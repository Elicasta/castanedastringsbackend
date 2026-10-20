import {createHmac, timingSafeEqual} from "node:crypto";
import {createAdminClient} from "@/lib/supabase/admin";
import {logActivity} from "@/lib/activity";
import {sendTemplateEmail} from "@/lib/email/resend";
import {NextResponse} from "next/server";

export const runtime="nodejs";
function extractEmail(value:string) {
 const match=value.match(/<([^>]+)>/);
 return (match?match[1]:value).trim().toLowerCase();
}
function verifyWebhook(payload:string,id:string,timestamp:string,signatures:string,secret:string):boolean {
 const ts=Number(timestamp);
 if(!Number.isInteger(ts)||Math.abs(Math.floor(Date.now()/1000)-ts)>300) return false;
 const key=Buffer.from(secret.replace(/^whsec_/,""),"base64");
 if(key.length<16) return false;
 const digest=createHmac("sha256",key).update(`${id}.${timestamp}.${payload}`).digest();
 return signatures.split(" ").some(sig=>{
   const value=sig.startsWith("v1,")?sig.slice(3):"";
   if(!value) return false;
   const incoming=Buffer.from(value,"base64");
   return incoming.length===digest.length&&timingSafeEqual(incoming,digest);
 });
}
type InboundEvent={type:string;data?:{email_id?:string}};
type ResendReceived={from:string;subject?:string;text?:string;html?:string};
export async function POST(req:Request) {
 const payload=await req.text();
 const id=req.headers.get("svix-id");
 const timestamp=req.headers.get("svix-timestamp");
 const signature=req.headers.get("svix-signature");
 const secret=process.env.RESEND_WEBHOOK_SECRET;
 if(!secret||!id||!timestamp||!signature||!verifyWebhook(payload,id,timestamp,signature,secret)) {
   return NextResponse.json({error:"Invalid webhook signature"},{status:401});
 }
 let event:InboundEvent;
 try {event=JSON.parse(payload) as InboundEvent;}
 catch {return NextResponse.json({error:"Invalid JSON"},{status:400});}
 if(event.type!=="email.received") return NextResponse.json({received:true});
 const emailId=event.data?.email_id;
 if(!emailId||!process.env.RESEND_API_KEY) return NextResponse.json({error:"Missing email id or API key"},{status:400});
 const result=await fetch(`https://api.resend.com/emails/receiving/${encodeURIComponent(emailId)}`,{
   headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`},cache:"no-store"
 });
 if(!result.ok) return NextResponse.json({error:"Failed to fetch incoming email"},{status:502});
 const message=await result.json() as ResendReceived;
 if(!message.from) return NextResponse.json({error:"Missing sender"},{status:400});
 const supabase=createAdminClient();
 const from=extractEmail(message.from);
 const {data:client}=await supabase.from("clients").select("*").eq("email",from).maybeSingle();
 const {data:comm,error}=await supabase.from("communications").insert({
   client_id:client?.id??null,channel:"email",direction:"inbound",
   subject:message.subject??null,body:message.text??message.html??"",status:"received"
 }).select("id").single();
 if(error||!comm) return NextResponse.json({error:"Could not save inbound communication"},{status:500});
 await logActivity({
  action:"received",entity_type:"communication",entity_id:comm.id,
  description:`Email reply from ${message.from}`
 });
 if(process.env.RESEND_FROM_EMAIL) {
   await sendTemplateEmail({
     to:process.env.RESEND_FROM_EMAIL,template:"inbound_reply_admin",
     vars:{from_name:client?.full_name??message.from,subject:message.subject??"(no subject)",snippet:(message.text??"").slice(0,200)},
     client_id:client?.id??null
   }).catch(()=>null);
 }
 return NextResponse.json({received:true});
}
