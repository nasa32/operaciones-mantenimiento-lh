import { getStore } from "@netlify/blobs";
import crypto from "node:crypto";

export function getBlobStore(){ return getStore({ name: "ot-mantenimiento", consistency: "strong" }); }
// Store versionado para cuentas: permite inicializar las credenciales predeterminadas
// sin borrar ni modificar las órdenes existentes del almacén principal.
export function getUsersBlobStore(){ return getStore("ot-mantenimiento-users-v2"); }
// Evidencias separadas de la ficha de la OT para evitar que una imagen grande
// o una lectura antigua del registro principal pierda la confirmación de una etapa.
export function getEvidenceBlobStore(){ return getStore({ name: "ot-mantenimiento-evidences-v1", consistency: "strong" }); }

export async function json(data, status=200){
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}
export async function readJson(req){
  try{return await req.json()}catch{return {}}
}
export function hashPassword(password){
  return crypto.createHash("sha256").update(password).digest("hex");
}
export function tokenFor(user){
  return crypto.createHmac("sha256", process.env.NETLIFY_DATABASE_SECRET || "ot-local-secret")
    .update(`${user.id}:${user.passwordHash}`).digest("hex");
}
export function auth(req){
  const h=req.headers.get("authorization")||"";
  const token=h.startsWith("Bearer ")?h.slice(7):"";
  return token;
}
export async function users(){
  const store = getUsersBlobStore();
  let u=await store.get("users",{type:"json"});
  if(!u){
    // Migrar las cuentas que ya existían en la versión funcional antes de crear
    // usuarios predeterminados. Así no se pierden nombres ni claves ya asignadas.
    const legacy=await getBlobStore().get("users",{type:"json"});
    if(Array.isArray(legacy)&&legacy.length){
      u=legacy;
      await store.setJSON("users",u);
      return u;
    }
    const passwords={
      admin:"AdminOT2026!",
      tecnico01:"TecOT01#2026",tecnico02:"TecOT02#2026",tecnico03:"TecOT03#2026",
      tecnico04:"TecOT04#2026",tecnico05:"TecOT05#2026",tecnico06:"TecOT06#2026",
      tecnico07:"TecOT07#2026",tecnico08:"TecOT08#2026",tecnico09:"TecOT09#2026",tecnico10:"TecOT10#2026"
    };
    u=[
      {id:"admin",username:"admin",role:"admin",active:true,passwordHash:hashPassword(passwords.admin)},
      ...Array.from({length:10},(_,i)=>{const username=`tecnico${String(i+1).padStart(2,"0")}`;return {id:username,username,role:"technician",active:true,passwordHash:hashPassword(passwords[username])}})
    ];
    await store.setJSON("users",u);
  }
  return u;
}
export async function currentUser(req){
  const token=auth(req); if(!token)return null;
  const u=await users();
  return u.find(x=>x.active && tokenFor(x)===token)||null;
}
export async function saveUsers(u){const store=getUsersBlobStore(); await store.setJSON("users",u)}
export async function getOrders(){const store=getBlobStore(); return await store.get("orders",{type:"json"})||[]}
export async function saveOrders(o){const store=getBlobStore(); await store.setJSON("orders",o)}
