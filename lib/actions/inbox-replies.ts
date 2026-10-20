"use server";
import {z} from "zod";
import {createClient} from "@/lib/supabase/server";
import {revalidatePath} from "next/cache";
import {brandedHtml} from "@/lib/email/templates";
const schema=z.object({
 clientId:z.string().uuid(),requestId:z.string().uuid(),
 subject:z.string().trim().min(3).max(200),
 body:z.string().trim().min(2).max(12000),
 replyToId:z.string().uuid().nullable().optional()
});
export async function sendInboxReplyAction(input:unknown){
 const parsed=schema.safeParse(input);if(!parsed.success)return {error:parsed.error.issues[0]?.message??"Invalid reply"};
 const a=parsed.data;
 const from=process.env.RESEND_FROM_EMAIL,key=process.env.RESEND_API_KEY;
 if(!from||!key)return {error:"Resend sender is not configured."};
 const s=createClient();
 const {data:{user}}=await s.auth.getUser();
 if(!user)return {error:"Sign in required."};
 const {data:member}=await s.from("cs_admin_members").select("role").eq("auth_user_id",user.id).maybeSingle();
 if(!member||member.role==="viewer")return {error:"You do not have permission to reply."};
 const {data:client}=await s.from("clients").select("id,email").eq("id",a.clientId).maybeSingle();
 const to=client?.email?.trim().toLowerCase();
 if(!to||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to))return {error:"This contact has no valid email."};
 let messageHeader:string|null=null;
 if(a.replyToId){
  const {data:original}=await s.from("communications").select("id,message_id_header")
   .eq("id",a.replyToId).eq("client_id",a.clientId).eq("direction","inbound").maybeSingle();
  if(!original)return {error:"Original message does not belong to this contact."};
  messageHeader=original.message_id_header;
 }
 const {data:existing}=await s.from("communications").select("id,status,body,subject").eq("reply_request_id",a.requestId).maybeSingle();
 if(existing?.status==="sent")return {success:true};
 if(existing&&(existing.subject!==a.subject||existing.body!==a.body))return {error:"This reply request was already used. Refresh and try again."};
 if(!existing){
  const {error:insertError}=await s.from("communications").insert({
   client_id:a.clientId,channel:"email",direction:"outbound",from_email:from,
   to_email:to,subject:a.subject,body:a.body,reply_to_id:a.replyToId||null,
   reply_request_id:a.requestId,status:"draft"
  });
  if(insertError&&insertError.code!=="23505")return {error:insertError.message};
 }
 try{
  const response=await fetch("https://api.resend.com/emails",{
   method:"POST",cache:"no-store",
   headers:{Authorization:`Bearer ${key}`,"Content-Type":"application/json","Idempotency-Key":a.requestId},
   body:JSON.stringify({
     from,to:[to],subject:a.subject,text:a.body,html:brandedHtml(a.subject,a.body),
     ...(messageHeader?{headers:{"In-Reply-To":messageHeader}}:{})
   })
  });
  const data=await response.json().catch(()=>({})) as {id?:string;message?:string};
  if(!response.ok||!data.id)throw new Error(data.message||"Email delivery service failed.");
  const {error:saved}=await s.from("communications").update({status:"sent",resend_email_id:data.id})
    .eq("reply_request_id",a.requestId);
  if(saved)return {error:"Resend accepted this email, but its history could not be updated. Do not resend it."};
  revalidatePath("/communications");revalidatePath(`/communications/client/${a.clientId}`);
  return {success:true};
 }catch(err){
  // Ambiguous network outcomes are retried with the same provider idempotency key.
  return {error:err instanceof Error?err.message:"Could not send reply."};
 }
}
