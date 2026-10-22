"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { respondToQuotePublicAction } from "@/lib/actions/quotes";
import { quoteTotal } from "@/lib/quote-builder";
import { formatCents } from "@/lib/currency";

type PublicItem = {
 id:string; name:string; description?:string|null;
 item_kind?: "standard"|"optional"|"client_selection";
 selection_group?:string|null; selected?:boolean;
 quantity:number; unit_price_cents:number; range_max_cents?:number|null;
};
export function QuoteResponse({publicId,items,discountCents=0,taxCents=0}:{
  publicId:string;items:PublicItem[];discountCents?:number;taxCents?:number;
}) {
 const router=useRouter();
 const [selected,setSelected]=useState<string[]>([]);
 const [busy,setBusy]=useState<"accepted"|"declined"|null>(null);
 const [error,setError]=useState<string|null>(null);
 const [result,setResult]=useState<{invoicePublicId?:string|null;contractPublicId?:string|null}|null>(null);
 const total=useMemo(()=>quoteTotal(items.map(i=>({
   name:i.name,description:i.description,quantity:i.quantity,unit_price_cents:i.unit_price_cents,
   item_kind:i.item_kind??"standard",selected:(i.item_kind??"standard")==="standard"||selected.includes(i.id)
 })),discountCents,taxCents),[items,selected,discountCents,taxCents]);
 const choices=items.filter(i=>(i.item_kind??"standard")!=="standard");

 function toggle(item:PublicItem){
   if(item.item_kind==="optional"){
     setSelected(previous=>previous.includes(item.id)?previous.filter(id=>id!==item.id):[...previous,item.id]);
   }else{
     const group=item.selection_group?.trim()||"default";
     const groupIds=new Set(choices.filter(i=>i.item_kind==="client_selection"&&(i.selection_group?.trim()||"default")===group).map(i=>i.id));
     setSelected(previous=>[...previous.filter(id=>!groupIds.has(id)),item.id]);
   }
 }
 async function respond(decision:"accepted"|"declined"){
   if(busy)return;
   setBusy(decision);setError(null);
   try {
     const response=await respondToQuotePublicAction(publicId,decision,selected);
     if(response.error){setError(response.error);return;}
     if(decision==="declined"){router.refresh();return;}
     setResult({invoicePublicId:response.invoicePublicId,contractPublicId:response.contractPublicId});
   }catch(e){setError(e instanceof Error?e.message:"Something went wrong. Please try again.");}
   finally{setBusy(null);}
 }
 if(result)return <div className="rounded-2xl bg-brand-light p-5 text-center space-y-3">
   <p className="font-semibold text-brand-dark">Quote accepted</p>
   <p className="text-sm">Your quote has been received. We will send the invoice and performance agreement once they are ready. Your date is not confirmed until the required payment and signed agreement are complete.</p>

 </div>;
 return <div className="space-y-4">
   {choices.length>0&&<div className="rounded-2xl border border-border bg-white p-4 space-y-3">
     <h2 className="font-semibold">Customize your quote</h2>
     <p className="text-xs text-muted">Choose optional services and one item from each selection group.</p>
     {choices.map(item=>{
       const chosen=selected.includes(item.id);
       const group=item.selection_group||"default";
       return <label key={item.id} className="flex gap-3 items-start p-3 rounded-xl border border-neutral-100 cursor-pointer">
         <input type={item.item_kind==="client_selection"?"radio":"checkbox"} name={item.item_kind==="client_selection"?`choice-${group}`:item.id} checked={chosen} onChange={()=>toggle(item)} className="mt-1 accent-teal-600"/>
         <span className="flex-1"><span className="block font-medium text-sm">{item.name}</span>{item.description&&<span className="block text-xs text-muted">{item.description}</span>}</span>
         <span className="text-sm font-semibold">{formatCents(item.quantity*item.unit_price_cents)}</span>
       </label>;
     })}
   </div>}
   <div className="flex justify-between px-3 py-3 border-y border-border font-semibold"><span>Your total</span><span>{formatCents(total)}</span></div>
   {error&&<p role="alert" className="text-sm text-rose-700 bg-rose-50 rounded-xl p-3">{error}</p>}
   <div className="flex gap-2">
     <Button className="flex-1" disabled={!!busy} onClick={()=>respond("accepted")}>{busy==="accepted"?"Accepting…":"Accept quote"}</Button>
     <Button variant="secondary" className="flex-1" disabled={!!busy} onClick={()=>respond("declined")}>{busy==="declined"?"Declining…":"Decline"}</Button>
   </div>
 </div>;
}
