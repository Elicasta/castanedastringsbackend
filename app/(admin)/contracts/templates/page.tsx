import { createClient } from "@/lib/supabase/server";
import { createContractTemplateAction } from "@/lib/actions/contracts";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

// Admin tool reading live data — never serve a cached/stale version of this page.
export const dynamic = "force-dynamic";

export default async function ContractTemplatesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const { data: templates } = await supabase
    .from("contract_templates")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <PageHeader title="Contract Templates" description="The first active template is used automatically when a quote is accepted." />
      {error && <p className="text-sm text-rose-600 bg-rose-50 rounded-xl p-3 mb-4">{error}</p>}

      <div className="grid sm:grid-cols-2 gap-4">
        <Card>
          <h2 className="font-semibold mb-3">New template</h2>
          <form action={createContractTemplateAction} className="space-y-3">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" placeholder="Standard Performance Agreement" required />
            </div>
            <div>
              <Label htmlFor="body">Body</Label>
              <Textarea
                id="body"
                name="body"
                rows={10}
                placeholder={"This agreement is between {{business_name}} and {{client_name}} for {{event_type}} on {{event_date}} at {{location}}.\n\nTotal: {{quote_total}}\nInvoice: {{invoice_number}}"}
                required
              />
              <p className="text-xs text-muted mt-1">
                Merge fields: {"{{client_name}}"}, {"{{client_email}}"}, {"{{event_type}}"}, {"{{event_date}}"}, {"{{event_time}}"}, {"{{location}}"}, {"{{quote_total}}"}, {"{{invoice_number}}"}, {"{{business_name}}"}
              </p>
            </div>
            <Button type="submit" className="w-full">Save template</Button>
          </form>
        </Card>

        <div className="space-y-2">
          {!templates || templates.length === 0 ? (
            <p className="text-sm text-muted">No templates yet.</p>
          ) : (
            templates.map((t) => (
              <Card key={t.id}>
                <p className="font-medium text-sm">{t.name}</p>
                <p className="text-xs text-muted mt-1">{t.status === "active" ? "Active" : "Archived"}</p>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
