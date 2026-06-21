"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createInvoiceCheckoutSessionPublicAction } from "@/lib/actions/invoices";

export function InvoicePay({
  publicId,
  zelleName,
  zelleEmail,
  zellePhone,
}: {
  publicId: string;
  zelleName?: string | null;
  zelleEmail?: string | null;
  zellePhone?: string | null;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function payWithCard() {
    setBusy(true);
    setError(null);
    const result = await createInvoiceCheckoutSessionPublicAction(publicId);
    if (result.url) {
      window.location.href = result.url;
      return;
    }
    setBusy(false);
    setError(result.error ?? "Couldn't start checkout.");
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-rose-600 bg-rose-50 rounded-xl p-3">{error}</p>}
      <Button className="w-full" onClick={payWithCard} disabled={busy}>
        {busy ? "Redirecting…" : "Pay by card"}
      </Button>
      <div className="rounded-xl border border-border p-4 text-sm">
        <p className="font-medium mb-1">Or pay by Zelle</p>
        {zelleName && <p className="text-muted">Name: {zelleName}</p>}
        {zelleEmail && <p className="text-muted">Email: {zelleEmail}</p>}
        {zellePhone && <p className="text-muted">Phone: {zellePhone}</p>}
        <p className="text-muted mt-1">Once sent, let us know — we&apos;ll mark it paid.</p>
      </div>
    </div>
  );
}
