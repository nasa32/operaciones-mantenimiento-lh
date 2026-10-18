const session=getSession("admin"); if(!session)location.href="/"; document.getElementById("who").textContent=`Sesión: ${session.username}`;
let orders=[];
const pdfInput=document.getElementById("pdf");
if(pdfInput){pdfInput.addEventListener("change",async()=>{
  const file=pdfInput.files&&pdfInput.files[0]; const msg=document.getElementById("pdfReadMsg");
  if(!file){if(msg)msg.textContent="";return;}
  const fieldIds=["otNumber","technician","type","area","equipment","description","checklist","dueDate"];
  const hasExistingData=fieldIds.some(id=>{const el=document.getElementById(id);return !!(el&&String(el.value||"").trim());});
  if(hasExistingData){
    const replace=confirm("Va a cargar otro PDF. ¿Desea reemplazar TODA la orden en el formulario (número, técnico, tipo, área, equipo, descripción y checklist) con los datos del nuevo PDF? Los campos que no se puedan extraer se limpiarán para evitar conservar datos de la OT anterior.");
    if(!replace){pdfInput.value="";if(msg){msg.textContent="Selección cancelada. Los datos anteriores se conservaron; vuelva a seleccionar el PDF correcto antes de crear la OT.";msg.className="message";}return;}
  }
  if(msg){msg.textContent="Leyendo el PDF original…";msg.className="message";}
  try{
    if(typeof window.extractOTFromPdf!=="function") throw new Error("El lector PDF todavía está cargando. Espere un momento e intente de nuevo.");
    const result=await window.extractOTFromPdf(file); const f=result.fields||{};
    // A new PDF represents a new source of truth: clear old values before applying extracted values.
    document.getElementById("otNumber").value=f.number||"";
    document.getElementById("dueDate").value=f.dueDate||f.scheduledDate||"";
    document.getElementById("type").value=f.type||"";
    document.getElementById("area").value=f.area||"";
    document.getElementById("equipment").value=f.equipment||"";
    document.getElementById("description").value=f.description||"";
    const techSelect=document.getElementById("technician");
    techSelect.value="";
    if(f.technician){
      const wanted=String(f.technician).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]/g,"");
      const match=[...techSelect.options].find(o=>o.value && (String(o.textContent).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]/g,"")===wanted));
      if(match)techSelect.value=match.value;
    }
    const box=document.getElementById("checklist");
    const activities=Array.isArray(result.activities)?result.activities:[];
    box.value=activities.join("\n");
    const count=Number(result.activityCount ?? activities.length);
    if(msg){
      const techNote=f.technician&&!techSelect.value?" El técnico extraído no coincide con un usuario activo; seleccione el técnico correcto manualmente.":(!f.technician?" Seleccione el técnico responsable manualmente.":"");
      msg.textContent=`PDF leído (${result.pages} página(s)). ${count} actividad(es) extraída(s). Se reemplazaron los datos del formulario con la información del nuevo PDF; revise los campos antes de crear la OT.${techNote}`;
      msg.className=count>0?"message ok":"message error";
    }
  }catch(err){
    // Do not leave stale values that could be submitted with a different PDF.
    document.getElementById("otNumber").value="";document.getElementById("dueDate").value="";document.getElementById("type").value="";document.getElementById("area").value="";document.getElementById("equipment").value="";document.getElementById("description").value="";document.getElementById("checklist").value="";document.getElementById("technician").value="";
    if(msg){msg.textContent=err.message+" Se limpiaron los campos para evitar mezclar datos de dos órdenes; revise el PDF y vuelva a intentarlo.";msg.className="message error";}
  }
});}
const reportForm=document.getElementById("managementReportForm");
if(reportForm){
  const now=new Date();const today=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;const first=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-01`;
  document.getElementById("reportFrom").value=first;document.getElementById("reportTo").value=today;
  document.getElementById("reportFrom").max=today;document.getElementById("reportTo").max=today;
  document.getElementById("reportFrom").addEventListener("change",()=>{const from=document.getElementById("reportFrom").value;document.getElementById("reportTo").min=from;if(document.getElementById("reportTo").value<from)document.getElementById("reportTo").value=from;});
  reportForm.addEventListener("submit",async e=>{e.preventDefault();const from=document.getElementById("reportFrom").value,to=document.getElementById("reportTo").value,photos=document.getElementById("reportPhotos").value,msg=document.getElementById("reportMsg");if(!from||!to||to<from){msg.textContent="Verifica que la fecha final sea igual o posterior a la inicial.";msg.className="message error";return;}msg.textContent="Preparando el resumen de equipos y las fotografías seleccionadas…";msg.className="message";try{await downloadFile(`/.netlify/functions/export?type=management-pdf&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&photos=${encodeURIComponent(photos)}`,`Informe_Gestion_Mantenimiento_${from}_${to}.pdf`,true);msg.textContent="Informe de equipos generado. Si no hay intervenciones en el periodo, revisa el mensaje recibido.";msg.className="message ok"}catch(err){msg.textContent=err.message;msg.className="message error"}});
}
const managementExcelForm=document.getElementById("managementExcelForm");
if(managementExcelForm){
  const now=new Date();const today=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;const first=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-01`;
  document.getElementById("excelFrom").value=first;document.getElementById("excelTo").value=today;document.getElementById("excelFrom").max=today;document.getElementById("excelTo").max=today;
  document.getElementById("excelFrom").addEventListener("change",()=>{const from=document.getElementById("excelFrom").value;document.getElementById("excelTo").min=from;if(document.getElementById("excelTo").value<from)document.getElementById("excelTo").value=from;});
  managementExcelForm.addEventListener("submit",async e=>{e.preventDefault();const from=document.getElementById("excelFrom").value,to=document.getElementById("excelTo").value,msg=document.getElementById("excelReportMsg");if(from&&to&&to<from){msg.textContent="La fecha final debe ser igual o posterior a la fecha inicial.";msg.className="message error";return;}const q=new URLSearchParams({type:"management-excel",from,to,technician:document.getElementById("excelTechnician").value,area:document.getElementById("excelArea").value,maintenanceType:document.getElementById("excelMaintenanceType").value,status:document.getElementById("excelStatus").value});msg.textContent="Generando dashboard y análisis con los datos reales…";msg.className="message";try{await downloadFile(`/.netlify/functions/export?${q.toString()}`,`OPS_Dashboard_Mantenimiento_${from||"inicio"}_${to||"hoy"}.xlsx`,true);msg.textContent="Excel generado con los filtros seleccionados.";msg.className="message ok"}catch(err){msg.textContent=err.message;msg.className="message error"}});
}
function refreshExcelFilterOptions(){const fill=(id,values,firstLabel,firstValue)=>{const el=document.getElementById(id);if(!el)return;const previous=el.value;const unique=[...new Set(values.map(v=>String(v||"").trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"es"));el.innerHTML=`<option value="${firstValue}">${firstLabel}</option>`+unique.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join("");if([...el.options].some(o=>o.value===previous))el.value=previous};fill("excelTechnician",orders.map(o=>o.technicianUsername),"Todos los técnicos","Todos");fill("excelArea",orders.map(o=>o.area),"Todas las áreas","Todas")}
function getSession(role){try{const s=JSON.parse(localStorage.getItem("ot_session")||"null");return s&&s.role===role?s:null}catch{return null}}
function logout(){localStorage.removeItem("ot_session");location.href="/"}
async function api(url,options={}){options.headers={...(options.headers||{}),Authorization:"Bearer "+session.token};const r=await fetch(url,options);const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||"Error del servidor");return d}
async function loadTechnicians(){const d=await api("/.netlify/functions/users");const opts=d.users.filter(u=>u.role==="technician"&&u.active).map(u=>`<option value="${u.id}">${esc(u.username)}</option>`).join("");const specific=document.getElementById("technician"),general=document.getElementById("generalTechnician");if(specific)specific.innerHTML=`<option value="">Seleccione el técnico responsable</option>`+opts;if(general)general.innerHTML=`<option value="">Seleccione el técnico responsable</option>`+opts}
document.getElementById("createForm").addEventListener("submit",async e=>{e.preventDefault();const msg=document.getElementById("createMsg");msg.textContent="Creando OT…";msg.className="message";try{const file=document.getElementById("pdf").files[0];if(!file||file.type!=="application/pdf")throw new Error("Seleccione un PDF válido.");const buf=await file.arrayBuffer();let binary="";const bytes=new Uint8Array(buf);for(let i=0;i<bytes.length;i+=0x8000)binary+=String.fromCharCode(...bytes.subarray(i,i+0x8000));const checklist=document.getElementById("checklist").value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean).map((text,i)=>({id:`a${i+1}`,text,done:false}));await api("/.netlify/functions/orders",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({number:otNumber.value.trim(),technicianId:technician.value,type:type.value,area:area.value,equipment:equipment.value,description:description.value,dueDate:document.getElementById("dueDate")?.value||"",checklist,pdfBase64:btoa(binary),pdfName:file.name})});msg.textContent="✓ OT creada y asignada.";msg.className="message ok";e.target.reset();await loadTechnicians();await loadOTs()}catch(err){msg.textContent=err.message;msg.className="message error"}});
function addGeneralActivityRow(text="",dueDate=""){
 const wrap=document.getElementById("generalActivitiesEditor");if(!wrap)return;
 const row=document.createElement("div");row.className="general-activity-editor-row";
 row.innerHTML=`<label>Actividad / tarea<input class="general-activity-text" required placeholder="Ej. Inspección de luminaria exterior" value="${esc(text)}"></label><label>Fecha de ejecución<input class="general-activity-date" type="date" required value="${esc(dueDate)}"></label><button type="button" class="danger" aria-label="Eliminar actividad">×</button>`;
 row.querySelector("button").addEventListener("click",()=>{if(wrap.children.length<=1){row.querySelector(".general-activity-text").value="";row.querySelector(".general-activity-date").value="";return}row.remove()});wrap.appendChild(row);
}
const generalForm=document.getElementById("generalCreateForm");
if(generalForm){addGeneralActivityRow();document.getElementById("addGeneralActivity").addEventListener("click",()=>addGeneralActivityRow());generalForm.addEventListener("submit",async e=>{e.preventDefault();const msg=document.getElementById("generalCreateMsg"),activities=[...document.querySelectorAll(".general-activity-editor-row")].map((r,i)=>({id:`ga${i+1}`,text:r.querySelector(".general-activity-text").value.trim(),dueDate:r.querySelector(".general-activity-date").value})).filter(a=>a.text);if(!activities.length||activities.some(a=>!a.dueDate)){msg.textContent="Cada actividad debe tener descripción y fecha de ejecución.";msg.className="message error";return}msg.textContent="Creando OT General…";msg.className="message";try{const d=await api("/.netlify/functions/orders",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"CREATE_GENERAL",title:document.getElementById("generalTitle").value.trim(),technicianId:document.getElementById("generalTechnician").value,type:document.getElementById("generalType").value,description:document.getElementById("generalDescription").value.trim(),activities})});msg.textContent=`✓ ${d.order.number} creada y asignada con ${activities.length} actividades.`;msg.className="message ok";generalForm.reset();document.getElementById("generalActivitiesEditor").innerHTML="";addGeneralActivityRow();await loadOTs()}catch(err){msg.textContent=err.message;msg.className="message error"}})}
function isOrderOverdue(o,today=new Date().toLocaleDateString("en-CA")){
 if(o.archived||!["ASSIGNED","IN_PROGRESS","RETURNED"].includes(o.status))return false;
 if(o.isGeneral||o.orderType==="GENERAL")return (o.generalActivities||[]).some(a=>!a.done&&a.dueDate&&String(a.dueDate).slice(0,10)<today);
 const due=String(o.dueDate||o.scheduledDate||o.plannedDate||"").slice(0,10);return !!due&&due<today;
}
function overdueBadge(o){return isOrderOverdue(o)?'<span class="status overdue">RETRASADA</span>':""}
async function loadOTs(){const box=document.getElementById("ots");box.innerHTML=`<div class="loading">Cargando órdenes…</div>`;try{const d=await api("/.netlify/functions/orders");orders=d.orders||[];refreshExcelFilterOptions();renderStats();renderFiltered();renderManualOrders();renderArchived()}catch(e){box.innerHTML=`<p class="error">${esc(e.message)}</p>`}}
function renderStats(){const c=s=>orders.filter(o=>o.status===s).length;document.getElementById("stats").innerHTML=`<div class="stat stat-total"><span>Total OT</span><b>${orders.length}</b></div><div class="stat stat-pending"><span>● Pendientes</span><b>${c("ASSIGNED")}</b></div><div class="stat stat-progress"><span>● En ejecución</span><b>${c("IN_PROGRESS")}</b></div><div class="stat stat-review"><span>● En revisión</span><b>${c("IN_REVIEW")}</b></div><div class="stat stat-accepted"><span>● Aceptadas</span><b>${c("ACCEPTED")}</b></div><div class="stat stat-overdue"><span>● Retrasadas</span><b>${orders.filter(o=>isOrderOverdue(o)).length}</b></div>`;renderAnalytics()}
function renderAnalytics(){
 const statusDefs=[['ASSIGNED','Pendientes','#f4b400'],['IN_PROGRESS','En ejecución','#1687e8'],['IN_REVIEW','En revisión','#7958e8'],['ACCEPTED','Aceptadas','#13a36f'],['RETURNED','Devueltas','#dc4b4b']];
 const chart=(id,rows)=>{const el=document.getElementById(id);if(!el)return;const max=Math.max(1,...rows.map(x=>x.value));el.innerHTML=rows.length?rows.map(x=>`<div class="bar-row"><div class="bar-label">${esc(x.label)}</div><div class="bar-track"><div class="bar-fill" style="width:${Math.max(x.value?3:0,x.value/max*100)}%;background:${x.color||'#1687e8'}"></div></div><b>${x.value}</b></div>`).join(''):'<p class="muted">Sin datos para mostrar.</p>'};
 chart('statusChart',statusDefs.map(([s,label,color])=>({label,value:orders.filter(o=>o.status===s).length,color})));
 const countBy=(key)=>{const m=new Map();orders.forEach(o=>{const v=String(o[key]||'Sin especificar').trim()||'Sin especificar';m.set(v,(m.get(v)||0)+1)});return [...m].map(([label,value])=>({label,value})).sort((a,b)=>b.value-a.value).slice(0,7)};
 chart('areaChart',countBy('area'));chart('typeChart',countBy('type'));
 const techCounts=new Map();orders.forEach(o=>{const t=o.technicianUsername||'Sin técnico';const row=techCounts.get(t)||{assigned:0,accepted:0};row.assigned++;if(o.status==='ACCEPTED')row.accepted++;techCounts.set(t,row)});chart('technicianChart',[...techCounts].map(([label,v])=>({label,value:v.accepted,color:'#13a36f'})).sort((a,b)=>b.value-a.value).slice(0,8));
 const activities=orders.flatMap(o=>[...(o.checklist||[]).map(a=>({...a,order:o})),...(o.generalActivities||[]).map(a=>({...a,order:o,text:a.text,done:!!a.done}))]);const done=activities.filter(a=>a.done).length;const pending=activities.length-done;
 const metric=(label,value,color,sub='')=>`<div class="metric-row"><span><i style="background:${color}"></i>${label}</span><b>${value}</b>${sub?`<small>${sub}</small>`:''}</div>`;
 document.getElementById('activityMetrics').innerHTML=metric('Actividades registradas',activities.length,'#64748b')+metric('Realizadas',done,'#13a36f',activities.length?Math.round(done/activities.length*100)+'% completadas':'Sin checklist')+metric('Pendientes',pending,'#f4b400');
 const materialOrders=orders.filter(o=>String(o.materialsUsed||'').trim());const materialLines=materialOrders.flatMap(o=>String(o.materialsUsed).split(/[,;\n]+/).map(x=>x.trim()).filter(Boolean));document.getElementById('materialsMetrics').innerHTML=metric('OT con materiales registrados',materialOrders.length,'#1687e8')+metric('Renglones de materiales',materialLines.length,'#f4b400')+`<p class="muted small-note">Los materiales se capturan como texto; para sumar cantidades y costos exactos se necesita registrar cada insumo con unidad y cantidad.</p>`;
 const sats=[['UNSATISFIED','Insatisfecho','#dc4b4b'],['SATISFIED','Satisfecho','#f4b400'],['VERY_SATISFIED','Muy satisfecho','#13a36f']];const rated=orders.filter(o=>o.customerSatisfaction);document.getElementById('satisfactionMetrics').innerHTML=sats.map(([key,label,color])=>metric(label,orders.filter(o=>o.customerSatisfaction===key).length,color,rated.length?Math.round(orders.filter(o=>o.customerSatisfaction===key).length/rated.length*100)+'% de evaluaciones':'')).join('')+`<p class="muted small-note">Evaluaciones recibidas: ${rated.length} de ${orders.length} OT.</p>`;
}
function renderFiltered(){const q=(document.getElementById("search")?.value||"").toLowerCase();const sf=document.getElementById("statusFilter")?.value||"";const list=orders.filter(o=>!o.archived&&(!sf||(sf==="OVERDUE"?isOrderOverdue(o):o.status===sf))&&(!q||[o.number,o.area,o.equipment,o.technicianUsername,o.description,o.title].join(" ").toLowerCase().includes(q)));const box=document.getElementById("ots");if(!list.length){box.innerHTML=`<div class="empty-state"><div class="empty-icon">✓</div><b>No hay órdenes con estos filtros.</b><p>Prueba otra búsqueda o cambia el estado.</p></div>`;return}box.innerHTML=`<div class="ot-list">${list.map(o=>`<article class="admin-ot"><div class="ot-id"><strong>${esc(o.number)}</strong><span class="status ${statusClass(o.status)}">${esc(statusLabel(o.status))}</span>${o.isGeneral?'<span class="general-type-tag">OT GENERAL</span>':'<span class="specific-type-tag">OT ESPECÍFICA</span>'}${overdueBadge(o)}</div><div class="ot-info"><span>👤 ${esc(o.technicianUsername||"Sin técnico")}</span><span>📍 ${esc(o.area||"Sin área")}</span><span>⚙ ${esc(o.equipment||"Sin equipo")}</span><span>🕒 ${fmt(o.updatedAt)}</span></div><button class="secondary" onclick="showOT('${o.id}')">Ver expediente →</button>${o.status==="ACCEPTED"?`<button class="secondary" onclick="archiveOrder('${o.id}')">Archivar</button>`:""}${o.status==="ASSIGNED"&&!o.manual?`<button class="danger" onclick="deleteOrder('${o.id}')">Eliminar</button>`:""}</article>`).join("")}</div>`}
function renderManualOrders(){const box=document.getElementById("manualOrdersList");if(!box)return;const q=(document.getElementById("manualSearch")?.value||"").toLowerCase();const sf=document.getElementById("manualStatusFilter")?.value||"";const list=orders.filter(o=>!o.archived&&(o.origin==="MANUAL"||o.manual===true)&&(!sf||o.status===sf)&&(!q||[o.number,o.technicianUsername,o.area,o.equipment,o.description].join(" ").toLowerCase().includes(q)));if(!list.length){box.innerHTML='<div class="empty-state"><div class="empty-icon">🛠</div><b>No hay órdenes manuales con estos filtros.</b><p>Cuando un técnico envíe un trabajo espontáneo, aparecerá aquí.</p></div>';return}box.innerHTML=`<div class="ot-list">${list.map(o=>`<article class="admin-ot manual-ot"><div><div class="ot-id"><strong>${esc(o.number)}</strong><span class="status ${statusClass(o.status)}">${esc(statusLabel(o.status))}</span><span class="manual-type-tag">${esc(o.type||"Sin tipo")}</span></div><div class="ot-info"><span>👤 ${esc(o.technicianUsername||"Sin técnico")}</span><span>📍 ${esc(o.area||"Sin área")}</span><span>⚙ ${esc(o.equipment||"Sin equipo")}</span><span>🕒 ${fmt(o.updatedAt)}</span></div></div><button class="secondary" onclick="showOT('${o.id}')">Revisar expediente →</button></article>`).join("")}</div>`}
function statusLabel(s){return ({ASSIGNED:"PENDIENTE",IN_PROGRESS:"EN EJECUCIÓN",IN_REVIEW:"EN REVISIÓN",RETURNED:"DEVUELTA",ACCEPTED:"ACEPTADA"}[s]||s||"")}
function cleanChecklistDisplay(items){
 const headings=/^(?:nombres?\s+y\s+apellidos|personal\s+de\s+mantenimiento|c[oó]digo|especialidad|cargo|t[eé]cnicos?|actividades?\s+de\s+mantenimiento.*|materiales?.*|repuestos?.*|insumos?.*|observaciones.*)$/i;
 const roles=/^(?:electricista|tornero|mec[aá]nico|mecanico|t[eé]cnico|tecnico|supervisor|operario|soldador|fontanero|plomero|jardinero|auxiliar|refrigerista|pintor|conductor|operador)$/i;
 const actionStart=/^(?:verificaci[oó]n|inspecci[oó]n|cambio|revisi[oó]n|lubricaci[oó]n|prueba|ajuste|limpieza|mantenimiento|reparaci[oó]n|instalaci[oó]n|sustituci[oó]n|calibraci[oó]n|medici[oó]n|retiro|montaje|desmontaje|diagn[oó]stico|control|comprobaci[oó]n|lavado|engrase|desarme|armado|reemplazo|restauraci[oó]n|poda|aplicaci[oó]n|recolecci[oó]n|tratamiento|arranque|puesta\s+en\s+marcha)\b/i;
 const person=/^[A-ZÁÉÍÓÚÜÑ][a-záéíóúüñ]+(?:\s+[A-ZÁÉÍÓÚÜÑ][a-záéíóúüñ]+){1,3}$/;
 return (Array.isArray(items)?items:[]).filter(a=>{const t=String(a?.text||'').replace(/\s+/g,' ').trim();return !!t&&!headings.test(t)&&!roles.test(t)&&!/^(?:REG|MAT|OT|EQ)-?\d{2,}\b/i.test(t)&&!(person.test(t)&&!actionStart.test(t));});
}
function statusClass(s){return s.toLowerCase().replace("_","-")}
async function showOT(id){
  try{
    const d=await api("/.netlify/functions/orders?id="+encodeURIComponent(id));
    const o=d.order, box=document.getElementById("detail");
    box.classList.remove("hidden");
    const generalRows=(o.generalActivities||[]).map((a,i)=>{const ev=(o.evidences||[]).find(e=>String(e.stage||"")===`TASK:${a.id}`||String(e.activityId||"")===String(a.id));return `<tr><td>${i+1}</td><td>${esc(a.text)}</td><td>${esc(a.dueDate||"—")}</td><td>${a.done?'<span class="status accepted">COMPLETADA</span>':(a.dueDate&&a.dueDate<new Date().toLocaleDateString("en-CA")?'<span class="status overdue">RETRASADA</span>':'<span class="status assigned">PENDIENTE</span>')}</td><td>${ev?.dataUrl?`<a href="${esc(ev.dataUrl)}" target="_blank" rel="noopener">Ver foto</a>`:"Sin foto"}</td><td>${esc(a.comment||"—")}</td></tr>`}).join("");
    const checks=cleanChecklistDisplay(o.checklist).map(a=>`<div>${a.done?"☑":"☐"} <span>${esc(a.text)}</span>${a.comment?`<p class="activity-comment-read">${esc(String(a.comment).replace(/^\s*(?:comentario\s+del\s+t[eé]cnico\s*:\s*)/i, ""))}</p>`:""}</div>`).join("")||"Sin checklist";
    const evidenceHtml=["BEFORE","DURING","AFTER"].map(stage=>{
      const photos=(o.evidences||[]).filter(e=>e.stage===stage).map(e=>`<figure><img src="${e.dataUrl}" alt="Evidencia"><figcaption>${fmt(e.createdAt)}</figcaption></figure>`).join("")||"<span class=\"muted\">Sin fotos</span>";
      return `<div><h4>${stageLabel(stage)}</h4><div class="photo-list">${photos}</div></div>`;
    }).join("");
    const timeline=(o.history||[]).slice().reverse().map(h=>`<div class="timeline-item"><b>${historyLabel(h.action)}</b><span>${fmt(h.at)} · ${esc(h.by)}</span>${h.reason?`<p>${esc(h.reason)}</p>`:""}</div>`).join("");
    const reviewActions=o.status==="IN_REVIEW"?`<button class="success" onclick="decide('${o.id}','ACCEPT')">✓ Aceptar OT</button><button class="danger" onclick="decide('${o.id}','RETURN')">↩ Devolver</button>`:"";
    box.innerHTML=`
      <div class="detail-head"><div><span class="kicker">EXPEDIENTE</span><h2>${esc(o.number)} <span class="status ${statusClass(o.status)}">${esc(statusLabel(o.status))}</span></h2><p>${esc(o.area||"Sin área")} · ${esc(o.equipment||"Sin equipo")} · ${esc(o.technicianUsername||"")}</p>${o.isGeneral?'<span class="general-type-tag">OT GENERAL</span>':'<span class="specific-type-tag">OT ESPECÍFICA</span>'}${overdueBadge(o)}</div><button class="secondary" onclick="closeDetail()">Cerrar</button></div>
      <div class="action-grid"><button class="secondary" onclick="openPdf('${o.id}')">📄 PDF original</button><button class="secondary" onclick="downloadFile('/.netlify/functions/export?id=${o.id}&type=pdf','${esc(o.number)}_expediente.pdf')">📥 Expediente PDF</button><button class="secondary" onclick="downloadFile('/.netlify/functions/export?id=${o.id}&type=excel','${esc(o.number)}_datos.xlsx')">📊 Excel OT</button>${reviewActions}${o.status==="ACCEPTED"&&!o.archived?`<button class="secondary" onclick="archiveOrder('${o.id}')">▣ Archivar OT</button>`:""}${o.status==="ASSIGNED"&&!o.manual?`<button class="danger" onclick="deleteOrder('${o.id}')">🗑 Eliminar OT</button>`:""}</div>
      <div class="detail-grid"><div>
        <section class="subpanel"><h3>Descripción</h3><p>${esc(o.description||"Sin descripción")}</p></section>
        <section class="subpanel"><h3>${o.isGeneral?"Actividades programadas":"Checklist"}</h3>${o.isGeneral?`<div class="table-wrap"><table class="general-admin-table"><thead><tr><th>#</th><th>Actividad</th><th>Fecha</th><th>Estado</th><th>Evidencia</th><th>Comentario técnico</th></tr></thead><tbody>${generalRows}</tbody></table></div>`:`<div class="check-read">${checks}</div>`}</section>
        <section class="subpanel"><h3>Datos de ejecución</h3><p>Fecha: ${esc(o.executionDate||"—")} · Inicio: ${esc(o.startTime||"—")} · Finalización: ${esc(o.endTime||"—")}</p><h3>Materiales, repuestos e insumos utilizados</h3><p>${esc(o.materialsUsed||"—")}</p><h3>Evaluación del cliente</h3><p>${esc(({UNSATISFIED:"☹️ Insatisfecho",SATISFIED:"🙂 Satisfecho",VERY_SATISFIED:"😄 Muy satisfecho"}[o.customerSatisfaction]||"Sin evaluación"))}</p></section><section class="subpanel"><h3>Respuesta del técnico</h3><p>${esc(cleanTechnicianResponse(o.technicianResponse)||"Sin observaciones")}</p>${o.returnReason?`<div class="return-box"><b>Motivo de devolución</b><p>${esc(o.returnReason)}</p></div>`:""}</section>
      </div><div>
        <section class="subpanel"><h3>Evidencias <span class="muted">· ${(o.evidences||[]).length} fotos</span></h3><div class="evidence-groups">${evidenceHtml}</div></section>
        <section class="subpanel"><h3>Historial</h3><div class="timeline">${timeline}</div></section>
      </div></div>`;
    box.scrollIntoView({behavior:"smooth",block:"start"});
  }catch(e){alert(e.message)}
}
async function adminOrderAction(id,action){const body={id,action};try{await api("/.netlify/functions/orders",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});await loadOTs();closeDetail();if(action==="ARCHIVE")showAdminView("archiveView");else if(action==="RESTORE")showAdminView("archiveView");}catch(e){alert(e.message)}}
async function archiveOrder(id){if(!confirm("¿Archivar esta OT aceptada? Se conservarán los datos, fotos y documentos."))return;await adminOrderAction(id,"ARCHIVE")}
async function deleteOrder(id){if(!confirm("¿Eliminar definitivamente esta OT pendiente? Esta opción solo está permitida si nunca se inició ni tiene evidencias."))return;await adminOrderAction(id,"DELETE_ORDER")}
async function restoreOrder(id){if(!confirm("¿Restaurar esta OT a la lista activa?"))return;await adminOrderAction(id,"RESTORE")}
function renderArchived(){const box=document.getElementById("archivedOrders");if(!box)return;const q=(document.getElementById("archiveSearch")?.value||"").toLowerCase();const list=orders.filter(o=>o.archived&&[o.number,o.area,o.equipment,o.technicianUsername,o.description].join(" ").toLowerCase().includes(q));box.innerHTML=list.length?`<div class="ot-list">${list.map(o=>`<article class="admin-ot"><div><div class="ot-id"><strong>${esc(o.number)}</strong><span class="status accepted">ARCHIVADA</span></div><div class="ot-info"><span>👤 ${esc(o.technicianUsername||"Sin técnico")}</span><span>📍 ${esc(o.area||"Sin área")}</span><span>⚙ ${esc(o.equipment||"Sin equipo")}</span><span>🕒 ${fmt(o.updatedAt)}</span></div></div><button class="secondary" onclick="showOT('${o.id}')">Ver expediente</button><button class="secondary" onclick="restoreOrder('${o.id}')">Restaurar</button></article>`).join("")}</div>`:`<div class="empty-state"><b>No hay órdenes archivadas que coincidan.</b></div>`}
function stageLabel(s){return ({BEFORE:"ANTES",DURING:"DURANTE",AFTER:"DESPUÉS"}[s]||s)}
function historyLabel(a){return ({CREATED_ASSIGNED:"OT creada y asignada",GENERAL_CREATED:"OT General creada",GENERAL_ACTIVITY_COMPLETED:"Actividad general completada",GENERAL_ACTIVITY_UPDATED:"Actividad general actualizada",SUBMITTED_FOR_REVIEW_GENERAL:"OT General enviada a revisión",STARTED:"Trabajo iniciado",STARTED_CORRECTION:"Corrección iniciada",EVIDENCE_UPLOADED:"Evidencia cargada",DRAFT_SAVED:"Borrador guardado",SUBMITTED_FOR_REVIEW:"Enviada a revisión",RETURNED:"OT devuelta",ACCEPTED:"OT aceptada",ARCHIVED:"OT archivada",RESTORED:"OT restaurada"}[a]||a)}
function fmt(v){return v?new Date(v).toLocaleString("es-CO"):"—"}
function closeDetail(){document.getElementById("detail").classList.add("hidden")}
async function openPdf(id){const w=window.open("about:blank","_blank");try{const d=await api("/.netlify/functions/orders?id="+encodeURIComponent(id)+"&pdf=1");if(!d.dataUrl)throw new Error("Esta orden no tiene un PDF original adjunto.");const blob=await (await fetch(d.dataUrl)).blob();const url=URL.createObjectURL(blob);if(w&&!w.closed){w.location.replace(url)}else{location.href=url}setTimeout(()=>URL.revokeObjectURL(url),120000)}catch(e){if(w&&!w.closed)w.close();alert(e.message)}}
async function decide(id,action){let reason="";if(action==="RETURN"){reason=prompt("Escriba el motivo de devolución:")||"";if(!reason.trim()){alert("El motivo es obligatorio.");return}}try{await api("/.netlify/functions/orders",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id,action,reason})});await loadOTs();await showOT(id)}catch(e){alert(e.message)}}
async function downloadFile(url,name,silent=false){try{const r=await fetch(url,{headers:{Authorization:"Bearer "+session.token}});if(!r.ok){const d=await r.json().catch(()=>({}));throw new Error(d.error||"No fue posible generar el archivo.")}const blob=await r.blob();const objectUrl=URL.createObjectURL(blob);const a=document.createElement("a");a.href=objectUrl;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(objectUrl),30000)}catch(e){if(!silent)alert(e.message);throw e}}
function cleanTechnicianResponse(v){return String(v??"").replace(/^\s*(?:(?:respuesta|comentario)\s+del\s+t[eé]cnico\s*:\s*)+/i,"").trim()}
function esc(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}

// Navegación del administrador: cada tarjeta abre una vista independiente.
function showAdminMenu(){
  document.getElementById("adminMenu")?.classList.remove("hidden");
  document.querySelectorAll(".admin-view").forEach(view=>view.classList.add("hidden"));
  document.getElementById("detail")?.classList.add("hidden");
  window.scrollTo({top:0,behavior:"smooth"});
}
function showAdminView(viewId){
  const target=document.getElementById(viewId);
  if(!target)return;
  document.getElementById("adminMenu")?.classList.add("hidden");
  document.querySelectorAll(".admin-view").forEach(view=>view.classList.toggle("hidden",view.id!==viewId));
  document.getElementById("detail")?.classList.add("hidden");
  window.scrollTo({top:0,behavior:"smooth"});
}
document.querySelectorAll(".admin-menu-card[data-view],.sidebar-link[data-view]").forEach(card=>card.addEventListener("click",()=>showAdminView(card.dataset.view)));
function showAdminMenu(){showAdminView("dashboardView")}
const oldShowAdminView=showAdminView;
showAdminView=function(viewId){oldShowAdminView(viewId);document.querySelectorAll(".sidebar-link").forEach(b=>b.classList.toggle("active",b.dataset.view===viewId));};
showAdminView("dashboardView");
loadTechnicians();loadOTs();
