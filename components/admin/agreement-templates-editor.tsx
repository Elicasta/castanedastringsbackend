"use client";
import {useState} from "react";
import {updateAgreementTemplateAction,selectDefaultAgreementAction} from "@/lib/actions/agreement-templates";
type Agreement={id:string;name:string;body:string;status:string;is_default:boolean};
export function AgreementTemplatesEditor({initial}:{initial:Agreement[]}){
 const [templates,setTemplates]=useState(initial),[currentId,setCurrentId]=useState(initial[0]?.id||"");
 const [busy,setBusy]=useState(false),[message,setMessage]=useState<string|null>(null);
 const current=templates.find(t=>t.id===currentId);
 function edit(field:"name"|"body",value:string){setTemplates(old=>old.map(t=>t.id===currentId?{...t,[field]:value}:t));setMessage(null);}
 async function save(){if(!current||busy)return;setBusy(true);setMessage(null);
  try{const r=await updateAgreementTemplateAction(current);setMessage(r.error||"Agreement template saved. Existing signed agreements stay unchanged.");}
  catch(e){setMessage(e instanceof Error?e.message:"Save failed");}finally{setBusy(false);}
 }
 async function chooseDefault(){if(!current||busy)return;setBusy(true);setMessage(null);
  try{const r=await selectDefaultAgreementAction(current.id);if(r.error)setMessage(r.error);else{setTemplates(old=>old.map(t=>({...t,is_default:t.id===current.id})));setMessage("Default agreement updated for future quotes.");}}
  catch(e){setMessage(e instanceof Error?e.message:"Update failed");}finally{setBusy(false);}
 }
 if(!current)return <p className="text-neutral-600">Create your first agreement using the form above.</p>;
 return <div className="space-y-4">
  <div className="flex gap-2 overflow-x-auto">{templates.map(t=><button key={t.id} type="button" onClick={()=>{setCurrentId(t.id);setMessage(null)}} className={`text-sm px-3 py-2 rounded-xl border whitespace-nowrap ${t.id===currentId?"border-teal-500 bg-teal-50":"border-neutral-200"}`}>{t.name}{t.is_default?" · Default":""}</button>)}</div>
  <div className="rounded-2xl bg-white border border-neutral-200 p-5 space-y-4">
   <p className="text-sm text-neutral-500">Changes affect only new agreements generated after saving. Previously sent and signed agreements keep their original terms.</p>
   <label className="block text-sm font-medium">Name<input className="block mt-2 w-full p-3 rounded-xl border border-neutral-200" value={current.name} onChange={e=>edit("name",e.target.value)}/></label>
   <label className="block text-sm font-medium">Agreement terms<textarea rows={22} className="block mt-2 w-full p-4 leading-relaxed rounded-xl border border-neutral-200" value={current.body} onChange={e=>edit("body",e.target.value)}/></label>
   <p className="text-xs text-neutral-500">Review payment, cancellation, liability, venue, and cancellation obligations with a qualified Florida attorney before using this with real clients.</p>
   {message&&<p role="status" className="text-sm bg-neutral-50 p-3 rounded-xl">{message}</p>}
   <div className="flex flex-wrap gap-2"><button onClick={save} disabled={busy} type="button" className="rounded-xl bg-[#009f87] text-white px-4 py-3 font-semibold disabled:opacity-40">Save agreement</button><button type="button" disabled={busy||current.is_default} onClick={chooseDefault} className="rounded-xl border border-neutral-300 px-4 py-3 font-semibold disabled:opacity-40">{current.is_default?"Current default":"Use as default"}</button></div>
  </div>
 </div>;
}
