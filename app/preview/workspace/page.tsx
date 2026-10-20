import Link from "next/link";
import {redirect} from "next/navigation";
import {
  LayoutDashboard,MessagesSquare,Inbox,FileText,Receipt,FileSignature,
  CalendarDays,Users,Settings2,LogOut,Database,ArrowUpRight,ShieldAlert
} from "lucide-react";
import {hasPreviewSession,previewLoginEnabled} from "@/lib/temporary-preview-auth";
import {previewSignOutAction} from "@/lib/actions/temporary-preview-auth";

export const dynamic="force-dynamic";
export const metadata={title:"Castaneda Strings | Temporary Studio Workspace"};
const areas=[
  {id:"overview",title:"Overview",subtitle:"Business dashboard",icon:LayoutDashboard,
   description:"Real overview will show active inquiries, quote drafts, invoice balances, and confirmed bookings."},
  {id:"communications",title:"Communications",subtitle:"Client inbox and replies",icon:MessagesSquare,
   description:"Real conversations are backed by website inquiries and Resend inbound email. Connect Supabase and receiving webhooks to activate."},
  {id:"inquiries",title:"Inquiries",subtitle:"New leads",icon:Inbox,
   description:"Incoming requests, statuses, and links to quote creation will appear when the database is connected."},
  {id:"quotes",title:"Quotes",subtitle:"Create and send quotes",icon:FileText,
   description:"Quote creation, revision locking, email drafts and client acceptance are implemented in the authenticated admin but need Supabase."},
  {id:"invoices",title:"Invoices",subtitle:"Payment management",icon:Receipt,
   description:"Invoice balances, Zelle details, payment verification and Stripe checkout require a connected database and verified payments configuration."},
  {id:"agreements",title:"Agreements",subtitle:"Contracts and e-signatures",icon:FileSignature,
   description:"Editable agreements, template selection and client signing will be available when the real backend is connected."},
  {id:"calendar",title:"Calendar",subtitle:"Confirmed performances",icon:CalendarDays,
   description:"Confirmed bookings and Google Calendar sync require the database and Google OAuth credentials."},
  {id:"clients",title:"Clients",subtitle:"Contact directory",icon:Users,
   description:"The clients directory will read real contact data after Supabase is linked."},
  {id:"settings",title:"Settings",subtitle:"Payment and document templates",icon:Settings2,
   description:"Payment settings, email templates and contract defaults can be saved after your Supabase project is configured."}
] as const;
export default function TemporaryWorkspace({searchParams}:{searchParams:{area?:string}}){
  if(!previewLoginEnabled()||!hasPreviewSession())redirect("/preview/access");
  const selected=areas.find(a=>a.id===searchParams.area)||areas[0];
  const Icon=selected.icon;
  return <div className="cs-admin min-h-screen lg:flex bg-[#f7f8f8]">
    <aside className="hidden lg:flex flex-col w-[262px] shrink-0 border-r border-[#e3e9e5] bg-white min-h-screen sticky top-0 h-screen">
      <div className="px-6 py-7 border-b border-[#e6ede9]">
        <p className="text-[11px] font-bold tracking-[0.22em] text-[#087b67] uppercase">Castaneda Strings</p>
        <h1 className="text-2xl font-semibold text-[#17352a] mt-1">Studio Office</h1>
        <p className="text-xs text-[#788980] mt-2">Temporary access</p>
      </div>
      <nav aria-label="Temporary workspaces" className="flex-1 overflow-y-auto px-3 py-5 space-y-1">
        {areas.map(area=><Link href={`/preview/workspace?area=${area.id}`} key={area.id}
          className={`flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium ${selected.id===area.id?"bg-[#e5f5f0] text-[#087b68]":"text-[#495752] hover:bg-neutral-50"}`}>
          <area.icon size={18}/>{area.title}</Link>)}
      </nav>
      <form action={previewSignOutAction} className="p-4 border-t border-[#e6ede9]"><button type="submit" className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-600"><LogOut size={17}/> Sign out</button></form>
    </aside>
    <main className="flex-1 min-w-0 pb-32 lg:pb-10">
      <div className="px-5 sm:px-8 py-6 bg-white border-b border-[#e6ede9] flex justify-between items-center gap-3">
        <div><h2 className="text-xl font-semibold text-[#17352a]">{selected.title}</h2><p className="text-xs text-neutral-500 mt-1">{selected.subtitle}</p></div>
        <form action={previewSignOutAction} className="lg:hidden"><button type="submit" className="text-sm text-[#087b68] font-medium">Sign out</button></form>
      </div>
      <div className="max-w-5xl mx-auto p-5 sm:p-8 space-y-6">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex gap-3 items-start text-sm text-amber-900">
          <ShieldAlert size={19} className="shrink-0"/>
          <div><strong>Temporary preview session</strong><p className="mt-1">You are signed in to a restricted workspace preview, not the live Supabase admin. No real data, saving, emails, contracts, or payments are available in this mode.</p></div>
        </div>
        <div className="rounded-2xl border border-[#e4eae6] bg-white p-6 sm:p-10">
          <div className="flex items-center gap-3">
            <span className="p-3 rounded-xl bg-[#e5f5f0] text-[#087b68]"><Icon size={24}/></span>
            <div><h3 className="text-xl font-semibold">{selected.title} workspace</h3><p className="text-sm text-neutral-500">{selected.subtitle}</p></div>
          </div>
          <p className="text-neutral-600 text-sm leading-relaxed mt-6">{selected.description}</p>
          <div className="mt-7 border border-dashed border-[#d5dfd9] rounded-xl p-7 text-center">
            <Database className="mx-auto text-[#8ba99a]" size={30}/>
            <p className="font-semibold mt-3">Awaiting Supabase connection</p>
            <p className="text-sm text-[#718179] mt-1">No connected records. We'll enable this workspace after the Castaneda Strings database and owner account are configured.</p>
          </div>
        </div>
        <div className="rounded-xl bg-white border border-[#e4eae6] p-5 flex flex-wrap justify-between gap-3 items-center">
          <div><p className="font-semibold text-sm">Next step: link your Supabase project</p><p className="text-neutral-500 text-sm mt-1">Locate the project reference in Supabase, then send it here to finish real admin setup.</p></div>
          <span className="text-xs text-[#087b68] font-semibold inline-flex gap-1 items-center">Database required<ArrowUpRight size={16}/></span>
        </div>
      </div>
    </main>
    <nav aria-label="Preview workspace selection" className="lg:hidden fixed z-40 bottom-0 inset-x-0 bg-white border-t border-[#e3e9e5] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <label className="block text-xs text-[#698378] font-semibold mb-2" htmlFor="workspace-areas">Select workspace</label>
      <div className="flex gap-2 overflow-x-auto">
      {areas.map(a=><Link key={a.id} href={`/preview/workspace?area=${a.id}`} className={`text-xs font-semibold shrink-0 px-3.5 py-2.5 rounded-xl ${selected.id===a.id?"bg-[#008b77] text-white":"bg-[#f2f6f3] text-neutral-700"}`}>{a.title}</Link>)}
      </div>
    </nav>
  </div>;
}
