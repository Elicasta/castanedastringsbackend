import "server-only";
import {createHmac,pbkdf2Sync,timingSafeEqual} from "node:crypto";
import {cookies} from "next/headers";

const COOKIE="cs_preview_session";
const VALID_FOR_SECONDS=60*60*12;
const BRANCH="feat/castaneda-mobile-quotes-flow";

export function previewLoginEnabled():boolean{
  // Production cannot enable preview authentication, even if variables are copied.
  return process.env.VERCEL_ENV==="preview"
    && process.env.VERCEL_GIT_COMMIT_REF===BRANCH
    && Boolean(process.env.TEMP_PREVIEW_ADMIN_EMAIL)
    && Boolean(process.env.TEMP_PREVIEW_PASSWORD_HASH)
    && Boolean(process.env.TEMP_PREVIEW_SESSION_SECRET);
}
function safeEqualStrings(a:string,b:string):boolean{
  const left=Buffer.from(a),right=Buffer.from(b);
  return left.length===right.length&&timingSafeEqual(left,right);
}
export function checkPreviewCredentials(email:string,password:string):boolean{
  if(!previewLoginEnabled()||password.length>128)return false;
  if(!safeEqualStrings(email.trim().toLowerCase(),process.env.TEMP_PREVIEW_ADMIN_EMAIL!.toLowerCase()))return false;
  const [saltHex,hashHex]=process.env.TEMP_PREVIEW_PASSWORD_HASH!.split(".");
  if(!/^[a-f0-9]{32}$/i.test(saltHex||"")||!/^[a-f0-9]{64}$/i.test(hashHex||""))return false;
  const actual=pbkdf2Sync(password,Buffer.from(saltHex,"hex"),310000,32,"sha256");
  const expected=Buffer.from(hashHex,"hex");
  return timingSafeEqual(actual,expected);
}
function signature(payload:string){
  return createHmac("sha256",process.env.TEMP_PREVIEW_SESSION_SECRET!)
    .update(payload).digest("base64url");
}
export function startPreviewSession(){
  if(!previewLoginEnabled())throw new Error("Temporary review is not available.");
  const payload=Buffer.from(JSON.stringify({
    sub:process.env.TEMP_PREVIEW_ADMIN_EMAIL,
    exp:Math.floor(Date.now()/1000)+VALID_FOR_SECONDS
  }),"utf8").toString("base64url");
  cookies().set(COOKIE,payload+"."+signature(payload),{
    path:"/preview",httpOnly:true,secure:true,sameSite:"lax",
    maxAge:VALID_FOR_SECONDS
  });
}
export function hasPreviewSession():boolean{
  if(!previewLoginEnabled())return false;
  const raw=cookies().get(COOKIE)?.value;
  if(!raw||raw.length>2000)return false;
  const pos=raw.lastIndexOf(".");
  if(pos<=0)return false;
  const data=raw.slice(0,pos),sig=raw.slice(pos+1);
  if(!safeEqualStrings(sig,signature(data)))return false;
  try{
    const value=JSON.parse(Buffer.from(data,"base64url").toString("utf8")) as {sub?:string;exp?:number};
    return value.sub===process.env.TEMP_PREVIEW_ADMIN_EMAIL
      && Number.isInteger(value.exp) && value.exp!>Math.floor(Date.now()/1000);
  }catch{return false;}
}
export function endPreviewSession(){
  cookies().set(COOKIE,"",{path:"/preview",httpOnly:true,secure:true,sameSite:"lax",maxAge:0});
}
