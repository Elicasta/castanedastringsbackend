import Link from "next/link";
import { QuoteForm } from "@/components/admin/quote-form";
import type { Client, QuoteTemplate } from "@/lib/types";

const CLIENTS:Client[] = [
  { id:"00000000-0000-4000-8000-000000000001",first_name:"Jordan",last_name:"Rivera",full_name:"Jordan Rivera",
    email:"jordan@example.invalid",phone:null,instagram_handle:null,notes:null,
    portal_public_id:"demo",created_at:"2026-01-01",updated_at:"2026-01-01" },
  { id:"00000000-0000-4000-8000-000000000002",first_name:"Alex",last_name:"Morgan",full_name:"Alex Morgan",
    email:"alex@example.invalid",phone:null,instagram_handle:null,notes:null,
    portal_public_id:"demo",created_at:"2026-01-01",updated_at:"2026-01-01" }
];

const TEMPLATES:QuoteTemplate[] = [
  {id:"00000000-0000-4000-8000-000000000101",category:"wedding",name:"Ceremony Collection",price_cents:49500,performance_time:"Ceremony coverage",description:"Solo violin for wedding ceremony",includes:"Guest arrival\nProcessional and recessional\nCustom song selections",recommended_for:"Wedding ceremonies",status:"active",sort_order:1,created_at:"2026-01-01",updated_at:"2026-01-01"},
  {id:"00000000-0000-4000-8000-000000000102",category:"wedding",name:"Signature Wedding Collection",price_cents:79500,performance_time:"2.5 hours",description:"Ceremony and cocktail hour",includes:"Full ceremony\nCocktail hour\nPlanning consultation",recommended_for:"Weddings",status:"active",sort_order:2,created_at:"2026-01-01",updated_at:"2026-01-01"},
  {id:"00000000-0000-4000-8000-000000000103",category:"private_celebration",name:"Private Event",price_cents:70000,performance_time:"2 hours",description:"Live violin for private celebrations",includes:"Performance\nSong requests",recommended_for:"Parties",status:"active",sort_order:3,created_at:"2026-01-01",updated_at:"2026-01-01"},
  {id:"00000000-0000-4000-8000-000000000104",category:"corporate",name:"Corporate Performance",price_cents:90000,performance_time:"2 hours",description:"Live music for corporate receptions",includes:"Reception music",recommended_for:"Corporate events",status:"active",sort_order:4,created_at:"2026-01-01",updated_at:"2026-01-01"},
  {id:"00000000-0000-4000-8000-000000000105",category:"proposal",name:"Proposal Experience",price_cents:42500,performance_time:"1 hour",description:"Live violin for a proposal",includes:"Custom song selections",recommended_for:"Proposals",status:"active",sort_order:5,created_at:"2026-01-01",updated_at:"2026-01-01"}
];

export const metadata = {
  title: "Castaneda Strings | Quote Builder Preview",
  description: "Explore the new mobile quote process using safe sample information."
};
export default function QuotePreviewPage() {
  return <main className="cs-admin min-h-screen px-4 py-7 sm:py-12">
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div><p className="text-xs font-semibold tracking-widest text-teal-700 uppercase">Castaneda Strings</p><h1 className="text-2xl font-semibold text-neutral-900 mt-1">Quote Builder Preview</h1></div>
        <Link href="/login" className="text-sm text-neutral-600 underline">Admin sign-in</Link>
      </div>
      <QuoteForm demo clients={CLIENTS} templates={TEMPLATES}
        projects={[{id:"00000000-0000-4000-8000-000000000201",client_id:CLIENTS[0].id,name:"Rivera Wedding"}]}/>
      <p className="text-xs text-neutral-500 text-center mt-6">This is a design preview using sample contacts. No quotes or emails are created.</p>
    </div>
  </main>;
}
