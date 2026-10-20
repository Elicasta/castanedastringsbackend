import {createClient} from "@/lib/supabase/server";
import {notFound} from "next/navigation";
import {QuoteForm} from "@/components/admin/quote-form";

export const dynamic="force-dynamic";
export default async function EditQuotePage({params}:{params:{id:string}}){
 const supabase=createClient();
 const {data:quote}=await supabase.from("quotes").select("*, quote_items(*)").eq("id",params.id).single();
 if(!quote || quote.status!=="draft") notFound();
 const [{data:clients},{data:templates},{data:projects}]=await Promise.all([
  supabase.from("clients").select("*").order("full_name"),
  supabase.from("quote_templates").select("*").eq("status","active").order("sort_order"),
  supabase.from("cs_quote_projects").select("id,client_id,name").order("created_at",{ascending:false})
 ]);
 return <div className="max-w-2xl mx-auto"><QuoteForm clients={clients??[]} projects={projects??[]} templates={templates??[]}
  existingQuote={{...quote,items:(quote.quote_items??[]).sort((a:{sort_order:number},b:{sort_order:number})=>a.sort_order-b.sort_order)}}/></div>;
}
