import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { ContractSign } from "@/components/public/contract-sign";
import { formatDateTime } from "@/lib/dates";

export default async function PublicContractPage({ params }: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await params;
  const supabase = createAdminClient();

  const { data: contract } = await supabase
    .from("contracts")
    .select("*")
    .eq("public_id", publicId)
    .single();
  if (!contract) notFound();

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-md mx-auto space-y-4">
        <div className="text-center">
          <p className="text-sm text-muted">Castaneda Strings</p>
          <h1 className="text-2xl font-semibold mt-1">{contract.title}</h1>
          <div className="mt-2"><StatusPill status={contract.status} /></div>
        </div>

        <Card>
          <p className="text-sm whitespace-pre-wrap">{contract.body}</p>
        </Card>

        {contract.status === "signed" ? (
          <Card className="text-center">
            <p className="text-sm">Signed by <span className="font-medium">{contract.signer_name}</span></p>
            <p className="text-xs text-muted mt-1">{formatDateTime(contract.signed_at)}</p>
          </Card>
        ) : contract.status === "pending" || contract.status === "sent" ? (
          <ContractSign publicId={publicId} />
        ) : (
          <p className="text-center text-sm text-muted">This contract is {contract.status}.</p>
        )}
      </div>
    </div>
  );
}
