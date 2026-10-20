"use client";

import Link from "next/link";
import {usePathname} from "next/navigation";
import {useEffect,useState} from "react";
import {logoutAction} from "@/lib/actions/auth";
import {cn} from "@/lib/cn";
import {
 LayoutDashboard,MessagesSquare,Inbox,Users,FileText,Receipt,
 FileSignature,CalendarDays,Settings2,CreditCard,Mail,ScrollText,
 ClipboardList,Menu,X,ChevronDown,PanelLeftClose,LogOut,Plus,
 type LucideIcon
} from "lucide-react";

type NavItem={href:string;label:string;icon:LucideIcon;exact?:boolean};
type NavGroup={id:string;label:string;items:NavItem[]};
const navGroups:NavGroup[]=[
 {id:"overview",label:"Overview",items:[
  {href:"/dashboard",label:"Dashboard",icon:LayoutDashboard,exact:true}
 ]},
 {id:"clients",label:"Client management",items:[
  {href:"/communications",label:"Communications",icon:MessagesSquare},
  {href:"/inquiries",label:"Inquiries",icon:Inbox},
  {href:"/clients",label:"Clients",icon:Users}
 ]},
 {id:"sales",label:"Sales & bookings",items:[
  {href:"/quotes",label:"Quotes",icon:FileText},
  {href:"/invoices",label:"Invoices",icon:Receipt},
  {href:"/contracts",label:"Agreements",icon:FileSignature},
  {href:"/calendar",label:"Calendar",icon:CalendarDays}
 ]},
 {id:"settings",label:"Configuration",items:[
  {href:"/settings",label:"Business settings",icon:Settings2,exact:true},
  {href:"/settings/payments",label:"Payment settings",icon:CreditCard},
  {href:"/settings/email-templates",label:"Email templates",icon:Mail},
  {href:"/contracts/templates",label:"Agreement templates",icon:ScrollText},
  {href:"/quotes/templates",label:"Quote templates",icon:ClipboardList}
 ]}
];

function currentItem(path:string,item:NavItem):boolean{
 if(item.exact)return path===item.href;
 if(item.href==="/quotes"&&path.startsWith("/quotes/templates"))return false;
 if(item.href==="/contracts"&&path.startsWith("/contracts/templates"))return false;
 return path===item.href||path.startsWith(item.href+"/");
}

function WorkspaceMenu({path,compact=false,onNavigate=()=>{}}:{
 path:string;compact?:boolean;onNavigate?:()=>void
}){
 const [open,setOpen]=useState<Record<string,boolean>>(
   Object.fromEntries(navGroups.map(g=>[g.id,true]))
 );
 return <nav aria-label="Admin workspaces" className="space-y-3">
  {navGroups.map(g=>{
   const hasActive=g.items.some(item=>currentItem(path,item));
   const expanded=open[g.id]||hasActive;
   return <section key={g.id} aria-label={g.label}>
    <button type="button" aria-expanded={expanded} onClick={()=>setOpen(old=>({...old,[g.id]:!expanded}))}
     className={cn("w-full flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-[11px] font-bold uppercase tracking-widest",hasActive?"text-[#087b68]":"text-[#829087]")}>
     {compact?<span className="sr-only">{g.label}</span>:<span>{g.label}</span>}
     {!compact&&<ChevronDown size={14} className={cn("transition-transform",!expanded&&"-rotate-90")}/>}
    </button>
    {expanded&&<div className="space-y-1">
     {g.items.map(item=>{
      const selected=currentItem(path,item);
      return <Link href={item.href} key={item.href} title={compact?item.label:undefined}
       aria-label={compact?item.label:undefined} aria-current={selected?"page":undefined}
       onClick={onNavigate} className={cn(
        "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13px] transition-colors",
        selected?"bg-[#e4f4ed] text-[#087b68] font-semibold":"text-[#536259] hover:bg-[#f3f7f4]"
       )}>
       <item.icon size={18} className="shrink-0"/>
       {!compact&&<span className="truncate">{item.label}</span>}
      </Link>;
     })}
    </div>}
   </section>;
  })}
 </nav>;
}

