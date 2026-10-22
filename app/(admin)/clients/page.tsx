import Link from "next/link";
import {createClient} from "@/lib/supabase/server";
import {PageHeader} from "@/components/ui/page-header";
import {SearchBar} from "@/components/ui/search-bar";
import {Card} from "@/components/ui/card";
import {Users,ArrowRight,AlertTriangle,MessageSquare} from "lucide-react";
export const dynamic="force-dynamic";
export default async function ClientsPage({searchParams}:{searchParams:{q?:string;page?:string}}){
 const {q}=searchParams;
 const page=Math.min(10000,Math.max(1,parseInt(searchParams.page||"1",10)||1)),size=30;
 const db=createClient();
 let query=db.from("clients").select("id,full_name,email,phone,inquiries(count),quotes(count),invoices(count),contracts(count)",{count:"exact"}).order("full_name",{ascending:true});
 const safe=(q||"").slice(0,80).replace(/[,.()%"\\]/g,"").trim();
 if(safe)query=query.or(`first_name.ilike.%${safe}%,last_name.ilike.%${safe}%,email.ilike.%${safe}%`);
 const {data,count,error}=await query.range((page-1)*size,page*size-1);
 const pages=Math.max(1,Math.ceil((count??0)/size));
 const href=(p:number)=>{const params=new URLSearchParams();if(q)params.set("q",q);params.set("page",String(p));return "/clients?"+params.toString();};
 return <div className="space-y-5">
  <PageHeader title="Clients" description="Your contact directory, conversations, quotes and booking documents." action={<Link href="/communications" className="inline-flex gap-2 items-center text-sm text-[#087b68] font-semibold"><MessageSquare size={17}/> Communications</Link>}/>
  <SearchBar placeholder="Search by client name or email…"/>
  {error&&<p role="alert" className="flex items-center gap-2 bg-red-50 rounded-xl p-4 text-sm text-red-700"><AlertTriangle size={18}/>Client records are currently unavailable.</p>}
  {!error&&(data??[]).length===0&&<div className="rounded-2xl border border-[#e5eae8] bg-white p-10 text-center"><Users size={33} className="mx-auto text-[#9baaa2]"/><h2 className="mt-3 font-semibold">No clients in this view</h2><p className="mt-1 text-[#718079] text-sm">Clients are created from inquiries or through the quote workflow.</p></div>}
  {(data??[]).length>0&&<div className="space-y-2">
   <p className="text-[#718079] text-xs">{count} clients · Page {page} of {pages}</p>
   {data?.map(c=><div key={c.id} className="flex gap-4 justify-between items-center rounded-xl border border-[#e5eae8] bg-white px-4 py-4 hover:border-[#a8d9ca]">
    <Link href={`/clients/${c.id}`} className="min-w-0 flex-1">
     <p className="font-semibold text-sm truncate">{c.full_name}</p>
     <p className="text-xs text-[#718079] mt-1 truncate">{c.email||c.phone||"No contact information"}</p>
     <p className="text-xs text-[#718079] mt-2">{c.inquiries?.[0]?.count??0} inquiries · {c.quotes?.[0]?.count??0} quotes · {c.invoices?.[0]?.count??0} invoices · {c.contracts?.[0]?.count??0} agreements</p>
    </Link>
    <Link href={`/communications/client/${c.id}`} aria-label={`Open conversation with ${c.full_name}`} title="Open client conversation" className="p-2.5 rounded-lg border border-[#e1eae6] text-[#087b68] hover:bg-[#e7f6f1]"><MessageSquare size={18}/></Link>
   </div>)}
   {pages>1&&<nav aria-label="Client pages" className="flex justify-between pt-4 text-sm"><span>{page>1?<Link href={href(page-1)} className="text-[#087b68] font-semibold">← Previous</Link>:"Previous"}</span><span>{page} / {pages}</span><span>{page<pages?<Link href={href(page+1)} className="text-[#087b68] font-semibold">Next →</Link>:"Next"}</span></nav>}
  </div>}
 </div>;
}
