"use client";
import {useState} from "react";
import {saveEmailTemplateAction} from "@/lib/actions/email-template-settings";
import {ALLOWED_MERGE_FIELDS,EMAIL_LABELS,type ManagedEmailKey} from "@/lib/email/managed-templates";
type Template={template_key:ManagedEmailKey;subject:string;body:string};
export function EmailTemplateManager({initial}:{initial:Template[]}){
 const [templates,setTemplates]=useState(initial);
 const [key,setKey]=useState<ManagedEmailKey>("quote_sent");
 const [busy,setBusy]=useState(false),[message,setMessage]=useState<string|null>(null);
 const current=templates.find(t=>t.template_key===key)!;
 function update(partial:Partial<Template>){setTemplates(list=>list.map(t=>t.template_key===key?{...t,...partial}:t));setMessage(null);}
 async function save(){if(busy)return;setBusy(true);setMessage(null);
  try{const r=await saveEmailTemplateAction(current);setMessage(r.error??"Template saved for future emails.");}
  catch(e){setMessage(e instanceof Error?e.message:"Could not save template.");}finally{setBusy(false);}
 }
 return <div className="space-y-5">
  <div className="flex flex-wrap gap-2">{(Object.keys(EMAIL_LABELS) as ManagedEmailKey[]).map(k=>
   <button key={k} type="button" onClick={()=>{setKey(k);setMessage(null)}} className={`rounded-full px-4 py-2 text-sm font-medium ${key===k?"bg-[#009f87] text-white":"bg-white border border-neutral-200"}`}>{EMAIL_LABELS[k]}</button>
  )}</div>
  <div className="bg-white border border-neutral-200 rounded-2xl p-5 space-y-4">
   <p className="text-sm text-neutral-500">Editing {EMAIL_LABELS[key]}. Changes apply to future messages only.</p>
   <label className="block text-sm font-medium">Subject<input value={current.subject} maxLength={200} onChange={e=>update({subject:e.target.value})} className="mt-2 block w-full border border-neutral-200 rounded-xl p-3"/></label>
   <label className="block text-sm font-medium">Message body<textarea value={current.body} onChange={e=>update({body:e.target.value})} rows={12} maxLength={12000} className="mt-2 block w-full border border-neutral-200 rounded-xl p-3 leading-relaxed"/></label>
   <details className="text-sm text-neutral-500"><summary className="cursor-pointer font-medium text-neutral-800">Available personalization fields</summary><p className="mt-2 break-words">{ALLOWED_MERGE_FIELDS.map(s=>`{{${s}}}`).join(" · ")}</p></details>
   {key==="quote_sent"&&<p className="text-xs text-teal-700">A secure quote link is appended automatically when you send, so the client never receives a quote email without its link.</p>}
   <p className="text-xs text-neutral-500">Reminders use these templates only when manually triggered or when a scheduler is configured. Saving a template does not turn on automatic email delivery.</p>
   {message&&<p role="status" className={`rounded-xl p-3 text-sm ${message.startsWith("Template saved")?"bg-teal-50 text-teal-800":"bg-red-50 text-red-700"}`}>{message}</p>}
   <button type="button" disabled={busy} onClick={save} className="w-full rounded-xl bg-[#009f87] text-white py-3 font-semibold disabled:opacity-50">{busy?"Saving…":"Save template"}</button>
  </div>
 </div>;
}
