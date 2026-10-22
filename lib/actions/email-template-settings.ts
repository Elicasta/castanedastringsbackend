"use server";
import {z} from "zod";
import {createClient} from "@/lib/supabase/server";
import {revalidatePath} from "next/cache";
import {MANAGED_EMAIL_KEYS,ALLOWED_MERGE_FIELDS} from "@/lib/email/managed-templates";
const schema=z.object({
 template_key:z.enum(MANAGED_EMAIL_KEYS),
 subject:z.string().trim().min(3).max(200),
 body:z.string().trim().min(5).max(12000),
});
export async function saveEmailTemplateAction(input:unknown){
 const parsed=schema.safeParse(input);if(!parsed.success)return {error:parsed.error.issues[0]?.message??"Invalid template"};
 const variables=Array.from((parsed.data.subject+" "+parsed.data.body).matchAll(/{{(\w+)}}/g)).map(x=>x[1]);
 const invalid=variables.find(v=>!ALLOWED_MERGE_FIELDS.includes(v as any));
 if(invalid)return {error:`Unknown merge field {{${invalid}}}.`};
 const s=createClient();const {data:{user}}=await s.auth.getUser();
 const {data:role}=user?await s.from("cs_admin_members").select("role").eq("auth_user_id",user.id).maybeSingle():{data:null};
 if(!role||!["owner","admin"].includes(role.role))return {error:"Only an owner or admin may edit email templates."};
 const {error}=await s.from("cs_email_templates").upsert({
  ...parsed.data,updated_at:new Date().toISOString()
 },{onConflict:"template_key"});
 if(error)return {error:error.message};
 revalidatePath("/settings/email-templates");revalidatePath("/quotes");
 return {success:true};
}
