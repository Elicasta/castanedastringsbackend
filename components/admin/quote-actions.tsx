"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { sendQuoteAction, cancelQuoteAction } from "@/lib/actions/quotes";

export function QuoteActions({ quoteId, status }: { quoteId: string; status: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function send() {
    setSending(true);
    setError(null);
    try {
      const result = await sendQuoteAction(quoteId);
      if (result?.error) setError(result.error);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong sending this quote.");
    } finally {
      setSending(false);
      router.refresh();
    }
  }

  return (
    <div className="space-y-2">
      {error && <p className="text-sm text-rose-600 bg-rose-50 rounded-xl p-3">{error}</p>}
      <div className="flex flex-wrap gap-2">
        {(status === "draft" || status === "sent") && (
          <Button onClick={send} disabled={sending}>
            {sending ? "Sending…" : "Send to client"}
          </Button>
        )}
        {(status === "draft" || status === "sent" || status === "pending") && (
          <ConfirmDialog
            trigger={<Button variant="ghost">Cancel quote</Button>}
            title="Cancel this quote?"
            confirmLabel="Cancel quote"
            variant="danger"
            onConfirm={async () => {
              await cancelQuoteAction(quoteId);
              router.refresh();
            }}
          />
        )}
      </div>
    </div>
  );
}
