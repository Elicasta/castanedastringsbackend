"use client";

import Link from "next/link";
import {usePathname,useSearchParams} from "next/navigation";
import {useEffect,useState} from "react";
import {cn} from "@/lib/cn";
import {
  LayoutDashboard, Inbox, FileText, Receipt, FileSignature, Users,
  MessagesSquare, CalendarDays, Settings2, Mail, CreditCard,
  ScrollText, ClipboardList, SlidersHorizontal, Menu, X, ChevronRight,
  Plus, MessageCircle, FolderOpen, type LucideIcon
} from "lucide-react";

type NavItem={href:string;label:string;icon:LucideIcon;exact?:boolean;description?:string};
const operations:NavItem[]=[
 {href:"/dashboard",label:"Overview",icon:LayoutDashboard,exact:true},
 {href:"/communications",label:"Communications",icon:MessagesSquare,description:"Inquiries and client email"},
 {href:"/inquiries",label:"Inquiries",icon:Inbox,description:"New leads"},
 {href:"/quotes",label:"Quotes",icon:FileText,description:"Estimates and approvals"},
 {href:"/invoices",label:"Invoices",icon:Receipt,description:"Billing and collections"},
 {href:"/contracts",label:"Agreements",icon:FileSignature,description:"Contracts and signatures"},
 {href:"/calendar",label:"Calendar",icon:CalendarDays,description:"Confirmed performances"},
 {href:"/clients",label:"Clients",icon:Users,description:"Client directory"}
];
const configuration:NavItem[]=[
 {href:"/settings",label:"Business settings",icon:Settings2,exact:true},
 {href:"/settings/payments",label:"Payment settings",icon:CreditCard},
 {href:"/settings/email-templates",label:"Email templates",icon:Mail},
 {href:"/contracts/templates",label:"Agreement templates",icon:ScrollText},
 {href:"/quotes/templates",label:"Quote templates",icon:ClipboardList}
];
const mobile:NavItem[]=[
 {href:"/dashboard",label:"Home",icon:LayoutDashboard},
 {href:"/communications",label:"Inbox",icon:MessagesSquare},
 {href:"/quotes",label:"Quotes",icon:FileText},
 {href:"/calendar",label:"Calendar",icon:CalendarDays}
];

