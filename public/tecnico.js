const session=getSession("technician");
if(!session) location.href="/";
document.getElementById("who").textContent=`Técnico: ${session.username}`;

let currentOrder=null;
let pendingPhotos={before:[],during:[],after:[]};
let manualPhotos={before:[],during:[],after:[]};
let manualDraftOrder=null;
let techFilter="ACTIVE";

function getSession(role){try{const s=JSON.parse(localStorage.getItem("ot_session")||"null");return s&&s.role===role?s:null}catch{return null}}
function logout(){localStorage.removeItem("ot_session");location.href="/"}
async function api(url,options={}){options.headers={...(options.headers||{}),Authorization:"Bearer "+session.token};let r;try{r=await fetch(url,{...options,cache:options.cache||"no-store"})}catch(e){throw new Error("No se pudo conectar con Netlify. Comprueba la conexión y vuelve a intentar.")}const raw=await r.text();let d={};try{d=raw?JSON.parse(raw):{}}catch{d={error:raw.slice(0,180)||"El servidor devolvió una respuesta no válida."}}if(!r.ok)throw new Error(d.error||`Error del servidor (${r.status})`);return d}
function updatePendingBadge(orders){
  const pending=(Array.isArray(orders)?orders:[]).filter(o=>!o.archived&&["ASSIGNED","IN_PROGRESS","RETURNED"].includes(String(o.status||"").toUpperCase())).length;
  const headerBadge=document.getElementById("pendingBadge");
  const summaryCount=document.getElementById("pendingCount");
  if(headerBadge){headerBadge.textContent=String(pending);headerBadge.hidden=pending===0;headerBadge.setAttribute("aria-label",`${pending} órdenes pendientes`)}
  if(summaryCount)summaryCount.textContent=String(pending);
  // Android/Chrome PWA puede mostrar el contador sobre el icono instalado.
  // Otros navegadores ignoran la API y conservan el contador visible dentro de la app.
  try{
    if(pending>0&&"setAppBadge" in navigator)navigator.setAppBadge(pending).catch(()=>{});
    else if(pending===0&&"clearAppBadge" in navigator)navigator.clearAppBadge().catch(()=>{});
  }catch{}
  return pending;
}
async function refreshPendingBadge(){
  if(!session?.token||document.visibilityState==="hidden")return;
  try{const d=await api("/.netlify/functions/orders?badge="+Date.now());updatePendingBadge(d.orders)}catch{}
}
function techOverdue(o){const today=new Date().toLocaleDateString("en-CA");if(!["ASSIGNED","IN_PROGRESS","RETURNED"].includes(o.status))return false;if(o.isGeneral||o.orderType==="GENERAL")return (o.generalActivities||[]).some(a=>!a.done&&a.dueDate&&a.dueDate<today);const due=String(o.dueDate||o.scheduledDate||o.plannedDate||"").slice(0,10);return !!due&&due<today}
async function load(){const box=document.getElementById("orders");box.innerHTML=`<div class="loading">Cargando tus OT…</div>`;try{const d=await api("/.netlify/functions/orders");const all=d.orders||[];updatePendingBadge(all);const counts={ACTIVE:all.filter(o=>["ASSIGNED","IN_PROGRESS","RETURNED"].includes(o.status)).length,IN_REVIEW:all.filter(o=>o.status==="IN_REVIEW").length,ACCEPTED:all.filter(o=>o.status==="ACCEPTED").length};const c=document.getElementById("techStatusCounts");if(c)c.innerHTML=`<span>Pendientes: <b>${counts.ACTIVE}</b></span><span>En revisión: <b>${counts.IN_REVIEW}</b></span><span>Aceptadas: <b>${counts.ACCEPTED}</b></span>`;document.querySelectorAll("[data-tech-filter]").forEach(b=>b.classList.toggle("active",b.dataset.techFilter===techFilter));const filtered=all.filter(o=>techFilter==="ACTIVE"?["ASSIGNED","IN_PROGRESS","RETURNED"].includes(o.status):o.status===techFilter);box.innerHTML=filtered.length?`<div class="tech-list">${filtered.map(o=>`<article class="tech-ot"><div><div class="ot-id"><strong>${esc(o.number)}</strong><span class="status ${o.status.toLowerCase().replace("_","-")}">${esc(statusLabel(o.status))}</span></div><h3>${esc(o.isGeneral?"OT GENERAL · "+(o.title||"Actividades programadas"):(o.area||"Sin área"))}</h3><p>${esc(o.isGeneral?`${(o.generalActivities||[]).filter(a=>a.done).length}/${(o.generalActivities||[]).length} actividades completadas`: (o.equipment||"Sin equipo"))}</p>${o.isGeneral?'<span class="general-type-tag">OT GENERAL</span>':""}${techOverdue(o)?'<span class="status overdue">RETRASADA</span>':""}<small>Actualizada ${fmt(o.updatedAt)}</small></div><button class="primary compact" onclick="show('${o.id}')">Abrir OT</button></article>`).join("")}</div>`:`<div class="empty-state"><div class="empty-icon">✓</div><b>No hay órdenes en esta categoría.</b><p>Selecciona otra categoría para consultar tus trabajos.</p></div>`}catch(e){box.innerHTML=`<p class="error">${esc(e.message)}</p>`}}
function setTechFilter(filter){techFilter=filter;load()}

