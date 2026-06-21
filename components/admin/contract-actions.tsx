"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { sendContractAction } from "@/lib/actions/contracts";

export function ContractActions({ contractId, status }: { contractId: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send() {
    setBusy(true);
    setError(null);
    try {
      const result = await sendContractAction(contractId);
      if (result?.error) setError(result.error);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong sending this contract.");
    } finally {
      setBusy(false);
      router.refresh();
    }
  }

  if (status !== "draft" && status !== "sent") return null;

  return (
    <div className="space-y-2">
      {error && <p className="text-sm text-rose-600 bg-rose-50 rounded-xl p-3">{error}</p>}
      <Button onClick={send} disabled={busy}>{busy ? "Sending…" : "Send for signature"}</Button>
    </div>
  );
}
