import { currentUser, getOrders, json } from "../lib/store.mjs";
import { getOrderEvidence } from "../lib/evidence.mjs";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import XLSX from "xlsx-js-style";
import JSZip from "jszip";

function b64ToBytes(dataUrl){const b64=String(dataUrl||"").split(",")[1]||"";return Uint8Array.from(Buffer.from(b64,"base64"));}
function clean(s){return String(s??"");}
function cleanTechnicianResponse(value){return clean(value).replace(/^\s*(?:(?:respuesta|comentario)\s+del\s+t[eé]cnico\s*:\s*)+/i,"").trim();}
// PDF StandardFonts use WinAnsi encoding. Normalize punctuation and replace unsupported
// glyphs before drawText so one unusual character in an OT cannot abort the whole PDF.
function pdfSafeText(value){
  return clean(value)
    .replace(/[\u2010-\u2015\u2212]/g,"-")
    .replace(/[\u2018\u2019\u201A\u201B]/g,"'")
    .replace(/[\u201C\u201D\u201E\u201F]/g,'"')
    .replace(/[\u2022\u25AA\u25CF]/g,"-")
    .replace(/[✓✔☑☒]/g,"OK")
    .replace(/[☹☺☻🙂🙁😐😃😄😁😅😀]/gu,"")
    .replace(/\u2026/g,"...")
    .replace(/[^\x00-\xFF]/g,"?");
}
function filename(s){return clean(s).replace(/[^a-zA-Z0-9._-]+/g,"_");}
function dataUrlToBytes(dataUrl){return b64ToBytes(dataUrl);}

// Normalize accidental numeric color arguments before they reach pdf-lib.
// pdf-lib expects a Color object (for example rgb(...)), not a raw number.
function pdfColor(value, fallback){
  if(value && typeof value === 'object' && ['RGB','Grayscale','CMYK'].includes(value.type)) return value;
  if(typeof value === 'number' && Number.isFinite(value)){const v=Math.max(0,Math.min(1,value));return rgb(v,v,v);}
  return fallback;
}

async function hydrateEvidence(o){
  try {
    return {...o,evidences:await getOrderEvidence(o)};
  } catch (e) {
    console.error('[export-pdf] No fue posible recuperar las evidencias desde el almacenamiento independiente.', {
      orderId: o?.id,
      message: e?.message,
      stack: e?.stack
    });
    // No inventar ni sustituir evidencias: permitir el reporte con las evidencias inline que existan.
    // Si las fotos están únicamente en Blobs y el almacén no responde, el PDF podrá generarse sin ellas,
    // mientras el log deja registrada la causa para su diagnóstico.
    return {...o,evidences:Array.isArray(o?.evidences)?o.evidences:[],_evidenceLoadError:e?.message||'Error de lectura de evidencias'};
  }
}

