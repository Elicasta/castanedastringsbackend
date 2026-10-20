import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { QuoteEmailComposer } from "@/components/admin/quote-email-composer";
export const dynamic="force-dynamic";
export default async function SendQuotePage({params}:{params:{id:string}}){
 const supabase=createClient();
 const {data:quote}=await supabase.from("quotes").select("id,status,quote_number,client:clients(full_name,email)").eq("id",params.id).maybeSingle();
 if(!quote)notFound();
 if(quote.status!=="draft")redirect(`/quotes/${quote.id}`);
 const client=quote.client as {full_name:string;email:string|null}|null;
 if(!client)notFound();
 return <QuoteEmailComposer quoteId={quote.id} quoteNumber={quote.quote_number}
   recipientName={client.full_name} recipientEmail={client.email??""} cancelHref={`/quotes/${quote.id}`}/>;
}
