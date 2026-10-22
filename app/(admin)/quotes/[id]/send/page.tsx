import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { QuoteEmailComposer } from "@/components/admin/quote-email-composer";
import { getEmailTemplate, renderManagedEmailTemplate } from "@/lib/email/managed-templates";
import {formatDate} from "@/lib/dates";
export const dynamic="force-dynamic";
export default async function SendQuotePage({params}:{params:{id:string}}){
 const supabase=createClient();
 const {data:quote}=await supabase.from("quotes").select("id,status,quote_number,event_type,event_date,client:clients(full_name,email)").eq("id",params.id).maybeSingle();
 if(!quote)notFound();
 if(quote.status!=="draft")redirect(`/quotes/${quote.id}`);
 const client=quote.client as unknown as {full_name:string;email:string|null}|null;
 if(!client)notFound();
 const tmpl=await getEmailTemplate("quote_sent");
 const message=renderManagedEmailTemplate(tmpl,{client_first_name:client.full_name.split(" ")[0],client_name:client.full_name,quote_number:quote.quote_number||"",event_type:quote.event_type||"event",event_date:formatDate(quote.event_date),business_name:"Castaneda Strings",quote_link:"",invoice_link:"",portal_link:"",total:""});
 return <QuoteEmailComposer quoteId={quote.id} quoteNumber={quote.quote_number}
   recipientName={client.full_name} recipientEmail={client.email??""} initialSubject={message.subject} initialBody={message.body} cancelHref={`/quotes/${quote.id}`}/>;
}