async function buildPdf(o){
  const pdf=await PDFDocument.create();
  const W=595,H=842, M=25;
  const font=await pdf.embedFont(StandardFonts.Helvetica);
  const bold=await pdf.embedFont(StandardFonts.HelveticaBold);
  const C={navy:rgb(.035,.23,.38),blue:rgb(.02,.36,.61),pale:rgb(.91,.96,.98),line:rgb(.78,.85,.89),ink:rgb(.09,.17,.24),muted:rgb(.35,.42,.47),green:rgb(.08,.61,.31),orange:rgb(.98,.57,.08),white:rgb(1,1,1),gray:rgb(.94,.96,.97)};
  const text=(page,t,x,y,size=8,b=false,color=C.ink,max=100)=>{let v=pdfSafeText(t).replace(/[\r\n]+/g,' ').trim();if(v.length>max)v=v.slice(0,Math.max(0,max-3))+'...';const safeSize=(typeof size==='number'&&Number.isFinite(size)&&size>0)?size:8;page.drawText(v,{x,y,size:safeSize,font:b?bold:font,color:pdfColor(color,C.ink)});};
  const section=(page,title,y,x=M,w=W-2*M)=>{page.drawRectangle({x,y,width:w,height:20,color:C.navy});text(page,title.toUpperCase(),x+9,y+6,9,true,C.white,85);return y-25;};
  const box=(page,x,y,w,h,fill=C.white)=>page.drawRectangle({x,y,width:w,height:h,color:pdfColor(fill,C.white),borderColor:C.line,borderWidth:.6});
  const dt=v=>v?new Date(v).toLocaleString('es-CO',{dateStyle:'short',timeStyle:'short'}):'No registrada';
  const status=({ASSIGNED:'PENDIENTE',IN_PROGRESS:'EN EJECUCIÓN',IN_REVIEW:'EN REVISIÓN',RETURNED:'DEVUELTA',ACCEPTED:'ACEPTADA'}[o.status]||o.status||'SIN ESTADO');
  let logoBytes=null;try{logoBytes=await (await import('node:fs/promises')).readFile(new URL('../../public/lake-house-logo.jpg',import.meta.url));}catch{}
  let logo=null;try{if(logoBytes)logo=await pdf.embedJpg(logoBytes)}catch{}
  const header=(page,pageLabel)=>{
    if(logo){const sc=Math.min(155/logo.width,48/logo.height);page.drawImage(logo,{x:28,y:779,width:logo.width*sc,height:logo.height*sc});}
    page.drawLine({start:{x:205,y:775},end:{x:205,y:827},thickness:1,color:C.line});
    text(page,'EXPEDIENTE DE',220,810,16,true,C.navy,28);text(page,'ORDEN DE TRABAJO',220,790,16,true,C.navy,30);text(page,'MANTENIMIENTO E INFRAESTRUCTURA',221,776,7,true,C.muted,45);
    box(page,25,721,128,43,C.blue);text(page,'N.º DE OT',36,747,8,true,C.white);text(page,String(o.number||'—'),36,727,22,true,C.white,12);
    box(page,160,721,122,43);text(page,'ESTADO DE LA ORDEN',169,747,6.8,true,C.navy,25);const col=status==='ACEPTADA'?C.green:(status==='EN REVISIÓN'?C.orange:C.blue);page.drawRectangle({x:169,y:728,width:103,height:14,color:col});text(page,status,175,732,7,true,C.white,20);
    box(page,289,721,136,43);text(page,'FECHA DE SOLICITUD',298,747,6.8,true,C.navy,25);text(page,dt(o.createdAt),298,732,7,false,C.ink,25);
    box(page,432,721,138,43);text(page,'FECHA DE EJECUCIÓN',441,747,6.8,true,C.navy,25);text(page,o.executionDate||'No registrada',441,732,7,false,C.ink,22);
    box(page,25,669,545,44);text(page,'TÉCNICO',35,695,7,true,C.navy);text(page,o.technicianUsername||'Sin asignar',94,695,8,false,C.ink,28);text(page,'ÁREA',35,679,7,true,C.navy);text(page,o.area||'—',94,679,8,false,C.ink,28);text(page,'UBICACIÓN',300,695,7,true,C.navy);text(page,o.location||o.locationName||'—',365,695,8,false,C.ink,26);text(page,'EQUIPO',300,679,7,true,C.navy);text(page,o.equipment||'—',365,679,8,false,C.ink,26);
    let y=section(page,'Descripción del trabajo',643);box(page,25,y-18,545,18,C.pale);text(page,o.description||'Sin descripción registrada',33,y-12,8,false,C.ink,112);
    page.drawLine({start:{x:25,y:28},end:{x:570,y:28},thickness:.6,color:C.line});text(page,`Lake House · Expediente generado automáticamente · ${pageLabel}`,28,16,6.5,false,C.muted,105);
  };
  const rawChecklist = Array.isArray(o.checklist) ? o.checklist : (Array.isArray(o.activities) ? o.activities : (Array.isArray(o.maintenanceActivities) ? o.maintenanceActivities : []));
  const checklist=rawChecklist.map((item)=>{if(typeof item==='string') return {text:item,done:false,comment:''}; if(!item||typeof item!=='object') return {text:String(item??''),done:false,comment:''}; return {...item,text:String(item.text??item.activity??item.description??item.name??item.label??''),done:Boolean(item.done??item.completed??item.checked),comment:String(item.comment??item.response??item.observation??'')};}).filter(a=>a.text.trim());
  // Page 1: order details and checklist with the technician's actual per-activity comments.
  let page=pdf.addPage([W,H]);header(page,'Página 1');
  let y=section(page,'Checklist de mantenimiento',594);
  const cols={num:31,activity:61,state:330,comment:397};
  page.drawRectangle({x:25,y:y-4,width:545,height:18,color:C.pale});text(page,'N.º',cols.num,y+3,7,true,C.navy);text(page,'ACTIVIDAD',cols.activity,y+3,7,true,C.navy);text(page,'ESTADO',cols.state,y+3,7,true,C.navy);text(page,'RESPUESTA',cols.comment,y+3,7,true,C.navy);y-=7;
  const wrap=(v,max)=>{const words=pdfSafeText(v||'').split(/\s+/);const lines=[];let line='';for(const w of words){const next=line?line+' '+w:w;if(next.length>max&&line){lines.push(line);line=w}else line=next;}if(line)lines.push(line);return lines.length?lines:[''];};
  for(let i=0;i<checklist.length;i++){
    const a=checklist[i]||{};const activityLines=wrap(a.text||'',44);const rawComment=String(a.comment||'').replace(/^\s*(?:comentario\s+del\s+t[eé]cnico\s*:\s*)/i,'').trim();const commentLines=wrap(rawComment||'—',31);const lines=Math.max(activityLines.length,commentLines.length,1);const rh=Math.max(22,lines*9+7);
    if(y-rh<52){page=pdf.addPage([W,H]);header(page,`Página ${pdf.getPageCount()}`);y=section(page,'Checklist de mantenimiento · continuación',735);page.drawRectangle({x:25,y:y-4,width:545,height:18,color:C.pale});text(page,'N.º',cols.num,y+3,7,true,C.navy);text(page,'ACTIVIDAD',cols.activity,y+3,7,true,C.navy);text(page,'ESTADO',cols.state,y+3,7,true,C.navy);text(page,'RESPUESTA',cols.comment,y+3,7,true,C.navy);y-=7;}
    page.drawLine({start:{x:25,y:y-rh+2},end:{x:570,y:y-rh+2},thickness:.35,color:C.line});text(page,String(i+1),cols.num,y-10,7,true,C.navy,4);activityLines.forEach((ln,j)=>text(page,ln,cols.activity,y-10-j*9,6.6,false,C.ink,45));text(page,a.done?'Realizada':'Pendiente',cols.state,y-10,6.4,true,a.done?C.green:C.orange,12);commentLines.forEach((ln,j)=>text(page,ln,cols.comment,y-10-j*9,6.5,false,C.ink,32));y-=rh;
  }
  if(!checklist.length)text(page,'No hay actividades registradas en el checklist.',32,y-10,8,false,C.muted,70);
  // Volver al formato anterior aprobado: el checklist queda en la primera hoja y
  // las evidencias, materiales y observaciones comienzan en la segunda hoja.
  const newContentPage=(title)=>{page=pdf.addPage([W,H]);header(page,`Página ${pdf.getPageCount()}`);return section(page,title,643);};
  page=pdf.addPage([W,H]); header(page,`Página ${pdf.getPageCount()}`); y=section(page,'Evidencias fotográficas',643);
  const ensureRoom=(needed,title)=>{if(y-needed<45)y=newContentPage(title);};
  const evs=Array.isArray(o.evidences)?o.evidences:[];
  const stages=[['BEFORE','ANTES',C.blue],['DURING','DURANTE',C.orange],['AFTER','DESPUÉS',C.green]];
  const cardW=171,gap=9,cardH=130;
  // La sección ya comienza en la segunda página para preservar la distribución previa.
  if(o._evidenceLoadError){text(page,'Aviso: no se pudieron recuperar todas las evidencias; consulte los registros de Netlify.',31,y-5,7,false,C.orange,105);y-=12;}
  const cardY=y-cardH;
  for(let i=0;i<3;i++){
    const [key,label,accent]=stages[i],x=25+i*(cardW+gap);page.drawRectangle({x,y:cardY,width:cardW,height:cardH,color:C.gray,borderColor:C.line,borderWidth:.6});page.drawRectangle({x,y:cardY+110,width:cardW,height:20,color:accent});text(page,label,x+cardW/2-22,cardY+117,8,true,C.white,18);
    const found=evs.filter(e=>{const st=String(e.stage||'').toUpperCase();return st===key||st===label;});
    if(found[0]){try{const d=String(found[0].dataUrl||'');const bytes=dataUrlToBytes(d);const img=d.startsWith('data:image/png')?await pdf.embedPng(bytes):await pdf.embedJpg(bytes);const scale=Math.min((cardW-12)/img.width,98/img.height);page.drawImage(img,{x:x+(cardW-img.width*scale)/2,y:cardY+7+(98-img.height*scale)/2,width:img.width*scale,height:img.height*scale});}catch{text(page,'Imagen no disponible',x+12,cardY+55,7,false,C.muted,24);}}else text(page,'Sin evidencia',x+12,cardY+55,7,false,C.muted,24);
  }
  y=cardY-14;
  // Materiales: mantener el bloque junto a su contenido y pasar de página si hace falta.
  ensureRoom(85,'Materiales e insumos');
  y=section(page,'Materiales, repuestos e insumos utilizados',y);box(page,25,y-44,545,38,C.pale);text(page,o.materialsUsed||'No registrados',33,y-20,8,false,C.ink,110);y-=57;
  ensureRoom(105,'Observaciones y evaluación');
  section(page,'Observaciones del técnico',y,25,267);section(page,'Evaluación del cliente',y,303,267);
  box(page,25,y-87,267,79,C.pale);const obs=wrap(o.observations||o.generalObservations||cleanTechnicianResponse(o.technicianResponse)||'Sin observaciones registradas',52);obs.slice(0,6).forEach((ln,i)=>text(page,ln,33,y-25-i*10,7.5,false,C.ink,54));
  box(page,303,y-87,267,79,C.pale);text(page,({UNSATISFIED:'Insatisfecho',SATISFIED:'Satisfecho',VERY_SATISFIED:'Muy satisfecho'}[o.customerSatisfaction]||'Sin evaluación registrada'),313,y-27,9,true,C.navy,30);if(o.customerComment)wrap(o.customerComment,48).slice(0,3).forEach((ln,i)=>text(page,ln,313,y-45-i*10,7,false,C.ink,50));
  y-=105;
  ensureRoom(70,'Respuesta general del técnico');
  y=section(page,'Respuesta general del técnico',y);box(page,25,y-57,545,49,C.pale);wrap(cleanTechnicianResponse(o.technicianResponse)||'Sin respuesta general registrada',110).slice(0,4).forEach((ln,i)=>text(page,ln,33,y-24-i*10,7.5,false,C.ink,112));
  // El expediente de respuesta contiene solo la respuesta del técnico; no anexa el PDF original.
  return await pdf.save();
}

