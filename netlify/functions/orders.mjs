import { currentUser, getOrders, saveOrders, users, json, readJson, getEvidenceBlobStore } from "../lib/store.mjs";
import crypto from "node:crypto";
import { getOrderEvidence, evidenceMetadata, normalizeEvidenceStage, evidenceStageKey, saveEvidenceBlob, deleteEvidenceBlob } from "../lib/evidence.mjs";

const now = () => new Date().toISOString();
const normalizeStage = normalizeEvidenceStage;
const history = (o, me, action, extra={}) => { o.history = o.history || []; o.history.push({at:now(), by:me.username, action, ...extra}); o.updatedAt=now(); };

// Limpia etiquetas de presentación que no deben guardarse dentro de la respuesta.
// Esta función se usa en SAVE_DRAFT y SUBMIT; sin ella Netlify lanza ReferenceError (502).
function cleanTechnicianResponse(value) {
  return String(value ?? "").replace(/^\s*(?:(?:respuesta|comentario)\s+del\s+t[eé]cnico\s*:\s*)+/i, "").trim();
}

// Las imágenes se almacenan en Blobs independientes; la OT conserva solo metadatos.
async function allEvidence(o) { return await getOrderEvidence(o); }
function metadataEvidence(rows) { return evidenceMetadata(rows); }
async function hydratedOrder(o) {
  if (!o) return o;
  return { ...o, evidences: await allEvidence(o) };
}
function listOrder(o) {
  // Las vistas de lista y el contador no necesitan transferir el PDF ni las fotos.
  // Esto evita que cada actualización periódica descargue todos los expedientes.
  const { pdfDataUrl, ...rest } = o;
  return { ...rest, evidences: metadataEvidence(Array.isArray(o.evidences) ? o.evidences : []) };
}
async function removeLegacyStageEvidence(orderId, evidenceId) {
  for (const stage of ["BEFORE", "DURING", "AFTER"]) {
    const rows = await getEvidenceBlobStore().get(evidenceStageKey(orderId, stage), { type: "json" }) || [];
    const remaining = rows.filter(e => String(e.id) !== String(evidenceId));
    if (remaining.length !== rows.length) {
      if (remaining.length) await getEvidenceBlobStore().setJSON(evidenceStageKey(orderId, stage), remaining);
      else await getEvidenceBlobStore().delete(evidenceStageKey(orderId, stage));
    }
  }
}

