"use client";
import {useState} from "react";
import Link from "next/link";
import {Mail,FileText,Receipt,Pencil,Lock,BookText,MessagesSquare,Settings2,CalendarDays,Send,Check,ChevronRight,Copy} from "lucide-react";
import {formatCents} from "@/lib/currency";
import {STANDARD_PERFORMANCE_AGREEMENT} from "@/lib/contracts/standard-agreement";
type View="quotes"|"inbox"|"payments"|"templates"|"agreement";
const views:[View,string,any][]=[["quotes","Quotes",FileText],["inbox","Inbox",Mail],["payments","Payments",Receipt],["templates","Email Templates",MessagesSquare],["agreement","Agreement",BookText]];
const sample=[
 {id:"CS-Q-2303",name:"Jordan Rivera",event:"Wedding Ceremony + Cocktail Hour",date:"2026-11-14",price:79500,status:"pending"},
 {id:"CS-Q-2302",name:"Alex Morgan",event:"Private Celebration",date:"2026-11-07",price:70000,status:"draft"},
 {id:"CS-Q-2301",name:"Taylor Brooks",event:"Wedding Reception",date:"2026-11-28",price:120000,status:"accepted"},
 {id:"CS-Q-2299",name:"Jamie Lee",event:"Proposal",date:"2026-10-12",price:42500,status:"cancelled"}
];
const emails=[
 {key:"quote_sent",name:"Quote email",subject:"Quote {{quote_number}} from Castaneda Strings",body:"Hi {{client_first_name}},\n\nYour quote is ready. Please review the services and selections.\n\nThanks,\nCastaneda Strings"},
 {key:"invoice_sent",name:"Invoice",subject:"Your Castaneda Strings invoice",body:"Hi {{client_first_name}},\n\nYour invoice is ready. Total: {{total}}.\n\n{{invoice_link}}"},
 {key:"quote_reminder",name:"Quote reminder",subject:"Reminder about your quote",body:"Hi {{client_first_name}},\n\nJust checking in regarding your quote.\n\n{{quote_link}}"},
 {key:"payment_reminder",name:"Payment reminder",subject:"Invoice {{invoice_number}} reminder",body:"Hi {{client_first_name}},\n\nYour balance is {{total}}.\n{{invoice_link}}"},
];
export function OfficePreview(){
 const [view,setView]=useState<View>("quotes");
 const [filter,setFilter]=useState("All");
 const [focused,setFocused]=useState<string|null>(null),[editing,setEditing]=useState(false),[revision,setRevision]=useState(false);
 const [zelleEmail,setZelleEmail]=useState("test@zelle.com"),[zellePhone,setZellePhone]=useState(""),[zelleName,setZelleName]=useState("Castaneda Strings"),[savedPayment,setSavedPayment]=useState(false);
 const [templates,setTemplates]=useState(emails),[template,setTemplate]=useState(emails[0].key),[savedTemplate,setSavedTemplate]=useState(false);
 const [agreement,setAgreement]=useState(STANDARD_PERFORMANCE_AGREEMENT),[savedAgreement,setSavedAgreement]=useState(false);
 const [conversation,setConversation]=useState("Jordan"),[reply,setReply]=useState(""),[sentReply,setSentReply]=useState<string[]>([]);
 const [search,setSearch]=useState("");
 const heading="text-lg font-semibold mb-3";
 const input="rounded-xl border border-neutral-200 bg-white p-3 w-full text-sm outline-none focus:border-teal-400";
 const card="rounded-2xl bg-white border border-neutral-200 p-4 sm:p-5";
 const current=sample.find(x=>x.id===focused);
 const currentTemplate=templates.find(t=>t.key===template)!;
 const setTemplateValue=(key:"subject"|"body",value:string)=>{setTemplates(old=>old.map(t=>t.key===template?{...t,[key]:value}:t));setSavedTemplate(false)};
 const name=conversation==="Jordan"?"Jordan Rivera":conversation==="Alex"?"Alex Morgan":"Taylor Brooks";
 return <main className="cs-admin min-h-screen bg-[#f7f8f9] px-4 py-6 sm:py-12 text-neutral-900">
  <div className="max-w-4xl mx-auto space-y-5">
   <div className="flex flex-wrap gap-3 justify-between items-start">
    <div><p className="text-xs tracking-widest font-semibold text-[#00856f] uppercase">Castaneda Strings</p><h1 className="text-2xl font-semibold mt-1">Admin Studio Preview</h1><p className="text-sm text-neutral-500">Quote control, client conversations, payment settings and agreements.</p></div>
    <Link href="/preview/quotes" className="rounded-xl text-white bg-[#009f87] px-4 py-3 font-semibold text-sm">New Quote</Link>
   </div>
   <p className="rounded-xl bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 text-sm">Interactive sample data only. Changes are not saved and emails are not sent. The real admin is protected behind sign-in.</p>
   <nav aria-label="Admin preview sections" className="flex gap-2 overflow-x-auto pb-2">{views.map(([id,label,Icon])=><button key={id} type="button" onClick={()=>{setView(id);setFocused(null);setEditing(false)}} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 font-semibold text-sm whitespace-nowrap ${view===id?"bg-[#009f87] text-white":"bg-white border border-neutral-200 text-neutral-600"}`}><Icon size={17}/>{label}</button>)}</nav>
   {view==="quotes"&&<section className="space-y-4">
     <div className="flex justify-between items-start gap-2"><div><h2 className={heading}>Quote Management</h2><p className="text-sm text-neutral-500">Read-only after sending. Create a revision with a fresh client link to change pricing.</p></div><Link className="text-sm text-[#009f87] font-semibold" href="/preview/client">Client view →</Link></div>
     {!current?<><div className="flex gap-2 overflow-x-auto">{["All","Draft","Sent","Accepted","Declined","Cancelled","Expired"].map(tab=><button key={tab} type="button" onClick={()=>setFilter(tab)} className={`rounded-full px-3.5 py-2 text-sm ${filter===tab?"bg-teal-100 text-teal-900 font-semibold":"bg-white text-neutral-600 border border-neutral-200"}`}>{tab}</button>)}</div>
      <div className="space-y-2">{sample.filter(x=>filter==="All"||(filter==="Sent"?x.status==="pending":x.status===filter.toLowerCase())).map(q=><button type="button" onClick={()=>{setFocused(q.id);setRevision(false)}} key={q.id} className="w-full text-left rounded-xl p-4 bg-white border border-neutral-200 flex justify-between gap-3 items-center"><div><b className="text-sm">{q.id} · {q.name}</b><p className="text-xs text-neutral-500">{q.event} · {q.date}</p></div><div className="text-right"><b className="text-sm">{formatCents(q.price)}</b><p className="text-xs capitalize text-[#00856f]">{q.status==="pending"?"Sent":q.status}</p></div></button>)}</div>
     </>:<div className={card}>
       <div className="flex justify-between items-center gap-3">
         <button type="button" onClick={()=>{setFocused(null);setEditing(false)}} className="text-sm text-[#009f87] font-medium">← Quotes</button>
         {!editing&&<button type="button" className="flex items-center gap-2 text-sm border border-[#009f87] text-[#00856f] font-semibold rounded-xl px-4 py-2" onClick={()=>{if(!revision&&current.status!=="draft"&&!window.confirm("Make a new draft revision? This cancels the previous quote link."))return;setEditing(true);setRevision(true)}}><Pencil size={16}/> Edit</button>}
       </div>
       <div className="text-center py-7 border-b border-neutral-100"><p className="text-xs tracking-wider uppercase text-neutral-500">Quote details</p><h2 className="text-2xl font-semibold mt-2">{revision?current.id+"-REV":current.id}</h2><p className="mt-1 text-sm">{current.name} · {current.event}</p><p className="mt-2 text-xs capitalize text-neutral-500">{revision?"Draft revision":current.status==="pending"?"Sent, awaiting response":current.status}</p></div>
       <div className="space-y-3 py-5">
         <p className="text-sm font-semibold">Event · November 14, 2026</p>
         <p className="text-sm text-neutral-500">Location: Coral Gables, Florida</p>
         <div className="flex justify-between gap-2 text-sm border-b pt-4 pb-4"><div><b>Signature Wedding Collection</b><p className="text-neutral-500 text-xs">Ceremony and cocktail hour. Includes arrival music and custom requests.</p></div><b>{formatCents(current.price)}</b></div>
         <div className="flex justify-between font-semibold text-lg"><span>Total</span><span>{formatCents(current.price)}</span></div>
       </div>
       {!editing?<div className="rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-600 p-4 text-sm flex gap-2"><Lock size={18} className="shrink-0"/>Quote is locked for viewing. A replacement draft is needed to change a sent quote.</div>:
       <div className="rounded-xl bg-teal-50 p-4 space-y-3 text-sm"><p>Replacement draft created in preview. Original quote would be cancelled and retained in history.</p><input aria-label="Quote item title" defaultValue="Signature Wedding Collection" className={input}/><button type="button" className="rounded-xl bg-[#009f87] text-white py-2.5 px-5" onClick={()=>setEditing(false)}>Save draft (demo)</button></div>}
     </div>}
    </section>}
    {view==="payments"&&<section className="space-y-4">
     <h2 className={heading}>Payment Settings</h2>
     <div className={card+" space-y-4"}><p className="text-sm text-neutral-500">Set the verified Zelle recipient clients see on their invoices. This sample is not a real payment destination.</p>
      <label className="block text-sm font-semibold">Zelle email<input value={zelleEmail} type="email" className={input+" mt-2"} onChange={e=>{setZelleEmail(e.target.value);setSavedPayment(false)}}/></label>
      <label className="block text-sm font-semibold">Zelle phone<input value={zellePhone} className={input+" mt-2"} onChange={e=>{setZellePhone(e.target.value);setSavedPayment(false)}} placeholder="Optional phone number"/></label>
      <label className="block text-sm font-semibold">Recipient name<input value={zelleName} className={input+" mt-2"} onChange={e=>{setZelleName(e.target.value);setSavedPayment(false)}}/></label>
      <button type="button" onClick={()=>setSavedPayment(true)} className="bg-[#009f87] text-white rounded-xl py-3 px-5 font-semibold">Save payment settings (demo)</button>
      {savedPayment&&<p role="status" className="text-sm text-teal-800">Preview updated.</p>}
     </div>
     <div className={card+" space-y-2"}><p className="font-semibold">Client invoice payment area</p><p className="text-sm">Pay by Zelle</p><p className="text-sm text-neutral-500">Name: {zelleName||"Not configured"}</p><p className="text-sm text-neutral-500">Email: {zelleEmail||"Not configured"}</p><p className="text-sm text-neutral-500">Phone: {zellePhone||"Not configured"}</p><button type="button" onClick={()=>navigator.clipboard?.writeText(zelleEmail||zellePhone)} className="text-[#00856f] flex items-center gap-2 text-sm font-semibold"><Copy size={16}/>Copy recipient</button></div>
    </section>}
    {view==="templates"&&<section className="space-y-4">
     <h2 className={heading}>Email Templates</h2><div className="flex gap-2 flex-wrap">{templates.map(t=><button key={t.key} type="button" onClick={()=>{setTemplate(t.key);setSavedTemplate(false)}} className={`rounded-full px-4 py-2 text-sm ${t.key===template?"bg-[#009f87] text-white":"border border-neutral-200 bg-white"}`}>{t.name}</button>)}</div>
     <div className={card+" space-y-4"}>
       <label className="block text-sm font-semibold">Subject<input value={currentTemplate.subject} className={input+" mt-2"} onChange={e=>setTemplateValue("subject",e.target.value)}/></label>
       <label className="block text-sm font-semibold">Message<textarea rows={11} value={currentTemplate.body} className={input+" mt-2 leading-relaxed"} onChange={e=>setTemplateValue("body",e.target.value)}/></label>
       <p className="text-xs text-neutral-500">Use variables such as {"{{client_first_name}}"}, {"{{quote_number}}"}, {"{{total}}"}, {"{{invoice_link}}"}. Changes apply to future messages.</p>
       <button type="button" onClick={()=>setSavedTemplate(true)} className="bg-[#009f87] text-white px-5 py-3 rounded-xl font-semibold">Save template (demo)</button>
       {savedTemplate&&<p role="status" className="text-teal-800 text-sm">Sample template saved to this preview only.</p>}
     </div>
    </section>}
    {view==="agreement"&&<section className="space-y-4">
     <h2 className={heading}>Performance Agreement</h2><p className="text-sm text-neutral-500">Comprehensive editable terms for future clients. Existing signed agreements never change when you update the default.</p>
     <div className={card+" space-y-4"}><label className="block text-sm font-semibold">Agreement text<textarea value={agreement} onChange={e=>{setAgreement(e.target.value);setSavedAgreement(false)}} rows={23} className={input+" mt-2 leading-relaxed font-mono text-xs"}/></label>
     <p className="text-xs text-neutral-500">Have a Florida attorney review your payment, cancellation, safety, and liability terms before using these with actual clients.</p>
     <button type="button" className="bg-[#009f87] text-white rounded-xl px-5 py-3 font-semibold" onClick={()=>setSavedAgreement(true)}>Save agreement (demo)</button>
     {savedAgreement&&<p role="status" className="text-teal-800 text-sm">Preview template saved locally.</p>}</div>
    </section>}
    {view==="inbox"&&<section className="space-y-4">
     <div><h2 className={heading}>Communications Inbox</h2><p className="text-sm text-neutral-500">Inquiries and incoming Resend email in one conversation, with direct replies.</p></div>
     <div className="grid sm:grid-cols-[230px_1fr] gap-3 items-start">
      <div className={card+" space-y-2"}>{["Jordan","Alex","Taylor"].map(n=><button key={n} type="button" onClick={()=>{setConversation(n);setReply("")}} className={`text-left p-3 rounded-xl w-full text-sm ${conversation===n?"bg-teal-50 text-teal-900":"hover:bg-neutral-50"}`}><b>{n==="Jordan"?"Jordan Rivera":n==="Alex"?"Alex Morgan":"Taylor Brooks"}</b><p className="text-xs text-neutral-500">{n==="Jordan"?"Wedding inquiry":n==="Alex"?"Questions about timing":"Quote accepted"}</p></button>)}</div>
      <div className={card+" space-y-4"}>
       <div className="pb-3 border-b border-neutral-100"><h3 className="font-semibold">{name}</h3><p className="text-xs text-neutral-500">{conversation.toLowerCase()}@example.invalid</p></div>
       <div className="rounded-xl bg-neutral-50 p-4 text-sm"><p className="text-xs text-neutral-500 mb-2">Received · New Inquiry</p><p>Hi! I’m interested in a live string performance for my upcoming celebration. Could you share availability and package details?</p></div>
       {sentReply.filter(x=>x.startsWith(conversation+":")).map((x,i)=><div key={i} className="bg-teal-50 rounded-xl p-4 text-sm"><p className="text-xs text-teal-800 mb-2">Sent · Demo reply</p>{x.slice(conversation.length+1)}</div>)}
       <div className="border-t pt-4 space-y-3">
        <div className="text-sm"><p><span className="text-neutral-500">From:</span> Castaneda Strings &lt;hello@example.invalid&gt;</p><p><span className="text-neutral-500">To:</span> {conversation.toLowerCase()}@example.invalid</p></div>
        <textarea value={reply} onChange={e=>setReply(e.target.value)} placeholder="Write your reply..." className={input+" min-h-32"}/>
        <button type="button" disabled={!reply.trim()} onClick={()=>{setSentReply(s=>[...s,conversation+":"+reply]);setReply("")}} className="inline-flex gap-2 items-center bg-[#009f87] text-white px-5 py-3 rounded-xl font-semibold disabled:opacity-40"><Send size={16}/>Send reply (demo)</button>
       </div>
      </div>
     </div>
    </section>}
  </div>
 </main>;
}