async function buildManagementPdf(orders, from, to, photoCount, req){
  const pdf=await PDFDocument.create();
  const font=await pdf.embedFont(StandardFonts.Helvetica);
  const bold=await pdf.embedFont(StandardFonts.HelveticaBold);
  const C={navy:rgb(.025,.16,.30),blue:rgb(.04,.36,.64),gold:rgb(.96,.75,.15),ink:rgb(.10,.15,.21),muted:rgb(.38,.43,.49),line:rgb(.82,.87,.91),pale:rgb(.94,.97,.99),white:rgb(1,1,1),green:rgb(.08,.48,.22),red:rgb(.72,.12,.12),lightGreen:rgb(.88,.96,.89),lightRed:rgb(.99,.90,.90)};
  const W=842,H=595,margin=22;
  const dateFmt=s=>{if(!s)return '—';const m=String(s).match(/^(\d{4})-(\d{2})-(\d{2})$/);return m?`${m[3]}/${m[2]}/${m[1]}`:String(s)};
  const safe=s=>pdfSafeText(String(s??'').replace(/\s+/g,' ').trim()||'—');
  let logo=null;
  try{const bytes=await (await import('node:fs/promises')).readFile(new URL('../../public/lake-house-logo.jpg',import.meta.url));logo=await pdf.embedJpg(bytes)}catch(e){console.error('[management-pdf] No se pudo cargar el logo original de Lake House.',e?.message)}
  const rows=orders.slice().sort((a,b)=>String(a.executionDate||'').localeCompare(String(b.executionDate||''))||String(a.equipment||'').localeCompare(String(b.equipment||''),'es'));
  if(!rows.length)throw new Error('No hay intervenciones registradas dentro del periodo seleccionado.');
  const conditionOf=o=>String(o.equipmentCondition||'').toUpperCase();
  const isOperational=o=>conditionOf(o)==='OPERATIONAL';
  const isOut=o=>conditionOf(o)==='OUT_OF_SERVICE';
  const isInspection=o=>conditionOf(o)==='INSPECTION';
  const operational=rows.filter(isOperational).length;
  const outOfService=rows.filter(isOut).length;
  let pageNo=0;
  const makePage=(continuation=false)=>{
    const page=pdf.addPage([W,H]);pageNo++;
    page.drawRectangle({x:0,y:H-8,width:W,height:8,color:C.gold});
    if(logo){const sc=Math.min(150/logo.width,54/logo.height);page.drawImage(logo,{x:margin,y:H-67,width:logo.width*sc,height:logo.height*sc})}
    page.drawLine({start:{x:190,y:H-19},end:{x:190,y:H-67},thickness:1,color:C.line});
    page.drawText('INFORME GENERAL',{x:207,y:H-33,size:17,font:bold,color:C.navy});
    page.drawText('EQUIPOS INTERVENIDOS',{x:207,y:H-53,size:16,font:bold,color:C.gold});
    page.drawText(`Periodo: ${dateFmt(from)} al ${dateFmt(to)}${continuation?' · continuación':''}`,{x:207,y:H-68,size:8,font,color:C.muted});
    page.drawLine({start:{x:margin,y:H-78},end:{x:W-margin,y:H-78},thickness:1,color:C.line});
    page.drawText(`Lake House Resort, Country Club & Spa · Página ${pageNo}`,{x:margin,y:14,size:6.5,font,color:C.muted});
    return page;
  };
  const columns=[
    {key:'number',label:'N.º OT',w:42},
    {key:'equipment',label:'EQUIPO INTERVENIDO',w:133},
    {key:'area',label:'ÁREA',w:91},
    {key:'type',label:'TIPO DE MANTENIMIENTO',w:93},
    {key:'tech',label:'TÉCNICO',w:82},
    {key:'date',label:'FECHA DE INTERVENCIÓN',w:84},
    {key:'condition',label:'ESTADO DEL EQUIPO',w:128},
    {key:'photo',label:'FOTO',w:145}
  ];
  let x=margin+4;for(const c of columns){c.x=x;x+=c.w;}
  const tableW=columns.reduce((n,c)=>n+c.w,0);
  let page=makePage();
  // Compact KPI cards; only real recorded equipment states are counted.
  const cards=[
    {label:'PERIODO DEL INFORME',value:`${dateFmt(from)} – ${dateFmt(to)}`,x:margin,w:202,color:C.blue},
    {label:'EQUIPOS INTERVENIDOS',value:String(rows.length),x:margin+209,w:191,color:C.blue},
    {label:'EQUIPOS OPERATIVOS',value:String(operational),x:margin+407,w:191,color:C.green},
    {label:'EQUIPOS INOPERATIVOS',value:String(outOfService),x:margin+605,w:193,color:C.red}
  ];
  for(const card of cards){page.drawRectangle({x:card.x,y:H-118,width:card.w,height:29,color:C.pale,borderColor:C.line,borderWidth:.4});page.drawText(card.label,{x:card.x+7,y:H-100,size:6.2,font:bold,color:C.navy});page.drawText(card.value,{x:card.x+7,y:H-112,size:8.3,font:bold,color:card.color});}
  let y=H-142;
  const drawHead=()=>{page.drawRectangle({x:margin,y:y-7,width:tableW+8,height:29,color:C.navy});for(const c of columns){const labelLines=c.label.length>18&&c.key!=='equipment'?c.label.split(' '):[c.label];if(labelLines.length>1){const mid=Math.ceil(labelLines.length/2);page.drawText(labelLines.slice(0,mid).join(' '),{x:c.x+3,y:y+8,size:5.9,font:bold,color:C.white});page.drawText(labelLines.slice(mid).join(' '),{x:c.x+3,y:y-1,size:5.9,font:bold,color:C.white});}else page.drawText(c.label,{x:c.x+3,y:y+3,size:6.1,font:bold,color:C.white});}y-=30;};
  drawHead();
  const wrap=(value,maxChars,maxLines=3)=>{const words=safe(value).split(/\s+/);const lines=[];let line='';for(const word of words){const next=line?line+' '+word:word;if(next.length>maxChars&&line){lines.push(line);line=word}else line=next;}if(line)lines.push(line);return lines.slice(0,maxLines)};
  for(let idx=0;idx<rows.length;idx++){
    const o=rows[idx];
    const cond=conditionOf(o);const conditionLabel=cond==='OPERATIONAL'?'OPERATIVO':cond==='OUT_OF_SERVICE'?'INOPERATIVO':cond==='INSPECTION'?'EN INSPECCIÓN':'NO REGISTRADO';
    const typeRaw=String(o.type||o.maintenanceType||o.maintenance_type||o.tipoMantenimiento||o.tipo_mantenimiento||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    const typeLabel=typeRaw.includes('condicion')?'BASADO EN CONDICIONES':typeRaw.includes('prev')?'PREVENTIVO':typeRaw.includes('corr')?'CORRECTIVO':typeRaw?'OTRO: '+typeRaw.toLocaleUpperCase('es-CO'):'NO REGISTRADO';
    const vals={number:safe(o.number||'—'),equipment:safe(o.equipment||'Equipo no identificado'),area:safe(o.area||'—'),type:typeLabel,tech:safe(o.technicianUsername||'Sin técnico'),date:dateFmt(o.executionDate),condition:conditionLabel};
    const lineMap={};
    for(const c of columns){if(c.key==='photo')continue;lineMap[c.key]=wrap(vals[c.key],Math.max(9,Math.floor((c.w-7)/3.7)),2)}
    const rh=54;
    if(y-rh<37){page=makePage(true);y=H-103;drawHead();}
    const rowTop=y+16,rowBottom=y-rh+2;
    if(idx%2===0)page.drawRectangle({x:margin,y:rowBottom,width:tableW+8,height:rh,color:rgb(.975,.985,.99)});
    page.drawLine({start:{x:margin,y:rowBottom},end:{x:margin+tableW+8,y:rowBottom},thickness:.4,color:C.line});
    for(const c of columns){
      if(c.key==='photo')continue;
      const lines=lineMap[c.key]||['—'];
      const color=c.key==='condition'?(isOperational(o)?C.green:isOut(o)?C.red:isInspection(o)?C.blue:C.muted):c.key==='type'?(typeLabel==='PREVENTIVO'?C.blue:typeLabel==='CORRECTIVO'?C.red:C.muted):C.ink;
      lines.forEach((line,j)=>page.drawText(line,{x:c.x+3,y:y-5-j*9,size:c.key==='condition'?6.4:6.5,font:(c.key==='condition'||c.key==='type')?bold:font,color}));
    }
    // Evidencias pequeñas en una sola línea: ANTES, DURANTE y DESPUÉS.
    // Cada etapa conserva su etiqueta; una foto no sustituye a otra.
    if(photoCount>0){
      const evs=Array.isArray(o.evidences)?o.evidences:[];
      const stages=[['BEFORE','ANTES'],['DURING','DURANTE'],['AFTER','DESPUÉS']];
      const cellX=columns[7].x+4, cellW=columns[7].w-8, gap=3, thumbW=(cellW-gap*2)/3, thumbH=35;
      for(let si=0;si<stages.length;si++){
        const [key,label]=stages[si], x=cellX+si*(thumbW+gap);
        const photo=evs.find(e=>[key,label].includes(String(e.stage||'').toUpperCase())&&typeof e.dataUrl==='string'&&e.dataUrl.startsWith('data:image/'));
        page.drawText(label,{x:x+1,y:y-4,size:4.8,font:bold,color:si===0?C.blue:si===1?C.orange:C.green});
        if(photo){
          try{
            const bytes=b64ToBytes(photo.dataUrl);
            const img=photo.dataUrl.startsWith('data:image/png')?await pdf.embedPng(bytes):await pdf.embedJpg(bytes);
            const sc=Math.min((thumbW-2)/img.width,thumbH/img.height);
            page.drawImage(img,{x:x+(thumbW-img.width*sc)/2,y:y-43+(thumbH-img.height*sc)/2,width:img.width*sc,height:img.height*sc});
          }catch{page.drawText('No disponible',{x:x+1,y:y-17,size:4.8,font,color:C.muted});}
        }else page.drawText('Sin foto',{x:x+1,y:y-17,size:4.8,font,color:C.red});
      }
    } else page.drawText('—',{x:columns[7].x+5,y:y-12,size:7,font,color:C.muted});
    y-=rh;
  }
  pdf.setTitle('Informe general de equipos intervenidos');pdf.setAuthor('Lake House Resort, Country Club & Spa');pdf.setSubject(`Equipos intervenidos del ${from} al ${to}`);
  return await pdf.save();
}

function workbookFor(orders, filters={}){
  const statusName=s=>({ASSIGNED:"Pendiente",IN_PROGRESS:"En ejecución",IN_REVIEW:"En revisión",RETURNED:"Devuelta",ACCEPTED:"Aceptada"}[s]||s||"Sin estado");
  const satName=s=>({UNSATISFIED:"Insatisfecho",SATISFIED:"Satisfecho",VERY_SATISFIED:"Muy satisfecho"}[s]||"Sin evaluación");
  const dateOnly=v=>{if(!v)return "";const s=String(v);if(/^\d{4}-\d{2}-\d{2}/.test(s))return s.slice(0,10);const d=new Date(v);return Number.isNaN(d.getTime())?"":d.toISOString().slice(0,10)};
  const normType=o=>{const t=String(o.type||o.maintenanceType||o.maintenance_type||"Sin tipo").trim();const n=t.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();if(n.includes("prevent"))return "Preventivo";if(n.includes("correct"))return "Correctivo";if(n.includes("condicion"))return "Basado en condiciones";return t||"Sin tipo"};
  const list=v=>Array.isArray(v)?v:[];
  const activitiesFor=o=>[...list(o.checklist),...list(o.generalActivities).map(a=>({...a,text:a.text,done:!!a.done,comment:a.comment||""}))];
  const otRows=orders.map(o=>({"N.º OT":o.number||"","Tipo OT":o.isGeneral||o.orderType==="GENERAL"?"General":"Específica","Fecha":dateOnly(o.executionDate||o.createdAt),"Fecha límite":dateOnly(o.dueDate||o.periodEnd),"Técnico":o.technicianUsername||"Sin técnico","Área":o.area||"Sin área","Equipo":o.equipment||o.title||"Sin equipo","Tipo mantenimiento":normType(o),"Origen":(o.origin==="MANUAL"||o.manual)?"Manual":"Asignada","Estado OT":statusName(o.status),"Estado final equipo":o.equipmentCondition||"Sin registrar","Satisfacción cliente":satName(o.customerSatisfaction),"Actividades realizadas":activitiesFor(o).filter(a=>a&&typeof a==="object"&&(a.done||a.completed)).length,"Actividades pendientes":activitiesFor(o).filter(a=>!a||typeof a!=="object"||!(a.done||a.completed)).length,"Hora inicio":o.startTime||"","Hora fin":o.endTime||"","Observación técnico":o.technicianResponse||o.observations||"","Materiales e insumos":o.materialsUsed||""}));
  const count=fn=>orders.filter(fn).length,total=orders.length;
  const accepted=count(o=>o.status==="ACCEPTED"), pending=count(o=>o.status==="ASSIGNED"), inProgress=count(o=>o.status==="IN_PROGRESS"), inReview=count(o=>o.status==="IN_REVIEW"), returned=count(o=>o.status==="RETURNED");
  const preventive=count(o=>normType(o)==="Preventivo"),corrective=count(o=>normType(o)==="Correctivo"),condition=count(o=>normType(o)==="Basado en condiciones");
  const positive=count(o=>["SATISFIED","VERY_SATISFIED"].includes(o.customerSatisfaction)),negative=count(o=>o.customerSatisfaction==="UNSATISFIED");
  const group=(key)=>{const m=new Map();for(const o of orders){const k=key(o)||"Sin dato";m.set(k,(m.get(k)||0)+1)}return [...m].sort((a,b)=>b[1]-a[1])};
  const techRows=group(o=>o.technicianUsername||"Sin técnico").map(([name,n])=>{const os=orders.filter(o=>(o.technicianUsername||"Sin técnico")===name);const done=os.reduce((a,o)=>a+activitiesFor(o).filter(x=>x&&typeof x==="object"&&(x.done||x.completed)).length,0);const acts=os.reduce((a,o)=>a+activitiesFor(o).length,0);return {"Técnico":name,"OT recibidas":n,"Aceptadas":os.filter(o=>o.status==="ACCEPTED").length,"Pendientes":os.filter(o=>o.status==="ASSIGNED").length,"En revisión":os.filter(o=>o.status==="IN_REVIEW").length,"Devueltas":os.filter(o=>o.status==="RETURNED").length,"Actividades realizadas":done,"Actividades totales":acts,"Cumplimiento actividades":acts?done/acts:0,"Satisfechos":os.filter(o=>["SATISFIED","VERY_SATISFIED"].includes(o.customerSatisfaction)).length,"Insatisfechos":os.filter(o=>o.customerSatisfaction==="UNSATISFIED").length}});
  const monthly=group(o=>{const d=dateOnly(o.executionDate||o.createdAt);return d?d.slice(0,7):""}).filter(([k])=>k).sort((a,b)=>a[0].localeCompare(b[0]));
  const navy="082B4C",blue="1565A8",yellow="FFC928",pale="EAF2F8",white="FFFFFF",ink="17324D",green="D9EEDB",red="FCE0E0",gray="F2F5F7",orange="FCE8D5",purple="E9E1F8";
  const fill=color=>({patternType:"solid",fgColor:{rgb:color}});
  const style=(opts={})=>({font:{name:"Aptos",sz:10,color:{rgb:ink},...(opts.font||{})},alignment:{vertical:"center",wrapText:true,...(opts.alignment||{})},...(opts.fill?{fill:fill(opts.fill)}:{}),...(opts.border?{border:opts.border}:{})});
  const dashboard=[];const put=(r)=>dashboard.push(r);const blank=()=>put([]);
  put(["OPS MANTENIMIENTO | INFORME GENERAL DE MANTENIMIENTO","","","","","","",""]);
  put(["CONTROL Y ANÁLISIS DE ÓRDENES DE TRABAJO · RESUMEN EJECUTIVO Y DETALLE DE INTERVENCIONES","","","","","","",""]);
  put(["PERÍODO DESDE",filters.from||"Todas","HASTA",filters.to||"Todas","TÉCNICO",filters.technician||"Todos","ÁREA",filters.area||"Todas"]);
  put(["TIPO DE MANTENIMIENTO",filters.maintenanceType||"Todos","ESTADO OT",filters.status||"Todos","ÓRDENES INCLUIDAS",total,"ACTUALIZADO",new Date().toLocaleDateString("es-CO")]);blank();
  put(["TOTAL ÓRDENES",total,"ACEPTADAS",accepted,"PENDIENTES",pending,"EN EJECUCIÓN",inProgress]);
  put(["EN REVISIÓN",inReview,"DEVUELTAS",returned,"PREVENTIVAS",preventive,"CORRECTIVAS",corrective]);
  put(["BASADO EN CONDICIONES",condition,"SATISFECHOS / MUY SATISFECHOS",positive,"INSATISFECHOS",negative,"OT MANUALES",count(o=>o.origin==="MANUAL"||o.manual)]);blank();
  put(["ÓRDENES POR TIPO DE MANTENIMIENTO","CANTIDAD","DISTRIBUCIÓN VISUAL","","ÓRDENES POR ESTADO","CANTIDAD","DISTRIBUCIÓN VISUAL",""]);
  const typeRows=group(normType);const stateRows=group(o=>statusName(o.status));const maxType=Math.max(1,...typeRows.map(x=>x[1])),maxState=Math.max(1,...stateRows.map(x=>x[1]));
  for(let i=0;i<Math.max(typeRows.length,stateRows.length);i++){const t=typeRows[i],st=stateRows[i];put([t?.[0]||"",t?.[1]??"",t?"█".repeat(Math.max(1,Math.round(t[1]/maxType*18))):"","",st?.[0]||"",st?.[1]??"",st?"█".repeat(Math.max(1,Math.round(st[1]/maxState*18))):""])}blank();
  put(["ÓRDENES POR ÁREA","CANTIDAD","DISTRIBUCIÓN VISUAL","","ÓRDENES POR MES","CANTIDAD","DISTRIBUCIÓN VISUAL",""]);
  const areaRows=group(o=>o.area||"Sin área");const maxArea=Math.max(1,...areaRows.map(x=>x[1])),maxMonth=Math.max(1,...monthly.map(x=>x[1]));
  for(let i=0;i<Math.max(areaRows.length,monthly.length);i++){const a=areaRows[i],m=monthly[i];put([a?.[0]||"",a?.[1]??"",a?"█".repeat(Math.max(1,Math.round(a[1]/maxArea*18))):"","",m?.[0]||"",m?.[1]??"",m?"█".repeat(Math.max(1,Math.round(m[1]/maxMonth*18))):""])}blank();
  put(["ESTADO FINAL DEL EQUIPO","CANTIDAD","DISTRIBUCIÓN VISUAL","","SATISFACCIÓN DEL CLIENTE","CANTIDAD","DISTRIBUCIÓN VISUAL",""]);
  const conditionRows=group(o=>{const v=String(o.equipmentCondition||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();return v.includes("oper")?"Operativo":(v.includes("inoper")||v.includes("fuera")?"Inoperativo":(v.includes("inspec")?"En inspección":"Sin registrar"))});
  const satRows=group(o=>satName(o.customerSatisfaction));const maxCondition=Math.max(1,...conditionRows.map(x=>x[1])),maxSat=Math.max(1,...satRows.map(x=>x[1]));
  for(let i=0;i<Math.max(conditionRows.length,satRows.length);i++){const a=conditionRows[i],b=satRows[i];put([a?.[0]||"",a?.[1]??"",a?"█".repeat(Math.max(1,Math.round(a[1]/maxCondition*18))):"","",b?.[0]||"",b?.[1]??"",b?"█".repeat(Math.max(1,Math.round(b[1]/maxSat*18))):""])}blank();
  put(["DESEMPEÑO POR TÉCNICO","OT RECIBIDAS","ACEPTADAS","PENDIENTES","EN REVISIÓN","DEVUELTAS","ACTIVIDADES REALIZADAS","ACTIVIDADES TOTALES","CUMPLIMIENTO","SATISFECHOS","INSATISFECHOS"]);
  for(const t of techRows)put(Object.values(t));
  const ws=XLSX.utils.aoa_to_sheet(dashboard);ws["!cols"]=[{wch:28},{wch:13},{wch:24},{wch:3},{wch:27},{wch:13},{wch:24},{wch:3},{wch:18},{wch:18},{wch:18}];
  ws["!merges"]=[{s:{r:0,c:0},e:{r:0,c:7}},{s:{r:1,c:0},e:{r:1,c:7}}];ws["!sheetViews"]=[{showGridLines:false}];ws["!rows"]=[{hpt:38},{hpt:25},{hpt:28},{hpt:28},{hpt:8},{hpt:34},{hpt:34},{hpt:34}];
  for(let r=0;r<dashboard.length;r++)for(let c=0;c<(dashboard[r]||[]).length;c++){const cell=ws[XLSX.utils.encode_cell({r,c})];if(cell)cell.s=style();}
  for(let c=0;c<8;c++){for(const r of [0]){const cell=ws[XLSX.utils.encode_cell({r,c})];if(cell)cell.s=style({fill:navy,font:{name:"Aptos Display",sz:18,bold:true,color:{rgb:white}},alignment:{vertical:"center",horizontal:"left"}})}const sub=ws[XLSX.utils.encode_cell({r:1,c})];if(sub)sub.s=style({fill:blue,font:{sz:10,italic:true,color:{rgb:white}}});}
  for(const r of [2,3])for(let c=0;c<8;c++){const cell=ws[XLSX.utils.encode_cell({r,c})];if(cell)cell.s=style({fill:pale,font:{sz:9,bold:c%2===0,color:{rgb:navy}}});}
  // Tarjetas KPI en una cuadrícula compacta y con cifras destacadas.
  const kpiColors=[navy,green,"FFF0C2","DDEEFF","D9F2DF","FCE0D2",purple,red];
  for(let r=5;r<=7;r++)for(let c=0;c<8;c++){const cell=ws[XLSX.utils.encode_cell({r,c})];if(cell){const k=Math.min(7,c);cell.s=style({fill:c%2===0?kpiColors[Math.floor(c/2)]||navy:white,font:{sz:c%2===0?9:17,bold:true,color:{rgb:c%2===0?(k===0?white:navy):navy}},alignment:{horizontal:c%2===0?"left":"center",vertical:"center",wrapText:true},border:{top:{style:"thin",color:{rgb:"D5E0E8"}},bottom:{style:"medium",color:{rgb:yellow}}}})}}
  const headRows=dashboard.map((r,i)=>({r,i,first:String(r?.[0]||"")})).filter(x=>["ÓRDENES POR TIPO DE MANTENIMIENTO","ÓRDENES POR ÁREA","DESEMPEÑO POR TÉCNICO"].includes(x.first));
  for(const h of headRows)for(let c=0;c<(dashboard[h.r]||[]).length;c++){const cell=ws[XLSX.utils.encode_cell({r:h.r,c})];if(cell)cell.s=style({fill:navy,font:{sz:9,bold:true,color:{rgb:white}}});}
  for(let r=0;r<dashboard.length;r++)if(dashboard[r]?.[0]&&dashboard[r]?.[1]!==undefined&&dashboard[r]?.[2]!==undefined&&String(dashboard[r][2]).includes("█")){for(let c=0;c<3;c++){const cell=ws[XLSX.utils.encode_cell({r,c})];if(cell)cell.s=style({fill:c===2?blue:white,font:{sz:10,bold:c===1,color:{rgb:c===2?white:ink}}})}for(let c=4;c<7;c++){const cell=ws[XLSX.utils.encode_cell({r,c})];if(cell)cell.s=style({fill:c===6?blue:white,font:{sz:10,bold:c===5,color:{rgb:c===6?white:ink}}})}}
  const techHead=dashboard.findIndex(r=>r[0]==="DESEMPEÑO POR TÉCNICO");for(let c=0;c<11;c++){const cell=ws[XLSX.utils.encode_cell({r:techHead,c})];if(cell)cell.s=style({fill:blue,font:{sz:9,bold:true,color:{rgb:white}},alignment:{vertical:"center",wrapText:true}})}
  for(let r=techHead+1;r<dashboard.length;r++){const p=ws[XLSX.utils.encode_cell({r,c:8})];if(p){p.t="n";p.z="0%";p.s=style({fill:gray,alignment:{horizontal:"center"}});}}
  ws["!autofilter"]={ref:`A${techHead+1}:K${dashboard.length}`};ws["!freeze"]={xSplit:0,ySplit:4};
  // Hoja de detalle separada: evita el desplazamiento horizontal en el tablero y conserva todos los registros.
  const detailHeaders=otRows.length?Object.keys(otRows[0]):["N.º OT","Fecha","Técnico","Área","Equipo","Tipo mantenimiento","Origen","Estado OT","Estado final equipo","Satisfacción cliente","Actividades realizadas","Actividades pendientes","Hora inicio","Hora fin","Observación técnico","Materiales e insumos"];
  const detail=[detailHeaders,...otRows.map(o=>detailHeaders.map(h=>o[h]??""))];const wd=XLSX.utils.aoa_to_sheet(detail);wd["!cols"]=[{wch:18},{wch:13},{wch:22},{wch:20},{wch:27},{wch:25},{wch:12},{wch:17},{wch:22},{wch:23},{wch:16},{wch:16},{wch:13},{wch:13},{wch:42},{wch:42}];wd["!autofilter"]={ref:`A1:P${Math.max(1,detail.length)}`};wd["!freeze"]={xSplit:0,ySplit:1};wd["!sheetViews"]=[{showGridLines:false}];
  for(let c=0;c<detailHeaders.length;c++){const cell=wd[XLSX.utils.encode_cell({r:0,c})];if(cell)cell.s=style({fill:navy,font:{sz:9,bold:true,color:{rgb:white}},alignment:{vertical:"center",wrapText:true},border:{bottom:{style:"medium",color:{rgb:yellow}}}})}
  for(let r=1;r<detail.length;r++)for(let c=0;c<detailHeaders.length;c++){const cell=wd[XLSX.utils.encode_cell({r,c})];if(cell)cell.s=style({fill:r%2?white:gray,font:{sz:9,color:{rgb:ink}},alignment:{vertical:"top",wrapText:true},border:{bottom:{style:"hair",color:{rgb:"D5E0E8"}}}})}
  const wb=XLSX.utils.book_new();ws["!sheetPr"]={tabColor:{rgb:yellow}};wd["!sheetPr"]={tabColor:{rgb:blue}};XLSX.utils.book_append_sheet(wb,ws,"Dashboard ejecutivo");XLSX.utils.book_append_sheet(wb,wd,"Detalle de órdenes");
  const wt=XLSX.utils.aoa_to_sheet([["Técnico","OT recibidas","Aceptadas","Pendientes","En revisión","Devueltas","Actividades realizadas","Actividades totales","Cumplimiento actividades","Satisfechos","Insatisfechos"],...techRows.map(Object.values)]);wt["!cols"]=[{wch:25},{wch:14},{wch:14},{wch:14},{wch:14},{wch:14},{wch:22},{wch:20},{wch:22},{wch:14},{wch:14}];wt["!autofilter"]={ref:`A1:K${Math.max(1,techRows.length+1)}`};for(let c=0;c<11;c++){const cell=wt[XLSX.utils.encode_cell({r:0,c})];if(cell)cell.s=style({fill:blue,font:{sz:9,bold:true,color:{rgb:white}},alignment:{wrapText:true,vertical:"center"}})}for(let r=1;r<=techRows.length;r++){const p=wt[XLSX.utils.encode_cell({r,c:8})];if(p){p.z="0%";p.s=style({fill:gray})}}XLSX.utils.book_append_sheet(wb,wt,"Análisis por técnico");
  wb.Props={Title:"OPS Mantenimiento - Dashboard ejecutivo",Subject:"Indicadores y detalle de órdenes",Author:"OT Mantenimiento OPS",CreatedDate:new Date()};return wb;
}
// Add native Excel charts to the dashboard workbook. JSZip patches only the
// presentation layer; order data and other application flows remain untouched.
function xmlEsc(v){return String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");}
async function addNativeDashboardCharts(buffer, wb){
  const zip=await JSZip.loadAsync(buffer);
  const sheet=wb.Sheets["Dashboard ejecutivo"];
  const rows=XLSX.utils.sheet_to_json(sheet,{header:1,defval:""});
  const findRow=(label)=>rows.findIndex(r=>String(r?.[0]||"").trim()===label);
  const sections=[
    {title:"Órdenes por tipo de mantenimiento",row:findRow("ÓRDENES POR TIPO DE MANTENIMIENTO"),kind:"pie",col:0},
    {title:"Órdenes por estado",row:findRow("ÓRDENES POR TIPO DE MANTENIMIENTO"),kind:"bar",col:4},
    {title:"Órdenes por área",row:findRow("ÓRDENES POR ÁREA"),kind:"bar",col:0},
    {title:"Órdenes por mes",row:findRow("ÓRDENES POR ÁREA"),kind:"line",col:4},
    {title:"Estado final del equipo",row:findRow("ESTADO FINAL DEL EQUIPO"),kind:"doughnut",col:0},
    {title:"Satisfacción del cliente",row:findRow("ESTADO FINAL DEL EQUIPO"),kind:"pie",col:4}
  ].filter(x=>x.row>=0);
  const charts=sections.map((c,i)=>({...c,id:i+1}));
  const cell=(r,c)=>XLSX.utils.encode_cell({r,c});
  function chartXml(c){
    const start=c.row+2; let end=start;
    while(end<rows.length && rows[end]?.[c.col]!==undefined && String(rows[end][c.col]||"").trim() && typeof rows[end][c.col+1]==="number") end++;
    end=Math.max(start,end-1);
    const catCol=XLSX.utils.encode_col(c.col),valCol=XLSX.utils.encode_col(c.col+1);
    const cats=`'Dashboard ejecutivo'!$${catCol}$${start+1}:$${catCol}$${end+1}`;
    const vals=`'Dashboard ejecutivo'!$${valCol}$${start+1}:$${valCol}$${end+1}`;
    const type=c.kind==="pie"?`<c:pieChart><c:varyColors val="1"/>`:(c.kind==="doughnut"?`<c:doughnutChart><c:varyColors val="1"/><c:holeSize val="58"/>`:`<c:${c.kind}Chart><c:barDir val="${c.kind==="bar"?"bar":"col"}"/><c:grouping val="${c.kind==="line"?"standard":"clustered"}"/>`);
    const close=c.kind==="pie"?"pieChart":c.kind==="doughnut"?"doughnutChart":c.kind+"Chart";
    const axes=(c.kind==="pie"||c.kind==="doughnut")?"":`<c:axId val="123456"/><c:axId val="123457"/>`;
    const axisXml=(c.kind==="pie"||c.kind==="doughnut")?"":`<c:catAx><c:axId val="123456"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:axPos val="b"/><c:crossAx val="123457"/><c:crosses val="autoZero"/></c:catAx><c:valAx><c:axId val="123457"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:axPos val="l"/><c:crossAx val="123456"/><c:crosses val="autoZero"/></c:valAx>`;
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><c:chartSpace xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><c:lang val="es-CO"/><c:chart><c:title><c:tx><c:rich><a:bodyPr/><a:lstStyle/><a:p><a:r><a:rPr lang="es-CO" sz="1100" b="1"/><a:t>${xmlEsc(c.title)}</a:t></a:r></a:p></c:rich></c:tx><c:overlay val="0"/></c:title><c:plotArea><c:layout/>${type}<c:ser><c:idx val="0"/><c:order val="0"/><c:tx><c:v>${xmlEsc(c.title)}</c:v></c:tx><c:cat><c:strRef><c:f>${xmlEsc(cats)}</c:f></c:strRef></c:cat><c:val><c:numRef><c:f>${xmlEsc(vals)}</c:f></c:numRef></c:val></c:ser>${axes}</c:${close}>${axisXml}</c:plotArea><c:legend><c:legendPos val="r"/></c:legend><c:plotVisOnly val="1"/></c:chart></c:chartSpace>`;
  }
  const anchors=charts.map((c,i)=>{const col=i%3===0?0:i%3===1?5:10;const row=30+Math.floor(i/3)*14;return `<xdr:twoCellAnchor><xdr:from><xdr:col>${col}</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>${row}</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from><xdr:to><xdr:col>${col+5}</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>${row+13}</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:to><xdr:graphicFrame macro=""><xdr:nvGraphicFramePr><xdr:cNvPr id="${i+2}" name="Gráfico ${i+1}"/><xdr:cNvGraphicFramePr/></xdr:nvGraphicFramePr><xdr:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/></xdr:xfrm><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/chart"><c:chart xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:id="rId${i+1}"/></a:graphicData></a:graphic></xdr:graphicFrame><xdr:clientData/></xdr:twoCellAnchor>`;}).join("");
  zip.file("xl/drawings/drawing1.xml",`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">${anchors}</xdr:wsDr>`);
  zip.file("xl/drawings/_rels/drawing1.xml.rels",`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${charts.map((c,i)=>`<Relationship Id="rId${i+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart" Target="../charts/chart${i+1}.xml"/>`).join("")}</Relationships>`);
  charts.forEach(c=>zip.file(`xl/charts/chart${c.id}.xml`,chartXml(c)));
  const sheetFile=zip.file("xl/worksheets/sheet1.xml"); if(sheetFile){let x=await sheetFile.async("string");x=x.replace(/<\/worksheet>/,`<drawing r:id="rIdDashboardDrawing" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/></worksheet>`);zip.file("xl/worksheets/sheet1.xml",x);}
  zip.file("xl/worksheets/_rels/sheet1.xml.rels",`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdDashboardDrawing" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="../drawings/drawing1.xml"/></Relationships>`);
  const ctFile=zip.file("[Content_Types].xml");if(ctFile){let ct=await ctFile.async("string");if(!ct.includes("/xl/drawings/drawing1.xml"))ct=ct.replace("</Types>",`<Override PartName="/xl/drawings/drawing1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>${charts.map(c=>`<Override PartName="/xl/charts/chart${c.id}.xml" ContentType="application/vnd.openxmlformats-officedocument.drawingml.chart+xml"/>`).join("")}</Types>`);zip.file("[Content_Types].xml",ct);}
  return zip.generateAsync({type:"nodebuffer",compression:"DEFLATE",compressionOptions:{level:6}});
}

export default async (req)=>{
  const me=await currentUser(req); if(!me || me.role!=="admin")return json({error:"Solo el administrador puede exportar."},403);
  const url=new URL(req.url); const id=url.searchParams.get("id"); const type=url.searchParams.get("type")||"pdf"; const all=await getOrders();
  if(type==="management-pdf"){
    const from=String(url.searchParams.get("from")||"");const to=String(url.searchParams.get("to")||"");const photoCount=Number(url.searchParams.get("photos")??3);
    if(!/^\d{4}-\d{2}-\d{2}$/.test(from)||!/^\d{4}-\d{2}-\d{2}$/.test(to)||to<from)return json({error:"Selecciona un rango de fechas válido."},400);
    if(![0,1].includes(photoCount))return json({error:"Selecciona si deseas mostrar una fotografía por equipo."},400);
    const ranged=all.filter(o=>String(o.executionDate||"")>=from&&String(o.executionDate||"")<=to&&String(o.equipment||"").trim()&&String(o.technicianUsername||"").trim());
    const orders=await Promise.all(ranged.map(hydrateEvidence));
    try{const bytes=await buildManagementPdf(orders,from,to,photoCount,req);return new Response(Buffer.from(bytes),{status:200,headers:{"Content-Type":"application/pdf","Content-Disposition":`attachment; filename="Informe_Gestion_Mantenimiento_${from}_${to}.pdf"`,"Cache-Control":"no-store"}})}catch(e){return json({error:e.message||"No fue posible generar el informe."},400)}
  }
  if(type==="management-excel"){
    const from=String(url.searchParams.get("from")||"");const to=String(url.searchParams.get("to")||"");
    const technician=String(url.searchParams.get("technician")||"");const area=String(url.searchParams.get("area")||"");const maintenanceType=String(url.searchParams.get("maintenanceType")||"");const status=String(url.searchParams.get("status")||"");
    if((from&&!/^\d{4}-\d{2}-\d{2}$/.test(from))||(to&&!/^\d{4}-\d{2}-\d{2}$/.test(to))||(from&&to&&to<from))return json({error:"Verifica el rango de fechas del informe."},400);
    const inRange=all.filter(o=>{const d=String(o.executionDate||o.createdAt||"").slice(0,10);if(from&&(!d||d<from))return false;if(to&&(!d||d>to))return false;if(technician&&technician!=="Todos"&&(o.technicianUsername||"")!==technician)return false;if(area&&area!=="Todas"&&(o.area||"")!==area)return false;if(status&&status!=="Todos"&&o.status!==status)return false;if(maintenanceType&&maintenanceType!=="Todos"){const t=String(o.type||o.maintenanceType||o.maintenance_type||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();const wanted=maintenanceType.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();if(wanted==="basado en condiciones"?!t.includes("condicion"):!t.includes(wanted))return false;}return true;});
    const wb=workbookFor(inRange,{from,to,technician:technician||"Todos",area:area||"Todas",maintenanceType:maintenanceType||"Todos",status:status||"Todos"});const baseBytes=XLSX.write(wb,{bookType:"xlsx",type:"buffer"});const bytes=await addNativeDashboardCharts(baseBytes,wb);
    return new Response(bytes,{status:200,headers:{"Content-Type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet","Content-Disposition":`attachment; filename="OPS_Dashboard_Mantenimiento_${from||"inicio"}_${to||"hoy"}.xlsx"`,"Cache-Control":"no-store"}});
  }
  const selected=id?[all.find(o=>o.id===id)].filter(Boolean):all;
  if(!selected.length)return json({error:"No hay OT para exportar."},404);
  if(type==="pdf"){
    try{
      const order=await hydrateEvidence(selected[0]);
      const bytes=await buildPdf(order); return new Response(Buffer.from(bytes),{status:200,headers:{"Content-Type":"application/pdf","Content-Disposition":`attachment; filename="${filename(order.number)}_expediente.pdf"`,"Cache-Control":"no-store"}});
    }catch(e){
      console.error("[export-pdf] No fue posible generar el expediente de respuesta y PDF original",{orderId:selected[0]?.id,message:e?.message,stack:e?.stack});
      return json({error:`No fue posible generar el expediente PDF: ${e?.message||'error desconocido'}. Verifica el PDF original y las evidencias de la orden.`},500);
    }
  }
  const orders=selected;
  if(!orders.length)return json({error:"No hay OT para exportar."},404);
  if(type==="excel"){
    const wb=workbookFor(orders,{}); const bytes=XLSX.write(wb,{bookType:"xlsx",type:"buffer"}); return new Response(bytes,{status:200,headers:{"Content-Type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet","Content-Disposition":`attachment; filename="OT_Mantenimiento_${new Date().toISOString().slice(0,10)}.xlsx"`,"Cache-Control":"no-store"}});
  }
  return json({error:"Tipo de exportación no válido."},400);
};
