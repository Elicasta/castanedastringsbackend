"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { updateInquiryStatusAction } from "@/lib/actions/inquiries";
import type { InquiryStatus } from "@/lib/types";

export function InquiryActions({ inquiryId, status }: { inquiryId: string; status: InquiryStatus }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function move(to: InquiryStatus) {
    setPending(true);
    setError(null);
    try {
      await updateInquiryStatusAction(inquiryId, status, to);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong updating this inquiry.");
    } finally {
      setPending(false);
      router.refresh();
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {error && <p className="text-sm text-rose-600 bg-rose-50 rounded-xl p-3 w-full">{error}</p>}
      {status === "new" && (
        <Button disabled={pending} onClick={() => move("awaiting_response")} variant="secondary">
          Mark awaiting response
        </Button>
      )}
      {(status === "new" || status === "awaiting_response" || status === "quoted") && (
        <ConfirmDialog
          trigger={<Button variant="ghost">Cancel</Button>}
          title="Cancel this inquiry?"
          description="You can still find it under the Cancelled tab."
          confirmLabel="Cancel inquiry"
          variant="danger"
          onConfirm={() => move("cancelled")}
        />
      )}
      {status !== "archived" && (
        <Button disabled={pending} onClick={() => move("archived")} variant="ghost">
          Archive
        </Button>
      )}
    </div>
  );
}