function openManualForm(){
  currentOrder=null;manualPhotos={before:[],during:[],after:[]};manualDraftOrder=null;
  const box=document.getElementById("manualFormPanel");box.classList.remove("hidden");document.getElementById("detail").classList.add("hidden");
  const today=new Date().toLocaleDateString("en-CA");
  box.innerHTML=`<div class="detail-head"><div><span class="kicker">REGISTRO DE TRABAJO ESPONTÁNEO</span><h2>Nueva orden de trabajo manual</h2><p>El sistema asignará automáticamente un número único al crearla.</p></div><button class="secondary" type="button" onclick="closeManualForm()">Cerrar</button></div><div class="manual-info-note">Usa esta opción para trabajos no asignados por administración. La orden quedará pendiente de revisión administrativa.</div><form id="manualWorkForm"><section class="work-section"><h3>1. Información general</h3><div class="grid3"><label>Número de OT<input value="Asignado automáticamente al enviar" disabled></label><label>Fecha de ejecución<input id="manualDate" type="date" value="${today}" required></label><label>Tipo de mantenimiento<select id="manualType" required><option value="">Seleccionar…</option><option value="Correctivo">Correctivo</option><option value="Preventivo">Preventivo</option></select></label></div><div class="grid3"><label>Hora de inicio${timePicker("manualStart", "")}</label><label>Hora de finalización${timePicker("manualEnd", "")}</label><label>Área<input id="manualArea" placeholder="Ej. Piscinas, Golf, Jardinería" required></label></div><div class="grid2"><label>Ubicación específica<input id="manualLocation" placeholder="Edificio, zona o punto exacto"></label><label>Equipo intervenido<input id="manualEquipment" placeholder="Equipo, máquina o instalación" required></label><label>Estado del equipo<select id="manualEquipmentCondition" required><option value="">Seleccionar estado…</option><option value="OPERATIONAL">Operativo</option><option value="OUT_OF_SERVICE">Inoperativo</option><option value="INSPECTION">En inspección</option></select></label></div></section><section class="work-section"><h3>2. Descripción del trabajo realizado</h3><label>Falla encontrada o motivo<textarea id="manualDescription" placeholder="Describe qué ocurrió y por qué se realizó el trabajo…" required></textarea></label><label>Solución aplicada / respuesta del técnico<textarea id="manualResponse" placeholder="Describe la intervención realizada y el resultado…" required></textarea></label></section><section class="work-section"><h3>3. Actividades realizadas</h3><p class="hint">Agrega una actividad por fila. Las actividades se registrarán como realizadas.</p><div id="manualActivities"><div class="manual-activity-row"><input class="manual-activity" placeholder="Ej. Reparación de fuga en tubería" required><button type="button" class="danger" onclick="removeManualActivity(this)" aria-label="Eliminar actividad">×</button></div></div><button type="button" class="secondary" onclick="addManualActivity()">＋ Agregar actividad</button></section><section class="work-section"><h3>4. Evidencias fotográficas</h3><p class="hint">Carga las fotografías de ANTES, DURANTE y DESPUÉS. Se validarán en el servidor antes de enviar la orden.</p>${photoPicker("manualbefore","ANTES","Estado inicial")}${photoPicker("manualduring","DURANTE","Trabajo en ejecución")}${photoPicker("manualafter","DESPUÉS","Resultado final")}</section><section class="work-section"><h3>5. Materiales e insumos</h3><label>Materiales utilizados<textarea id="manualMaterials" placeholder="Material, cantidad y unidad (opcional)"></textarea></label></section><section class="work-section"><h3>6. Evaluación del cliente</h3><div class="satisfaction-options"><label class="satisfaction-option"><input type="radio" name="manualSatisfaction" value="UNSATISFIED" required><span class="face">☹️</span><b>Insatisfecho</b></label><label class="satisfaction-option"><input type="radio" name="manualSatisfaction" value="SATISFIED" required><span class="face">🙂</span><b>Satisfecho</b></label><label class="satisfaction-option"><input type="radio" name="manualSatisfaction" value="VERY_SATISFIED" required><span class="face">😄</span><b>Muy satisfecho</b></label></div></section><button class="primary wide submit-btn" type="submit">Enviar orden manual a revisión</button><p id="manualMsg" class="message" role="status" aria-live="polite"></p></form>`;
  bindTimePickers(box);bindManualPhotoPickers();box.scrollIntoView({behavior:"smooth",block:"start"});
}
function closeManualForm(){document.getElementById("manualFormPanel").classList.add("hidden");if(!manualDraftOrder)manualPhotos={before:[],during:[],after:[]}}
function addManualActivity(){const wrap=document.getElementById("manualActivities");const row=document.createElement("div");row.className="manual-activity-row";row.innerHTML='<input class="manual-activity" placeholder="Describe la actividad realizada" required><button type="button" class="danger" onclick="removeManualActivity(this)" aria-label="Eliminar actividad">×</button>';wrap.appendChild(row)}
function removeManualActivity(btn){const rows=document.querySelectorAll(".manual-activity-row");if(rows.length<=1){rows[0].querySelector("input").value="";return}btn.closest(".manual-activity-row").remove()}
function bindManualPhotoPickers(){["before","during","after"].forEach(id=>{const prefix="manual"+id;[document.getElementById(prefix+"Gallery"),document.getElementById(prefix+"Camera")].forEach(input=>input.addEventListener("change",async()=>{const files=[...(input.files||[])];input.value="";for(const original of files){try{const file=await snapshotSelectedFile(original);const detected=await detectImageFormat(file);let f=file;if(detected.heic)f=await convertHeicToJpeg(f);else if(detected.mime&&f.type!==detected.mime)f=withDetectedMime(f,detected.mime);const probe=await decodeImage(f);if(probe.cleanup)probe.cleanup();manualPhotos[id].push(f)}catch(err){const m=document.getElementById(prefix+"PhotoMsg");m.textContent=err.message;m.className="photo-message error"}}renderManualPreviews(id)}));});document.getElementById("manualWorkForm").addEventListener("submit",submitManualOrder)}
function renderManualPreviews(id){const box=document.getElementById("manual"+id+"Preview");if(!box)return;box.innerHTML=manualPhotos[id].map((f,i)=>`<div class="selected-photo"><img data-mpreview="${id}" data-index="${i}" alt="Vista previa"><small>${esc(f.name||"Foto")}</small><button type="button" class="remove-photo" data-mremove="${i}">Quitar</button></div>`).join("")||'<p class="no-photos">No hay fotos en esta etapa.</p>';box.querySelectorAll("img[data-mpreview]").forEach(img=>{const f=manualPhotos[id][Number(img.dataset.index)];const url=URL.createObjectURL(f);img.onload=()=>URL.revokeObjectURL(url);img.src=url});box.querySelectorAll("[data-mremove]").forEach(btn=>btn.onclick=()=>{manualPhotos[id].splice(Number(btn.dataset.mremove),1);renderManualPreviews(id)})}
async function submitManualOrder(e){e.preventDefault();const form=e.target,btn=form.querySelector(".submit-btn"),msg=document.getElementById("manualMsg");if(btn.disabled)return;btn.disabled=true;const say=(t,c="message")=>{msg.textContent=t;msg.className=c};try{
 const activityTexts=[...form.querySelectorAll(".manual-activity")].map(x=>x.value.trim()).filter(Boolean);if(!activityTexts.length)throw new Error("Agrega al menos una actividad realizada.");
 for(const id of ["before","during","after"]){const stage=stageName(id);const already=(manualDraftOrder?.evidences||[]).some(x=>normalizeEvidenceStage(x.stage)===stage);if(!manualPhotos[id].length&&!already)throw new Error(`Carga al menos una fotografía de ${({before:"ANTES",during:"DURANTE",after:"DESPUÉS"})[id]}.`);}
 const satisfaction=form.querySelector('input[name="manualSatisfaction"]:checked')?.value||"";if(!satisfaction)throw new Error("Selecciona la evaluación del cliente.");
 const equipmentCondition=document.getElementById("manualEquipmentCondition").value;if(!["OPERATIONAL","OUT_OF_SERVICE","INSPECTION"].includes(equipmentCondition))throw new Error("Selecciona el estado final del equipo: Operativo, Inoperativo o En inspección.");
 const payload={action:"CREATE_MANUAL",type:document.getElementById("manualType").value,executionDate:document.getElementById("manualDate").value,startTime:document.getElementById("manualStart").value,endTime:document.getElementById("manualEnd").value,area:document.getElementById("manualArea").value.trim(),location:document.getElementById("manualLocation").value.trim(),equipment:document.getElementById("manualEquipment").value.trim(),equipmentCondition:document.getElementById("manualEquipmentCondition").value,description:document.getElementById("manualDescription").value.trim(),technicianResponse:document.getElementById("manualResponse").value.trim(),materialsUsed:document.getElementById("manualMaterials").value.trim(),customerSatisfaction:satisfaction,checklist:activityTexts.map(text=>({text,done:true}))};
 let order=manualDraftOrder;
 if(!order){say("Creando la orden y asignando un número único…");const created=await api("/.netlify/functions/orders",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});order=created.order;manualDraftOrder=order;}
 for(const [stage,id] of [["BEFORE","before"],["DURING","during"],["AFTER","after"]]){while(manualPhotos[id].length){say(`Guardando fotografía de ${stage}…`);const file=manualPhotos[id][0];const dataUrl=await compressImage(file);const uploaded=await api("/.netlify/functions/orders",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:order.id,action:"UPLOAD_EVIDENCE",stage,dataUrl,name:file.name||`${id}.jpg`})});manualDraftOrder=uploaded.order;manualPhotos[id].shift();renderManualPreviews(id);}}
 say("Enviando la orden manual a revisión…");await api("/.netlify/functions/orders",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:order.id,action:"SUBMIT",checklist:order.checklist,technicianResponse:payload.technicianResponse,executionDate:payload.executionDate,startTime:payload.startTime,endTime:payload.endTime,customerSatisfaction:payload.customerSatisfaction,materialsUsed:payload.materialsUsed,equipmentCondition:payload.equipmentCondition})});say(`✓ ${order.number} fue enviada a revisión administrativa.`,"message ok");manualPhotos={before:[],during:[],after:[]};manualDraftOrder=null;await load();setTimeout(()=>{document.getElementById("manualFormPanel").classList.add("hidden");alert(`Orden ${order.number} enviada a revisión.`)},700)
 }catch(err){say(err.message,"message error")}finally{btn.disabled=false}}

