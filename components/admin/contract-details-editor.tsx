"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/field";
import { updateContractDetailsAction } from "@/lib/actions/contracts";
import { dollarsToCents } from "@/lib/currency";
import type { Contract } from "@/lib/types";

const SERVICE_FIELDS: { key: keyof Contract; label: string }[] = [
  { key: "service_ceremony", label: "Ceremony" },
  { key: "service_cocktail_hour", label: "Cocktail hour" },
  { key: "service_reception", label: "Reception" },
  { key: "service_proposal", label: "Proposal" },
  { key: "service_corporate", label: "Corporate" },
  { key: "service_custom_song", label: "Custom song" },
];

export function ContractDetailsEditor({ contract }: { contract: Contract }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [services, setServices] = useState<Record<string, boolean>>(
    Object.fromEntries(SERVICE_FIELDS.map((f) => [f.key, Boolean(contract[f.key])]))
  );

  async function save(formData: FormData) {
    setBusy(true);
    setError(null);
    try {
      const result = await updateContractDetailsAction({
        contract_id: contract.id,
        ...services,
        deposit_amount_cents: formData.get("deposit_amount")
          ? dollarsToCents(String(formData.get("deposit_amount")))
          : undefined,
        balance_due_cents: formData.get("balance_due")
          ? dollarsToCents(String(formData.get("balance_due")))
          : undefined,
        planner_name: formData.get("planner_name"),
        planner_phone: formData.get("planner_phone"),
        song_requests: formData.get("song_requests"),
      });
      if (result?.error) setError(result.error);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong saving these details.");
    } finally {
      setBusy(false);
      router.refresh();
    }
  }

  return (
    <form action={save} className="space-y-4">
      {error && <p className="text-sm text-rose-600 bg-rose-50 rounded-xl p-3">{error}</p>}

      <div>
        <Label>Services covered</Label>
        <div className="grid grid-cols-2 gap-2 mt-1">
          {SERVICE_FIELDS.map((f) => (
            <label key={f.key} className="flex items-center gap-2 text-sm rounded-xl border border-border p-2">
              <input
                type="checkbox"
                checked={services[f.key]}
                onChange={(e) => setServices((prev) => ({ ...prev, [f.key]: e.target.checked }))}
              />
              {f.label}
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="deposit_amount">Deposit amount ($)</Label>
          <Input
            id="deposit_amount"
            name="deposit_amount"
            type="number"
            step="0.01"
            min="0"
            defaultValue={contract.deposit_amount_cents != null ? (contract.deposit_amount_cents / 100).toFixed(2) : ""}
          />
        </div>
        <div>
          <Label htmlFor="balance_due">Balance due ($)</Label>
          <Input
            id="balance_due"
            name="balance_due"
            type="number"
            step="0.01"
            min="0"
            defaultValue={contract.balance_due_cents != null ? (contract.balance_due_cents / 100).toFixed(2) : ""}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="planner_name">Planner name</Label>
          <Input id="planner_name" name="planner_name" defaultValue={contract.planner_name ?? ""} />
        </div>
        <div>
          <Label htmlFor="planner_phone">Planner phone</Label>
          <Input id="planner_phone" name="planner_phone" defaultValue={contract.planner_phone ?? ""} />
        </div>
      </div>

      <div>
        <Label htmlFor="song_requests">Song requests</Label>
        <Textarea id="song_requests" name="song_requests" rows={2} defaultValue={contract.song_requests ?? ""} />
      </div>

      <Button type="submit" disabled={busy} variant="secondary" className="w-full">
        {busy ? "Saving…" : "Save details"}
      </Button>
    </form>
  );
}
