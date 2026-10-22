import Link from "next/link";
import {createClient} from "@/lib/supabase/server";
import {PageHeader} from "@/components/ui/page-header";
import {formatCents} from "@/lib/currency";
import {formatDate,formatDateTime} from "@/lib/dates";
import {
 ArrowUpRight, Inbox, FileText, CreditCard, CalendarDays, Mail,
 Plus, AlertTriangle, ChevronRight, CheckCircle2, ArrowRight
} from "lucide-react";
export const dynamic="force-dynamic";
type Count={count:number|null;error?:{message?:string}|null};
type Client={full_name:string|null}|null;
type RecentInquiry={id:string;event_type:string|null;created_at:string;status:string;client:Client};
type RecentQuote={id:string;quote_number:string|null;title:string;total_cents:number;created_at:string;client:Client};
type Booking={id:string;quote_id:string;title:string;event_date:string;start_time:string;location:string|null;sync_status:string};
type Message={id:string;client_id:string|null;subject:string|null;created_at:string;direction:string;client:Client};

export default async function DashboardPage(){
 const db=createClient();
 const currentDate=new Date().toISOString().slice(0,10);
 const [
   inquiriesCount,draftsCount,sentCount,paymentsCount,bookingsCount,
   inquiries,drafts,bookings,messages
 ]=await Promise.all([
  db.from("inquiries").select("id",{count:"exact",head:true}).in("status",["new","awaiting_response"]),
  db.from("quotes").select("id",{count:"exact",head:true}).eq("status","draft"),
  db.from("quotes").select("id",{count:"exact",head:true}).in("status",["sent","pending"]),
  db.from("invoices").select("id",{count:"exact",head:true}).in("status",["sent","payment_pending","past_due"]),
  db.from("cs_bookings").select("id",{count:"exact",head:true}).eq("status","confirmed").gte("event_date",currentDate),
  db.from("inquiries").select("id,event_type,created_at,status,client:clients(full_name)").in("status",["new","awaiting_response"]).order("created_at",{ascending:false}).limit(4),
  db.from("quotes").select("id,quote_number,title,total_cents,created_at,client:clients(full_name)").eq("status","draft").order("updated_at",{ascending:false}).limit(4),
  db.from("cs_bookings").select("id,quote_id,title,event_date,start_time,location,sync_status").eq("status","confirmed").gte("event_date",currentDate).order("event_date",{ascending:true}).limit(5),
  db.from("communications").select("id,client_id,subject,created_at,direction,client:clients(full_name)").eq("direction","inbound").order("created_at",{ascending:false}).limit(4)
 ]);
 const metrics=[
  {label:"New inquiries",value:inquiriesCount.count??0,href:"/inquiries?status=new",icon:Inbox,description:"Need a response"},
  {label:"Quote drafts",value:draftsCount.count??0,href:"/quotes?status=draft",icon:FileText,description:"Not sent yet"},
  {label:"Sent quotes",value:sentCount.count??0,href:"/quotes?status=sent",icon:Mail,description:"Awaiting a decision"},
  {label:"Open invoices",value:paymentsCount.count??0,href:"/invoices?status=payment_pending",icon:CreditCard,description:"Payment follow-ups"},
  {label:"Upcoming bookings",value:bookingsCount.count??0,href:"/calendar",icon:CalendarDays,description:"Confirmed performances"}
 ];
 const dataError=[inquiriesCount,draftsCount,sentCount,paymentsCount,bookingsCount].some(x=>Boolean(x.error));
 const bookingError=Boolean(bookings.error||bookingsCount.error);
 return <div className="space-y-8">
  <PageHeader title="Studio overview" description="Your active work, not a sample dashboard." action={
   <Link href="/quotes/new" className="inline-flex items-center gap-2 rounded-xl bg-[#008b77] text-white px-4 py-3 text-sm font-semibold hover:bg-[#007763]"><Plus size={18}/> New quote</Link>
  }/>
  {dataError&&<div role="alert" className="flex gap-3 items-start rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><AlertTriangle className="size-5 shrink-0"/>Some counts could not be loaded. Check the Castaneda Strings database migrations and your account permissions. Unavailable counts are not confirmed zero.</div>}
  <section aria-label="Business metrics" className="grid grid-cols-2 xl:grid-cols-5 gap-3">
   {metrics.map(m=><Link href={m.href} key={m.label} className="group rounded-2xl border border-[#e5eae8] bg-white p-4 sm:p-5 hover:border-[#b4dace] hover:shadow-sm transition-all">
    <div className="flex justify-between gap-2"><m.icon size={19} className="text-[#087d69]"/><ArrowUpRight size={15} className="text-[#a7b5ae] group-hover:text-[#087d69]"/></div>
    <p className="mt-5 text-[30px] leading-none font-semibold tracking-tight text-[#18372d] tabular-nums">{m.value}</p>
    <p className="font-semibold text-sm mt-3">{m.label}</p>
    <p className="text-xs text-[#718079] mt-1">{m.description}</p>
   </Link>)}
  </section>
  <section className="grid lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-5">
   <div className="space-y-5">
    <div className="rounded-2xl border border-[#e5eae8] bg-white overflow-hidden">
     <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-[#edf0ee]"><div><h2 className="font-semibold text-[16px]">Inquiries needing attention</h2><p className="text-xs text-[#7e8a83] mt-1">Reply to new client requests</p></div><Link href="/inquiries" className="text-xs font-semibold text-[#087d69] inline-flex gap-1 items-center">View all<ArrowRight size={14}/></Link></div>
     {inquiries.error?<p className="p-5 text-sm text-red-700">Could not load inquiries.</p>:(inquiries.data??[]).length===0?<p className="p-6 text-sm text-[#7e8a83]">Nothing requires a response right now.</p>:
     (inquiries.data as unknown as RecentInquiry[]).map(item=><Link key={item.id} href={`/inquiries/${item.id}`} className="flex gap-3 items-center justify-between px-5 py-4 border-b border-[#f0f2f0] last:border-0 hover:bg-[#f9fbfa]">
      <span className="min-w-0"><span className="block text-sm font-semibold truncate">{item.client?.full_name||"Client inquiry"}</span><span className="block text-xs text-[#718079] truncate mt-1">{item.event_type||"Performance request"} · {formatDateTime(item.created_at)}</span></span><ChevronRight size={16} className="shrink-0 text-[#8c9d94]"/></Link>)}
    </div>
    <div className="rounded-2xl border border-[#e5eae8] bg-white overflow-hidden">
     <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-[#edf0ee]"><div><h2 className="font-semibold text-[16px]">Drafts ready to finish</h2><p className="text-xs text-[#7e8a83] mt-1">Edit, review, then send</p></div><Link href="/quotes?status=draft" className="text-xs font-semibold text-[#087d69] inline-flex items-center gap-1">View drafts<ArrowRight size={14}/></Link></div>
     {drafts.error?<p className="p-5 text-sm text-red-700">Could not load drafts.</p>:(drafts.data??[]).length===0?<p className="p-6 text-sm text-[#7e8a83]">No unsent quote drafts.</p>:
     (drafts.data as unknown as RecentQuote[]).map(q=><Link key={q.id} href={`/quotes/${q.id}`} className="flex items-center justify-between gap-3 px-5 py-4 border-b border-[#f0f2f0] last:border-0 hover:bg-[#f9fbfa]">
      <span className="min-w-0"><span className="block text-sm font-semibold truncate">{q.quote_number||q.title}</span><span className="block text-xs text-[#718079] truncate mt-1">{q.client?.full_name||"Unassigned"} · {formatCents(q.total_cents)}</span></span><ChevronRight size={16} className="shrink-0 text-[#8c9d94]"/></Link>)}
    </div>
   </div>
   <div className="space-y-5">
    <div className="rounded-2xl border border-[#e5eae8] bg-white overflow-hidden">
     <div className="flex items-center justify-between px-5 py-4 border-b border-[#edf0ee]"><h2 className="font-semibold text-[16px]">Confirmed performances</h2><Link href="/calendar" className="text-xs font-semibold text-[#087d69]">Calendar →</Link></div>
     {bookingError?<div className="p-5 text-sm text-amber-800">Bookings are not available until the Calendar database is configured.</div>:(bookings.data??[]).length===0?<div className="p-6 text-sm text-[#718079]">No confirmed upcoming performances.</div>:
     (bookings.data as Booking[]).map(b=><Link key={b.id} href={`/quotes/${b.quote_id}`} className="flex justify-between gap-3 border-b last:border-0 border-[#f0f2f0] px-5 py-4 hover:bg-[#f9fbfa]">
      <span className="min-w-0"><b className="text-sm block truncate">{b.title}</b><span className="text-xs text-[#718079] mt-1 block">{formatDate(b.event_date)} · {b.start_time.slice(0,5)}</span></span><ChevronRight size={16} className="text-[#8c9d94] shrink-0"/></Link>)}
    </div>
    <div className="rounded-2xl border border-[#e5eae8] bg-white overflow-hidden">
     <div className="flex items-center justify-between px-5 py-4 border-b border-[#edf0ee]"><h2 className="font-semibold text-[16px]">Latest incoming messages</h2><Link href="/communications?view=inbox" className="text-xs font-semibold text-[#087d69]">Inbox →</Link></div>
     {messages.error?<p className="p-5 text-sm text-amber-800">Messages could not be loaded.</p>:(messages.data??[]).length===0?<p className="p-6 text-sm text-[#718079]">No inbound messages yet.</p>:
     (messages.data as unknown as Message[]).map(m=><Link key={m.id} href={m.client_id?`/communications/client/${m.client_id}`:"/communications"} className="flex justify-between items-center gap-3 px-5 py-4 border-b last:border-0 border-[#f0f2f0] hover:bg-[#f9fbfa]">
      <span className="min-w-0"><b className="text-sm block truncate">{m.client?.full_name||m.subject||"Incoming message"}</b><span className="text-xs text-[#718079] block truncate mt-1">{m.subject||"Email"} · {formatDateTime(m.created_at)}</span></span><ChevronRight size={16} className="shrink-0 text-[#8c9d94]"/></Link>)}
    </div>
   </div>
  </section>
  <div className="flex flex-wrap gap-3 text-xs text-[#667a70]"><Link href="/settings/payments" className="inline-flex items-center gap-2 underline underline-offset-4"><CreditCard size={15}/> Payment settings</Link><Link href="/settings/email-templates" className="inline-flex items-center gap-2 underline underline-offset-4"><Mail size={15}/> Email templates</Link><Link href="/contracts/templates" className="inline-flex items-center gap-2 underline underline-offset-4"><CheckCircle2 size={15}/> Agreements</Link></div>
 </div>;
}
