"use client";
import { useMemo,useState } from "react";
import Link from "next/link";
import { CalendarDays, FileText, Plus, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { formatCents } from "@/lib/currency";
const data=[
 {id:"Q-2303",client:"Jordan Rivera",event:"Wedding ceremony",amount:79500,date:"2026-11-14",status:"draft"},
 {id:"Q-2302",client:"Alex Morgan",event:"Private celebration",amount:70000,date:"2026-11-07",status:"pending"},
 {id:"Q-2301",client:"Taylor Brooks",event:"Wedding reception",amount:120000,date:"2026-11-28",status:"accepted"},
 {id:"Q-2299",client:"Jamie Lee",event:"Proposal experience",amount:42500,date:"2026-10-12",status:"cancelled"},
 {id:"Q-2297",client:"Sam Carter",event:"Corporate event",amount:90000,date:"2026-10-24",status:"declined"},
 {id:"Q-2294",client:"Chris Morgan",event:"Engagement celebration",amount:55000,date:"2026-10-09",status:"expired"}
];
const filters=["All","Draft","Sent","Accepted","Declined","Cancelled","Expired"];
const bookings=[
 {id:"1",date:"2026-10-24",title:"Corporate reception",time:"6:00 PM",location:"Miami Beach",status:"Synced"},
 {id:"2",date:"2026-10-30",title:"Wedding ceremony",time:"4:00 PM",location:"Coral Gables",status:"Not synced"},
 {id:"3",date:"2026-11-07",title:"Private celebration",time:"7:00 PM",location:"Miami",status:"Synced"},
];
export function AdminPreview(){
 const [section,setSection]=useState<"quotes"|"calendar">("quotes");
 const [filter,setFilter]=useState("All");
 const [search,setSearch]=useState("");
 const [month,setMonth]=useState("2026-10");
 const shown=useMemo(()=>data.filter(x=>
   (filter==="All"||filter==="Sent"?filter==="All"||["pending","sent"].includes(x.status):x.status===filter.toLowerCase())
   && [x.id,x.client,x.event].join(" ").toLowerCase().includes(search.toLowerCase())
 ),[filter,search]);
 const first=new Date(`${month}-01T00:00:00Z`),year=first.getUTCFullYear(),m=first.getUTCMonth();
 const count=new Date(Date.UTC(year,m+1,0)).getUTCDate(),offset=first.getUTCDay();
 const cells=Array.from({length:offset+count},(_,index)=>index<offset?null:index-offset+1);
 function move(delta:number){setMonth(new Date(Date.UTC(year,m+delta,1)).toISOString().slice(0,7));}
 return <div className="cs-admin min-h-screen bg-[#f7f8f9] text-neutral-900">
   <div className="max-w-5xl mx-auto px-4 py-5 sm:py-10 space-y-5">
     <div className="flex gap-4 justify-between items-center">
       <div><p className="text-xs uppercase tracking-widest text-teal-700 font-semibold">Castaneda Strings · Design Preview</p><h1 className="text-2xl font-semibold mt-1">Admin</h1></div>
       <Link href="/preview/quotes" className="bg-[#009f87] text-white rounded-xl px-4 py-3 text-sm font-semibold flex items-center gap-1"><Plus size={17}/> New quote</Link>
     </div>
     <p className="text-sm bg-teal-50 border border-teal-100 text-teal-900 p-3 rounded-xl">Sample data only. This page does not read your clients, send emails, or connect Google accounts.</p>
     <nav aria-label="Admin preview sections" className="flex gap-2 border-b border-neutral-200 pb-3">
       <button type="button" onClick={()=>setSection("quotes")} className={`px-4 py-2 rounded-xl flex items-center gap-2 font-semibold text-sm ${section==="quotes"?"bg-teal-100 text-teal-800":"bg-white"}`}><FileText size={17}/> Quotes</button>
       <button type="button" onClick={()=>setSection("calendar")} className={`px-4 py-2 rounded-xl flex items-center gap-2 font-semibold text-sm ${section==="calendar"?"bg-teal-100 text-teal-800":"bg-white"}`}><CalendarDays size={17}/> Calendar</button>
     </nav>
     {section==="quotes"?<section className="space-y-5">
       <div><h2 className="text-xl font-semibold">Quotes</h2><p className="text-neutral-500 text-sm">Track every draft, delivery and client decision.</p></div>
       <div className="relative"><Search size={18} className="absolute top-3 left-3 text-neutral-400"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search quotes or clients" aria-label="Search sample quotes" className="w-full border border-neutral-200 rounded-xl bg-white px-10 py-3 text-sm"/></div>
       <div className="flex gap-2 overflow-x-auto pb-2">{filters.map(label=><button type="button" key={label} onClick={()=>setFilter(label)} className={`rounded-full whitespace-nowrap px-4 py-2 text-sm font-medium ${filter===label?"bg-[#009f87] text-white":"bg-white border border-neutral-200 text-neutral-600"}`}>{label}</button>)}</div>
       {shown.length===0&&<p className="text-sm text-neutral-500">No matching sample quotes.</p>}
       <div className="space-y-3">{shown.map(q=><div key={q.id} className="bg-white rounded-xl border border-neutral-100 p-4 flex flex-wrap gap-3 justify-between items-center">
         <div><p className="font-semibold">{q.id} · {q.client}</p><p className="text-sm text-neutral-500">{q.event} · {q.date}</p></div>
         <div className="text-right"><p className="font-semibold">{formatCents(q.amount)}</p><span className="text-xs rounded-full bg-neutral-100 px-3 py-1 capitalize">{q.status==="pending"?"Sent":q.status}</span></div>
       </div>)}</div>
     </section>:
     <section className="space-y-5">
       <div className="flex flex-wrap gap-3 justify-between items-center">
         <div><h2 className="text-xl font-semibold">Bookings Calendar</h2><p className="text-sm text-neutral-500">Confirmed performances only.</p></div>
         <div className="border border-neutral-200 rounded-xl bg-white p-3 text-sm"><p className="font-semibold">Google Calendar</p><p className="text-neutral-500 text-xs">Not connected in preview</p></div>
       </div>
       <div className="bg-white rounded-xl border border-neutral-200 p-3 sm:p-5">
         <div className="flex justify-between items-center mb-4">
           <button aria-label="Previous month" type="button" onClick={()=>move(-1)}><ChevronLeft/></button>
           <strong>{first.toLocaleDateString("en-US",{month:"long",year:"numeric",timeZone:"UTC"})}</strong>
           <button aria-label="Next month" type="button" onClick={()=>move(1)}><ChevronRight/></button>
         </div>
         <div className="grid grid-cols-7 text-center text-xs text-neutral-500 mb-2">{["S","M","T","W","T","F","S"].map((d,i)=><span key={i}>{d}</span>)}</div>
         <div className="grid grid-cols-7 gap-1">{cells.map((n,i)=>{const key=n?`${month}-${String(n).padStart(2,"0")}`:"";const current=bookings.filter(b=>b.date===key);return <div key={i} className={`min-h-14 sm:min-h-20 rounded-lg p-1 ${n?"bg-neutral-50":""}`}><p className="text-xs text-neutral-500">{n??""}</p>{current.map(b=><div key={b.id} title={b.title} className="rounded bg-teal-100 text-teal-900 text-[10px] p-1 mt-1">{b.title}</div>)}</div>})}</div>
       </div>
       <h3 className="font-semibold">Confirmed performances</h3>
       <div className="space-y-2">{bookings.filter(b=>b.date.startsWith(month)).map(b=><div key={b.id} className="bg-white p-4 rounded-xl border border-neutral-100 flex justify-between gap-4"><div><p className="font-semibold">{b.title}</p><p className="text-sm text-neutral-500">{b.date} · {b.time} · {b.location}</p></div><span className="text-xs text-neutral-500 whitespace-nowrap">{b.status}</span></div>)}</div>
     </section>}
   </div>
 </div>;
}