function SidebarContent({path,compact=false,close=()=>{}}:{path:string;compact?:boolean;close?:()=>void}){
 return <>
   <div className={cn("border-b border-[#e5eae7]",compact?"px-3 py-7":"px-6 pt-7 pb-6")}>
    {compact?<Link href="/dashboard" aria-label="Studio Office dashboard" className="flex justify-center text-[#087b68]"><LayoutDashboard size={24}/></Link>
     :<Link href="/dashboard" onClick={close} className="block">
       <span className="text-[11px] uppercase tracking-[0.22em] text-[#087b68] font-bold">Castaneda Strings</span>
       <span className="block text-2xl tracking-tight text-[#17352a] font-semibold mt-1">Studio Office</span>
      </Link>}
   </div>
   <div className="flex-1 overflow-y-auto px-3 py-5">
     <WorkspaceMenu path={path} compact={compact} onNavigate={close}/>
   </div>
   <div className="p-3 border-t border-[#e5eae7] space-y-2">
     <Link href="/quotes/new" onClick={close} title={compact?"New quote":undefined}
      aria-label={compact?"New quote":undefined}
      className="flex justify-center items-center gap-2 rounded-xl py-3 px-2 text-sm bg-[#008b77] text-white font-semibold hover:bg-[#007865]">
      <Plus size={18}/>{!compact&&"New quote"}
     </Link>
     <form action={logoutAction}><button type="submit" title="Sign out"
      aria-label={compact?"Sign out":undefined}
      className="flex items-center justify-center gap-2 w-full rounded-xl py-2.5 px-2 text-sm text-[#687c72] hover:bg-neutral-50"><LogOut size={16}/>{!compact&&"Sign out"}</button></form>
   </div>
 </>;
}

export function AdminShell({children}:{children:React.ReactNode}){
 const path=usePathname();
 const [mobileOpen,setMobileOpen]=useState(false);
 const [collapsed,setCollapsed]=useState(false);
 useEffect(()=>setMobileOpen(false),[path]);
 useEffect(()=>{
  if(!mobileOpen)return;
  function onEscape(e:KeyboardEvent){if(e.key==="Escape")setMobileOpen(false);}
  window.addEventListener("keydown",onEscape);
  return ()=>window.removeEventListener("keydown",onEscape);
 },[mobileOpen]);
 const found=navGroups.flatMap(g=>g.items).find(item=>currentItem(path,item));
 const group=navGroups.find(g=>g.items.some(item=>currentItem(path,item)));
 return <div className="cs-admin flex min-h-screen bg-[#f7f8f8]">
  <aside aria-label="Studio Office sidebar" className={cn(
   "hidden lg:flex shrink-0 flex-col sticky top-0 h-screen border-r border-[#e5eae7] bg-white transition-[width] duration-200",
   collapsed?"w-[78px]":"w-[266px]"
  )}>
   <SidebarContent path={path} compact={collapsed}/>
  </aside>
  {mobileOpen&&<div className="lg:hidden fixed inset-0 z-50">
   <button type="button" aria-label="Close navigation" className="absolute inset-0 w-full bg-black/45" onClick={()=>setMobileOpen(false)}/>
   <aside role="dialog" aria-modal="true" aria-label="Studio Office navigation"
     className="absolute top-0 bottom-0 left-0 w-[min(320px,88vw)] flex flex-col bg-white shadow-xl">
    <button type="button" aria-label="Close menu" className="absolute top-4 right-3 z-10 rounded-xl p-2 hover:bg-neutral-50" onClick={()=>setMobileOpen(false)}><X size={21}/></button>
    <SidebarContent path={path} close={()=>setMobileOpen(false)}/>
   </aside>
  </div>}
  <div className="flex-1 min-w-0 min-h-screen flex flex-col">
   <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xl border-b border-[#e5eae7]">
    <div className="min-h-[69px] px-4 sm:px-7 flex items-center gap-3">
     <button type="button" aria-label="Open navigation menu" aria-expanded={mobileOpen}
       onClick={()=>setMobileOpen(true)}
       className="lg:hidden rounded-xl p-2.5 text-[#235448] hover:bg-[#e8f6f0]"><Menu size={22}/></button>
     <button type="button" aria-label={collapsed?"Expand sidebar":"Collapse sidebar"}
       onClick={()=>setCollapsed(!collapsed)}
       className="hidden lg:inline-flex rounded-xl p-2.5 text-[#235448] hover:bg-[#e8f6f0]"><PanelLeftClose size={21}/></button>
     <div className="min-w-0 flex-1">
      <p className="font-semibold text-[#17352a] truncate text-sm sm:text-base">{found?.label||"Studio Office"}</p>
      <p className="text-[11px] text-[#81938a]">{group?.label||"Workspace"}</p>
     </div>
     <Link href="/quotes/new" className="hidden sm:inline-flex items-center gap-2 rounded-xl bg-[#008b77] text-white text-sm font-semibold px-4 py-2.5 hover:bg-[#007865]"><Plus size={17}/>New quote</Link>
    </div>
   </header>
   <main id="workspace-content" className="w-full max-w-[1540px] mx-auto flex-1 px-4 sm:px-7 lg:px-9 pt-7 pb-12">{children}</main>
   <footer className="px-6 py-4 border-t border-[#e5eae7] text-[11px] text-[#81938a]">Castaneda Strings · Studio Office</footer>
  </div>
 </div>;
}
