"use client";
import {useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {Pencil} from "lucide-react";
import {beginQuoteRevisionAction} from "@/lib/actions/quote-revisions";
export function ReviseSentQuoteButton({id}:{id:string}){
 const router=useRouter(),busyRef=useRef(false),[busy,setBusy]=useState(false),[error,setError]=useState<string|null>(null);
 async function begin(){
  if(busyRef.current)return;
  if(!window.confirm("Revise this sent quote? The existing client link will stop accepting responses immediately. A new draft and new quote number will be created. You must send the replacement yourself."))return;
  busyRef.current=true;setBusy(true);setError(null);
  try{
   const r=await beginQuoteRevisionAction(id);
   if(r.error){setError(r.error);return;}
   router.push(`/quotes/${r.id}/edit`);router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Could not revise quote.");}
  finally{busyRef.current=false;setBusy(false);}
 }
 return <span className="inline-flex flex-col items-end gap-1"><button type="button" disabled={busy} onClick={begin} className="inline-flex gap-2 items-center px-4 py-2.5 rounded-xl border border-[#009f87] text-[#00856f] font-semibold text-sm disabled:opacity-50"><Pencil size={16}/>{busy?"Preparing…":"Edit"}</button>{error&&<small role="alert" className="text-red-700 max-w-56">{error}</small>}</span>;
}
