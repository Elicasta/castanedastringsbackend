import Link from "next/link";
import {createClient} from "@/lib/supabase/server";
import {PageHeader} from "@/components/ui/page-header";
import {Card} from "@/components/ui/card";
import {Input,Label} from "@/components/ui/field";
import {Button} from "@/components/ui/button";
import {updatePaymentSettingsAction} from "@/lib/actions/payment-settings";
import {isStripeConfigured} from "@/lib/stripe";
export const dynamic="force-dynamic";
export default async function PaymentSettings({searchParams}:{searchParams:{error?:string;saved?:string}}){
 const s=createClient(),{data:config}=await s.from("settings").select("*").limit(1).maybeSingle();
 return <div className="max-w-2xl">
 <PageHeader title="Payment Settings" description="Your clients see these payment instructions on payable invoices." action={<Link href="/settings" className="text-sm text-[#009f87] underline">Settings</Link>}/>
 {searchParams.saved&&<p role="status" className="bg-teal-50 text-teal-800 rounded-xl p-3 mb-4">Payment details updated.</p>}
 {searchParams.error&&<p role="alert" className="bg-red-50 text-red-700 rounded-xl p-3 mb-4">{searchParams.error}</p>}
 <Card><form action={updatePaymentSettingsAction} className="space-y-4">
  <h2 className="font-semibold text-lg">Zelle</h2>
  <p className="text-sm text-neutral-500">Enter your verified Zelle-enrolled email or phone number. Use test@zelle.com for interface testing only, not to collect real payments.</p>
  <div><Label htmlFor="zelle_email">Zelle email</Label><Input id="zelle_email" name="zelle_email" type="email" placeholder="test@zelle.com" defaultValue={config?.zelle_email??""}/></div>
  <div><Label htmlFor="zelle_phone">Zelle phone number</Label><Input id="zelle_phone" name="zelle_phone" type="tel" placeholder="(305) 555-0100" defaultValue={config?.zelle_phone??""}/></div>
  <div><Label htmlFor="zelle_name">Zelle recipient name</Label><Input id="zelle_name" name="zelle_name" placeholder="Castaneda Strings" defaultValue={config?.zelle_name??""}/></div>
  <div className="border-t border-neutral-100 pt-4"><Label htmlFor="default_invoice_due_days">Default invoice due (days)</Label><Input id="default_invoice_due_days" name="default_invoice_due_days" type="number" min={1} max={365} defaultValue={config?.default_invoice_due_days??7}/></div>
  <Button type="submit" className="w-full">Save payment settings</Button>
 </form></Card>
 <Card className="mt-4"><h2 className="font-semibold mb-2">Card payments</h2><p className="text-sm text-neutral-600">{isStripeConfigured()?"Stripe credentials detected. A card payment still requires an active checkout flow and webhook verification.":"Stripe credentials are missing. The pay-by-card option is unavailable."}</p></Card>
 </div>;
}
