"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/field";
import { sendInvoiceAction, markInvoicePaidZelleAction, sendPaymentReminderAction } from "@/lib/actions/invoices";

export function InvoiceActions({
  invoiceId,
  status,
  balanceDueCents,
}: {
  invoiceId: string;
  status: string;
  balanceDueCents: number;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showZelleForm, setShowZelleForm] = useState(false);

  async function send() {
    setBusy(true);
    setError(null);
    const result = await sendInvoiceAction(invoiceId);
    setBusy(false);
    if (result?.error) setError(result.error);
    router.refresh();
  }

  async function remind() {
    setBusy(true);
    await sendPaymentReminderAction(invoiceId);
    setBusy(false);
    router.refresh();
  }

  async function submitZelle(formData: FormData) {
    setBusy(true);
    setError(null);
    const result = await markInvoicePaidZelleAction({
      invoice_id: invoiceId,
      amount_paid_cents: Math.round(parseFloat(String(formData.get("amount"))) * 100),
      paid_at: formData.get("paid_at"),
      zelle_reference: formData.get("reference"),
    });
    setBusy(false);
    if (result?.error) setError(result.error);
    else setShowZelleForm(false);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-rose-600 bg-rose-50 rounded-xl p-3">{error}</p>}
      <div className="flex flex-wrap gap-2">
        {status === "draft" && (
          <Button onClick={send} disabled={busy}>{busy ? "Sending…" : "Send invoice"}</Button>
        )}
        {(status === "sent" || status === "payment_pending" || status === "past_due") && (
          <>
            <Button onClick={remind} disabled={busy} variant="secondary">Send reminder</Button>
            <Button onClick={() => setShowZelleForm((v) => !v)} variant="secondary">Mark Zelle paid</Button>
          </>
        )}
      </div>

      {showZelleForm && (
        <form action={submitZelle} className="space-y-3 rounded-xl border border-border p-3">
          <div>
            <Label htmlFor="amount">Amount received ($)</Label>
            <Input id="amount" name="amount" type="number" step="0.01" min="0.01" defaultValue={(balanceDueCents / 100).toFixed(2)} required />
          </div>
          <div>
            <Label htmlFor="paid_at">Date paid</Label>
            <Input id="paid_at" name="paid_at" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required />
          </div>
          <div>
            <Label htmlFor="reference">Zelle reference / note</Label>
            <Input id="reference" name="reference" placeholder="Optional" />
          </div>
          <Button type="submit" disabled={busy} className="w-full">{busy ? "Saving…" : "Confirm payment"}</Button>
        </form>
      )}
    </div>
  );
}
