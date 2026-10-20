import Link from "next/link";
import {createClient} from "@/lib/supabase/server";
import {PageHeader} from "@/components/ui/page-header";
import {ButtonLink} from "@/components/ui/button";
import {SearchBar} from "@/components/ui/search-bar";
import {StatusTabs} from "@/components/ui/status-tabs";
import {StatusPill} from "@/components/ui/status-pill";
import {Card} from "@/components/ui/card";
import {formatDate} from "@/lib/dates";
import {Inbox,Plus,ArrowRight,AlertTriangle} from "lucide-react";
export const dynamic="force-dynamic";
const TABS=[
 {label:"All",value:"all"},{label:"New",value:"new"},{label:"Awaiting response",value:"awaiting_response"},
 {label:"Quoted",value:"quoted"},{label:"Booked",value:"booked"},
 {label:"Cancelled",value:"cancelled"},{label:"Archived",value:"archived"}
];
export default async function InquiriesPage({searchParams}:{searchParams:{q?:string;status?:string;page?:string}}){
 const {q,status}=searchParams;
 const page=Math.min(10000,Math.max(1,parseInt(searchParams.page||"1",10)||1)),size=30;
 const db=createClient();
 let query=db.from("inquiries").select("id,event_type,event_date,created_at,status,client:clients(full_name)",{count:"exact"}).order("created_at",{ascending:false});
 if(status&&status!=="all"&&TABS.some(t=>t.value===status))query=query.eq("status",status);
 const safe=(q||"").slice(0,80).replace(/[,.()%"\\]/g,"").trim();
 if(safe){
  const {data:clients}=await db.from("clients").select("id").ilike("full_name",`%${safe}%`).limit(100);
  const predicates=[`event_type.ilike.%${safe}%`];
  const ids=(clients??[]).map(c=>c.id);
  if(ids.length)predicates.push(`client_id.in.(${ids.join(",")})`);
  query=query.or(predicates.join(","));
 }
 const {data,count,error}=await query.range((page-1)*size,page*size-1);
 const pages=Math.max(1,Math.ceil((count??0)/size));
 const href=(p:number)=>{const params=new URLSearchParams();if(q)params.set("q",q);if(status)params.set("status",status);params.set("page",String(p));return "/inquiries?"+params.toString();};
 return <div className="space-y-5">
  <PageHeader title="Inquiries" description="Every incoming request, its status, and the next booking step." action={<ButtonLink href="/inquiries/new"><Plus className="size-4"/> Add inquiry</ButtonLink>}/>
  <div className="space-y-3"><SearchBar placeholder="Search by client or event…"/><StatusTabs tabs={TABS}/></div>
  {error&&<p role="alert" className="flex gap-2 bg-red-50 text-red-700 p-4 rounded-xl text-sm"><AlertTriangle size={18}/>Inquiries could not be loaded. Check access to the database.</p>}
  {!error&&(data??[]).length===0&&<div className="p-10 border border-[#e5eae8] bg-white rounded-2xl text-center"><Inbox size={34} className="mx-auto text-[#99aca2]"/><h2 className="font-semibold mt-3">No inquiries in this view</h2><p className="text-sm text-[#718079] mt-1">New website inquiries and manually added requests appear here.</p><Link href="/inquiries/new" className="mt-5 inline-flex gap-2 items-center text-sm text-[#087b68] font-semibold">New inquiry <ArrowRight size={16}/></Link></div>}
  {(data??[]).length>0&&<div className="space-y-2"><p className="text-xs text-[#718079]">{count} inquiries · Page {page} of {pages}</p>
   {data?.map(i=><Link href={`/inquiries/${i.id}`} key={i.id} className="block"><Card className="flex items-center justify-between gap-3 hover:border-[#a8d9ca] transition-colors">
    <span className="min-w-0"><span className="text-sm font-semibold truncate block">{(i.client as unknown as {full_name:string}|null)?.full_name||"Client inquiry"}</span><span className="text-xs text-[#718079] truncate mt-1 block">{i.event_type||"Event details pending"} · {formatDate(i.event_date)}</span></span><StatusPill status={i.status}/>
   </Card></Link>)}
   {pages>1&&<nav className="flex justify-between pt-4 text-sm" aria-label="Inquiry pages"><span>{page>1?<Link href={href(page-1)} className="text-[#087b68] font-semibold">← Previous</Link>:"Previous"}</span><span>{page} / {pages}</span><span>{page<pages?<Link href={href(page+1)} className="text-[#087b68] font-semibold">Next →</Link>:"Next"}</span></nav>}
  </div>}
 </div>;
}
