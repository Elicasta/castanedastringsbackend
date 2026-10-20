"use client";

import { useState } from "react";
import { ArrowLeft, Check, ChevronRight, CreditCard, FileSignature, FileText, Mail, ShieldCheck } from "lucide-react";
import { formatCents } from "@/lib/currency";

const panels=["Email","Quote","Accepted","Invoice","Agreement"] as const;
type Panel=typeof panels[number];
const BASE=79500,OPTIONAL=35000;
const selections=[{label:"Solo violin",price:0},{label:"Violin & cello duo",price:22500}];
export function ClientJourneyPreview(){
 const [panel,setPanel]=useState<Panel>("Email");
 const [cocktail,setCocktail]=useState(false);
 const [selection,setSelection]=useState(0);
 const [accepted,setAccepted]=useState(false);
 const [declined,setDeclined]=useState(false);
 const [signed,setSigned]=useState(false);
 const [zelle,setZelle]=useState(false);
 const [paid,setPaid]=useState(false);
 const [signer,setSigner]=useState("");
 const [signatureEmail,setSignatureEmail]=useState("");
 const [signatureMode,setSignatureMode]=useState<"type"|"draw">("type");
 const total=BASE+(cocktail?OPTIONAL:0)+selections[selection].price;
 const date="Saturday, November 14, 2026";
 const stages=panels;
 const button="w-full rounded-xl px-5 py-3.5 font-semibold text-sm bg-[#009f87] text-white disabled:opacity-40";
 return <div className="cs-admin mx-auto w-full max-w-3xl px-3 sm:px-6 py-6 text-[#16211e]">
    <div className="mb-5 flex justify-between items-start gap-3">
     <div><p className="text-xs font-semibold text-[#008b76] tracking-[0.16em] uppercase">Castaneda Strings</p><h1 className="font-semibold text-2xl mt-1">Client Experience Preview</h1><p className="text-neutral-500 text-sm mt-1">Sample wedding quote, from delivery to booking requirements.</p></div>
     <div className="rounded-lg bg-teal-50 text-teal-800 text-xs px-3 py-2 font-semibold whitespace-nowrap">Interactive Demo</div>
    </div>
    <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 mb-6 text-sm text-amber-900">
      Everything here is simulated. No client information is accessed, no email is sent, and no payment or signature is recorded.
    </div>
    <nav aria-label="Preview each client screen" className="grid grid-cols-5 gap-1.5 sm:gap-2 mb-5">
      {stages.map((x,i)=><button key={x} onClick={()=>setPanel(x)} className={`py-2 px-1 rounded-lg text-[10px] sm:text-xs font-semibold border ${panel===x?"bg-[#009f87] border-[#009f87] text-white":"bg-white border-neutral-200 text-neutral-600"}`}>{i+1}. {x}</button>)}
    </nav>
    <div className="max-w-xl mx-auto overflow-hidden border border-neutral-200 rounded-2xl shadow-sm bg-white">
    {panel==="Email"&&<>
       <div className="p-5 border-b border-neutral-100 bg-[#f8f9f8] flex items-center gap-3"><Mail size={22} className="text-[#009f87]"/><div><h2 className="font-semibold">Your quote is ready</h2><p className="text-xs text-neutral-500">Inbox preview</p></div></div>
       <div className="p-5 text-sm space-y-2 border-b border-neutral-100"><p><span className="text-neutral-500">From:</span> Castaneda Strings</p><p><span className="text-neutral-500">To:</span> Jordan Rivera</p><p><span className="text-neutral-500">Subject:</span> Quote #2303 from Castaneda Strings</p></div>
       <div className="p-6 sm:p-8 bg-[#f8f7f4]">
        <div className="bg-white rounded-xl border border-neutral-100 overflow-hidden">
          <div className="bg-[#0f6e5e] text-white tracking-widest uppercase font-semibold text-xs p-6">Castaneda Strings</div>
          <div className="p-6 space-y-5 text-sm leading-relaxed"><h3 className="font-semibold text-xl">Quote #2303 from Castaneda Strings</h3>
           <p>Hi Jordan,</p>
           <p>Please take a moment to review your quote. Use the link below to view all the details and respond.</p>
           <p>If you'd like to make changes, just reply to this email.</p>
           <p>Thanks,<br/>Castaneda Strings</p>
           <p>Review and respond to your quote:</p>
           <button type="button" className="text-[#0f6e5e] text-left underline break-words" onClick={()=>setPanel("Quote")}>View your secure quote →</button>
          </div>
          <p className="text-xs p-5 border-t border-neutral-100 text-neutral-500">Castaneda Strings · Live violin for weddings &amp; events</p>
        </div>
       </div>
       <div className="p-5"><button type="button" onClick={()=>setPanel("Quote")} className={button}>Open quote <ChevronRight size={16} className="inline ml-1"/></button></div>
    </>}
    {panel==="Quote"&&<>
       <div className="px-6 pt-8 pb-6 text-center border-b border-neutral-100">
        <p className="text-xs uppercase tracking-widest text-[#0f6e5e] font-semibold">Castaneda Strings</p>
        <h2 className="text-2xl font-semibold mt-2">Signature Wedding Collection</h2>
        <span className="inline-block mt-3 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-medium">{accepted?"Accepted":declined?"Declined":"Awaiting your response"}</span>
       </div>
       <div className="px-5 sm:px-7 py-6 space-y-5">
        <div className="border rounded-xl border-neutral-100 p-4"><h3 className="font-semibold mb-2">Your event</h3><p>Wedding ceremony &amp; reception</p><p className="text-sm text-neutral-500">{date}</p><p className="text-sm text-neutral-500">Coral Gables, Florida</p></div>
        <div className="border rounded-xl border-neutral-100 p-4 space-y-3">
          <h3 className="font-semibold">Included in your quote</h3>
          <div className="flex justify-between gap-2"><div><p className="font-medium text-sm">Signature Wedding Collection</p><p className="text-xs text-neutral-500">Ceremony + cocktail hour performance</p></div><b className="text-sm whitespace-nowrap">{formatCents(BASE)}</b></div>
          <ul className="pl-5 list-disc text-sm text-neutral-600 space-y-1"><li>Guest arrival music</li><li>Ceremony processional and recessional</li><li>Custom song requests</li><li>Performance planning consultation</li></ul>
        </div>
        <div className="border rounded-xl border-neutral-100 p-4 space-y-4">
          <h3 className="font-semibold">Personalize your experience</h3>
          <label className="flex gap-3 cursor-pointer items-start">
           <input type="checkbox" checked={cocktail} onChange={e=>{if(!accepted&&!declined)setCocktail(e.target.checked)}} disabled={accepted||declined} className="w-5 h-5 accent-[#009f87] mt-0.5"/>
           <span className="flex-1"><b className="block text-sm">Extended performance</b><span className="text-xs text-neutral-500">Add more live music to your event</span></span><b className="text-sm">+{formatCents(OPTIONAL)}</b>
          </label>
          <p className="text-xs text-neutral-500 font-semibold uppercase tracking-wide">Choose an ensemble</p>
          {selections.map((x,i)=><label key={x.label} className="flex items-center gap-3 cursor-pointer">
           <input type="radio" name="ensemble" checked={selection===i} disabled={accepted||declined} onChange={()=>setSelection(i)} className="w-5 h-5 accent-[#009f87]"/>
           <span className="flex-1 text-sm">{x.label}</span><b className="text-sm">{x.price?"+"+formatCents(x.price):"Included"}</b>
          </label>)}
        </div>
        <div className="border-t border-neutral-200 pt-3 space-y-2 text-sm">
         <div className="flex justify-between"><span className="text-neutral-500">Included package</span><span>{formatCents(BASE)}</span></div>
         {cocktail&&<div className="flex justify-between"><span className="text-neutral-500">Optional upgrade</span><span>{formatCents(OPTIONAL)}</span></div>}
         {selection===1&&<div className="flex justify-between"><span className="text-neutral-500">Ensemble upgrade</span><span>{formatCents(selections[selection].price)}</span></div>}
         <div className="flex justify-between text-xl font-semibold border-t border-neutral-200 pt-3"><span>Total</span><span>{formatCents(total)}</span></div>
        </div>
        {!accepted&&!declined?<div className="space-y-2"><button type="button" onClick={()=>{setAccepted(true);setPanel("Accepted")}} className={button}>Accept quote</button><button type="button" onClick={()=>setDeclined(true)} className="w-full py-3 border border-neutral-200 rounded-xl font-medium text-sm">Decline quote</button></div>:
        <div className="bg-neutral-50 rounded-xl px-4 py-3 text-center text-sm">Quote {accepted?"accepted":"declined"}. <button type="button" className="underline text-[#008b76]" onClick={()=>{setAccepted(false);setDeclined(false)}}>Reset sample response</button></div>}
       </div>
    </>}
    {panel==="Accepted"&&<div className="px-6 py-10 text-center space-y-5">
       <div className="mx-auto size-14 rounded-full bg-teal-50 grid place-items-center text-[#009f87]"><Check size={28}/></div>
       <h2 className="text-2xl font-semibold">Quote accepted</h2>
       <p className="text-sm text-neutral-600">Thank you, Jordan! We've received your response for {date}.</p>
       <div className="bg-amber-50 p-4 rounded-xl text-left text-sm text-amber-900">
        Your performance date is not fully confirmed yet. The invoice and agreement are created as drafts and must be sent and completed before the admin can confirm the booking.
       </div>
       <div className="space-y-3">
        <button type="button" onClick={()=>setPanel("Invoice")} className={button}>See sample invoice <ChevronRight size={16} className="inline"/></button>
        <button type="button" onClick={()=>setPanel("Agreement")} className="w-full rounded-xl border border-neutral-200 px-4 py-3.5 font-semibold text-sm">See sample agreement</button>
       </div>
       <p className="text-xs text-neutral-500">In the current implementation, these documents aren't payable or signable until their statuses are advanced by the admin.</p>
    </div>}
    {panel==="Invoice"&&<div className="px-5 sm:px-7 py-7 space-y-5">
       <div className="text-center"><p className="text-xs text-[#0f6e5e] uppercase font-semibold tracking-widest">Castaneda Strings</p><h2 className="text-2xl font-semibold mt-2">Invoice #INV-2303</h2><span className="inline-block text-xs bg-neutral-100 rounded-full px-3 py-1 mt-2">Example of a payable invoice</span></div>
       <div className="border border-neutral-200 rounded-xl p-4 space-y-3">
        <div className="flex justify-between gap-2 text-sm"><span>Signature Wedding Collection</span><b>{formatCents(BASE)}</b></div>
        {cocktail&&<div className="flex justify-between gap-2 text-sm"><span>Extended performance</span><b>{formatCents(OPTIONAL)}</b></div>}
        {selection===1&&<div className="flex justify-between gap-2 text-sm"><span>Violin &amp; cello duo</span><b>{formatCents(selections[selection].price)}</b></div>}
        <div className="flex justify-between gap-2 text-sm border-t pt-3"><span>Total</span><b>{formatCents(total)}</b></div>
        <div className="flex justify-between gap-2 text-sm"><span>Paid</span><b>{paid?formatCents(total):formatCents(0)}</b></div>
        <div className="flex justify-between gap-2 border-t pt-3 text-lg font-semibold"><span>Balance due</span><span>{paid?formatCents(0):formatCents(total)}</span></div>
       </div>
       {paid?<div className="bg-teal-50 text-teal-800 p-4 rounded-xl text-sm">Sample payment marked complete. No charge was made.</div>:<>
        <button type="button" onClick={()=>setPaid(true)} className={button}><CreditCard size={16} className="inline mr-2"/>Simulate card payment</button>
        <div className="border rounded-xl border-neutral-200 p-4 space-y-2"><h3 className="font-semibold text-sm">Or pay with Zelle</h3><p className="text-xs text-neutral-500">Payment instructions will appear when configured by the admin.</p><button type="button" className="border rounded-lg px-3 py-2 text-sm w-full" onClick={()=>setZelle(true)}>{zelle?"Payment notification simulated":"Simulate “I sent payment via Zelle”"}</button></div>
       </>}
       <p className="text-xs text-neutral-500">This is a simulated screen. Stripe and Zelle are not called.</p>
    </div>}
    {panel==="Agreement"&&<div className="px-5 sm:px-7 py-7 space-y-5">
       <div className="text-center"><p className="text-xs text-[#0f6e5e] uppercase tracking-widest font-semibold">Castaneda Strings</p><h2 className="text-2xl font-semibold mt-2">Performance Agreement</h2><span className="inline-block text-xs bg-neutral-100 rounded-full px-3 py-1 mt-2">Example of an agreement ready for signature</span></div>
       <div className="border border-neutral-200 rounded-xl p-4 text-sm space-y-3"><h3 className="font-semibold">Performance details</h3><p>Client: Jordan Rivera</p><p>Date: {date}</p><p>Location: Coral Gables, Florida</p><p>Selected services: {formatCents(total)}</p><p className="text-neutral-500 text-xs">Actual terms are populated from your saved contract template. This example does not contain legal terms.</p></div>
       {signed?<div className="bg-teal-50 text-teal-800 p-4 rounded-xl"><ShieldCheck className="inline mr-2" size={18}/>Example signature recorded on this screen only.</div>:<div className="space-y-3">
        <label className="block text-sm font-medium">Full legal name<input className="block w-full border rounded-xl p-3 mt-1" value={signer} onChange={e=>setSigner(e.target.value)} placeholder="Jordan Rivera"/></label>
        <label className="block text-sm font-medium">Email<input className="block w-full border rounded-xl p-3 mt-1" type="email" value={signatureEmail} onChange={e=>setSignatureEmail(e.target.value)} placeholder="jordan@example.com"/></label>
        <div className="grid grid-cols-2 gap-2 text-sm"><button type="button" onClick={()=>setSignatureMode("type")} className={`py-2 rounded-xl ${signatureMode==="type"?"bg-teal-50 text-teal-800":"bg-neutral-100"}`}>Typed signature</button><button type="button" onClick={()=>setSignatureMode("draw")} className={`py-2 rounded-xl ${signatureMode==="draw"?"bg-teal-50 text-teal-800":"bg-neutral-100"}`}>Draw signature</button></div>
        {signatureMode==="draw"&&<p className="bg-neutral-50 p-3 rounded-xl text-xs text-neutral-500">The real agreement includes a touch signature canvas. The demo uses a typed acknowledgement.</p>}
        {signatureMode==="type"&&signer&&<p className="text-3xl italic py-3 text-center" style={{fontFamily:"Georgia,serif"}}>{signer}</p>}
        <button type="button" className={button} disabled={signer.trim().length<2||!signatureEmail.includes("@")} onClick={()=>setSigned(true)}><FileSignature className="inline mr-2" size={16}/>Simulate signature</button>
       </div>}
       <p className="text-xs text-neutral-500">This preview doesn't create a legal agreement or persist any signature.</p>
    </div>}
    </div>
    <div className="max-w-xl mx-auto flex justify-between items-center gap-3 mt-5">
      <button type="button" className="inline-flex items-center gap-2 text-sm text-neutral-600" onClick={()=>setPanel(stages[Math.max(0,stages.indexOf(panel)-1)])} disabled={panel==="Email"}><ArrowLeft size={16}/> Previous</button>
      <span className="text-xs text-neutral-500">Step {stages.indexOf(panel)+1} of {stages.length}</span>
      <button type="button" className="inline-flex items-center gap-2 text-sm text-[#009f87] font-semibold" onClick={()=>setPanel(stages[Math.min(stages.length-1,stages.indexOf(panel)+1)])} disabled={panel==="Agreement"}>Next <ChevronRight size={16}/></button>
    </div>
 </div>;
}
