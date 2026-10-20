"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Clock3, FileText } from "lucide-react";
import { sendComposedQuoteAction } from "@/lib/actions/quote-dispatch";

type Props = {
 quoteId?: string;
 quoteNumber?: string|null;
 recipientName:string;
 recipientEmail:string;
 demo?:boolean;
 cancelHref?:string;
 onClose?:()=>void;
};
export function QuoteEmailComposer({
 quoteId, quoteNumber, recipientName, recipientEmail, demo=false,
 cancelHref="/quotes", onClose
}:Props){
 const router=useRouter();
 const firstName=recipientName.trim().split(/\s+/)[0] || "there";
 const [subject,setSubject]=useState(`Quote #${quoteNumber??"Draft"} from Castaneda Strings`);
 const [body,setBody]=useState(`Hi ${firstName},\n\nPlease take a moment to review your quote. Use the link below to view all the details and respond.\n\nIf you'd like to make any changes, just reply to this email.\n\nThanks,\nCastaneda Strings`);
 const [sendCopy,setSendCopy]=useState(true);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState<string|null>(null);
 const [success,setSuccess]=useState(false);
 async function send(){
  if(busy || success)return;
  if(!subject.trim() || !body.trim()){setError("Subject and message are required.");return;}
  setError(null);
  if(demo){setSuccess(true);return;}
  if(!quoteId){setError("Save the quote first.");return;}
  setBusy(true);
  try{
   const result=await sendComposedQuoteAction({quoteId,subject,body,sendCopy});
   if(result.error){setError(result.error);return;}
   setSuccess(true);
   router.refresh();
  }catch(err){setError(err instanceof Error?err.message:"Could not send your quote.");}
  finally{setBusy(false);}
 }
 if(success)return <div className="cs-admin mx-auto max-w-xl bg-white rounded-2xl p-8 text-center space-y-4">
   <div className="mx-auto w-14 h-14 rounded-full bg-teal-50 text-[#009f87] grid place-items-center text-3xl">✓</div>
   <h2 className="text-2xl font-semibold">{demo?"Email preview completed":"Quote sent"}</h2>
   <p className="text-neutral-600 text-sm">{demo?"No message was sent. This is a sample-data preview.":`Resend accepted the message to ${recipientEmail}. You can review it in Communications.`}</p>
   {demo?<button type="button" onClick={()=>{setSuccess(false);onClose?.();}} className="rounded-xl bg-[#009f87] text-white py-3 px-6">Back to preview</button>:
    <Link href={`/quotes/${quoteId}`} className="inline-block rounded-xl bg-[#009f87] text-white py-3 px-6">View quote</Link>}
 </div>;
 return <div className="cs-admin bg-white rounded-2xl min-h-[77dvh] flex flex-col overflow-hidden max-w-2xl mx-auto border border-neutral-100 shadow-sm">
  <header className="flex justify-between items-center px-5 py-5 bg-white border-b border-neutral-100 gap-3">
    {demo?<button type="button" onClick={onClose} className="text-[#009f87] text-base">Cancel</button>:
     <Link href={cancelHref} className="text-[#009f87] text-base">Cancel</Link>}
    <h1 className="font-semibold text-lg">Send Quote</h1>
    <button type="button" disabled={busy} onClick={send} className="text-[#009f87] disabled:opacity-40 font-semibold text-base">{busy?"Sending…":demo?"Preview Send":"Send"}</button>
  </header>
  {demo&&<p className="px-5 py-3 text-sm text-teal-800 bg-teal-50">Preview mode. Tapping Send will not email anyone.</p>}
  <div className="px-5 flex-1">
    <div className="flex items-center gap-3 py-4 border-b border-neutral-200"><label className="font-semibold text-lg">To:</label>
     <div className="bg-neutral-100 rounded-lg px-3 py-2 text-base">{recipientName}</div>
    </div>
    <p className="pl-10 pb-2 text-sm text-neutral-500">{recipientEmail||"No email address"}</p>
    <div className="flex items-start sm:items-center gap-3 py-4 border-b border-neutral-200">
     <label htmlFor="email-subject" className="font-semibold text-lg">Subject:</label>
     <input id="email-subject" value={subject} maxLength={180} onChange={e=>setSubject(e.target.value)} className="min-w-0 flex-1 text-base focus:outline-none" aria-label="Email subject"/>
    </div>
    <label className="flex justify-between items-center py-5 border-b border-neutral-200 cursor-pointer font-semibold text-lg">Send me a copy
     <input type="checkbox" checked={sendCopy} onChange={e=>setSendCopy(e.target.checked)} className="w-6 h-6 accent-[#009f87]"/>
    </label>
    <textarea aria-label="Email message" value={body} maxLength={12000} onChange={e=>setBody(e.target.value)}
      className="w-full min-h-[42vh] py-6 resize-y outline-none text-lg leading-relaxed text-neutral-900" />
    <div className="rounded-xl bg-neutral-50 border border-neutral-100 px-4 py-3 mb-5 text-sm text-neutral-600 flex items-start gap-2">
      <FileText size={18} className="text-[#009f87] shrink-0 mt-0.5"/>
      <div><b className="text-neutral-800">Quote document attached as a secure link</b>
      <p>We add the actual quote link to the email when it sends. Clients can review and accept it online.</p></div>
    </div>
    {error&&<p role="alert" className="rounded-xl bg-red-50 text-red-700 p-4 mb-5 text-sm">{error}</p>}
  </div>
  <footer className="px-5 py-4 border-t border-neutral-100 flex items-center justify-between gap-3">
    <span className="flex items-center gap-2 text-neutral-500 text-sm"><FileText size={19}/> Quote document</span>
    <span title="Send scheduling is not enabled yet" className="text-neutral-400"><Clock3 size={21}/></span>
  </footer>
 </div>;
}
