"use client";
import {useRef,useState} from "react";
import {sendInboxReplyAction} from "@/lib/actions/inbox-replies";
import {Send} from "lucide-react";
export function InboxReplyComposer({clientId,toEmail,fromEmail,subject:startingSubject,replyToId}:{
 clientId:string;toEmail:string|null;fromEmail:string;subject:string;replyToId:string|null
}){
 const [subject,setSubject]=useState(startingSubject.startsWith("Re:")?startingSubject:`Re: ${startingSubject}`);
 const [body,setBody]=useState(""),[error,setError]=useState<string|null>(null);
 const [success,setSuccess]=useState(false),[busy,setBusy]=useState(false);
 const requestId=useRef<string|null>(null),lock=useRef(false);
 async function send(){
  if(lock.current)return;
  if(!toEmail||!body.trim()||!subject.trim()){setError("A recipient, subject, and message are required.");return;}
  lock.current=true;setBusy(true);setError(null);
  if(!requestId.current)requestId.current=crypto.randomUUID();
  try{
   const r=await sendInboxReplyAction({clientId,requestId:requestId.current,subject,body,replyToId});
   if(r.error){setError(r.error);return;}
   setSuccess(true);setBody("");requestId.current=null;
   window.location.reload();
  }catch(e){setError(e instanceof Error?e.message:"Reply failed");}
  finally{lock.current=false;setBusy(false);}
 }
 return <div className="bg-white rounded-2xl border border-neutral-200 p-4 sm:p-5 space-y-4">
  <h2 className="font-semibold text-lg">Reply</h2>
  <div className="grid gap-2 text-sm">
   <div className="flex gap-3 border-b pb-2"><span className="text-neutral-500 w-12">From</span><span className="font-medium break-all">{fromEmail||"Sender not configured"}</span></div>
   <div className="flex gap-3 border-b pb-2"><span className="text-neutral-500 w-12">To</span><span className="font-medium break-all">{toEmail||"No client email"}</span></div>
   <label className="block">Subject<input className="mt-1 border border-neutral-200 rounded-xl w-full p-3" value={subject} onChange={e=>{setSubject(e.target.value);requestId.current=null}}/></label>
   <label className="block">Message<textarea className="mt-1 border border-neutral-200 rounded-xl w-full p-3 min-h-44" value={body} onChange={e=>{setBody(e.target.value);requestId.current=null}} placeholder="Write a reply to this client..."/></label>
  </div>
  {error&&<p role="alert" className="rounded-xl bg-red-50 text-red-700 p-3 text-sm">{error}</p>}
  {success&&<p role="status" className="rounded-xl bg-teal-50 text-teal-800 p-3 text-sm">Reply accepted by Resend.</p>}
  <button type="button" onClick={send} disabled={busy||!toEmail||!fromEmail||!body.trim()} className="inline-flex gap-2 items-center rounded-xl bg-[#009f87] text-white px-5 py-3 font-semibold text-sm disabled:opacity-40"><Send size={16}/>{busy?"Sending…":"Send reply"}</button>
  <p className="text-xs text-neutral-500">Sent using your verified Resend sender. Incoming replies appear here after Resend receiving and the inbound webhook are configured.</p>
 </div>;
}
