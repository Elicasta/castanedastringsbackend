import {redirect} from "next/navigation";
import {Database,ArrowUpRight,ShieldAlert,PlugZap,LockKeyhole} from "lucide-react";
import {hasPreviewSession,previewLoginEnabled} from "@/lib/temporary-preview-auth";
import {TemporaryStudioShell} from "@/components/preview/temporary-studio-shell";

export const dynamic="force-dynamic";
export const metadata={title:"Castaneda Strings | Temporary Studio Workspace"};
const areas=[
 {id:"overview",title:"Dashboard",subtitle:"Business overview",
  description:"See new inquiries, quotes needing review, payments to collect, and upcoming confirmed performances."},
 {id:"communications",title:"Communications",subtitle:"Client inbox and replies",
  description:"Read incoming client inquiries and email conversations, then reply from your Resend sender address."},
 {id:"inquiries",title:"Inquiries",subtitle:"Leads and new event requests",
  description:"Review website inquiries, record event details, track responses, and build quotes from new leads."},
 {id:"clients",title:"Clients",subtitle:"Contacts and relationship history",
  description:"Find client records, contact information, related quotes, agreements, and complete conversations."},
 {id:"quotes",title:"Quotes",subtitle:"Estimates and approvals",
  description:"Create quotes, save drafts, compose outgoing email, inspect sent versions, and prepare revisions."},
 {id:"invoices",title:"Invoices",subtitle:"Billing and payment follow-ups",
  description:"Review invoices, send payment requests, and track Zelle or Stripe payment status."},
 {id:"agreements",title:"Agreements",subtitle:"Contracts and signatures",
  description:"Manage performance agreements, send for signature, and track client responses."},
 {id:"calendar",title:"Calendar",subtitle:"Confirmed performances",
  description:"See your performance schedule and sync eligible confirmed bookings to Google Calendar."},
 {id:"settings",title:"Business settings",subtitle:"Business identity and preferences",
  description:"Edit company contact information, payment defaults, and other operating preferences."},
 {id:"payments",title:"Payment settings",subtitle:"Zelle and invoice preferences",
  description:"Manage your Zelle recipient email, phone, display name and default invoice due date."},
 {id:"email-templates",title:"Email templates",subtitle:"Quotes, invoices, and reminders",
  description:"Edit reusable email subjects, personalized message bodies, and reminder templates."},
 {id:"agreement-templates",title:"Agreement templates",subtitle:"Performance terms",
  description:"Edit your standard performance agreement and set the version used for future bookings."},
 {id:"quote-templates",title:"Quote templates",subtitle:"Packages and pricing",
  description:"Maintain reusable performance packages, line items, optional upgrades and starting rates."}
] as const;

export default function TemporaryWorkspace({searchParams}:{searchParams:{area?:string}}){
 if(!previewLoginEnabled()||!hasPreviewSession())redirect("/preview/access");
 const selected=areas.find(item=>item.id===searchParams.area)||areas[0];
 return <TemporaryStudioShell selectedId={selected.id}>
  <main className="max-w-5xl mx-auto p-5 sm:p-8 space-y-6">
   <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex gap-3 items-start text-sm text-amber-900">
    <ShieldAlert size={19} className="shrink-0"/>
    <div><strong>Temporary review access</strong><p className="mt-1">You can explore the admin navigation, but live data, saving, emails and payments remain disabled until we connect the Castaneda Strings database.</p></div>
   </div>
   <div className="rounded-2xl border border-[#e4eae6] bg-white p-6 sm:p-10">
    <p className="text-xs font-semibold uppercase tracking-widest text-[#087b68]">{selected.subtitle}</p>
    <h1 className="text-2xl font-semibold text-[#17352a] mt-2">{selected.title}</h1>
    <p className="text-neutral-600 text-sm leading-relaxed mt-4">{selected.description}</p>
    <div className="mt-8 border border-dashed border-[#d5dfd9] rounded-xl p-7 text-center">
      <Database className="mx-auto text-[#8ba99a]" size={30}/>
      <h2 className="font-semibold mt-3">Waiting for Supabase</h2>
      <p className="text-sm text-[#718179] mt-1 max-w-lg mx-auto">This workspace is implemented in the real admin but cannot load or save actual client records until we connect its database.</p>
    </div>
   </div>
   <div className="rounded-xl bg-white border border-[#e4eae6] p-5 flex flex-wrap justify-between gap-3 items-center">
     <div><p className="font-semibold text-sm">Activate your workspaces</p><p className="text-neutral-500 text-sm mt-1">Share the Castaneda Strings Supabase project reference when you find it.</p></div>
     <span className="text-xs text-[#087b68] font-semibold inline-flex gap-1 items-center"><PlugZap size={16}/> Database connection needed</span>
   </div>
  </main>
 </TemporaryStudioShell>;
}
