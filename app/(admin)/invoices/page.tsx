import Link from "next/link";
import {createClient} from "@/lib/supabase/server";
import {PageHeader} from "@/components/ui/page-header";
import {SearchBar} from "@/components/ui/search-bar";
import {StatusTabs} from "@/components/ui/status-tabs";
import {StatusPill} from "@/components/ui/status-pill";
import {Card} from "@/components/ui/card";
import {formatCents} from "@/lib/currency";
import {formatDate} from "@/lib/dates";
import {Receipt,ArrowRight,AlertTriangle} from "lucide-react";
export const dynamic="force-dynamic";
const TABS=[
 {label:"All",value:"all"},{label:"Drafts",value:"draft"},
 {label:"Sent",value:"sent"},{label:"Awaiting payment",value:"payment_pending"},
 {label:"Paid",value:"paid"},{label:"Past due",value:"past_due"},
 {label:"Cancelled",value:"cancelled"},{label:"Refunded",value:"refunded"}
];
export default async function InvoicesPage({searchParams}:{searchParams:{q?:string;status?:string;page?:string}}){
 const {q,status}=searchParams;
 const page=Math.min(10000,Math.max(1,Number.parseInt(searchParams.page||"1",10)||1)),size=30;
 const s=createClient();
 let query=s.from("invoices").select("id,invoice_number,total_cents,balance_due_cents,due_date,status,client:clients(full_name)",{count:"exact"}).order("created_at",{ascending:false});
 if(status&&status!=="all"&&TABS.some(t=>t.value===status))query=query.eq("status",status);
 const safe=(q||"").slice(0,80).replace(/[,.()%"\\]/g,"").trim();
 if(safe)query=query.ilike("invoice_number",`%${safe}%`);
 const {data, count,error}=await query.range((page-1)*size,page*size-1);
 const pages=Math.max(1,Math.ceil((count??0)/size));
 const href=(p:number)=>{const params=new URLSearchParams();if(q)params.set("q",q);if(status)params.set("status",status);params.set("page",String(p));return "/invoices?"+params.toString();};
 return <div className="space-y-5">
  <PageHeader title="Invoices" description="Send invoices, check balances, confirm payments, and manage overdue accounts." action={<Link href="/settings/payments" className="text-sm font-semibold text-[#087b68] underline underline-offset-4">Payment settings</Link>}/>
  <div className="space-y-3"><SearchBar placeholder="Search invoice number…"/><StatusTabs tabs={TABS}/></div>
  {error&&<div role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700 flex gap-2"><AlertTriangle size={18}/>Invoice records are currently unavailable. Verify database access.</div>}
  {!error&&(data??[]).length===0&&<div className="rounded-2xl border border-[#e5eae8] bg-white p-10 text-center"><Receipt className="mx-auto text-[#9baaa2]" size={32}/><h2 className="mt-3 font-semibold">No invoices in this view</h2><p className="text-sm text-[#718079] mt-1">Invoices appear when a quote is accepted and an invoice is generated.</p><Link href="/quotes" className="inline-flex gap-2 items-center mt-5 font-semibold text-sm text-[#087b68]">Go to quotes <ArrowRight size={16}/></Link></div>}
  {(data??[]).length>0&&<div className="space-y-2"><p className="text-xs text-[#718079]">{count} invoices · Page {page} of {pages}</p>
   {data?.map(inv=><Link href={`/invoices/${inv.id}`} key={inv.id} className="block rounded-xl focus-visible:ring-2 ring-[#087b68]"><Card className="flex gap-3 items-center justify-between hover:border-[#a8d9ca] transition-colors">
     <span className="min-w-0"><span className="block font-semibold text-sm truncate">{inv.invoice_number||"Draft invoice"}</span><span className="block text-xs text-[#718079] truncate mt-1">{(inv.client as unknown as {full_name:string}|null)?.full_name||"Client"} · Due {formatDate(inv.due_date)}</span></span>
     <span className="text-right shrink-0"><span className="font-semibold text-sm block">{formatCents(inv.balance_due_cents)}</span><StatusPill status={inv.status} className="mt-1"/></span>
    </Card></Link>)}
   {pages>1&&<nav aria-label="Invoice pages" className="flex justify-between pt-4 text-sm"><span>{page>1?<Link href={href(page-1)} className="text-[#087b68] font-semibold">← Previous</Link>:"Previous"}</span><span>{page} / {pages}</span><span>{page<pages?<Link href={href(page+1)} className="text-[#087b68] font-semibold">Next →</Link>:"Next"}</span></nav>}
  </div>}
 </div>;
}
