"use client";

import Link from "next/link";
import {useEffect,useState} from "react";
import {
  LayoutDashboard,MessagesSquare,Inbox,Users,FileText,Receipt,
  FileSignature,CalendarDays,Settings2,CreditCard,Mail,ScrollText,
  ClipboardList,ChevronDown,Menu,X,LogOut,PanelLeftClose
} from "lucide-react";
import {previewSignOutAction} from "@/lib/actions/temporary-preview-auth";

type Area={id:string;title:string;icon:typeof LayoutDashboard};
type Group={id:string;label:string;items:Area[]};
const groups:Group[]=[
 {id:"overview",label:"Overview",items:[
  {id:"overview",title:"Dashboard",icon:LayoutDashboard}
 ]},
 {id:"clients",label:"Client management",items:[
  {id:"communications",title:"Communications",icon:MessagesSquare},
  {id:"inquiries",title:"Inquiries",icon:Inbox},
  {id:"clients",title:"Clients",icon:Users}
 ]},
 {id:"bookings",label:"Sales & bookings",items:[
  {id:"quotes",title:"Quotes",icon:FileText},
  {id:"invoices",title:"Invoices",icon:Receipt},
  {id:"agreements",title:"Agreements",icon:FileSignature},
  {id:"calendar",title:"Calendar",icon:CalendarDays}
 ]},
 {id:"configuration",label:"Configuration",items:[
  {id:"settings",title:"Business settings",icon:Settings2},
  {id:"payments",title:"Payment settings",icon:CreditCard},
  {id:"email-templates",title:"Email templates",icon:Mail},
  {id:"agreement-templates",title:"Agreement templates",icon:ScrollText},
  {id:"quote-templates",title:"Quote templates",icon:ClipboardList}
 ]}
];

function GroupNav({activeId,close,compact=false}:{activeId:string;close:()=>void;compact?:boolean}){
 const [expanded,setExpanded]=useState<Record<string,boolean>>(
  Object.fromEntries(groups.map(g=>[g.id,true]))
 );
 return <nav aria-label="Studio Office sections" className="space-y-3">
  {groups.map(group=>{
   const active=group.items.some(item=>item.id===activeId);
   const isOpen=expanded[group.id]!==false;
   return <section key={group.id} aria-label={group.label}>
    <button type="button" aria-expanded={isOpen} onClick={()=>setExpanded(old=>({...old,[group.id]:!isOpen}))}
     className={"flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-[11px] font-bold uppercase tracking-widest "+(active?"text-[#087c68]":"text-[#829087]")}>
     {!compact&&<span>{group.label}</span>}
     {compact?<span className="sr-only">{group.label}</span>:<ChevronDown size={14} className={"transition-transform "+(!isOpen?"-rotate-90":"")}/>}
    </button>
    {isOpen&&<div className="space-y-1">
     {group.items.map(item=>{
      const selected=item.id===activeId;
      return <Link key={item.id} href={`/preview/workspace?area=${item.id}`} onClick={close}
       title={compact?item.title:undefined} aria-label={compact?item.title:undefined}
       aria-current={selected?"page":undefined}
       className={"flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition-colors "+(selected?"bg-[#e4f4ed] text-[#087b68] font-semibold":"text-[#536259] hover:bg-[#f3f7f4]")}>
        <item.icon size={18} className="shrink-0"/>
        {!compact&&<span className="truncate">{item.title}</span>}
       </Link>;
     })}
    </div>}
   </section>;
  })}
 </nav>;
}

export function TemporaryStudioShell({selectedId,children}:{selectedId:string;children:React.ReactNode}){
 const [drawerOpen,setDrawerOpen]=useState(false);
 const [collapsed,setCollapsed]=useState(false);
 useEffect(()=>setDrawerOpen(false),[selectedId]);
 useEffect(()=>{
   if(!drawerOpen)return;
   function closeOnEscape(e:KeyboardEvent){if(e.key==="Escape")setDrawerOpen(false);}
   window.addEventListener("keydown",closeOnEscape);
   return ()=>window.removeEventListener("keydown",closeOnEscape);
 },[drawerOpen]);
 const current=groups.flatMap(g=>g.items).find(a=>a.id===selectedId);
 const SidebarContent=({compact=false,close=()=>{}}:{compact?:boolean;close?:()=>void})=><>
  <div className={"border-b border-[#e6ede9] "+(compact?"px-3 py-7":"px-6 py-7")}>
   {!compact&&<><p className="text-[11px] font-bold tracking-[0.22em] text-[#087b67] uppercase">Castaneda Strings</p>
    <h1 className="text-2xl font-semibold text-[#17352a] mt-1">Studio Office</h1>
    <p className="text-xs text-[#788980] mt-2">Temporary review access</p></>}
   {compact&&<div className="flex justify-center text-[#087c68]"><LayoutDashboard size={24}/></div>}
  </div>
  <div className="flex-1 overflow-y-auto px-3 py-5"><GroupNav activeId={selectedId} compact={compact} close={close}/></div>
  <form action={previewSignOutAction} className="p-3 border-t border-[#e6ede9]">
   <button type="submit" aria-label={compact?"Sign out":undefined} title="Sign out"
    className="w-full flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm text-[#617369] hover:bg-neutral-50">
    <LogOut size={17}/>{!compact&&" Sign out"}
   </button>
  </form>
 </>;
 return <div className="cs-admin min-h-screen lg:flex bg-[#f7f8f8]">
   <aside aria-label="Studio Office sidebar" className={"hidden lg:flex flex-col shrink-0 border-r border-[#e3e9e5] bg-white h-screen sticky top-0 transition-[width] duration-200 "+(collapsed?"w-[78px]":"w-[268px]")}>
    <SidebarContent compact={collapsed}/>
   </aside>
   {drawerOpen&&<div className="lg:hidden fixed inset-0 z-50">
    <button type="button" aria-label="Close navigation" className="absolute inset-0 bg-black/45 w-full" onClick={()=>setDrawerOpen(false)}/>
    <aside role="dialog" aria-modal="true" aria-label="Studio Office navigation" className="absolute left-0 top-0 bottom-0 w-[min(320px,88vw)] bg-white shadow-xl flex flex-col">
      <div className="absolute top-4 right-3 z-10"><button type="button" aria-label="Close menu" className="rounded-xl p-2 hover:bg-neutral-100" onClick={()=>setDrawerOpen(false)}><X size={21}/></button></div>
      <SidebarContent close={()=>setDrawerOpen(false)}/>
    </aside>
   </div>}
   <div className="min-w-0 flex-1">
    <header className="sticky top-0 z-30 bg-white border-b border-[#e6ede9] min-h-[68px] flex gap-3 items-center px-4 sm:px-7">
     <button type="button" aria-label="Open navigation menu" aria-expanded={drawerOpen} onClick={()=>setDrawerOpen(true)}
      className="lg:hidden rounded-xl p-2.5 text-[#235448] hover:bg-[#e8f6f0]"><Menu size={22}/></button>
     <button type="button" aria-label={collapsed?"Expand sidebar":"Collapse sidebar"} onClick={()=>setCollapsed(!collapsed)}
      className="hidden lg:inline-flex rounded-xl p-2.5 text-[#235448] hover:bg-[#e8f6f0]"><PanelLeftClose size={21}/></button>
     <div className="min-w-0"><p className="font-semibold text-[#17352a]">{current?.title||"Dashboard"}</p><p className="text-xs text-[#71827a]">Studio Office / Temporary review</p></div>
    </header>
    {children}
   </div>
 </div>;
}
