"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { respondToQuotePublicAction } from "@/lib/actions/quotes";

export function QuoteResponse({ publicId }: { publicId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<"accepted" | "declined" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ invoicePublicId?: string | null; contractPublicId?: string | null } | null>(null);

  async function respond(decision: "accepted" | "declined") {
    setBusy(decision);
    setError(null);
    const res = await respondToQuotePublicAction(publicId, decision);
    setBusy(null);
    if (res.error) {
      setError(res.error);
      return;
    }
    if (decision === "declined") {
      router.refresh();
      return;
    }
    setResult({ invoicePublicId: res.invoicePublicId, contractPublicId: res.contractPublicId });
  }

  if (result) {
    return (
      <div className="rounded-2xl bg-brand-light p-5 text-center">
        <p className="font-medium text-brand-dark mb-3">You&apos;re booked! Here&apos;s what&apos;s next.</p>
        <div className="flex flex-col gap-2">
          {result.invoicePublicId && (
            <a href={`/i/${result.invoicePublicId}`} className="rounded-xl bg-brand text-white py-2.5 text-sm font-medium">
              View & pay invoice
            </a>
          )}
          {result.contractPublicId && (
            <a href={`/c/${result.contractPublicId}`} className="rounded-xl bg-white border border-brand text-brand-dark py-2.5 text-sm font-medium">
              Sign agreement
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {error && <p className="text-sm text-rose-600 bg-rose-50 rounded-xl p-3">{error}</p>}
      <div className="flex gap-2">
        <Button className="flex-1" disabled={!!busy} onClick={() => respond("accepted")}>
          {busy === "accepted" ? "Accepting…" : "Accept quote"}
        </Button>
        <Button variant="secondary" className="flex-1" disabled={!!busy} onClick={() => respond("declined")}>
          {busy === "declined" ? "…" : "Decline"}
        </Button>
      </div>
    </div>
  );
}