const sectionMap={
 overview:{
   title:"Overview",subtitle:"Business at a glance",
   tabs:[{href:"/dashboard",label:"Dashboard"},{href:"/inquiries",label:"Open inquiries"},{href:"/quotes?status=draft",label:"Quote drafts"},{href:"/calendar",label:"Bookings"}]
 },
 sales:{
   title:"Sales & bookings",subtitle:"From inquiry to confirmed performance",
   tabs:[{href:"/inquiries",label:"Inquiries"},{href:"/quotes",label:"Quotes"},{href:"/invoices",label:"Invoices"},{href:"/contracts",label:"Agreements"},{href:"/calendar",label:"Calendar"}]
 },
 messages:{
   title:"Communications",subtitle:"Your client inbox and message history",
   tabs:[{href:"/communications?view=inbox",label:"Inbox"},{href:"/communications?view=sent",label:"Sent"},{href:"/communications?view=all",label:"All conversations"},{href:"/clients",label:"Contacts"}]
 },
 clients:{
   title:"Clients",subtitle:"People, events and relationship history",
   tabs:[{href:"/clients",label:"All clients"},{href:"/communications?view=inbox",label:"Conversations"},{href:"/inquiries",label:"Inquiries"}]
 },
 settings:{
   title:"Settings",subtitle:"Your business defaults, payments and reusable documents",
   tabs:[{href:"/settings",label:"Business"},{href:"/settings/payments",label:"Payments"},{href:"/settings/email-templates",label:"Email templates"},{href:"/contracts/templates",label:"Agreements"},{href:"/quotes/templates",label:"Quote templates"}]
 }
} as const;
type Section=keyof typeof sectionMap;
function sectionOf(path:string):Section{
 if(path.startsWith("/settings")||path.startsWith("/contracts/templates")||path.startsWith("/quotes/templates"))return "settings";
 if(path.startsWith("/communications"))return "messages";
 if(path.startsWith("/clients"))return "clients";
 if(path==="/dashboard")return "overview";
 return "sales";
}
function active(path:string,item:NavItem){
 if(item.exact)return path===item.href;
 if(item.href==="/quotes"&&path.startsWith("/quotes/templates"))return false;
 if(item.href==="/contracts"&&path.startsWith("/contracts/templates"))return false;
 return path===item.href||path.startsWith(item.href+"/");
}
function NavRow({item,pathname,onNavigate,compact=false}:{
 item:NavItem;pathname:string;onNavigate?:()=>void;compact?:boolean
}){
 const selected=active(pathname,item);
 return <Link href={item.href} onClick={onNavigate} aria-current={selected?"page":undefined}
  className={cn("group flex items-center gap-3 rounded-xl transition-colors",
   compact?"px-3 py-3 text-sm":"px-3.5 py-2.5 text-[13px]",
   selected?"bg-[#e5f5f0] text-[#087b68] font-semibold":"text-[#495752] hover:bg-neutral-100 hover:text-[#122320]")}>
   <item.icon className="size-[18px] shrink-0" aria-hidden="true"/>
   <span className="flex-1 truncate">{item.label}</span>
   {compact&&<ChevronRight className="size-4 opacity-40"/>}
 </Link>;
}
export function Sidebar(){
 const pathname=usePathname();
 return <aside className="hidden lg:flex lg:w-[266px] lg:shrink-0 lg:flex-col h-screen sticky top-0 border-r border-[#e5eae7] bg-white">
  <div className="px-6 pt-7 pb-6 border-b border-[#eff2f0]">
   <Link href="/dashboard" className="block" aria-label="Castaneda Strings admin home">
    <span className="text-[11px] uppercase font-bold tracking-[0.25em] text-[#087c6a]">Castaneda Strings</span>
    <span className="block text-[22px] tracking-tight font-semibold text-[#172d27] mt-1">Studio Office</span>
   </Link>
  </div>
  <div className="flex-1 overflow-y-auto px-3 py-5">
   <p className="px-3.5 text-[10px] font-bold text-[#8a9690] uppercase tracking-widest mb-2">Workspaces</p>
   <nav aria-label="Workspaces" className="space-y-1">
    {operations.map(item=><NavRow key={item.href} item={item} pathname={pathname}/>)}
   </nav>
   <div className="mt-7 pt-5 border-t border-[#eef0ee]">
    <p className="px-3.5 text-[10px] font-bold text-[#8a9690] uppercase tracking-widest mb-2">Configuration</p>
    <nav aria-label="Configuration" className="space-y-1">
     {configuration.map(item=><NavRow key={item.href} item={item} pathname={pathname}/>)}
    </nav>
   </div>
  </div>
  <div className="p-4 border-t border-[#eff2f0]">
   <Link href="/quotes/new" className="flex items-center justify-center gap-2 w-full rounded-xl bg-[#008b77] text-white py-3 text-sm font-semibold hover:bg-[#007764]"><Plus size={17}/> New quote</Link>
  </div>
 </aside>;
}
export function WorkspaceHeader(){
 const pathname=usePathname(),search=useSearchParams(),section=sectionMap[sectionOf(pathname)];
 return <div className="sticky top-0 z-20 bg-[#f7f8f8]/95 backdrop-blur-xl border-b border-[#e8ecea]">
   <div className="flex items-center justify-between min-h-[65px] px-4 sm:px-7 gap-3">
    <div className="min-w-0"><h2 className="font-semibold text-[15px] text-[#162c26]">{section.title}</h2><p className="hidden sm:block text-xs text-[#77817c]">{section.subtitle}</p></div>
    <Link href="/quotes/new" className="hidden sm:inline-flex gap-2 items-center rounded-xl bg-[#008b77] text-white px-3.5 py-2 text-xs font-semibold hover:bg-[#007764]"><Plus size={15}/> New quote</Link>
   </div>
   <nav aria-label={section.title+" tabs"} className="flex gap-1 px-3 sm:px-6 overflow-x-auto whitespace-nowrap [scrollbar-width:none]">
    {section.tabs.map(tab=>{
      const url=tab.href.split("?"),key=url[0],param=new URLSearchParams(url[1]||"");
      const samePath=pathname===key||(!url[1]&&pathname.startsWith(key+"/"));
      const isActive=section===sectionMap.messages&&key==="/communications"
        ? samePath&&(search.get("view")||"inbox")===param.get("view")
        : samePath;
      return <Link key={tab.href} href={tab.href}
       className={cn("border-b-[3px] px-3.5 py-3 text-[12px] font-semibold transition-colors",
         isActive?"text-[#007965] border-[#008b77]":"text-[#71807a] border-transparent hover:text-[#172d27] hover:border-[#c6d5ce]")}>
       {tab.label}
      </Link>;
    })}
   </nav>
  </div>;
}
export function BottomNav(){
 const pathname=usePathname(),[opened,setOpened]=useState(false);
 useEffect(()=>setOpened(false),[pathname]);
 useEffect(()=>{
  if(!opened)return;
  function esc(e:KeyboardEvent){if(e.key==="Escape")setOpened(false);}
  window.addEventListener("keydown",esc);
  return ()=>window.removeEventListener("keydown",esc);
 },[opened]);
 return <>
  {opened&&<div className="lg:hidden fixed inset-0 z-40 bg-black/50">
    <button aria-label="Close navigation" type="button" className="absolute inset-0 w-full h-full" onClick={()=>setOpened(false)}/>
    <div role="dialog" aria-modal="true" aria-label="All admin workspaces"
     className="absolute bottom-[calc(71px+env(safe-area-inset-bottom))] left-3 right-3 max-h-[75vh] overflow-y-auto rounded-2xl bg-white p-4 shadow-xl">
      <div className="flex justify-between items-center px-2 mb-3"><h2 className="font-semibold text-lg">Workspaces</h2><button aria-label="Close menu" onClick={()=>setOpened(false)} className="p-2"><X size={20}/></button></div>
      <p className="text-[11px] px-3 uppercase tracking-widest text-neutral-500 mb-1">Business</p>
      {operations.map(item=><NavRow key={item.href} item={item} pathname={pathname} compact onNavigate={()=>setOpened(false)}/>)}
      <p className="text-[11px] px-3 uppercase tracking-widest text-neutral-500 mt-4 mb-1">Settings & templates</p>
      {configuration.map(item=><NavRow key={item.href} item={item} pathname={pathname} compact onNavigate={()=>setOpened(false)}/>)}
    </div>
   </div>}
   <nav aria-label="Mobile workspaces" className="lg:hidden fixed z-50 bottom-0 inset-x-0 flex border-t border-[#e1e9e5] bg-white/95 backdrop-blur-xl pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] px-1">
    {mobile.map(item=>{
     const selected=active(pathname,item);
     return <Link href={item.href} aria-current={selected?"page":undefined} key={item.href}
      className={cn("flex-1 flex flex-col gap-1 items-center rounded-xl py-1.5 text-[10px] font-semibold",selected?"text-[#008b77]":"text-[#82918a]")}>
      <item.icon size={20}/>{item.label}
     </Link>;
    })}
    <button type="button" aria-expanded={opened} aria-label="More workspaces" onClick={()=>setOpened(!opened)}
     className={cn("flex-1 flex flex-col gap-1 items-center rounded-xl py-1.5 text-[10px] font-semibold",opened?"text-[#008b77]":"text-[#82918a]")}>
      <Menu size={20}/>More
    </button>
   </nav>
 </>;
}
