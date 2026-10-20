import Link from "next/link";
import {createClient} from "@/lib/supabase/server";
import {EMAIL_TEMPLATES} from "@/lib/email/templates";
import {MANAGED_EMAIL_KEYS} from "@/lib/email/managed-templates";
import {EmailTemplateManager} from "@/components/admin/email-template-manager";
import {PageHeader} from "@/components/ui/page-header";
export const dynamic="force-dynamic";
export default async function EmailTemplateSettings(){
 const s=createClient();
 const {data:stored}=await s.from("cs_email_templates").select("template_key,subject,body");
 const initial=MANAGED_EMAIL_KEYS.map(k=>{
  const db=stored?.find(t=>t.template_key===k);
  return {template_key:k,subject:db?.subject||EMAIL_TEMPLATES[k].subject,body:db?.body||EMAIL_TEMPLATES[k].body};
 });
 return <div className="max-w-3xl"><PageHeader title="Email Templates" description="Personalize client quotes, invoices, and reminders." action={<Link href="/settings" className="text-sm text-[#009f87] underline">Settings</Link>}/><EmailTemplateManager initial={initial}/></div>;
}
