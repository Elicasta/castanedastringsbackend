"use client";
import { useState } from "react";
import Link from "next/link";
import { confirmBookingAction } from "@/lib/actions/bookings-calendar";
export function BookingConfirm({quoteId,eventDate,eligible,existingBooking}:{
 quoteId:string;eventDate:string|null;eligible:boolean;existingBooking?:{id:string}|null
}){
 const [date,setDate]=useState(eventDate||"");
 const [start,setStart]=useState("17:00");
 const [end,setEnd]=useState("19:00");
 const [zone,setZone]=useState("America/New_York");
 const [working,setWorking]=useState(false);
 const [error,setError]=useState<string|null>(null);
 const [done,setDone]=useState<string|null>(null);
 if(existingBooking||done)return <div className="text-sm space-y-2">
  <p className="text-teal-700 font-semibold">Booking confirmed</p>
  {done&&<p className="text-neutral-500">{done}</p>}
  <Link href="/calendar" className="text-[#009f87] underline">View calendar</Link>
 </div>;
 if(!eligible)return <p className="text-sm text-neutral-500">Booking confirmation becomes available after quote acceptance, payment, and a signed contract when one exists.</p>;
 async function submit(){
  if(working)return;
  setError(null);setWorking(true);
  try {
   const response=await confirmBookingAction({quoteId,eventDate:date,startTime:start,endTime:end,timeZone:zone});
   if(response.error)setError(response.error);
   else setDone(response.syncMessage||"Booking confirmed.");
  }catch(err){setError(err instanceof Error?err.message:"Unable to confirm booking.");}
  finally{setWorking(false);}
 }
 return <div className="space-y-3">
  <p className="text-sm text-neutral-600">Confirm after payment and agreement are complete. We will check the calendar for conflicts.</p>
  <label className="block text-sm">Performance date<input className="block w-full mt-1 border border-neutral-200 rounded-lg p-2" type="date" value={date} onChange={e=>setDate(e.target.value)}/></label>
  <div className="grid grid-cols-2 gap-2">
   <label className="text-sm">Starts<input aria-label="Performance start time" className="block w-full mt-1 border border-neutral-200 rounded-lg p-2" type="time" value={start} onChange={e=>setStart(e.target.value)}/></label>
   <label className="text-sm">Ends<input aria-label="Performance end time" className="block w-full mt-1 border border-neutral-200 rounded-lg p-2" type="time" value={end} onChange={e=>setEnd(e.target.value)}/></label>
  </div>
  <label className="block text-sm">Time zone<select className="block w-full mt-1 border border-neutral-200 rounded-lg p-2" value={zone} onChange={e=>setZone(e.target.value)}><option value="America/New_York">Eastern</option><option value="America/Chicago">Central</option><option value="America/Denver">Mountain</option><option value="America/Los_Angeles">Pacific</option></select></label>
  {error&&<p role="alert" className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">{error}</p>}
  <button type="button" disabled={working||!date||!start||!end||end<=start} onClick={submit} className="w-full p-3 rounded-xl text-white bg-[#009f87] disabled:opacity-40 font-semibold">{working?"Confirming…":"Confirm booking"}</button>
 </div>;
}