function normalizeEvidenceStage(value){const s=String(value||"").trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");return ({BEFORE:"BEFORE",ANTES:"BEFORE",DURING:"DURING",DURANTE:"DURING",AFTER:"AFTER",DESPUES:"AFTER"})[s]||s;}
function statusLabel(s){return ({ASSIGNED:"PENDIENTE",IN_PROGRESS:"EN EJECUCIÓN",IN_REVIEW:"EN REVISIÓN",RETURNED:"DEVUELTA",ACCEPTED:"ACEPTADA"}[s]||s||"")}
// Filtra registros de otras columnas que pudieron quedar guardados en OT creadas
// con versiones anteriores del lector. Las actividades válidas conservan su ID,
// estado y comentario; no se eliminan actividades repetidas.
function cleanChecklist(items){
  const headings=/^(?:nombres?\s+y\s+apellidos|personal\s+de\s+mantenimiento|c[oó]digo|especialidad|cargo|t[eé]cnicos?|actividades?\s+de\s+mantenimiento.*|materiales?.*|repuestos?.*|insumos?.*|observaciones.*)$/i;
  const roles=/^(?:electricista|tornero|mec[aá]nico|mecanico|t[eé]cnico|tecnico|supervisor|operario|soldador|fontanero|plomero|jardinero|auxiliar|refrigerista|pintor|conductor|operador)$/i;
  const actionStart=/^(?:verificaci[oó]n|inspecci[oó]n|cambio|revisi[oó]n|lubricaci[oó]n|prueba|ajuste|limpieza|mantenimiento|reparaci[oó]n|instalaci[oó]n|sustituci[oó]n|calibraci[oó]n|medici[oó]n|retiro|montaje|desmontaje|diagn[oó]stico|control|comprobaci[oó]n|lavado|engrase|desarme|armado|reemplazo|restauraci[oó]n|poda|aplicaci[oó]n|recolecci[oó]n|tratamiento|arranque|puesta\s+en\s+marcha)\b/i;
  const looksLikePerson=/^[A-ZÁÉÍÓÚÜÑ][a-záéíóúüñ]+(?:\s+[A-ZÁÉÍÓÚÜÑ][a-záéíóúüñ]+){1,3}$/;
  return (Array.isArray(items)?items:[]).filter(a=>{
    const text=String(a?.text||'').replace(/\s+/g,' ').trim();
    if(!text||headings.test(text)||roles.test(text)||/^(?:REG|MAT|OT|EQ)-?\d{2,}\b/i.test(text))return false;
    if(looksLikePerson.test(text)&&!actionStart.test(text))return false;
    return true;
  });
}

async function show(id){
  try{
    const d=await api("/.netlify/functions/orders?id="+encodeURIComponent(id));
    const o=d.order; o.checklist=cleanChecklist(o.checklist); currentOrder=o; pendingPhotos={before:[],during:[],after:[]};
    const box=document.getElementById("detail");box.classList.remove("hidden");
    if(o.isGeneral||o.orderType==="GENERAL"){await renderGeneralOrder(o,box);return;}
    const editable=["ASSIGNED","IN_PROGRESS","RETURNED"].includes(o.status);
    box.innerHTML=`<div class="detail-head"><div><span class="kicker">ORDEN DE TRABAJO</span><h2>${esc(o.number)} <span class="status ${o.status.toLowerCase().replace("_","-")}">${esc(statusLabel(o.status))}</span></h2><p>${esc(o.area||"Sin área")} · ${esc(o.equipment||"Sin equipo")}</p><p class="maintenance-type-line"><strong>Tipo de mantenimiento:</strong> ${esc(o.type||o.maintenanceType||o.maintenance_type||"No registrado")}</p></div><button class="secondary" onclick="closeDetail()">Cerrar</button></div><div class="action-grid"><button class="secondary" onclick="openPdf('${o.id}')">📄 Ver PDF original</button></div>${o.status==="RETURNED"?`<div class="return-box"><b>⚠ Corrección solicitada</b><p>${esc(o.returnReason||"")}</p></div>`:""}${o.status==="ACCEPTED"?`<div class="accepted-box">✓ Esta OT fue aceptada por administración.</div>`:""}${editable?`<form id="workForm" novalidate><section class="work-section"><div class="section-title"><div><h3>☑ Checklist</h3><p class="hint">Marca cada actividad al terminarla.</p></div><span id="checkCount" class="progress-chip"></span></div><div class="checklist-box">${(o.checklist||[]).map((a,i)=>`<div class="check-activity-row"><label class="check-item"><input type="checkbox" data-i="${i}" ${a.done?"checked":""}><span>${esc(a.text)}</span></label><label class="activity-comment-label"><textarea data-comment="${i}" rows="1" placeholder="Comentario…" aria-label="Comentario de la actividad ${i+1}">${esc(a.comment||"")}</textarea></label></div>`).join("")||"<p>No hay actividades de checklist.</p>"}</div></section><section class="work-section"><h3>🕒 Datos de ejecución</h3><div class="execution-fields"><label>Fecha de ejecución<input id="executionDate" type="date" value="${esc(o.executionDate||new Date().toLocaleDateString('en-CA'))}" required></label><label>Hora de inicio${timePicker("startTime", o.startTime||"")}</label><label>Hora de finalización${timePicker("endTime", o.endTime||"")}</label><label>Estado del equipo<select id="equipmentCondition" required><option value="">Seleccionar estado…</option><option value="OPERATIONAL" ${o.equipmentCondition==="OPERATIONAL"?"selected":""}>Operativo</option><option value="OUT_OF_SERVICE" ${o.equipmentCondition==="OUT_OF_SERVICE"?"selected":""}>Inoperativo</option><option value="INSPECTION" ${o.equipmentCondition==="INSPECTION"?"selected":""}>En inspección</option></select></label></div><p class="hint">Registra la fecha, las horas reales y el estado final del equipo.</p></section><section class="work-section"><h3>📷 Evidencias</h3><p class="hint">En cada etapa puedes elegir una foto de la galería o tomarla con la cámara. Revisa la vista previa y elimina las fotos incorrectas con el botón Quitar.</p>${photoPicker("before","ANTES","Estado inicial del equipo o área")}${photoPicker("during","DURANTE","Trabajo en ejecución")}${photoPicker("after","DESPUÉS","Resultado final")}</section><section class="work-section"><h3>🧰 Materiales, repuestos e insumos utilizados</h3><label>Registra los materiales o insumos utilizados<textarea id="materialsUsed">${esc(o.materialsUsed||"")}</textarea></label></section><label>Observaciones generales<textarea id="response">${esc(o.technicianResponse||"")}</textarea></label><section class="work-section"><h3>🙂 Evaluación del cliente</h3><p class="hint">Selecciona la valoración que indique el cliente al finalizar el servicio.</p><div class="satisfaction-options"><label class="satisfaction-option"><input type="radio" name="customerSatisfaction" value="UNSATISFIED" ${o.customerSatisfaction==="UNSATISFIED"?"checked":""} required><span class="face">☹️</span><b>Insatisfecho</b></label><label class="satisfaction-option"><input type="radio" name="customerSatisfaction" value="SATISFIED" ${o.customerSatisfaction==="SATISFIED"?"checked":""} required><span class="face">🙂</span><b>Satisfecho</b></label><label class="satisfaction-option"><input type="radio" name="customerSatisfaction" value="VERY_SATISFIED" ${o.customerSatisfaction==="VERY_SATISFIED"?"checked":""} required><span class="face">😄</span><b>Muy satisfecho</b></label></div></section><div class="action-stack"><button type="button" class="secondary wide" id="saveBtn">💾 Guardar avance</button><button class="primary wide submit-btn" type="submit">Enviar a revisión</button></div><p id="workMsg" class="message" role="status" aria-live="polite"></p></form>`:`<section class="work-section"><h3>Resultado</h3><p><strong>Tipo de mantenimiento:</strong> ${esc(o.type||o.maintenanceType||o.maintenance_type||"No registrado")}</p><div class="check-read">${(o.checklist||[]).map(a=>`<div>${a.done?"☑":"☐"} ${esc(a.text)}${a.comment?`<p class="activity-comment-read">${esc(String(a.comment).replace(/^\s*(?:comentario\s+del\s+t[eé]cnico\s*:\s*)/i, ""))}</p>`:""}</div>`).join("")}</div><h3>Datos de ejecución</h3><p>Fecha: ${esc(o.executionDate||"—")} · Inicio: ${esc(o.startTime||"—")} · Finalización: ${esc(o.endTime||"—")}</p><h3>Materiales, repuestos e insumos utilizados</h3><p>${esc(o.materialsUsed||"—")}</p><h3>Evaluación del cliente</h3><p>${esc(satisfactionLabel(o.customerSatisfaction))}</p><h3>Observaciones</h3><p>${esc(o.technicianResponse||"Sin observaciones")}</p>${renderReadOnlyEvidence(o)}</section>`}`;
    if(editable){bindTimePickers(box);await api("/.netlify/functions/orders",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:o.id,action:"START"})});bindWork(o)}
  }catch(e){alert(e.message)}
}
async function renderGeneralOrder(o,box){
 const editable=["ASSIGNED","IN_PROGRESS","RETURNED"].includes(o.status);const today=new Date().toLocaleDateString("en-CA");
 const tasks=(o.generalActivities||[]).map((a,i)=>{const photos=(o.evidences||[]).filter(e=>String(e.stage||"")===`TASK:${a.id}`||String(e.activityId||"")===String(a.id)).sort((x,y)=>String(x.createdAt||"").localeCompare(String(y.createdAt||"")));const count=photos.length;const overdue=!a.done&&a.dueDate&&a.dueDate<today;const photoHtml=photos.map((ev,j)=>`<figure class="general-task-photo"><img src="${esc(ev.dataUrl||"")}" alt="Evidencia ${j+1} de ${esc(a.text)}"><figcaption>Foto ${j+1} · ${esc(ev.name||"evidencia.jpg")}</figcaption></figure>`).join("");return `<article class="general-task-card ${a.done?"task-complete":overdue?"task-overdue":""}"><div class="general-task-head"><label class="general-task-check"><input type="checkbox" data-general-done="${esc(a.id)}" ${a.done?"checked":""} ${!editable?"disabled":""}><span><b>${i+1}. ${esc(a.text)}</b><small>Fecha de ejecución: ${esc(a.dueDate||"Sin fecha")}</small></span></label><span class="status ${a.done?"accepted":overdue?"overdue":"assigned"}">${a.done?"COMPLETADA":overdue?"RETRASADA":"PENDIENTE"}</span></div><div class="general-task-evidence"><div class="general-task-evidence-heading"><b>Evidencias fotográficas</b><span>${count} de 4 fotos</span></div>${photoHtml?`<div class="general-task-photos">${photoHtml}</div>`:`<div class="general-task-photo-empty">${editable?"Adjunta hasta cuatro fotos desde la galería o toma fotos con la cámara.":"Sin evidencias registradas."}</div>`}${editable&&count<4?`<div class="photo-actions general-task-photo-actions"><label class="file-button gallery-button"><input type="file" accept="image/*,.jpg,.jpeg,.png,.webp,.gif,.bmp,.avif,.heic,.heif,.tif,.tiff" multiple data-general-gallery="${esc(a.id)}" data-general-photo="${esc(a.id)}"><span>🖼 Adjuntar desde galería</span></label><label class="file-button camera-button"><input type="file" accept="image/*,.jpg,.jpeg,.png,.webp,.avif,.heic,.heif" capture="environment" data-general-camera="${esc(a.id)}"><span>📷 Tomar foto con cámara</span></label></div><small class="hint">Puedes guardar ${4-count} foto(s) más para esta actividad. Máximo 4.</small>`:editable?`<p class="hint">Límite alcanzado: máximo 4 fotos por actividad.</p>`:""}</div><label class="general-task-comment-label">Comentario / recomendación del técnico<textarea rows="2" data-general-comment="${esc(a.id)}" ${!editable?"disabled":""}>${esc(a.comment||"")}</textarea></label>${editable?`<button type="button" class="secondary compact" data-general-save="${esc(a.id)}">Guardar comentario y estado</button><p class="message" data-general-msg="${esc(a.id)}" role="status"></p>`:""}</article>`}).join("");
 box.innerHTML=`<div class="detail-head"><div><span class="kicker">ORDEN DE TRABAJO GENERAL</span><h2>${esc(o.number)} <span class="general-type-tag">OT GENERAL</span></h2><p>${esc(o.title||o.description||"Actividades programadas")} · ${esc(o.technicianUsername||session.username)}</p><p class="maintenance-type-line"><strong>Tipo de mantenimiento:</strong> ${esc(o.type||"No registrado")} · <strong>Período:</strong> ${esc(o.periodStart||"—")} a ${esc(o.periodEnd||"—")}</p></div><button class="secondary" onclick="closeDetail()">Cerrar</button></div><div class="general-progress"><div><b>Progreso de actividades</b><span>${(o.generalActivities||[]).filter(a=>a.done).length} de ${(o.generalActivities||[]).length} completadas</span></div><progress max="${Math.max(1,(o.generalActivities||[]).length)}" value="${(o.generalActivities||[]).filter(a=>a.done).length}"></progress></div>${o.status==="IN_REVIEW"?'<div class="accepted-box">✓ Todas las actividades fueron completadas y enviadas a revisión administrativa.</div>':""}<section class="work-section"><h3>Checklist de actividades</h3><p class="hint">Marca cada tarea al terminarla. Para completarla debes adjuntar al menos una fotografía de evidencia. Puedes adjuntar hasta cuatro fotos por actividad desde la galería o la cámara.</p><div class="general-task-list">${tasks||"No hay actividades programadas."}</div></section>`;
 if(editable&&o.status==="ASSIGNED")await api("/.netlify/functions/orders",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:o.id,action:"START"})}).catch(()=>{});
 const uploadTaskPhotos=async(input)=>{const id=input.dataset.generalGallery||input.dataset.generalCamera;const msg=box.querySelector(`[data-general-msg="${id}"]`);const existing=(o.evidences||[]).filter(e=>String(e.stage||"")===`TASK:${id}`||String(e.activityId||"")===String(id)).length;const files=[...(input.files||[])];input.value="";if(!files.length)return;const allowed=Math.max(0,4-existing);if(!allowed){if(msg){msg.textContent="Esta actividad ya tiene cuatro fotografías.";msg.className="message error"}return}const chosen=files.slice(0,allowed);if(files.length>allowed&&msg){msg.textContent=`Solo se cargarán ${allowed} foto(s), para respetar el máximo de cuatro.`;msg.className="message"}try{for(let i=0;i<chosen.length;i++){if(msg){msg.textContent=`Procesando foto ${i+1} de ${chosen.length}…`;msg.className="message"}const dataUrl=await compressImage(chosen[i]);await api("/.netlify/functions/orders",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:o.id,action:"UPLOAD_EVIDENCE",stage:`TASK:${id}`,activityId:id,dataUrl,name:chosen[i].name||`evidencia-${i+1}.jpg`})});}await show(o.id);await load()}catch(err){if(msg){msg.textContent=err.message;msg.className="message error"}else alert(err.message)}};
 box.querySelectorAll("[data-general-gallery], [data-general-camera]").forEach(input=>input.addEventListener("change",()=>uploadTaskPhotos(input)));
 box.querySelectorAll("[data-general-save]").forEach(btn=>btn.addEventListener("click",async()=>{const id=btn.dataset.generalSave,msg=box.querySelector(`[data-general-msg="${id}"]`),done=box.querySelector(`[data-general-done="${id}"]`).checked,comment=box.querySelector(`[data-general-comment="${id}"]`).value;try{if(msg){msg.textContent="Guardando actividad…";msg.className="message"}await api("/.netlify/functions/orders",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:o.id,action:"SAVE_GENERAL_ACTIVITY",activityId:id,done,comment})});await show(o.id);await load()}catch(err){if(msg){msg.textContent=err.message;msg.className="message error"}else alert(err.message)}}));
}
function timePicker(id,value=""){
  const match=String(value||"").match(/^(\d{1,2}):(\d{1,2})$/);
  const rawH=match?Number(match[1]):null, rawM=match?Number(match[2]):null;
  const h=rawH!==null&&rawH>=0&&rawH<=23?rawH:null;
  const m=rawM!==null&&rawM>=0&&rawM<=59?rawM:null;
  const displayHour=h===null?"":String((h%12)||12);
  const period=h===null?"":(h>=12?"PM":"AM");
  const hours=Array.from({length:12},(_,i)=>i+1).map(i=>`<option value="${i}" ${Number(displayHour)===i?"selected":""}>${String(i).padStart(2,"0")}</option>`).join("");
  const minutes=Array.from({length:60},(_,i)=>`<option value="${String(i).padStart(2,"0")}" ${m===i?"selected":""}>${String(i).padStart(2,"0")}</option>`).join("");
  return `<div class="digital-time-picker"><select data-time-hour="${id}" aria-label="Hora" required><option value="">Hora</option>${hours}</select><span aria-hidden="true">:</span><select data-time-minute="${id}" aria-label="Minutos" required><option value="">Min</option>${minutes}</select><select data-time-period="${id}" aria-label="AM o PM" required><option value="">AM/PM</option><option value="AM" ${period==="AM"?"selected":""}>AM</option><option value="PM" ${period==="PM"?"selected":""}>PM</option></select><input id="${id}" type="hidden" value="${h!==null&&m!==null?String(h).padStart(2,"0")+":"+String(m).padStart(2,"0"):""}"></div><small class="time-hint">Formato de 12 horas · selecciona AM o PM</small>`;
}
function bindTimePickers(root=document){[...root.querySelectorAll(".digital-time-picker")].forEach(w=>{const hidden=w.querySelector('input[type="hidden"]');const id=hidden.id;const hour=w.querySelector(`[data-time-hour="${id}"]`);const minute=w.querySelector(`[data-time-minute="${id}"]`);const period=w.querySelector(`[data-time-period="${id}"]`);if(!hidden||!hour||!minute||!period||w.dataset.bound==="1")return;w.dataset.bound="1";const sync=()=>{if(hour.value&&minute.value&&period.value){let h=Number(hour.value)%12;if(period.value==="PM")h+=12;hidden.value=`${String(h).padStart(2,"0")}:${minute.value}`;}else hidden.value="";hidden.dispatchEvent(new Event("change",{bubbles:true}));};hour.addEventListener("change",sync);minute.addEventListener("change",sync);period.addEventListener("change",sync);sync();});}
function photoPicker(id,label,hint){return `<div class="photo-picker"><div class="photo-picker-title"><b>${label}</b><span>${hint}</span></div><div class="photo-actions"><label class="file-button gallery-button"><input id="${id}Gallery" type="file" accept="image/*,.jpg,.jpeg,.png,.webp,.gif,.bmp,.avif,.heic,.heif,.tif,.tiff" multiple><span>🖼 Elegir de galería</span></label><label class="file-button camera-button"><input id="${id}Camera" type="file" accept="image/*,.jpg,.jpeg,.png,.webp,.gif,.bmp,.avif,.heic,.heif" capture="environment"><span>📷 Tomar foto</span></label></div><div id="${id}Preview" class="selected-photos"></div><p id="${id}PhotoMsg" class="photo-message" aria-live="polite"></p></div>`}
function bindWork(o){
  document.querySelectorAll("[data-i]").forEach(el=>el.addEventListener("change",updateCount));updateCount();
  ["before","during","after"].forEach(id=>{
    [document.getElementById(id+"Gallery"),document.getElementById(id+"Camera")].forEach(input=>input.addEventListener("change",async()=>{
      const msg=document.getElementById(id+"PhotoMsg");
      const files=[...(input.files||[])];
      input.value="";
      if(!files.length)return;
      const added=[]; const failures=[];
      for(const original of files){
        try{
          // Congelar los bytes mientras la referencia temporal de galería sigue disponible.
          const stableFile=await snapshotSelectedFile(original);
          // Identificar por la firma binaria real, no por extensión/MIME (algunas
          // galerías Android entregan HEIC como .jpg o application/octet-stream).
          const detected=await detectImageFormat(stableFile);
          let file=stableFile;
          if(detected.heic){
            msg.textContent=`Convirtiendo ${file.name||"foto HEIC/HEIF"} a JPG…`;
            msg.className="photo-message";
            file=await convertHeicToJpeg(file);
          }else if(detected.mime && file.type!==detected.mime){
            file=withDetectedMime(file,detected.mime);
          }
          // Probar que la imagen realmente puede abrirse antes de agregarla a la
          // selección; evita que una foto inválida falle más tarde al enviar.
          const probe=await decodeImage(file);
          if(probe.cleanup)probe.cleanup();
          added.push(file);
        }catch(err){failures.push(`${original.name||"Foto"}: ${err.message}`)}
      }
      if(added.length)pendingPhotos[id].push(...added);
      renderStagePreviews(id);
      if(failures.length){msg.textContent=(added.length?`${added.length} foto(s) lista(s). `:"")+failures.join(" ");msg.className="photo-message error"}
      else{msg.textContent=`${added.length} foto(s) lista(s). Revisa la vista previa.`;msg.className="photo-message ok"}
    }));
    renderStagePreviews(id);
  });
  document.getElementById("saveBtn").onclick=()=>saveDraft(o);
  document.getElementById("workForm").onsubmit=e=>submitWork(e,o);
}
function satisfactionLabel(v){return ({UNSATISFIED:"☹️ Insatisfecho",SATISFIED:"🙂 Satisfecho",VERY_SATISFIED:"😄 Muy satisfecho"}[v]||"Sin evaluación")}
function updateCount(){const all=[...document.querySelectorAll("[data-i]")];const done=all.filter(x=>x.checked).length;const c=document.getElementById("checkCount");if(c)c.textContent=`${done}/${all.length} completas`}
function stageName(id){return ({before:"BEFORE",during:"DURING",after:"AFTER"}[id]||id)}
function renderStagePreviews(id){
  const box=document.getElementById(id+"Preview");if(!box)return;
  const local=pendingPhotos[id]||[];
  const saved=(currentOrder?.evidences||[]).filter(e=>e.stage===stageName(id));
  box.innerHTML=[...saved.map(e=>`<div class="selected-photo saved-photo"><img src="${esc(e.dataUrl)}" alt="Evidencia guardada"><small>${esc(e.name||"Foto guardada")}</small><button type="button" class="remove-photo" data-remove-saved="${esc(e.id)}" data-stage="${id}">✕ Quitar foto</button><span class="saved-label">Ya guardada</span></div>`),...local.map((f,i)=>`<div class="selected-photo"><img data-local-preview="${id}" data-photo-index="${i}" alt="Vista previa de ${id}"><small>${esc(f.name||"Foto seleccionada")}</small><button type="button" class="remove-photo" data-remove-pending="${i}" data-stage="${id}">✕ Quitar foto</button></div>`)].join("")||`<p class="no-photos">No hay fotos en esta etapa.</p>`;
  box.querySelectorAll("img[data-local-preview]").forEach((img)=>{const f=local[Number(img.dataset.photoIndex)];if(!f)return;const url=URL.createObjectURL(f);img.onload=()=>URL.revokeObjectURL(url);img.onerror=()=>{URL.revokeObjectURL(url);img.alt="No se pudo mostrar la vista previa; intenta otra imagen.";img.classList.add("preview-error")};img.src=url});
  box.querySelectorAll("[data-remove-pending]").forEach(btn=>btn.addEventListener("click",()=>{const index=Number(btn.dataset.removePending);pendingPhotos[id].splice(index,1);renderStagePreviews(id);const msg=document.getElementById(id+"PhotoMsg");msg.textContent="Foto eliminada de la selección.";msg.className="photo-message"}));
  box.querySelectorAll("[data-remove-saved]").forEach(btn=>btn.addEventListener("click",()=>removeSavedPhoto(id,btn.dataset.removeSaved)));
}
async function removeSavedPhoto(stage,id){if(!confirm("¿Eliminar esta fotografía de la OT? Esta acción no se puede deshacer."))return;const msg=document.getElementById(stage+"PhotoMsg");try{const d=await api("/.netlify/functions/orders",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:currentOrder.id,action:"DELETE_EVIDENCE",evidenceId:id})});currentOrder=d.order;renderStagePreviews(stage);msg.textContent="Fotografía eliminada de la OT.";msg.className="photo-message ok"}catch(e){msg.textContent=e.message;msg.className="photo-message error"}}
function renderReadOnlyEvidence(o){return `<h3>📷 Evidencias registradas</h3><div class="evidence-groups">${["BEFORE","DURING","AFTER"].map(stage=>`<div class="evidence-group"><b>${({BEFORE:"ANTES",DURING:"DURANTE",AFTER:"DESPUÉS"})[stage]}</b><div class="selected-photos">${(o.evidences||[]).filter(e=>e.stage===stage).map(e=>`<figure class="selected-photo"><img src="${esc(e.dataUrl)}" alt="Evidencia ${stage}"><figcaption>${esc(e.name||"Foto")}</figcaption></figure>`).join("")||"<span class='muted'>Sin fotos</span>"}</div></div>`).join("")}</div>`}
async function saveDraft(o){const msg=document.getElementById("workMsg");try{const checks=[...document.querySelectorAll("[data-i]")].map(el=>({id:o.checklist[Number(el.dataset.i)].id,text:o.checklist[Number(el.dataset.i)].text,done:el.checked,comment:document.querySelector(`[data-comment="${el.dataset.i}"]`)?.value.trim()||""}));await api("/.netlify/functions/orders",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:o.id,action:"SAVE_DRAFT",checklist:checks,technicianResponse:document.getElementById("response").value.trim(),executionDate:document.getElementById("executionDate").value,startTime:document.getElementById("startTime").value,endTime:document.getElementById("endTime").value,customerSatisfaction:document.querySelector('input[name="customerSatisfaction"]:checked')?.value||"",materialsUsed:document.getElementById("materialsUsed").value.trim(),equipmentCondition:document.getElementById("equipmentCondition").value})});msg.textContent="✓ Avance guardado.";msg.className="message ok"}catch(e){msg.textContent=e.message;msg.className="message error"}}
async function submitWork(e,o){
  e.preventDefault();
  const form=e.target, msg=document.getElementById("workMsg"), btn=form.querySelector(".submit-btn");
  if(btn.disabled)return;
  btn.disabled=true;
  const say=(text,kind="message")=>{msg.textContent=text;msg.className=kind;msg.scrollIntoView({behavior:"smooth",block:"center"})};
  try{
    const checks=[...form.querySelectorAll("[data-i]")].map(el=>({id:o.checklist[Number(el.dataset.i)].id,text:o.checklist[Number(el.dataset.i)].text,done:el.checked,comment:form.querySelector(`[data-comment="${el.dataset.i}"]`)?.value.trim()||""}));
    if(!checks.length)throw new Error("Esta OT no tiene actividades cargadas. Informa al administrador para revisar el PDF original.");
    if(checks.some(x=>!x.done))throw new Error("Completa todas las actividades del checklist antes de enviar.");
    const executionDate=document.getElementById("executionDate").value;
    const startTime=document.getElementById("startTime").value;
    const endTime=document.getElementById("endTime").value;
    const satisfaction=form.querySelector('input[name="customerSatisfaction"]:checked')?.value||"";
    if(!executionDate||!startTime||!endTime)throw new Error("Completa la fecha de ejecución, hora de inicio y hora de finalización.");
    if(endTime<startTime)throw new Error("La hora de finalización no puede ser anterior a la hora de inicio.");
    if(!satisfaction)throw new Error("Selecciona la evaluación del cliente.");
    const payload={id:o.id,checklist:checks,technicianResponse:document.getElementById("response").value.trim(),executionDate,startTime,endTime,customerSatisfaction:satisfaction,materialsUsed:document.getElementById("materialsUsed").value.trim(),equipmentCondition:document.getElementById("equipmentCondition").value};
    if(!["OPERATIONAL","OUT_OF_SERVICE","INSPECTION"].includes(payload.equipmentCondition))throw new Error("Selecciona el estado final del equipo: Operativo, Inoperativo o En inspección.");
    // Guardar primero el formulario: si una foto falla, los comentarios y el checklist no se pierden.
    say("Guardando checklist y datos de ejecución…");
    await api("/.netlify/functions/orders",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({...payload,action:"SAVE_DRAFT"})});
    const groups=[["BEFORE","before","ANTES"],["DURING","during","DURANTE"],["AFTER","after","DESPUÉS"]];
    for(const [stage,id,label] of groups){
      while((pendingPhotos[id]||[]).length){
        const file=pendingPhotos[id][0];
        say(`Preparando y guardando foto ${pendingPhotos[id].length} de ${label.toLowerCase()}…`);
        let dataUrl;
        try{dataUrl=await compressImage(file)}catch(err){throw new Error(`No se pudo preparar la foto de ${label.toLowerCase()} (${file.name||"imagen"}): ${err.message}`)}
        try{
          const d=await api("/.netlify/functions/orders",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:o.id,action:"UPLOAD_EVIDENCE",stage,dataUrl,name:file.name||`${id}.jpg`})});
          // La confirmación autoritativa de la subida es savedEvidence, devuelta
          // solo después de que Netlify Blobs haya guardado la orden. No dependemos
          // de que la copia completa de evidencias del objeto order llegue idéntica.
          if(!d.savedEvidence || normalizeEvidenceStage(d.savedEvidence.stage)!==stage)throw new Error("Netlify no devolvió la confirmación de guardado para esta etapa.");
          const returnedEvidence=(d.order?.evidences||[]).find(x=>String(x.id||"")===String(d.savedEvidence.id||"")&&normalizeEvidenceStage(x.stage)===stage);
          // No inventar una foto guardada usando solo metadatos: la respuesta debe
          // permitir recuperar los bytes reales de la imagen desde el registro de la OT.
          if(!returnedEvidence || typeof returnedEvidence.dataUrl!=="string" || !returnedEvidence.dataUrl.startsWith("data:image/jpeg;base64,")){
            throw new Error("El servidor confirmó la solicitud, pero no devolvió la imagen guardada. La foto permanece seleccionada; vuelve a intentar sin eliminarla.");
          }
          currentOrder=d.order;
          pendingPhotos[id].shift();renderStagePreviews(id);
        }catch(err){throw new Error(`No se pudo guardar la foto de ${label.toLowerCase()}: ${err.message}. La foto sigue seleccionada; vuelve a intentarlo sin quitarla.`)}
      }
    }
    // Primero validamos la respuesta confirmada por cada guardado. Solo consultamos de nuevo
    // si falta una etapa; esto evita un falso negativo por una lectura inmediata desactualizada.
    say("Verificando que las tres evidencias estén guardadas…");
    const hasStage=(order,stage)=>((order?.evidences)||[]).some(x=>normalizeEvidenceStage(x.stage)===stage);
    let missing=groups.filter(([stage])=>!hasStage(currentOrder,stage));
    if(missing.length){
      for(let attempt=0;attempt<3&&missing.length;attempt++){
        await new Promise(resolve=>setTimeout(resolve,400*(attempt+1)));
        const latest=await api("/.netlify/functions/orders?id="+encodeURIComponent(o.id)+"&verify="+Date.now());
        if(latest.order)currentOrder=latest.order;
        missing=groups.filter(([stage])=>!hasStage(currentOrder,stage));
      }
    }
    // No continuar si el propio registro de la OT aún no devuelve las tres etapas.
    // Evita disparar SUBMIT y perder tiempo cuando una carga no quedó persistida.
    if(missing.length){
      const labels=missing.map(([, ,label])=>label).join(", ");
      throw new Error(`No se pudo verificar en la orden guardada la evidencia de ${labels}. Las fotos ya confirmadas se conservan; vuelve a intentar solo la etapa indicada.`);
    }
    say("Enviando la OT a revisión…");
    await api("/.netlify/functions/orders",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({...payload,action:"SUBMIT"})});
    say("✓ OT enviada a revisión.","message ok");
    // Actualiza la lista sin volver a abrir inmediatamente el expediente completo
    // (que incluye las imágenes); el envío ya quedó confirmado por el servidor.
    currentOrder=null; pendingPhotos={before:[],during:[],after:[]};
    await load();
  }catch(err){say(err.message,"message error")}
  finally{btn.disabled=false}
}
async function compressImage(file){
  if(!file)throw new Error("No se recibió ningún archivo de imagen.");
  const detected=await detectImageFormat(file);
  if(!detected.isImage)throw new Error("El archivo no contiene un formato de imagen reconocido. Selecciona una foto JPG, PNG, WebP, GIF, BMP, AVIF o HEIC/HEIF desde la galería.");
  if(detected.heic)file=await convertHeicToJpeg(file);
  else if(detected.mime&&file.type!==detected.mime)file=withDetectedMime(file,detected.mime);
  const decoded=await decodeImage(file);
  try{
    let maxSide=1280,canvas=document.createElement("canvas"),scale=Math.min(1,maxSide/Math.max(decoded.width,decoded.height));
    canvas.width=Math.max(1,Math.round(decoded.width*scale));canvas.height=Math.max(1,Math.round(decoded.height*scale));
    const ctx=canvas.getContext("2d");if(!ctx)throw new Error("El navegador no pudo procesar la fotografía.");ctx.drawImage(decoded.source,0,0,canvas.width,canvas.height);
    for(let attempt=0;attempt<7;attempt++){
      const quality=[.78,.7,.62,.55,.48,.42,.36][attempt];
      const blob=await new Promise(resolve=>canvas.toBlob(resolve,"image/jpeg",quality));
      if(!blob)throw new Error("El navegador abrió la imagen, pero no pudo convertirla a JPEG. Prueba otra foto.");
      const dataUrl=await blobToDataUrl(blob);
      if(dataUrl.length<=640000)return dataUrl;
      if(attempt>=3){canvas.width=Math.max(1,Math.round(canvas.width*.82));canvas.height=Math.max(1,Math.round(canvas.height*.82));ctx.drawImage(decoded.source,0,0,canvas.width,canvas.height)}
    }
    throw new Error("La fotografía sigue siendo demasiado grande. Intenta tomarla de nuevo o elige una imagen más pequeña.");
  }finally{if(decoded.cleanup)decoded.cleanup()}
}

