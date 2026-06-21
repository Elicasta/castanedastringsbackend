"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  createInvoiceCheckoutSessionPublicAction,
  notifyZellePaymentSentPublicAction,
} from "@/lib/actions/invoices";

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
  const [zelleSent, setZelleSent] = useState(false);
  const [zelleBusy, setZelleBusy] = useState(false);

  async function payWithCard() {
    setBusy(true);
    setError(null);
    try {
      const result = await createInvoiceCheckoutSessionPublicAction(publicId);
      if (result.url) {
        window.location.href = result.url;
        return; // keep "Redirecting…" showing — the browser is about to navigate away
      }
      setError(result.error ?? "Couldn't start checkout.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't start checkout. Try again or use Zelle below.");
    } finally {
      setBusy(false);
    }
  }

  async function markZelleSent() {
    setZelleBusy(true);
    setError(null);
    try {
      const result = await notifyZellePaymentSentPublicAction(publicId);
      if (result?.error) setError(result.error);
      else setZelleSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't send that notice. Try again.");
    } finally {
      setZelleBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-rose-600 bg-rose-50 rounded-xl p-3">{error}</p>}
      <Button className="w-full" onClick={payWithCard} disabled={busy}>
        {busy ? "Redirecting…" : "Pay by card"}
      </Button>
      <div className="rounded-xl border border-border p-4 text-sm space-y-3">
        <div>
          <p className="font-medium mb-1">Or pay by Zelle</p>
          {zelleName && <p className="text-muted">Name: {zelleName}</p>}
          {zelleEmail && <p className="text-muted">Email: {zelleEmail}</p>}
          {zellePhone && <p className="text-muted">Phone: {zellePhone}</p>}
        </div>
        {zelleSent ? (
          <p className="text-emerald-700 bg-emerald-50 rounded-lg p-2 text-sm">
            Got it — we&apos;ll confirm and mark this paid shortly.
          </p>
        ) : (
          <Button variant="secondary" className="w-full" onClick={markZelleSent} disabled={zelleBusy}>
            {zelleBusy ? "Sending…" : "I sent payment via Zelle"}
          </Button>
        )}
      </div>
    </div>
  );
}
