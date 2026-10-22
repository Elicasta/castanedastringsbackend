import Link from "next/link";
import {notFound} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import {formatDateTime} from "@/lib/dates";
import {InboxReplyComposer} from "@/components/admin/inbox-reply-composer";
import {ArrowLeft,Mail,MessageSquare} from "lucide-react";
export const dynamic="force-dynamic";
type Event={id:string;inquiry_id:string|null;created_at:string;subject:string|null;body:string|null;direction:string;from_email:string|null;to_email:string|null;channel:string};
export default async function ClientConversationPage({params}:{params:{id:string}}){
 const s=createClient();
 const {data:client}=await s.from("clients").select("id,full_name,email,phone").eq("id",params.id).maybeSingle();
 if(!client)notFound();
 const [{data:communications},{data:inquiries}]=await Promise.all([
  s.from("communications").select("id,inquiry_id,created_at,subject,body,direction,from_email,to_email,channel").eq("client_id",params.id).order("created_at",{ascending:false}).limit(250),
  s.from("inquiries").select("id,created_at,event_type,event_date,message,status").eq("client_id",params.id).order("created_at",{ascending:false}).limit(100),
 ]);
 const comms=(communications??[]) as Event[];
 const all=[
 ...comms.map(m=>({id:m.id,at:m.created_at,type:m.direction==="inbound"?"Received":m.direction==="outbound"?"Sent":"Note",subject:m.subject||"Communication",body:m.body||"",from:m.from_email,to:m.to_email,href:null as string|null})),
 ...(inquiries??[]).filter(i=>!comms.some(m=>m.inquiry_id===i.id&&m.direction==="inbound")).map(i=>({id:`inq-${i.id}`,at:i.created_at,type:"Inquiry",subject:i.event_type||"New inquiry",body:i.message||`Event: ${i.event_date||"Date not provided"} · Status: ${i.status}`,from:client.email,to:null,href:`/inquiries/${i.id}`}))
 ].sort((a,b)=>b.at.localeCompare(a.at));
 const latestInbound=comms.find(m=>m.direction==="inbound");
 const sender=process.env.RESEND_FROM_EMAIL||"";
 const connected=Boolean(process.env.RESEND_WEBHOOK_SECRET);
 return <div className="max-w-3xl space-y-5">
  <Link href="/communications" className="text-sm text-[#009f87] inline-flex items-center gap-2"><ArrowLeft size={16}/> Back to Inbox</Link>
  <div className="flex flex-wrap justify-between gap-3">
   <div><h1 className="text-2xl font-semibold">{client.full_name}</h1><p className="text-sm text-neutral-500">{client.email||"No email"}{client.phone?` · ${client.phone}`:""}</p></div>
   <Link href={`/clients/${client.id}`} className="text-sm text-[#009f87] underline">Contact record</Link>
  </div>
  {!connected&&<p className="text-sm bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-3">Incoming email receiving is not configured. Website inquiries are still listed; email replies cannot appear here until a Resend receiving domain and webhook are connected.</p>}
  <section className="space-y-3">
   <h2 className="font-semibold">Conversation history</h2>
   {all.length===0&&<p className="text-sm text-neutral-500">No messages or inquiries yet.</p>}
   {all.map(m=><div key={m.id} className="rounded-xl bg-white border border-neutral-200 px-4 py-3">
    <div className="flex gap-2 justify-between items-start"><div className="flex items-center gap-2"><span className={`text-xs font-semibold rounded-full px-2 py-1 ${m.type==="Received"||m.type==="Inquiry"?"bg-teal-50 text-teal-800":"bg-neutral-100 text-neutral-600"}`}>{m.type}</span><b className="text-sm">{m.subject}</b></div><time className="text-xs text-neutral-500 shrink-0">{formatDateTime(m.at)}</time></div>
    {(m.from||m.to)&&<p className="text-xs text-neutral-500 mt-2 break-all">{m.from?`From: ${m.from}`:""}{m.to?` · To: ${m.to}`:""}</p>}
    <p className="text-sm whitespace-pre-wrap break-words mt-3 max-h-80 overflow-y-auto">{m.body}</p>
    {m.href&&<Link href={m.href} className="text-sm text-[#009f87] mt-2 inline-block">Open inquiry</Link>}
   </div>)}
  </section>
  <InboxReplyComposer clientId={client.id} toEmail={client.email} fromEmail={sender} subject={latestInbound?.subject||"Your Castaneda Strings inquiry"} replyToId={latestInbound?.id||null}/>
 </div>;
}
