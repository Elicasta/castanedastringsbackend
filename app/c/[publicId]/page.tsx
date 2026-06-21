import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { ContractSign } from "@/components/public/contract-sign";
import { ContractBody } from "@/components/public/contract-body";
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
          <p className="text-sm text-muted tracking-wide uppercase">Castaneda Strings</p>
          <h1 className="text-2xl font-semibold mt-2">{contract.title}</h1>
          <div className="mt-3"><StatusPill status={contract.status} /></div>
        </div>

        <Card className="border-brand-light">
          <ContractBody body={contract.body} />
        </Card>

        {contract.status === "signed" ? (
          <Card className="text-center">
            {contract.signature_image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={contract.signature_image} alt="Signature" className="mx-auto h-16 object-contain mb-2" />
            ) : (
              <p className="text-lg font-medium italic" style={{ fontFamily: "Georgia, serif" }}>
                {contract.signature_text}
              </p>
            )}
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
