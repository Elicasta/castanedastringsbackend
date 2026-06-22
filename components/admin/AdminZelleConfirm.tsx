'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { markInvoiceZellePaid } from '@/lib/server-actions/invoices';

export default function AdminZelleConfirm({ invoiceId, prefillReference }: { invoiceId: string; prefillReference: string }) {
  const router = useRouter();
  const [reference, setReference] = useState(prefillReference);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    const result = await markInvoiceZellePaid(invoiceId, reference);
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.refresh();
  };

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-5">
      <p className="text-sm font-medium text-amber-900 mb-1">Zelle reference submitted by client</p>
      <p className="text-xs text-amber-700 mb-3">Confirm only after you've actually verified this landed in your account.</p>
      <div className="flex gap-2">
        <input
          type="text"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          className="flex-1 rounded-md border border-amber-300 px-3 py-2 text-sm bg-white"
        />
        <button
          type="button"
          onClick={handleConfirm}
          disabled={loading}
          className="rounded-md bg-neutral-900 text-white text-sm px-4 py-2 disabled:opacity-50"
        >
          {loading ? 'Confirming…' : 'Mark Zelle Paid'}
        </button>
      </div>
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
    </div>
  );
}
