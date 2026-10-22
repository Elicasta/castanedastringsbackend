import { createClient } from "@/lib/supabase/server";
import { createContractTemplateAction } from "@/lib/actions/contracts";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { AgreementTemplatesEditor } from "@/components/admin/agreement-templates-editor";
import {STANDARD_PERFORMANCE_AGREEMENT} from "@/lib/contracts/standard-agreement";

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
      <PageHeader title="Performance Agreements" description="Maintain your full terms. The selected default is used for new accepted quotes; existing signatures never change." />
      {error && <p className="text-sm text-rose-600 bg-rose-50 rounded-xl p-3 mb-4">{error}</p>}

      <div className="grid gap-5">
        <Card>
          <h2 className="font-semibold mb-3">Create another agreement</h2>
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
                defaultValue={STANDARD_PERFORMANCE_AGREEMENT}
                required
              />
              <p className="text-xs text-muted mt-1">
                Merge fields: {"{{client_name}}"}, {"{{client_email}}"}, {"{{event_type}}"}, {"{{event_date}}"}, {"{{event_time}}"}, {"{{location}}"}, {"{{quote_total}}"}, {"{{invoice_number}}"}, {"{{business_name}}"}
              </p>
            </div>
            <Button type="submit" className="w-full">Save template</Button>
          </form>
        </Card>

        <div><h2 className="text-lg font-semibold mb-3">Existing agreements</h2><AgreementTemplatesEditor initial={(templates??[]).map(t=>({id:t.id,name:t.name,body:t.body,status:t.status,is_default:Boolean(t.is_default)}))}/></div>
      </div>
    </div>
  );
}
