"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { disconnectGoogleCalendarAction, syncConfirmedBookingAction } from "@/lib/actions/bookings-calendar";

export function GoogleDisconnect(){
 const [working,setWorking]=useState(false);const [error,setError]=useState<string|null>(null);const router=useRouter();
 async function disconnect(){
  if(working||!window.confirm("Disconnect Google Calendar? Existing Google events will remain on the calendar."))return;
  setWorking(true);setError(null);
  try{const r=await disconnectGoogleCalendarAction();if(r.error)setError(r.error);else router.refresh();}
  catch(err){setError(err instanceof Error?err.message:"Unable to disconnect");}finally{setWorking(false);}
 }
 return <div className="flex flex-col items-start gap-2">
  <button type="button" className="text-sm underline text-neutral-500" disabled={working} onClick={disconnect}>{working?"Disconnecting…":"Disconnect Google account"}</button>
  {error&&<p role="alert" className="text-sm text-red-700">{error}</p>}
 </div>;
}
export function SyncBookingButton({id}:{id:string}){
 const [working,setWorking]=useState(false);const [message,setMessage]=useState<string|null>(null);const router=useRouter();
 async function sync(){
  if(working)return;setWorking(true);setMessage(null);
  try{const r=await syncConfirmedBookingAction(id);setMessage(r.error??"Synced.");router.refresh();}
  catch(err){setMessage(err instanceof Error?err.message:"Sync failed");}finally{setWorking(false);}
 }
 return <div className="space-y-1"><button type="button" onClick={sync} disabled={working} className="text-xs font-medium border border-teal-200 text-teal-700 bg-white rounded-lg px-3 py-1.5 disabled:opacity-40">{working?"Syncing…":"Sync to Google"}</button>{message&&<p className="text-xs text-neutral-600">{message}</p>}</div>;
}
