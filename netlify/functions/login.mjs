import { users, hashPassword, tokenFor, json, readJson } from "../lib/store.mjs";
export default async (req)=>{
  if(req.method!=="POST") return json({error:"Método no permitido."},405);
  const {username,password}=await readJson(req);
  const u=(await users()).find(x=>x.username===username && x.active);
  if(!u || u.passwordHash!==hashPassword(password||"")) return json({error:"Usuario o contraseña incorrectos."},401);
  return json({session:{token:tokenFor(u),username:u.username,role:u.role,id:u.id}});
};