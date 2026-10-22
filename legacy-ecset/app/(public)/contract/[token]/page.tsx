import { notFound } from 'next/navigation';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { resolveContractBody } from '@/lib/server-actions/contract-merge';
import ContractSignature from '@/components/public/ContractSignature';

export default async function PublicContractPage({ params }: { params: { token: string } }) {
  const supabase = createServiceRoleClient();

  const { data: contract } = await supabase
    .from('contracts')
    .select('id, title, status, signed_name, signed_at, clients(email)')
    .eq('public_token', params.token)
    .single();

  if (!contract) notFound();

  const client = contract.clients as any;
  const resolvedBody = await resolveContractBody(contract.id);
  const isSigned = contract.status === 'contract_signed';

  // Mark viewed the first time a client actually loads this page, not on
  // every reload — avoids the status flipping back and forth pointlessly.
  if (contract.status === 'contract_sent') {
    await supabase.from('contracts').update({ status: 'contract_viewed' }).eq('id', contract.id);
  }

  return (
    <section className="min-h-screen px-6 py-20">
      <div className="max-w-xl mx-auto">
        <p className="label-text text-center mb-3">EC Creative Studios</p>
        <h1 className="display-text text-4xl md:text-5xl text-matte-dark text-center mb-10">{contract.title}</h1>

        <div className="vision-card p-8 rounded-sm mb-8">
          <p className="text-sm text-matte-dark whitespace-pre-wrap leading-relaxed" style={{ fontFamily: "'Jost',sans-serif" }}>
            {resolvedBody}
          </p>
        </div>

        {isSigned ? (
          <div className="text-center">
            <p className="display-text text-2xl text-matte-dark mb-2">Already signed.</p>
            <p className="body-text">
              Signed by {contract.signed_name} on {new Date(contract.signed_at).toLocaleDateString()}.
            </p>
          </div>
        ) : (
          <ContractSignature token={params.token} clientEmail={client.email} />
        )}
      </div>
    </section>
  );
}
