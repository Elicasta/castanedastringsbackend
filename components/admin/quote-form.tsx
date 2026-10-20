"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, ChevronRight, FileText, FolderOpen, Plus, Search, Trash2, X } from "lucide-react";
import { createQuoteAction, updateQuoteDraftAction } from "@/lib/actions/quotes";
import { QuoteEmailComposer } from "@/components/admin/quote-email-composer";
import { createQuoteContactAction, createQuoteProjectAction } from "@/lib/actions/quote-builder";
import { formatCents, dollarsToCents } from "@/lib/currency";
import { quoteSubtotal, quoteTotal, type ItemKind } from "@/lib/quote-builder";
import type { Client, QuoteTemplate } from "@/lib/types";

type Project = { id: string; client_id: string; name: string };
type ExistingQuote = {id:string;client_id:string;cs_project_id?:string|null;updated_at:string;title:string;event_type?:string|null;event_date?:string|null;location_name?:string|null;valid_until?:string|null;notes_to_client?:string|null;internal_notes?:string|null;discount_cents:number;tax_cents:number;auto_create_invoice?:boolean;reminders_enabled?:boolean;reminder_days_before?:number;items:Array<{name:string;description?:string|null;quantity:number;unit_price_cents:number;item_kind?:ItemKind;selection_group?:string|null;range_max_cents?:number|null;taxable?:boolean}>};
type Item = { key: number; name: string; description: string; quantity: string; price: string; range: boolean; rangeMax: string; kind: ItemKind; group: string; taxable: boolean };
const newItem = (key: number, kind: ItemKind = "standard"): Item => ({
 key, name:"", description:"", quantity:"1", price:"", range:false, rangeMax:"", kind, group:"", taxable:false
});
const INPUT = "w-full bg-white border border-neutral-200 rounded-xl px-4 py-3 text-base text-neutral-900 outline-none focus:border-teal-500";
const CARD = "bg-white rounded-xl border border-neutral-100 overflow-hidden";
const ACCENT = "text-[#009f87]";
const CATEGORY_NAMES:Record<string,string>={wedding:"Wedding",private_celebration:"Private Celebrations",corporate:"Corporate & Brand",proposal:"Proposals",lessons:"Lessons"};

