import { getEvidenceBlobStore } from "./store.mjs";

export const normalizeEvidenceStage = value => {
  const s=String(value||"").trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
  return ({BEFORE:"BEFORE",ANTES:"BEFORE",DURING:"DURING",DURANTE:"DURING",AFTER:"AFTER",DESPUES:"AFTER"})[s]||s;
};
export const evidenceBlobKey = (orderId, evidenceId) => `files/${orderId}/${evidenceId}`;
export const evidenceStageKey = (orderId, stage) => `${orderId}/${stage}`;
export const evidenceMetadata = rows => (rows||[]).map(({dataUrl, ...meta})=>meta);

// Returns runtime evidence with dataUrl hydrated from its individual Blob.
// Legacy embedded images and legacy per-stage rows are migrated lazily.
export async function getOrderEvidence(order) {
  const store=getEvidenceBlobStore();
  const merged=new Map((Array.isArray(order.evidences)?order.evidences:[]).map(e=>[String(e.id),e]));
  for(const stage of ["BEFORE","DURING","AFTER"]) {
    const rows=await store.get(evidenceStageKey(order.id,stage),{type:"json"});
    if(Array.isArray(rows)) for(const e of rows) merged.set(String(e.id),e);
  }
  const result=[];
  for(const original of merged.values()) {
    const e={...original};
    if(!e.id) continue;
    const key=evidenceBlobKey(order.id,e.id);
    if(typeof e.dataUrl==="string" && e.dataUrl.startsWith("data:image/")) {
      // Migrate old records to independent image blobs before acknowledging them.
      await store.set(key,e.dataUrl);
    } else {
      const data=await store.get(key,{type:"text"});
      if(typeof data==="string" && data.startsWith("data:image/")) e.dataUrl=data;
    }
    result.push(e);
  }
  return result.sort((a,b)=>String(a.createdAt||"").localeCompare(String(b.createdAt||"")));
}

export async function saveEvidenceBlob(orderId,evidenceId,dataUrl) {
  const store=getEvidenceBlobStore();
  const key=evidenceBlobKey(orderId,evidenceId);
  await store.set(key,String(dataUrl));
  const verify=await store.get(key,{type:"text"});
  if(typeof verify!=="string" || verify!==String(dataUrl)) throw new Error("La fotografía no pudo verificarse en el almacenamiento.");
  return key;
}
export async function deleteEvidenceBlob(orderId,evidenceId) {
  await getEvidenceBlobStore().delete(evidenceBlobKey(orderId,evidenceId));
}
