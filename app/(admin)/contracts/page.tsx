import Link from "next/link";
import {createClient} from "@/lib/supabase/server";
import {PageHeader} from "@/components/ui/page-header";
import {StatusTabs} from "@/components/ui/status-tabs";
import {StatusPill} from "@/components/ui/status-pill";
import {Card} from "@/components/ui/card";
import {FileSignature,ArrowRight,AlertTriangle} from "lucide-react";
export const dynamic="force-dynamic";
const TABS=[{label:"All",value:"all"},{label:"Drafts",value:"draft"},{label:"Sent",value:"sent"},{label:"Awaiting signature",value:"pending"},{label:"Signed",value:"signed"},{label:"Cancelled",value:"cancelled"}];
export default async function ContractsPage({searchParams}:{searchParams:{status?:string;page?:string}}){
 const {status}=searchParams;const page=Math.min(10000,Math.max(1,parseInt(searchParams.page||"1",10)||1)),size=30;
 const db=createClient();
 let query=db.from("contracts").select("id,title,status,created_at,client:clients(full_name)",{count:"exact"}).order("created_at",{ascending:false});
 if(status&&status!=="all"&&TABS.some(t=>t.value===status))query=query.eq("status",status);
 const {data, count,error}=await query.range((page-1)*size,page*size-1);
 const pages=Math.max(1,Math.ceil((count??0)/size));
 const href=(p:number)=>`/contracts?status=${status||"all"}&page=${p}`;
 return <div className="space-y-5">
  <PageHeader title="Agreements" description="Prepare performance agreements, send for signature, and track signed documents." action={<Link href="/contracts/templates" className="text-sm text-[#087b68] underline underline-offset-4 font-semibold">Manage templates</Link>}/>
  <StatusTabs tabs={TABS}/>
  {error&&<p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700 text-sm flex gap-2"><AlertTriangle size={18}/>Agreement records could not be loaded.</p>}
  {!error&&(data??[]).length===0&&<div className="rounded-2xl border border-[#e5eae8] bg-white p-10 text-center"><FileSignature size={32} className="mx-auto text-[#9baaa2]"/><h2 className="mt-3 font-semibold">No agreements in this view</h2><p className="mt-1 text-sm text-[#718079]">Create an agreement template first, then accept a quote to generate a draft.</p><Link href="/contracts/templates" className="inline-flex gap-2 mt-5 items-center text-sm text-[#087b68] font-semibold">Open agreement templates <ArrowRight size={16}/></Link></div>}
  {(data??[]).length>0&&<div className="space-y-2"><p className="text-xs text-[#718079]">{count} agreements · Page {page} of {pages}</p>
   {data?.map(c=><Link key={c.id} href={`/contracts/${c.id}`} className="block rounded-xl"><Card className="flex items-center justify-between gap-3 hover:border-[#a8d9ca]">
    <div className="min-w-0"><p className="font-semibold text-sm truncate">{c.title}</p><p className="text-xs text-[#718079] truncate mt-1">{(c.client as unknown as {full_name:string}|null)?.full_name||"Client"}</p></div><StatusPill status={c.status}/></Card></Link>)}
   {pages>1&&<nav aria-label="Agreement pages" className="flex justify-between pt-4 text-sm"><span>{page>1?<Link href={href(page-1)} className="text-[#087b68] font-semibold">← Previous</Link>:"Previous"}</span><span>{page} / {pages}</span><span>{page<pages?<Link href={href(page+1)} className="text-[#087b68] font-semibold">Next →</Link>:"Next"}</span></nav>}
  </div>}
 </div>;
}
