import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { ContractActions } from "@/components/admin/contract-actions";
import { ContractDetailsEditor } from "@/components/admin/contract-details-editor";
import { formatDateTime } from "@/lib/dates";

export default async function ContractDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: contract } = await supabase
    .from("contracts")
    .select("*, client:clients(*)")
    .eq("id", id)
    .single();
  if (!contract) notFound();

  return (
    <div>
      <PageHeader title={contract.title} description={contract.client?.full_name} action={<StatusPill status={contract.status} />} />

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2 space-y-4">
          <Card>
            <h2 className="font-semibold mb-3">Agreement text</h2>
            <p className="text-sm whitespace-pre-wrap">{contract.body}</p>
          </Card>

          {contract.status === "signed" && (
            <Card>
              <h2 className="font-semibold mb-3">Signature record</h2>
              <p className="text-sm">Signed by <span className="font-medium">{contract.client_signature ?? contract.signer_name}</span></p>
              <p className="text-sm text-muted">{contract.signer_email}</p>
              <p className="text-sm text-muted">{formatDateTime(contract.signed_at)}</p>
              <p className="text-xs text-muted mt-2">IP: {contract.signer_ip ?? "—"}</p>
            </Card>
          )}

          <Card>
            <h2 className="font-semibold mb-3">Booking details</h2>
            <ContractDetailsEditor contract={contract} />
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <h2 className="font-semibold mb-3">Client</h2>
            <a href={`/clients/${contract.client_id}`} className="text-sm font-medium hover:text-brand">{contract.client?.full_name}</a>
            <p className="text-sm text-muted">{contract.client?.email ?? "No email"}</p>
          </Card>
          <Card>
            <h2 className="font-semibold mb-3">Actions</h2>
            <ContractActions contractId={contract.id} status={contract.status} />
          </Card>
        </div>
      </div>
    </div>
  );
}
