import Link from "next/link";
import {createClient} from "@/lib/supabase/server";
import {PageHeader} from "@/components/ui/page-header";
import {Card} from "@/components/ui/card";
import {AddNoteForm} from "@/components/admin/add-note-form";
import {formatDateTime} from "@/lib/dates";
import {Inbox,Send,MessagesSquare,ChevronRight} from "lucide-react";
export const dynamic="force-dynamic";
type Thread={client_id:string;full_name:string;email:string|null;latest_at:string;last_subject:string|null;last_body:string|null;last_direction:string;inquiry_count:number;message_count:number;total_count:number};
const options=[{key:"inbox",label:"Inbox",icon:Inbox},{key:"sent",label:"Sent",icon:Send},{key:"all",label:"All conversations",icon:MessagesSquare}] as const;
export default async function CommunicationsPage({searchParams}:{searchParams:{view?:string;q?:string;page?:string}}){
 const view=["inbox","sent","all"].includes(searchParams.view||"")?searchParams.view!:"inbox";
 const q=(searchParams.q||"").trim().slice(0,80);
 const page=Math.min(10000,Math.max(1,parseInt(searchParams.page||"1",10)||1));
 const size=40;
 const s=createClient();
 const {data:threads,error}=await s.rpc("cs_inbox_threads",{p_view:view,p_query:q,p_limit:size,p_offset:(page-1)*size});
 const records=(threads??[]) as Thread[];
 const total=Number(records[0]?.total_count||0);
 const pages=Math.max(1,Math.ceil(total/size));
 const href=(tab:string,p=1)=>{
  const params=new URLSearchParams();
  params.set("view",tab);if(q)params.set("q",q);if(p>1)params.set("page",String(p));
  return "/communications?"+params.toString();
 };
 const configured=Boolean(process.env.RESEND_API_KEY&&process.env.RESEND_FROM_EMAIL);
 const incoming=Boolean(process.env.RESEND_WEBHOOK_SECRET);
 return <div className="space-y-5">
  <PageHeader title="Communications" description="One inbox for client inquiries, received emails, and replies." />
  <div className="flex flex-wrap gap-2 text-sm">
   <span className={`rounded-lg px-3 py-1.5 ${configured?"bg-teal-50 text-teal-800":"bg-amber-50 text-amber-800"}`}>Outgoing Resend: {configured?"Configured":"Not configured"}</span>
   <span className={`rounded-lg px-3 py-1.5 ${incoming?"bg-teal-50 text-teal-800":"bg-amber-50 text-amber-800"}`}>Incoming email: {incoming?"Webhook key present":"Needs receiving domain + webhook"}</span>
  </div>
  <nav className="flex gap-2 flex-wrap">{options.map(o=><Link key={o.key} href={href(o.key)} className={`inline-flex gap-2 items-center rounded-xl px-4 py-2.5 text-sm font-semibold ${view===o.key?"bg-[#009f87] text-white":"bg-white border border-neutral-200"}`}><o.icon size={17}/>{o.label}</Link>)}</nav>
  <form action="/communications" method="get" className="flex items-center gap-2">
   <input type="hidden" name="view" value={view}/>
   <input type="search" name="q" defaultValue={q} aria-label="Find conversations" placeholder="Search clients or email addresses" className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-white text-sm"/>
   <button type="submit" className="bg-[#009f87] text-white rounded-xl px-4 py-3 text-sm font-semibold">Search</button>
  </form>
  {error&&<p role="alert" className="bg-red-50 text-red-700 p-4 rounded-xl text-sm">Inbox unavailable. Apply the latest Castaneda Strings migration before using Communications.</p>}
  {!error&&records.length===0&&<p className="text-sm text-neutral-500 p-6 text-center bg-white rounded-xl border border-neutral-100">No matching client conversations. Inquiries appear here when submitted to your Castaneda Strings intake endpoint.</p>}
  <div className="space-y-2">{records.map(r=><Link key={r.client_id} href={`/communications/client/${r.client_id}`} className="block rounded-2xl bg-white border border-neutral-100 px-5 py-4 hover:border-teal-300">
   <div className="flex justify-between items-start gap-3"><div className="min-w-0"><p className="font-semibold truncate">{r.full_name}</p><p className="text-xs text-neutral-500 truncate">{r.email}</p></div><div className="text-right shrink-0"><p className="text-xs text-neutral-500">{formatDateTime(r.latest_at)}</p><ChevronRight size={17} className="ml-auto text-[#009f87] mt-1"/></div></div>
   <p className="font-medium text-sm mt-3">{r.last_subject||"New message"}</p>
   <p className="text-sm text-neutral-500 mt-1 truncate">{r.last_body||"Open conversation"}</p>
   <div className="mt-3 flex gap-3 text-xs text-neutral-500"><span>{r.inquiry_count} inquiries</span><span>{r.message_count} messages</span><span className="capitalize">Last: {r.last_direction}</span></div>
  </Link>)}</div>
  {!error&&pages>1&&<div className="flex justify-between items-center text-sm"><span>{page>1?<Link href={href(view,page-1)} className="font-semibold text-[#009f87]">Previous</Link>:"Previous"}</span><span>Page {page} of {pages}</span><span>{page<pages?<Link href={href(view,page+1)} className="font-semibold text-[#009f87]">Next</Link>:"Next"}</span></div>}
  <details className="bg-white rounded-xl border border-neutral-100 p-4"><summary className="font-medium text-sm cursor-pointer">Log a private note</summary><div className="pt-4"><AddNoteForm/></div></details>
 </div>;
