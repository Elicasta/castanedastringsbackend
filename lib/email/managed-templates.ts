import {createAdminClient} from "@/lib/supabase/admin";
import {EMAIL_TEMPLATES,renderTemplate,type EmailTemplateKey} from "@/lib/email/templates";

export const MANAGED_EMAIL_KEYS=["quote_sent","invoice_sent","quote_reminder","payment_reminder"] as const;
export type ManagedEmailKey=typeof MANAGED_EMAIL_KEYS[number];
export const EMAIL_LABELS:Record<ManagedEmailKey,string>={
 quote_sent:"Quote delivery",invoice_sent:"Invoice delivery",
 quote_reminder:"Quote reminder",payment_reminder:"Payment reminder",
};
export const ALLOWED_MERGE_FIELDS=[
 "client_first_name","client_name","quote_number","invoice_number","event_type","event_date",
 "quote_link","invoice_link","due_date","total","business_name","portal_link","expiry_date"
] as const;

export async function getEmailTemplate(key:EmailTemplateKey){
 if(!MANAGED_EMAIL_KEYS.includes(key as ManagedEmailKey))return EMAIL_TEMPLATES[key];
 const db=createAdminClient();
 const {data}=await db.from("cs_email_templates").select("subject,body").eq("template_key",key).maybeSingle();
 return data?.subject&&data?.body?{subject:data.subject,body:data.body}:EMAIL_TEMPLATES[key];
}
export function renderManagedEmailTemplate(t:{subject:string;body:string},vars:Record<string,string>){
 return {subject:renderTemplate(t.subject,vars),body:renderTemplate(t.body,vars)};
}
