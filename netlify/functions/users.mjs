import { currentUser, users, json } from "../lib/store.mjs";
export default async (req)=>{
  const me=await currentUser(req); if(!me)return json({error:"No autorizado."},401);
  if(me.role!=="admin")return json({error:"Acceso restringido."},403);
  const u=(await users()).map(({passwordHash,...safe})=>safe);
  return json({users:u});
};