export function QuoteForm({clients,templates,projects=[],defaultClientId,defaultInquiryId,defaultEventType,defaultEventDate,defaultLocation,existingQuote,demo=false}:{
 clients:Client[];templates:QuoteTemplate[];projects?:Project[];defaultClientId?:string;defaultInquiryId?:string;defaultEventType?:string|null;defaultEventDate?:string|null;defaultLocation?:string|null;existingQuote?:ExistingQuote;demo?:boolean;
}) {
 const router=useRouter();
 const [step,setStep]=useState(existingQuote?3:defaultClientId?1:0);
 const [clientList,setClientList]=useState(clients);
 const [projectList,setProjectList]=useState(projects);
 const [clientId,setClientId]=useState(existingQuote?.client_id??defaultClientId??"");
 const [projectId,setProjectId]=useState(existingQuote?.cs_project_id??"");
 const [search,setSearch]=useState("");
 const [newClientOpen,setNewClientOpen]=useState(false);
 const [firstName,setFirstName]=useState("");
 const [lastName,setLastName]=useState("");
 const [email,setEmail]=useState("");
 const [newProjectOpen,setNewProjectOpen]=useState(false);
 const [projectName,setProjectName]=useState("");
 const [saving,setSaving]=useState(false);
 const [error,setError]=useState<string|null>(null);
 const [demoResult,setDemoResult]=useState<null|{send:boolean,total:number;client:string;items:number}>(null);
 const [demoEmailOpen,setDemoEmailOpen]=useState(false);
 const [title,setTitle]=useState(existingQuote?.title??"Performance Quote");
 const [items,setItems]=useState<Item[]>(existingQuote?.items.map((i,key)=>({
  key,name:i.name,description:i.description??"",quantity:String(i.quantity),price:(i.unit_price_cents/100).toFixed(2),
  range:i.range_max_cents!=null,rangeMax:i.range_max_cents==null?"":(i.range_max_cents/100).toFixed(2),
  kind:i.item_kind??"standard",group:i.selection_group??"",taxable:i.taxable??false
 }))??[]);
 const [counter,setCounter]=useState(existingQuote?.items.length??0);
 const [editingItem,setEditingItem]=useState<number|null>(null);
 const [showTypePicker,setShowTypePicker]=useState(false);
 const [discount,setDiscount]=useState(String((existingQuote?.discount_cents??0)/100));
 const [tax,setTax]=useState(String((existingQuote?.tax_cents??0)/100));
 const [note,setNote]=useState(existingQuote?.notes_to_client??"");
 const [internalNote,setInternalNote]=useState(existingQuote?.internal_notes??"");
 const [eventType,setEventType]=useState(existingQuote?.event_type??defaultEventType??"");
 const [eventDate,setEventDate]=useState(existingQuote?.event_date??defaultEventDate??"");
 const [venue,setVenue]=useState(existingQuote?.location_name??defaultLocation??"");
 const [expiryEnabled,setExpiryEnabled]=useState(Boolean(existingQuote?.valid_until));
 const [expiry,setExpiry]=useState(existingQuote?.valid_until??"");
 const [reminders,setReminders]=useState(existingQuote?.reminders_enabled??false);
 const [reminderDays,setReminderDays]=useState(String(existingQuote?.reminder_days_before??2));
 const [autoInvoice,setAutoInvoice]=useState(existingQuote?.auto_create_invoice??true);
 const [settingsOpen,setSettingsOpen]=useState(false);

 const client=clientList.find(c=>c.id===clientId);
 const shownClients=clientList.filter(c=>[c.full_name,c.email].join(" ").toLowerCase().includes(search.toLowerCase()));
 const shownProjects=projectList.filter(p=>p.client_id===clientId);
 const pricedItems=items.filter(i=>i.name.trim()).map(i=>({
   name:i.name.trim(),description:i.description,quantity:Number(i.quantity),
   unit_price_cents:dollarsToCents(i.price),item_kind:i.kind,
   selected:i.kind==="standard",selection_group:i.group||null,
   range_max_cents:i.range?dollarsToCents(i.rangeMax):null,taxable:i.taxable
 }));
 const subtotal=quoteSubtotal(pricedItems);
 const total=quoteTotal(pricedItems,dollarsToCents(discount),dollarsToCents(tax));
 const grouped=useMemo(()=>templates.reduce<Record<string,QuoteTemplate[]>>((acc,t)=>{(acc[t.category]??=[]).push(t);return acc;},{}),[templates]);
 const itemBeingEdited=editingItem===null?null:items.find(i=>i.key===editingItem);

 function applyTemplate(t?:QuoteTemplate) {
   if(t){
     setTitle(t.name);
     setItems([{...newItem(counter),name:t.name,description:[t.performance_time,t.description].filter(Boolean).join(" • "),price:(t.price_cents/100).toFixed(2)}]);
     setCounter(c=>c+1);
     setNote(t.includes? "Includes:\n"+t.includes:"");
   } else {setTitle("Performance Quote");setItems([]);setNote("");}
   setStep(3);
 }
 function appendItem(kind:ItemKind){
   const k=counter;setCounter(c=>c+1);setItems(old=>[...old,newItem(k,kind)]);setEditingItem(k);setShowTypePicker(false);
 }
 function patchItem(key:number,patch:Partial<Item>) {setItems(old=>old.map(i=>i.key===key?{...i,...patch}:i));}

 async function createContact(){
   if(saving)return;
   if(demo){
     const name=[firstName.trim(),lastName.trim()].filter(Boolean).join(' ');
     if(!name || !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email.trim())){setError('Enter a name and valid email.');return;}
     const record={id:`demo-contact-${Date.now()}`,first_name:firstName.trim(),last_name:lastName.trim(),full_name:name,email:email.trim()} as Client;
     setClientList(old=>[...old,record]);setClientId(record.id);setProjectId('');setNewClientOpen(false);setError(null);setStep(1);return;
   }
   setSaving(true);setError(null);
   try{
     const result=await createQuoteContactAction({first_name:firstName,last_name:lastName,email});
     if(!result.client){setError(result.error??"Could not save contact.");return;}
     setClientList(old=>old.some(c=>c.id===result.client!.id)?old:[...old,result.client as Client]);
     setClientId(result.client.id);setProjectId("");setNewClientOpen(false);setStep(1);
   }catch(e){setError(e instanceof Error?e.message:"Could not create contact.");}
   finally{setSaving(false);}
 }
 async function createProject(){
   if(demo){
     if(!projectName.trim()){setError('Enter a project name.');return;}
     const project={id:`demo-project-${Date.now()}`,client_id:clientId,name:projectName.trim()};
     setProjectList(old=>[...old,project]);setProjectId(project.id);setNewProjectOpen(false);setError(null);setStep(2);return;
   }
   setSaving(true);setError(null);
   try {
     const result=await createQuoteProjectAction({client_id:clientId,name:projectName});
     if(!result.project){setError(result.error??"Could not create project.");return;}
     setProjectList(old=>[...old,result.project!]);setProjectId(result.project.id);setNewProjectOpen(false);setStep(2);
   }catch(e){setError(e instanceof Error?e.message:"Could not create project.");}
   finally{setSaving(false);}
 }
 function next(){
   setError(null);
   if(step===0 && !clientId){setError("Select or create a contact.");return;}
   if(step===1 && newProjectOpen)return;
   setStep(Math.min(3,step+1));
 }
 async function saveQuote(send:boolean){
   if(saving)return;
   if(items.some(i=>i.name.trim()==="" || !(Number(i.quantity)>0) || !(Number(i.price)>=0) || !Number.isFinite(Number(i.price)))){
     setError("Finish or remove empty items before saving.");return;
   }
   if(items.some(i=>i.range && (i.rangeMax==="" || dollarsToCents(i.rangeMax)<dollarsToCents(i.price)))){setError("Price range maximum must be at least the minimum.");return;}
   if(send && items.length===0){setError("Add an item before sending.");return;}
   if(expiryEnabled && !expiry){setError("Choose the quote expiry date.");return;}
   if(expiryEnabled && expiry < new Date().toISOString().slice(0,10)){setError("Expiry must be today or later.");return;}
   if(dollarsToCents(discount)>subtotal){setError("Discount cannot exceed subtotal.");return;}
   setError(null);
   if(demo){if(send){setDemoEmailOpen(true);}else{setDemoResult({send:false,total,client:client?.full_name??'Sample Client',items:items.length});}return;}
   setSaving(true);
   try{
     const payload={
       client_id:clientId,cs_project_id:projectId||null,inquiry_id:defaultInquiryId||null,
       title:title.trim()||"Performance Quote", event_type:eventType,event_date:eventDate,location_name:venue,
       valid_until:expiryEnabled?expiry:"",reminders_enabled:reminders,reminder_days_before:Number(reminderDays)||2,
       auto_create_invoice:autoInvoice,currency:"usd",
       notes_to_client:note,internal_notes:internalNote,discount_cents:dollarsToCents(discount),
       tax_cents:dollarsToCents(tax),send,
       items:pricedItems
     };
     const result=existingQuote ? await updateQuoteDraftAction(existingQuote.id,existingQuote.updated_at,payload) : await createQuoteAction(payload);
     if(result?.error)setError(result.error);
     else if(result && 'success' in result && result.success){
       const savedId=existingQuote?.id || ('quoteId' in result ? result.quoteId : undefined);
       if(savedId){router.push(send?`/quotes/${savedId}/send`:`/quotes/${savedId}`);router.refresh();}
     }
   }catch(e){setError(e instanceof Error?e.message:"Unable to save quote.");}
   finally{setSaving(false);}
 }

 if(demoEmailOpen)return <QuoteEmailComposer demo recipientName={client?.full_name??"Sample Client"} recipientEmail={client?.email??"sample@example.invalid"} quoteNumber="PREVIEW" onClose={()=>setDemoEmailOpen(false)}/>;

 return <div className="cs-quote-sheet min-h-[75vh] rounded-2xl overflow-hidden -mx-4 sm:mx-0">
   <header className="sticky top-0 z-20 flex items-center justify-between bg-[#f7f7f8] px-5 py-4 border-b border-neutral-200">
     {step===0?<Link href="/quotes" className={ACCENT}>Cancel</Link>:existingQuote?<Link href={`/quotes/${existingQuote.id}`} aria-label="Back to quote" className={ACCENT}><ArrowLeft size={22}/></Link>:
     <button type="button" onClick={()=>{setError(null);setStep(s=>s-1);}} aria-label="Go back" className={ACCENT}><ArrowLeft size={22}/></button>}
     <strong className="text-lg font-semibold">{existingQuote?"Edit Quote":"New Quote"}</strong>
     {step<3?<button type="button" onClick={next} disabled={step===0&&!clientId} className="text-[#009f87] disabled:opacity-30 font-semibold">Next</button>:
     <button type="button" onClick={()=>saveQuote(false)} disabled={saving} className="text-[#009f87] disabled:opacity-40 font-semibold">{saving?"Saving…":existingQuote?"Done":"Create"}</button>}
   </header>
   <div className="px-4 sm:px-7 py-6 space-y-6">
     {demo&&<div className="rounded-xl bg-teal-50 text-teal-800 px-4 py-3 text-sm">Interactive preview. Changes are temporary. Nothing is saved or sent.</div>}
     {demoResult&&<div className="rounded-xl border-2 border-teal-500 bg-white px-5 py-5 space-y-2" role="status"><p className="font-semibold text-teal-800">Quote preview created</p><p className="text-sm text-neutral-600">{demoResult.client} · {demoResult.items} items · {formatCents(demoResult.total)}</p><p className="text-xs text-neutral-500">{demoResult.send?'Email send simulated. No email was sent.':'Draft saved in preview only.'}</p><button type="button" onClick={()=>setDemoResult(null)} className="text-sm font-semibold text-teal-700">Continue editing</button></div>}
     {error&&<div role="alert" className="rounded-xl bg-red-50 text-red-700 p-4 text-sm">{error}</div>}
     <div className="flex gap-1.5 mb-6" aria-label={`Step ${step+1} of 4`}>{[0,1,2,3].map(i=><div key={i} className={`h-1 rounded-full flex-1 ${i<=step?"bg-[#009f87]":"bg-neutral-200"}`}/>)}</div>

     {step===0&&<section className="space-y-5">
       <h2 className="text-2xl font-semibold text-center py-4">Who is the quote for?</h2>
       <div className="relative"><Search className="absolute left-3 top-3.5 text-neutral-400" size={20}/>
         <input className={INPUT+" pl-11"} value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search contacts…" aria-label="Search contacts"/>
       </div>
       <div className={CARD}>
         <button type="button" onClick={()=>setNewClientOpen(true)} className="w-full flex gap-4 items-center px-5 py-4 text-left border-b border-neutral-100 font-semibold"><span className="rounded-full bg-neutral-100 p-2"><Plus/></span>New Contact</button>
         {shownClients.map(c=><button type="button" key={c.id} onClick={()=>{setClientId(c.id);setProjectId("");}} className="w-full px-5 py-4 text-left flex justify-between items-center border-b border-neutral-100 last:border-0">
           <span><b className="block">{c.full_name}</b><small className="text-neutral-500">{c.email}</small></span>
           {clientId===c.id&&<Check className={ACCENT}/>}
         </button>)}
         {shownClients.length===0&&<p className="p-4 text-neutral-500 text-sm">No matching contacts. Create a new contact to continue.</p>}
       </div>
       {newClientOpen&&<div className={CARD+" p-5 space-y-3"}>
         <div className="flex justify-between"><b>New contact</b><button type="button" onClick={()=>setNewClientOpen(false)}><X size={20}/></button></div>
         <input className={INPUT} placeholder="First name" value={firstName} onChange={e=>setFirstName(e.target.value)}/>
         <input className={INPUT} placeholder="Last name" value={lastName} onChange={e=>setLastName(e.target.value)}/>
         <input className={INPUT} type="email" placeholder="Email address" value={email} onChange={e=>setEmail(e.target.value)}/>
         <button type="button" onClick={createContact} disabled={saving} className="bg-[#009f87] text-white rounded-xl px-4 py-3 w-full">{saving?"Saving…":"Create contact"}</button>
       </div>}
     </section>}

     {step===1&&<section className="space-y-5">
       <h2 className="text-2xl font-semibold text-center py-4">Link to Project</h2>
       <p className="text-neutral-500 font-medium">{client?.full_name}&apos;s projects</p>
       <div className={CARD}>
         <button type="button" onClick={()=>setNewProjectOpen(true)} className="w-full flex items-center gap-3 px-5 py-4 font-semibold border-b border-neutral-100"><Plus className={ACCENT}/>New Project</button>
         {shownProjects.map(p=><button key={p.id} type="button" onClick={()=>setProjectId(p.id)} className="w-full flex justify-between items-center text-left px-5 py-4 border-b border-neutral-100"><span className="flex items-center gap-3"><FolderOpen size={20}/>{p.name}</span>{projectId===p.id&&<Check className={ACCENT}/>}</button>)}
         <button type="button" onClick={()=>setProjectId("")} className="w-full flex justify-between px-5 py-4"><span>No Project</span>{!projectId&&<Check className={ACCENT}/>}</button>
       </div>
       {newProjectOpen&&<div className={CARD+" p-5 space-y-3"}>
         <div className="flex justify-between"><b>New project</b><button type="button" onClick={()=>setNewProjectOpen(false)}><X size={20}/></button></div>
         <input className={INPUT} placeholder="Project name" value={projectName} onChange={e=>setProjectName(e.target.value)}/>
         <button type="button" onClick={createProject} disabled={saving||!projectName.trim()} className="bg-[#009f87] text-white rounded-xl px-4 py-3 w-full">Create project</button>
       </div>}
     </section>}

     {step===2&&<section className="space-y-5">
       <h2 className="text-2xl font-semibold text-center py-4">How would you like to start?</h2>
       <button type="button" onClick={()=>applyTemplate()} className={CARD+" flex items-center gap-4 p-5 w-full text-left text-lg"}><FileText/>Blank Quote<ChevronRight className="ml-auto text-neutral-400"/></button>
       <h3 className="text-neutral-500 font-semibold mt-8">Start with a template</h3>
       {Object.entries(grouped).map(([category,arr])=><div key={category} className="space-y-1">
         <p className="text-sm text-neutral-400 pt-3">{CATEGORY_NAMES[category]||category}</p>
         <div className={CARD}>{arr.filter(t=>t.status==="active").map(t=><button key={t.id} type="button" onClick={()=>applyTemplate(t)} className="w-full flex gap-3 p-4 items-center border-b border-neutral-100 last:border-0 text-left"><FileText size={18}/><span className="flex-1">{t.name}</span><span className="text-neutral-500 text-sm">{formatCents(t.price_cents)}</span></button>)}</div>
       </div>)}
       {templates.length===0&&<p className="text-neutral-500">No templates available. Use Blank Quote.</p>}
     </section>}

     {step===3&&<section className="space-y-6">
       <div className={CARD+" p-4 space-y-3"}>
         <label className="block text-xs text-neutral-500">Quote title<input className={INPUT+" mt-1"} value={title} onChange={e=>setTitle(e.target.value)}/></label>
         <div className="flex justify-between text-sm"><span className="text-neutral-500">Billed to</span><b>{client?.full_name}</b></div>
         <div className="flex justify-between text-sm"><span className="text-neutral-500">Project</span><b>{shownProjects.find(p=>p.id===projectId)?.name??"None"}</b></div>
       </div>

       <h3 className="font-semibold text-lg">Items</h3>
       <div className={CARD}>
         {items.length===0?<div className="p-10 text-center text-neutral-400"><FileText size={35} className="mx-auto mb-3"/>Add items to provide an accurate quote.</div>:
         items.map(i=><button type="button" key={i.key} className="w-full text-left p-4 flex justify-between gap-3 border-b border-neutral-100" onClick={()=>setEditingItem(i.key)}>
           <div><b>{i.name||"Untitled item"}</b><small className="text-neutral-500 block">Qty {i.quantity||"1"} · {i.kind==="client_selection"?"Client selection":i.kind==="optional"?"Optional":"Standard"}</small></div><span className="font-medium">{formatCents(dollarsToCents(i.price)*Number(i.quantity||1))}{i.range?" +":""}</span>
         </button>)}
       </div>
       <button type="button" onClick={()=>setShowTypePicker(true)} className={CARD+" w-full p-4 flex items-center justify-between font-semibold "+ACCENT}>Add Item <Plus size={22}/></button>
       <div className={CARD+" divide-y divide-neutral-100"}>
         <div className="flex justify-between p-4"><span>Subtotal</span><strong>{formatCents(subtotal)}</strong></div>
         <div className="flex justify-between p-4 font-semibold"><span>Total</span><strong>{formatCents(total)}</strong></div>
       </div>
       <div className="grid sm:grid-cols-2 gap-3"><label className="text-sm">Discount ($)<input className={INPUT+" mt-1"} inputMode="decimal" type="number" step=".01" min="0" value={discount} onChange={e=>setDiscount(e.target.value)}/></label><label className="text-sm">Tax amount ($)<input className={INPUT+" mt-1"} inputMode="decimal" type="number" step=".01" min="0" value={tax} onChange={e=>setTax(e.target.value)}/></label></div>
       <label className="block text-sm">Note to client<textarea className={INPUT+" mt-2 min-h-24"} value={note} onChange={e=>setNote(e.target.value)} placeholder="Add a note to the quote"/></label>
       <div className={CARD+" p-4 space-y-3"}>
         <button type="button" onClick={()=>setSettingsOpen(!settingsOpen)} className="font-semibold flex justify-between items-center w-full">Quote settings <ChevronRight size={18}/></button>
         {settingsOpen&&<div className="space-y-4 pt-3">
           <label className="flex justify-between gap-2"><span>Auto-create invoice on acceptance</span><input type="checkbox" checked={autoInvoice} onChange={e=>setAutoInvoice(e.target.checked)}/></label>
           <label className="flex justify-between gap-2"><span>Document expiry</span><input type="checkbox" checked={expiryEnabled} onChange={e=>setExpiryEnabled(e.target.checked)}/></label>
           {expiryEnabled&&<input aria-label="Quote expiry date" className={INPUT} type="date" value={expiry} onChange={e=>setExpiry(e.target.value)}/>}
           <label className="flex justify-between gap-2"><span>Email reminders (requires scheduled worker)</span><input type="checkbox" checked={reminders} onChange={e=>setReminders(e.target.checked)}/></label>
           {reminders&&<label className="block text-sm">Remind before expiry (days)<input className={INPUT+" mt-2"} type="number" min="1" max="30" value={reminderDays} onChange={e=>setReminderDays(e.target.value)}/></label>}
           <p className="text-xs text-neutral-500">Currency: USD. Tax is a fixed amount; item taxable flags are for reporting, not automatic tax calculation.</p>
           <label className="block text-sm">Event type<input className={INPUT+" mt-2"} value={eventType} onChange={e=>setEventType(e.target.value)}/></label>
           <label className="block text-sm">Event date<input className={INPUT+" mt-2"} type="date" value={eventDate} onChange={e=>setEventDate(e.target.value)}/></label>
           <label className="block text-sm">Venue<input className={INPUT+" mt-2"} value={venue} onChange={e=>setVenue(e.target.value)}/></label>
           <label className="block text-sm">Internal note<textarea className={INPUT+" mt-2"} value={internalNote} onChange={e=>setInternalNote(e.target.value)}/></label>
         </div>}
       </div>
       <div className="grid grid-cols-2 gap-3"><button type="button" disabled={saving} onClick={()=>saveQuote(false)} className="bg-white border border-neutral-300 rounded-xl p-4 font-semibold">Save draft</button><button type="button" disabled={saving} onClick={()=>saveQuote(true)} className="bg-[#009f87] text-white rounded-xl p-4 font-semibold">Save &amp; send</button></div>
     </section>}
   </div>
   {showTypePicker&&<div className="fixed inset-0 z-50 bg-black/30 flex items-end sm:items-center sm:justify-center" onClick={()=>setShowTypePicker(false)}><div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-lg p-5 space-y-3" onClick={e=>e.stopPropagation()}>
     <div className="flex justify-between text-xl font-semibold">New Item Type<button onClick={()=>setShowTypePicker(false)}><X/></button></div>
     {([["standard","Standard Item"],["client_selection","Client Selection"],["optional","Optional Item"]] as const).map(([k,label])=><button className="block w-full text-left p-4 border-b border-neutral-100" onClick={()=>appendItem(k)} key={k}>{label}</button>)}
   </div></div>}
   {itemBeingEdited&&<div className="fixed inset-0 z-50 bg-black/30 flex items-end sm:items-center sm:justify-center" onClick={()=>setEditingItem(null)}><div className="cs-admin bg-[#f7f7f8] rounded-t-3xl sm:rounded-2xl w-full max-w-lg p-5 max-h-[92dvh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
      <div className="flex justify-between items-center mb-5"><button type="button" className="text-red-500" onClick={()=>{setItems(old=>old.filter(i=>i.key!==itemBeingEdited.key));setEditingItem(null);}}><Trash2 size={20}/></button><b>New Item</b><button type="button" className={ACCENT+" font-semibold"} onClick={()=>{if(!itemBeingEdited.name.trim() || !(Number(itemBeingEdited.quantity)>0) || itemBeingEdited.price==="" ){setError("Complete item name, quantity and price.");return;}setError(null);setEditingItem(null);}}>Done</button></div>
      <div className="space-y-4">
        <label className="block text-sm">Type<select className={INPUT+" mt-2"} value={itemBeingEdited.kind} onChange={e=>patchItem(itemBeingEdited.key,{kind:e.target.value as ItemKind})}><option value="standard">Standard Item</option><option value="client_selection">Client Selection</option><option value="optional">Optional Item</option></select></label>
        <label className="block text-sm">Name<input className={INPUT+" mt-2"} value={itemBeingEdited.name} onChange={e=>patchItem(itemBeingEdited.key,{name:e.target.value})} placeholder="Item name"/></label>
        <label className="block text-sm">Description<textarea className={INPUT+" mt-2 min-h-28"} value={itemBeingEdited.description} onChange={e=>patchItem(itemBeingEdited.key,{description:e.target.value})} placeholder="Item description"/></label>
        <label className="block text-sm">Quantity<input className={INPUT+" mt-2"} value={itemBeingEdited.quantity} onChange={e=>patchItem(itemBeingEdited.key,{quantity:e.target.value})} type="number" min="0.01" step="0.5"/></label>
        {itemBeingEdited.kind==="client_selection"&&<label className="block text-sm">Selection group<input className={INPUT+" mt-2"} value={itemBeingEdited.group} onChange={e=>patchItem(itemBeingEdited.key,{group:e.target.value})} placeholder="Choose one from group"/></label>}
        <label className="flex items-center justify-between">Price range <input type="checkbox" checked={itemBeingEdited.range} onChange={e=>patchItem(itemBeingEdited.key,{range:e.target.checked})}/></label>
        <label className="block text-sm">{itemBeingEdited.range?"Starting price ($)":"Price ($)"}<input className={INPUT+" mt-2"} inputMode="decimal" type="number" step=".01" min="0" value={itemBeingEdited.price} onChange={e=>patchItem(itemBeingEdited.key,{price:e.target.value})}/></label>
        {itemBeingEdited.range&&<label className="block text-sm">Maximum price ($)<input className={INPUT+" mt-2"} type="number" step=".01" min="0" value={itemBeingEdited.rangeMax} onChange={e=>patchItem(itemBeingEdited.key,{rangeMax:e.target.value})}/></label>}
        <label className="flex items-center justify-between">Taxable (reporting only) <input type="checkbox" checked={itemBeingEdited.taxable} onChange={e=>patchItem(itemBeingEdited.key,{taxable:e.target.checked})}/></label>
      </div>
   </div></div>}
 </div>;
}
