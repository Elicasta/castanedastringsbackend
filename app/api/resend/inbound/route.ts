import {createHmac,timingSafeEqual} from "node:crypto";
import {createAdminClient} from "@/lib/supabase/admin";
import {NextResponse} from "next/server";
export const runtime="nodejs";
function emailAddress(input:string):string {
 const match=input.match(/<([^>]+)>/);
 return (match?match[1]:input).trim().toLowerCase();
}
function webhookVerified(body:string,headers:Headers,secret:string){
 const id=headers.get("svix-id"),ts=headers.get("svix-timestamp"),sig=headers.get("svix-signature");
 if(!id||!ts||!sig)return false;
 const when=Number(ts);if(!Number.isInteger(when)||Math.abs(Date.now()/1000-when)>300)return false;
 try{
  const key=Buffer.from(secret.replace(/^whsec_/,""),"base64");
  if(key.length<16)return false;
  const digest=createHmac("sha256",key).update(`${id}.${ts}.${body}`).digest();
  return sig.split(/\s+/).some(s=>{
   if(!s.startsWith("v1,"))return false;
   const compare=Buffer.from(s.slice(3),"base64");
   return compare.length===digest.length&&timingSafeEqual(digest,compare);
  });
 }catch{return false;}
}
type Event={type?:string;data?:{email_id?:string}};
type Incoming={
 from?:string;to?:string[];subject?:string;text?:string|null;html?:string|null;
 message_id?:string;headers?:Record<string,string>;
};
export async function POST(request:Request){
 const secret=process.env.RESEND_WEBHOOK_SECRET;
 if(!secret)return NextResponse.json({error:"Inbound email not configured"},{status:503});
 const raw=await request.text();
 if(!webhookVerified(raw,request.headers,secret))return NextResponse.json({error:"Invalid webhook signature"},{status:401});
 let event:Event;try{event=JSON.parse(raw);}catch{return NextResponse.json({error:"Bad JSON"},{status:400});}
 if(event.type!=="email.received")return NextResponse.json({received:true});
 const id=event.data?.email_id;
 if(!id||!process.env.RESEND_API_KEY)return NextResponse.json({error:"Missing email identifier or API key"},{status:503});
 const db=createAdminClient();
 const {data:already}=await db.from("communications").select("id").eq("resend_email_id",id).maybeSingle();
 if(already)return NextResponse.json({received:true});
 const fetched=await fetch(`https://api.resend.com/emails/receiving/${encodeURIComponent(id)}`,{
  headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`},cache:"no-store"
 });
 if(!fetched.ok)return NextResponse.json({error:"Could not retrieve email"},{status:502});
 const mail=await fetched.json() as Incoming;
 const from=emailAddress(mail.from||"");
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(from))return NextResponse.json({error:"Sender email invalid"},{status:400});
 const target=Array.isArray(mail.to)?mail.to.map(emailAddress).join(", "):"";
 const {data:known}=await db.from("clients").select("id,full_name").ilike("email",from).limit(1).maybeSingle();
 let clientId=known?.id||null;
 // Incoming email creates a contact only when necessary, so any inbound message
 // can appear as a replyable conversation even without an earlier form inquiry.
 if(!clientId){
  const display=(mail.from||"").split("<")[0].replace(/["<>]/g,"").trim();
  const parts=display.split(/\s+/).filter(Boolean).slice(0,8);
  const first=parts.shift()||"Email";
  const last=parts.join(" ")||"Contact";
  const created=await db.from("clients").insert({
   first_name:first,last_name:last,email:from,notes:"Created from incoming Resend email"
  }).select("id").single();
  if(created.error||!created.data)return NextResponse.json({error:"Could not create email contact"},{status:500});
  clientId=created.data.id;
 }
 const subject=(mail.subject||"(No subject)").slice(0,200);
 const body=(mail.text||"").slice(0,30000) ||
  "[HTML email received. Plain-text body unavailable. View message at the provider.]";
 const headerId=mail.message_id||mail.headers?.["message-id"]||null;
 const {error}=await db.from("communications").insert({
  client_id:clientId,channel:"email",direction:"inbound",
  from_email:from,to_email:target,subject,body,
  resend_email_id:id,message_id_header:headerId,status:"received"
 });
 // Unique resend_email_id protects webhook retries, including concurrent delivery.
 if(error&&error.code!=="23505")return NextResponse.json({error:"Unable to save email"},{status:500});
 return NextResponse.json({received:true});
}
