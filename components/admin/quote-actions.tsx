"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cancelQuoteAction } from "@/lib/actions/quotes";
import Link from "next/link";

export function QuoteActions({ quoteId, status }: { quoteId: string; status: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      {error && <p className="text-sm text-rose-600 bg-rose-50 rounded-xl p-3">{error}</p>}
      <div className="flex flex-wrap gap-2">
        {status === "draft" && (
          <Link href={`/quotes/${quoteId}/send`} className="inline-flex items-center justify-center rounded-xl bg-brand text-white px-4 py-2.5 text-sm font-semibold">Send to client</Link>
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