export default async (req)=>{
  const me=await currentUser(req); if(!me)return json({error:"Sesión no válida."},401);
  const method=req.method; const url=new URL(req.url); const id=url.searchParams.get("id");
  if(method==="GET"){
    const all=await getOrders();
    if(id){
      const o=all.find(x=>x.id===id); if(!o)return json({error:"OT no encontrada."},404);
      if(me.role!=="admin" && o.technicianId!==me.id)return json({error:"No autorizado."},403);
      if(url.searchParams.get("pdf")==="1") return json({dataUrl:o.pdfDataUrl||"",name:o.pdfName||"OT.pdf"});
      return json({order:await hydratedOrder(o)});
    }
    const visible=me.role==="admin"?all:all.filter(x=>x.technicianId===me.id && !x.archived);
    return json({orders:visible.map(listOrder)});
  }
  const body=await readJson(req);
  if(method==="POST"){
    if(body.action==="CREATE_GENERAL"){
      if(me.role!=="admin")return json({error:"Solo el administrador puede crear OT General."},403);
      const title=String(body.title||"").trim();
      const technicianId=String(body.technicianId||"");
      const activities=Array.isArray(body.activities)?body.activities.map((a,i)=>({id:String(a.id||`ga${i+1}`),text:String(a.text||"").trim(),dueDate:String(a.dueDate||"").slice(0,10),done:false,comment:"",evidenceId:""})).filter(a=>a.text):[];
      if(!title||!technicianId||!activities.length||activities.some(a=>!a.dueDate))return json({error:"Completa título, técnico y al menos una actividad con fecha de ejecución."},400);
      const tech=(await users()).find(x=>x.id===technicianId&&x.role==="technician"&&x.active);
      if(!tech)return json({error:"Técnico no válido."},400);
      const all=await getOrders();const stamp=now();let number;
      do{number=`OTG-${new Date().toISOString().slice(0,7).replace("-","")}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;}while(all.some(x=>String(x.number).toUpperCase()===number));
      const order={id:crypto.randomUUID(),number,orderType:"GENERAL",isGeneral:true,title,origin:"ADMIN",technicianId:tech.id,technicianUsername:tech.username,type:String(body.type||"Preventivo"),area:"Varias áreas",equipment:title,description:String(body.description||"Actividades generales asignadas para el período."),periodStart:String(body.periodStart||activities.map(a=>a.dueDate).sort()[0]),periodEnd:String(body.periodEnd||activities.map(a=>a.dueDate).sort().slice(-1)[0]),generalActivities:activities,checklist:[],evidences:[],technicianResponse:"",returnReason:"",status:"ASSIGNED",createdAt:stamp,updatedAt:stamp,history:[{at:stamp,by:me.username,action:"GENERAL_CREATED",activityCount:activities.length}]};
      all.unshift(order);await saveOrders(all);return json({order},201);
    }
    if(body.action==="CREATE_MANUAL"){
      if(me.role!=="technician")return json({error:"La orden manual solo puede crearla un técnico autenticado."},403);
      const required=["area","equipment","description","type","executionDate","startTime","endTime"];
      const missing=required.filter(k=>!String(body[k]||"").trim());
      if(missing.length)return json({error:"Completa los campos obligatorios: área, equipo, descripción, tipo de mantenimiento, fecha y horas."},400);
      if(!["Preventivo","Correctivo"].includes(String(body.type)))return json({error:"Selecciona Preventivo o Correctivo."},400);
      if(String(body.endTime)<String(body.startTime))return json({error:"La hora de finalización no puede ser anterior a la hora de inicio."},400);
      const checklist=Array.isArray(body.checklist)?body.checklist.map((x,i)=>({id:`m${i+1}`,text:String(x.text||"").trim(),done:true,comment:""})).filter(x=>x.text):[];
      if(!checklist.length)return json({error:"Agrega al menos una actividad realizada."},400);
      const all=await getOrders();
      const stamp=now();
      let id=crypto.randomUUID();
      let number;
      // Número generado por el servidor. El fragmento UUID garantiza unicidad práctica
      // incluso si dos técnicos crean órdenes manuales simultáneamente.
      do { number=`OT-M-${new Date().toISOString().slice(0,10).replace(/-/g,"")}-${crypto.randomBytes(6).toString("hex").toUpperCase()}`; }
      while(all.some(x=>String(x.number).toUpperCase()===number));
      const order={id,number,origin:"MANUAL",manual:true,createdByTechnicianId:me.id,technicianId:me.id,technicianUsername:me.username,type:String(body.type),area:String(body.area).trim(),location:String(body.location||"").trim(),equipment:String(body.equipment).trim(),equipmentCondition:["OPERATIONAL","OUT_OF_SERVICE","INSPECTION"].includes(String(body.equipmentCondition))?String(body.equipmentCondition):"",description:String(body.description).trim(),checklist,executionDate:String(body.executionDate),startTime:String(body.startTime),endTime:String(body.endTime),materialsUsed:String(body.materialsUsed||""),technicianResponse:String(body.technicianResponse||""),customerSatisfaction:String(body.customerSatisfaction||""),pdfDataUrl:"",pdfName:"",evidences:[],returnReason:"",status:"IN_PROGRESS",createdAt:stamp,updatedAt:stamp,history:[{at:stamp,by:me.username,action:"MANUAL_CREATED"}]};
      all.unshift(order); await saveOrders(all);
      return json({order:await hydratedOrder(order)},201);
    }
    if(me.role!=="admin")return json({error:"Solo el administrador puede crear OT."},403);
    if(!body.number || !body.technicianId || !body.pdfBase64)return json({error:"Número, técnico y PDF son obligatorios."},400);
    const tech=(await users()).find(x=>x.id===body.technicianId && x.role==="technician" && x.active);
    if(!tech)return json({error:"Técnico no válido."},400);
    const all=await getOrders(); if(all.some(x=>x.number===body.number))return json({error:"Ese número de OT ya existe."},409);
    const stamp=now();
    const order={id:crypto.randomUUID(),number:String(body.number).trim(),technicianId:tech.id,technicianUsername:tech.username,type:body.type||"",area:body.area||"",equipment:body.equipment||"",description:body.description||"",dueDate:String(body.dueDate||"").slice(0,10),checklist:Array.isArray(body.checklist)?body.checklist:[],pdfDataUrl:`data:application/pdf;base64,${body.pdfBase64}`,pdfName:body.pdfName||`${body.number}.pdf`,evidences:[],technicianResponse:"",returnReason:"",status:"ASSIGNED",createdAt:stamp,updatedAt:stamp,history:[{at:stamp,by:me.username,action:"CREATED_ASSIGNED"}]};
    all.unshift(order); await saveOrders(all); return json({order},201);
  }
  if(method==="PATCH"){
    const all=await getOrders(); const o=all.find(x=>x.id===body.id); if(!o)return json({error:"OT no encontrada."},404); const stamp=now();
    if(me.role==="technician"){
      if(o.technicianId!==me.id)return json({error:"No autorizado."},403);
      if(body.action==="START"){
        if(["ASSIGNED","RETURNED"].includes(o.status)){o.status="IN_PROGRESS"; history(o,me,o.status==="IN_PROGRESS"&&o.history?.some(h=>h.action==="RETURNED")?"STARTED_CORRECTION":"STARTED"); await saveOrders(all);}
        return json({order:await hydratedOrder(o)});
      }
      if(body.action==="SAVE_DRAFT"){
        // Mantener las imágenes en el mismo registro autoritativo de la OT.
        // allEvidence también recupera y migra en memoria las imágenes antiguas de 4.0.2/4.0.3.
        o.evidences=metadataEvidence(await allEvidence(o));
        if(Array.isArray(body.checklist))o.checklist=body.checklist; if(typeof body.technicianResponse==="string")o.technicianResponse=cleanTechnicianResponse(body.technicianResponse); if(typeof body.executionDate==="string")o.executionDate=body.executionDate; if(typeof body.startTime==="string")o.startTime=body.startTime; if(typeof body.endTime==="string")o.endTime=body.endTime; if(typeof body.customerSatisfaction==="string")o.customerSatisfaction=body.customerSatisfaction; if(typeof body.materialsUsed==="string")o.materialsUsed=body.materialsUsed; if(["OPERATIONAL","OUT_OF_SERVICE","INSPECTION"].includes(String(body.equipmentCondition)))o.equipmentCondition=String(body.equipmentCondition); history(o,me,"DRAFT_SAVED"); await saveOrders(all); return json({order:await hydratedOrder(o)});
      }
      if(body.action==="DELETE_EVIDENCE"){
        if(!["ASSIGNED","IN_PROGRESS","RETURNED"].includes(o.status))return json({error:"No se pueden eliminar evidencias de una OT que ya fue enviada a revisión o aceptada."},409);
        const evidenceId=String(body.evidenceId||"");
        o.evidences=o.evidences||[];
        const complete=await allEvidence(o);
        const removed=complete.find(e=>String(e.id)===evidenceId);
        if(!removed)return json({error:"No se encontró la fotografía que deseas eliminar."},404);
        const normalizedStage=normalizeStage(removed.stage);
        // Eliminar tanto del registro principal como de cualquier almacén heredado,
        // para que una foto antigua no reaparezca al volver a leer la OT.
        o.evidences=metadataEvidence(complete.filter(e=>String(e.id)!==evidenceId));
        await deleteEvidenceBlob(o.id,evidenceId);
        await removeLegacyStageEvidence(o.id,evidenceId);
        history(o,me,"EVIDENCE_DELETED",{stage:normalizedStage,name:removed.name||"evidencia"});
        o.updatedAt=stamp; await saveOrders(all); return json({order:await hydratedOrder(o)});
      }
      if(body.action==="UPLOAD_EVIDENCE"){
        if(!body.dataUrl || !String(body.dataUrl).startsWith("data:image/jpeg;base64,"))return json({error:"La fotografía no se pudo preparar en formato JPG. Intenta tomarla de nuevo o selecciona JPG/PNG."},400);
        if(String(body.dataUrl).length>700000)return json({error:"La fotografía sigue siendo demasiado grande. Intenta tomarla de nuevo o elige una imagen más pequeña."},413);
        const normalizedStage=normalizeStage(body.stage);
        const taskStage=String(body.stage||"").toUpperCase().startsWith("TASK:");
        if(taskStage){
          if(!o.isGeneral)return json({error:"La evidencia por actividad solo está disponible en una OT General."},400);
          const activityId=String(body.activityId||String(body.stage).slice(5));
          const activity=(o.generalActivities||[]).find(a=>String(a.id)===activityId);
          if(!activity)return json({error:"Actividad de OT General no encontrada."},404);
          const taskPhotos=(await allEvidence(o)).filter(e=>String(e.stage||"")===`TASK:${activityId}`||String(e.activityId||"")===activityId);
          if(taskPhotos.length>=4)return json({error:"Esta actividad ya tiene el máximo de cuatro fotografías."},400);
        }else if(!["BEFORE","DURING","AFTER"].includes(normalizedStage))return json({error:"Etapa de evidencia no válida."},400);
        // Cada imagen se guarda como Blob independiente y se verifica mediante lectura.
        // La ficha de la OT conserva solo metadatos y la referencia estable de la imagen.
        const currentEvidence=await allEvidence(o);
        const evidence={id:crypto.randomUUID(),stage:taskStage?`TASK:${String(body.activityId||String(body.stage).slice(5))}`:normalizedStage,activityId:taskStage?String(body.activityId||String(body.stage).slice(5)):"",createdAt:stamp,by:me.username,name:String(body.name||"evidencia.jpg")};
        await saveEvidenceBlob(o.id,evidence.id,String(body.dataUrl));
        o.evidences=metadataEvidence([...currentEvidence,evidence]);
        if(o.status==="ASSIGNED"||o.status==="RETURNED")o.status="IN_PROGRESS";
        history(o,me,"EVIDENCE_UPLOADED",{stage:normalizedStage,evidenceId:evidence.id});
        await saveOrders(all);
        // La confirmación solo se devuelve después de verificar el Blob y persistir sus metadatos.
        return json({order:await hydratedOrder(o),savedEvidence:{id:evidence.id,stage:evidence.stage,name:evidence.name,createdAt:evidence.createdAt}});
      }
      if(o.isGeneral&&body.action==="SAVE_GENERAL_ACTIVITY"){
        const activity=(o.generalActivities||[]).find(a=>String(a.id)===String(body.activityId));
        if(!activity)return json({error:"Actividad no encontrada."},404);
        if(typeof body.comment==="string")activity.comment=String(body.comment).trim();
        if(body.done===true){
          const ev=await allEvidence(o);const photo=ev.find(e=>String(e.activityId||String(e.stage||"").slice(5))===String(activity.id)&&String(e.stage||"").startsWith("TASK:"));
          if(!photo)return json({error:"Adjunta la fotografía de evidencia de esta actividad antes de marcarla como completada."},400);
          activity.done=true;activity.completedAt=stamp;activity.completedBy=me.username;
        }else if(body.done===false){activity.done=false;activity.completedAt="";activity.completedBy="";}
        activity.status=activity.done?"COMPLETED":(activity.dueDate&&activity.dueDate<stamp.slice(0,10)?"OVERDUE":"PENDING");
        history(o,me,activity.done?"GENERAL_ACTIVITY_COMPLETED":"GENERAL_ACTIVITY_UPDATED",{activityId:activity.id,activity:activity.text});
        if((o.generalActivities||[]).length&&(o.generalActivities||[]).every(a=>a.done))o.status="IN_REVIEW";else if(o.status==="ASSIGNED"&&((o.generalActivities||[]).some(a=>a.done)))o.status="IN_PROGRESS";
        await saveOrders(all);return json({order:await hydratedOrder(o)});
      }
      if(o.isGeneral&&body.action==="SUBMIT_GENERAL"){
        const activities=o.generalActivities||[];const ev=await allEvidence(o);
        const missing=activities.filter(a=>!a.done||!ev.some(e=>String(e.stage||"")===`TASK:${a.id}`));
        if(missing.length)return json({error:`Faltan ${missing.length} actividad(es) por completar con evidencia fotográfica.`},400);
        o.status="IN_REVIEW";history(o,me,"SUBMITTED_FOR_REVIEW_GENERAL");await saveOrders(all);return json({order:await hydratedOrder(o)});
      }
      if(body.action!=="SUBMIT")return json({error:"Acción no válida."},400);
      o.checklist=body.checklist||o.checklist; o.technicianResponse=cleanTechnicianResponse(body.technicianResponse||""); o.executionDate=String(body.executionDate||""); o.startTime=String(body.startTime||""); o.endTime=String(body.endTime||""); o.customerSatisfaction=String(body.customerSatisfaction||""); o.materialsUsed=String(body.materialsUsed||""); if(["OPERATIONAL","OUT_OF_SERVICE","INSPECTION"].includes(String(body.equipmentCondition)))o.equipmentCondition=String(body.equipmentCondition);
      if(!o.executionDate||!o.startTime||!o.endTime)return json({error:"Debe registrar fecha de ejecución y hora de inicio y finalización."},400); if(!["OPERATIONAL","OUT_OF_SERVICE","INSPECTION"].includes(o.equipmentCondition))return json({error:"Debe seleccionar el estado final: Operativo, Inoperativo o En inspección."},400);
      if(o.endTime<o.startTime)return json({error:"La hora de finalización no puede ser anterior a la hora de inicio."},400);
      if(!["UNSATISFIED","SATISFIED","VERY_SATISFIED"].includes(o.customerSatisfaction))return json({error:"Debe registrar la evaluación del cliente."},400);
      if(!Array.isArray(o.checklist)||o.checklist.some(x=>!x.done))return json({error:"Debe marcar todas las actividades del checklist."},400);
      // La validación comprueba imágenes recuperadas del Blob, no solo metadatos.
      const ev=await allEvidence(o); if(!ev.length)return json({error:"Debe cargar evidencias antes de enviar la OT."},400);
      const validEv=ev.filter(x=>typeof x.dataUrl==="string" && x.dataUrl.startsWith("data:image/"));
      const stages=new Set(validEv.map(x=>normalizeStage(x.stage)));
      const missingStages=[["BEFORE","ANTES"],["DURING","DURANTE"],["AFTER","DESPUÉS"]].filter(([stage])=>!stages.has(stage)).map(([,label])=>label);
      if(missingStages.length)return json({error:`El servidor verificó las evidencias y no encontró una foto válida en ${missingStages.join(", ")}. Entra a esa etapa y vuelve a cargarla; no necesitas repetir las otras fotos.`},400);
      // No convertir a metadatos: la OT debe conservar los bytes de las imágenes
      // después de pasar a revisión para que el administrador y el PDF las vean.
      o.evidences=metadataEvidence(validEv);
      o.status="IN_REVIEW"; o.returnReason=""; history(o,me,"SUBMITTED_FOR_REVIEW"); await saveOrders(all);
      // No devolver las fotos en base64 al confirmar el envío: solo metadatos.
      // Evita respuestas grandes y una segunda lectura de todos los Blobs en el momento crítico.
      return json({order:{...o,evidences:metadataEvidence(o.evidences)}});
    }
    // Acciones administrativas de archivo y eliminación controlada.
    if(me.role!=="admin" && ["ARCHIVE","RESTORE","DELETE_ORDER"].includes(body.action))return json({error:"Solo el administrador puede archivar, restaurar o eliminar órdenes."},403);
    if(body.action==="ARCHIVE"){
      if(o.status!=="ACCEPTED")return json({error:"Solo se pueden archivar órdenes aceptadas."},409);
      o.archived=true; o.archivedAt=stamp; o.archivedBy=me.username; history(o,me,"ARCHIVED"); await saveOrders(all); return json({order:await hydratedOrder(o)});
    }
    if(body.action==="RESTORE"){
      if(!o.archived)return json({error:"La orden no está archivada."},409);
      o.archived=false; o.restoredAt=stamp; history(o,me,"RESTORED"); await saveOrders(all); return json({order:await hydratedOrder(o)});
    }
    if(body.action==="DELETE_ORDER"){
      // Borrado definitivo limitado a una OT asignada por error y sin evidencias ni ejecución.
      const ev=await allEvidence(o);
      const safeStatuses=["ASSIGNED"];
      if(!safeStatuses.includes(o.status) || ev.length || o.manual || (o.history||[]).some(h=>["STARTED","EVIDENCE_UPLOADED","SUBMITTED_FOR_REVIEW","ACCEPTED","RETURNED"].includes(h.action)))return json({error:"Esta OT ya tiene actividad, evidencias o no está pendiente. Por seguridad, archívala en lugar de eliminarla."},409);
      await saveOrders(all.filter(x=>x.id!==o.id));
      return json({ok:true,deletedId:o.id,number:o.number});
    }
    if(body.action==="ACCEPT"){
      if(o.status!=="IN_REVIEW")return json({error:"La OT no está pendiente de revisión."},400);
      o.status="ACCEPTED"; history(o,me,"ACCEPTED");
    } else if(body.action==="RETURN"){
      if(o.status!=="IN_REVIEW")return json({error:"La OT no está pendiente de revisión."},400);
      if(!String(body.reason||"").trim())return json({error:"El motivo es obligatorio."},400);
      o.status="RETURNED"; o.returnReason=String(body.reason).trim(); history(o,me,"RETURNED",{reason:o.returnReason});
    } else return json({error:"Acción no válida."},400);
    await saveOrders(all); return json({order:await hydratedOrder(o)});
  }
  return json({error:"Método no permitido."},405);
};