// Inspección de firma binaria: el nombre y el MIME que devuelve una galería no
// siempre corresponden al contenido real. Solo se modifica esta ruta de imágenes.
async function detectImageFormat(file){
  const name=String(file?.name||"");
  const head=new Uint8Array(await file.slice(0,64).arrayBuffer());
  const ascii=(a,b)=>String.fromCharCode(...head.slice(a,b));
  const starts=(...bytes)=>bytes.every((v,i)=>head[i]===v);
  const lowerName=name.toLowerCase();
  if(starts(0xff,0xd8,0xff))return {format:"jpeg",mime:"image/jpeg",isImage:true,heic:false};
  if(starts(0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a))return {format:"png",mime:"image/png",isImage:true,heic:false};
  if(ascii(0,6)==="GIF87a"||ascii(0,6)==="GIF89a")return {format:"gif",mime:"image/gif",isImage:true,heic:false};
  if(ascii(0,2)==="BM")return {format:"bmp",mime:"image/bmp",isImage:true,heic:false};
  if(ascii(0,4)==="RIFF"&&ascii(8,12)==="WEBP")return {format:"webp",mime:"image/webp",isImage:true,heic:false};
  if((ascii(0,4)==="II*\0")||(ascii(0,4)==="MM\0*"))return {format:"tiff",mime:"image/tiff",isImage:true,heic:false};
  // ISO-BMFF: distinguish AVIF from HEIC/HEIF by the ftyp brand.
  if(ascii(4,8)==="ftyp"){
    const brands=ascii(8,Math.min(head.length,32)).replace(/\0/g,"").toLowerCase();
    if(/avif|avis/.test(brands))return {format:"avif",mime:"image/avif",isImage:true,heic:false};
    if(/heic|heix|hevc|hevx|heim|heis|hevm|hevs|mif1|msf1/.test(brands))return {format:"heif",mime:file.type||"image/heic",isImage:true,heic:true};
  }
  // SVG es texto; no se acepta como evidencia fotográfica para evitar contenido activo.
  if(/^\s*(?:<\?xml[^>]*>\s*)?<svg[\s>]/i.test(new TextDecoder().decode(await file.slice(0,512).arrayBuffer())))return {format:"svg",mime:"image/svg+xml",isImage:false,heic:false};
  // Algunos formatos de cámara no tienen una firma soportada por los navegadores.
  // No confiar solo en .jpg; el MIME es únicamente un último indicio, no una prueba.
  if(/\.(heic|heif)$/i.test(lowerName)||/image\/(heic|heif|heic-sequence|heif-sequence)/i.test(file.type||"")){
    return {format:"heif-unknown",mime:file.type||"image/heic",isImage:true,heic:true};
  }
  if(file.type&&/^image\/(jpeg|png|webp|gif|bmp|avif|tiff)$/i.test(file.type))return {format:file.type.split("/")[1],mime:file.type,isImage:true,heic:false};
  return {format:"unknown",mime:"",isImage:false,heic:false};
}
function withDetectedMime(file,mime){
  try{return new File([file],file.name||"evidencia",{type:mime,lastModified:file.lastModified||Date.now()})}catch{return file}
}
// Copia los bytes del archivo inmediatamente al seleccionarlo. Algunas galerías
// móviles entregan referencias temporales que dejan de poder leerse más tarde.
// El resto del flujo trabaja con esta copia independiente, no con la referencia original.
async function snapshotSelectedFile(file){
  if(!file)throw new Error("No se recibió ningún archivo de imagen.");
  let bytes;
  try{bytes=await file.arrayBuffer();}
  catch(error){
    // Alternativa para navegadores móviles con File.arrayBuffer inestable.
    try{bytes=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(reader.error||error);reader.readAsArrayBuffer(file);});}
    catch{throw new Error("El celular ya no permite leer esta referencia de la foto. Vuelve a seleccionarla desde la galería o toma la fotografía nuevamente.");}
  }
  if(!(bytes instanceof ArrayBuffer)||!bytes.byteLength)throw new Error("La fotografía está vacía o el celular no permitió leerla. Vuelve a seleccionarla.");
  try{return new File([bytes],file.name||"evidencia.jpg",{type:file.type||"application/octet-stream",lastModified:file.lastModified||Date.now()});}
  catch{return new Blob([bytes],{type:file.type||"application/octet-stream"});}
}
function isHeicFile(file){return /\.(heic|heif)$/i.test(file?.name||"")||/image\/(heic|heif|heic-sequence|heif-sequence)/i.test(file?.type||"")}
let heicConverterPromise=null;
async function loadHeicConverter(){
  if(typeof window.heic2any==="function")return window.heic2any;
  if(!heicConverterPromise)heicConverterPromise=new Promise((resolve,reject)=>{
    const sources=["https://cdn.jsdelivr.net/npm/heic2any@0.0.4/dist/heic2any.min.js","https://unpkg.com/heic2any@0.0.4/dist/heic2any.min.js"];
    let index=0;
    const tryNext=()=>{
      if(index>=sources.length){reject(new Error("El archivo es HEIC/HEIF y este navegador necesita el conversor para abrirlo. Comprueba la conexión a internet y vuelve a seleccionarlo; las fotos JPG, PNG, WebP y AVIF no dependen de ese conversor."));return}
      const script=document.createElement("script");script.src=sources[index++];script.async=true;
      script.onload=()=>typeof window.heic2any==="function"?resolve(window.heic2any):(script.remove(),tryNext());
      script.onerror=()=>{script.remove();tryNext()};document.head.appendChild(script);
    };
    tryNext();
  }).catch(error=>{heicConverterPromise=null;throw error});
  return heicConverterPromise;
}
async function convertHeicToJpeg(file){
  const convert=await loadHeicConverter();let result;
  try{result=await convert({blob:file,toType:"image/jpeg",quality:0.86})}catch(error){throw new Error("Se detectó HEIC/HEIF, pero no fue posible convertir esta fotografía. Comprueba la conexión y vuelve a seleccionarla.")}
  const blob=Array.isArray(result)?result[0]:result;
  if(!(blob instanceof Blob)||!blob.size)throw new Error("El conversor no generó una imagen válida. Vuelve a tomar la foto.");
  const name=(file.name||"evidencia").replace(/\.(heic|heif)$/i,"")+".jpg";
  return new File([blob],name,{type:"image/jpeg",lastModified:Date.now()});
}
async function decodeImage(file){
  // Camino 1: decoder nativo del navegador.
  if("createImageBitmap" in window){
    try{
      const bitmap=await createImageBitmap(file,{imageOrientation:"from-image"});
      if(bitmap.width>0&&bitmap.height>0)return {source:bitmap,width:bitmap.width,height:bitmap.height,cleanup:()=>bitmap.close?.()};
      bitmap.close?.();
    }catch{/* Continuar con los caminos alternativos. */}
  }
  // Camino 2: URL de objeto, comprobando dimensiones reales.
  const url=URL.createObjectURL(file);
  try{
    const img=await new Promise((resolve,reject)=>{
      const image=new Image();image.onload=()=>image.naturalWidth>0&&image.naturalHeight>0?resolve(image):reject(new Error("La imagen se abrió sin dimensiones válidas."));
      image.onerror=()=>reject(new Error("El navegador no pudo abrir la imagen desde el archivo seleccionado."));image.src=url;
      if(typeof image.decode==="function")image.decode().then(()=>{if(image.naturalWidth>0&&image.naturalHeight>0)resolve(image)}).catch(()=>{});
    });
    return {source:img,width:img.naturalWidth,height:img.naturalHeight,cleanup:()=>URL.revokeObjectURL(url)};
  }catch(e){URL.revokeObjectURL(url)}
  // Camino 3: data URL, para navegadores/galerías que no decodifican blob URL.
  const dataUrl=await blobToDataUrl(file);
  try{
    const img=await new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>image.naturalWidth>0&&image.naturalHeight>0?resolve(image):reject(new Error("La imagen no tiene dimensiones válidas."));image.onerror=()=>reject(new Error("El navegador no pudo decodificar el contenido de la fotografía."));image.src=dataUrl;if(typeof image.decode==="function")image.decode().then(()=>{if(image.naturalWidth>0&&image.naturalHeight>0)resolve(image)}).catch(()=>{})});
    return {source:img,width:img.naturalWidth,height:img.naturalHeight,cleanup:null};
  }catch(e){
    const detected=await detectImageFormat(file);
    if(detected.heic)return Promise.reject(new Error("La foto es HEIC/HEIF, pero no se pudo convertir. Comprueba la conexión a internet y vuelve a seleccionarla."));
    if(detected.format==="tiff")return Promise.reject(new Error("El archivo es TIFF; este navegador no lo puede decodificar de forma nativa. Guarda o exporta la foto como JPG o PNG."));
    if(detected.format==="unknown")return Promise.reject(new Error("El contenido no coincide con un formato de imagen compatible. Prueba exportarla desde la galería como JPG o PNG."));
    return Promise.reject(new Error(`El archivo se identificó como ${detected.format.toUpperCase()}, pero el navegador no pudo decodificarlo. Prueba guardar una copia nueva desde la galería.`));
  }
}
function blobToDataUrl(blob){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(new Error("No se pudo preparar la fotografía para enviarla."));reader.readAsDataURL(blob)})}
function closeDetail(){document.getElementById("detail").classList.add("hidden");currentOrder=null;load()}
async function openPdf(id){const w=window.open("about:blank","_blank");try{const d=await api("/.netlify/functions/orders?id="+encodeURIComponent(id)+"&pdf=1");if(!d.dataUrl)throw new Error("Esta orden no tiene un PDF original adjunto.");const blob=await (await fetch(d.dataUrl)).blob();const url=URL.createObjectURL(blob);if(w&&!w.closed){w.location.replace(url)}else{location.href=url}setTimeout(()=>URL.revokeObjectURL(url),120000)}catch(e){if(w&&!w.closed)w.close();alert(e.message)}}
function fmt(v){return v?new Date(v).toLocaleString("es-CO"):"—"}
function esc(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}
load();

// Sincroniza el contador mientras la PWA está abierta. No interrumpe el formulario de trabajo.
setInterval(refreshPendingBadge,60000);
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")refreshPendingBadge()});
