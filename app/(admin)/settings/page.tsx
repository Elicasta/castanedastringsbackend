import { createClient } from "@/lib/supabase/server";
import { updateSettingsAction } from "@/lib/actions/settings";
import { isStripeConfigured } from "@/lib/stripe";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle } from "lucide-react";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { error, saved } = await searchParams;
  const supabase = await createClient();
  const { data: settings } = await supabase.from("settings").select("*").limit(1).single();
  const stripeOk = isStripeConfigured();

  return (
    <div>
      <PageHeader title="Settings" />
      {error && <p className="text-sm text-rose-600 bg-rose-50 rounded-xl p-3 mb-4 max-w-xl">{error}</p>}
      {saved && <p className="text-sm text-emerald-700 bg-emerald-50 rounded-xl p-3 mb-4 max-w-xl">Settings saved.</p>}

      <div className="space-y-4 max-w-xl">
        <Card>
          <h2 className="font-semibold mb-3">Business info</h2>
          <form action={updateSettingsAction} className="space-y-3">
            <div>
              <Label htmlFor="business_name">Business name</Label>
              <Input id="business_name" name="business_name" defaultValue={settings?.business_name} required />
            </div>
            <div>
              <Label htmlFor="business_email">Business email</Label>
              <Input id="business_email" name="business_email" type="email" defaultValue={settings?.business_email ?? ""} />
            </div>
            <div>
              <Label htmlFor="business_phone">Business phone</Label>
              <Input id="business_phone" name="business_phone" defaultValue={settings?.business_phone ?? ""} />
            </div>
            <div>
              <Label htmlFor="business_address">Business address</Label>
              <Input id="business_address" name="business_address" defaultValue={settings?.business_address ?? ""} />
            </div>

            <h2 className="font-semibold pt-2">Zelle</h2>
            <div>
              <Label htmlFor="zelle_name">Zelle name</Label>
              <Input id="zelle_name" name="zelle_name" defaultValue={settings?.zelle_name ?? ""} />
            </div>
            <div>
              <Label htmlFor="zelle_email">Zelle email</Label>
              <Input id="zelle_email" name="zelle_email" defaultValue={settings?.zelle_email ?? ""} />
            </div>
            <div>
              <Label htmlFor="zelle_phone">Zelle phone</Label>
              <Input id="zelle_phone" name="zelle_phone" defaultValue={settings?.zelle_phone ?? ""} />
            </div>

            <h2 className="font-semibold pt-2">Invoicing</h2>
            <div>
              <Label htmlFor="default_invoice_due_days">Default due days</Label>
              <Input id="default_invoice_due_days" name="default_invoice_due_days" type="number" min={1} defaultValue={settings?.default_invoice_due_days ?? 7} />
            </div>

            <Button type="submit" className="w-full">Save settings</Button>
          </form>
        </Card>

        <Card>
          <h2 className="font-semibold mb-3">Stripe</h2>
          <div className="flex items-center gap-2 text-sm">
            {stripeOk ? <CheckCircle2 className="size-4 text-emerald-600" /> : <XCircle className="size-4 text-rose-600" />}
            {stripeOk ? "Stripe keys are configured." : "Stripe keys are missing — card payments will show Zelle only."}
          </div>
        </Card>
      </div>
    </div>
  );
}
