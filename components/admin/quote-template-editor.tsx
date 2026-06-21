"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/field";
import { updateQuoteTemplateAction, toggleQuoteTemplateStatusAction } from "@/lib/actions/quote-templates";
import type { QuoteTemplate } from "@/lib/types";
import { dollarsToCents } from "@/lib/currency";

export function QuoteTemplateEditor({ template }: { template: QuoteTemplate }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(formData: FormData) {
    setBusy(true);
    setError(null);
    try {
      const result = await updateQuoteTemplateAction({
        id: template.id,
        name: formData.get("name"),
        price_cents: dollarsToCents(String(formData.get("price"))),
        performance_time: formData.get("performance_time"),
        description: formData.get("description"),
        includes: formData.get("includes"),
        recommended_for: formData.get("recommended_for"),
      });
      if (result?.error) setError(result.error);
      else setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong saving this template.");
    } finally {
      setBusy(false);
      router.refresh();
    }
  }

  async function toggleStatus() {
    setBusy(true);
    try {
      await toggleQuoteTemplateStatusAction(template.id, template.status === "active" ? "archived" : "active");
    } finally {
      setBusy(false);
      router.refresh();
    }
  }

  if (!editing) {
    return (
      <div className="flex gap-2">
        <Button variant="secondary" onClick={() => setEditing(true)}>Edit</Button>
        <Button variant="ghost" onClick={toggleStatus} disabled={busy}>
          {template.status === "active" ? "Archive" : "Reactivate"}
        </Button>
      </div>
    );
  }

  return (
    <form action={save} className="space-y-2 rounded-xl border border-border p-3">
      {error && <p className="text-sm text-rose-600 bg-rose-50 rounded-xl p-2">{error}</p>}
      <div>
        <Label htmlFor={`name-${template.id}`}>Name</Label>
        <Input id={`name-${template.id}`} name="name" defaultValue={template.name} required />
      </div>
      <div>
        <Label htmlFor={`price-${template.id}`}>Price ($)</Label>
        <Input
          id={`price-${template.id}`}
          name="price"
          type="number"
          step="0.01"
          min="0"
          defaultValue={(template.price_cents / 100).toFixed(2)}
          required
        />
      </div>
      <div>
        <Label htmlFor={`time-${template.id}`}>Performance time</Label>
        <Input id={`time-${template.id}`} name="performance_time" defaultValue={template.performance_time ?? ""} />
      </div>
      <div>
        <Label htmlFor={`desc-${template.id}`}>Description</Label>
        <Textarea id={`desc-${template.id}`} name="description" rows={2} defaultValue={template.description ?? ""} />
      </div>
      <div>
        <Label htmlFor={`includes-${template.id}`}>Includes (one per line)</Label>
        <Textarea id={`includes-${template.id}`} name="includes" rows={3} defaultValue={template.includes ?? ""} />
      </div>
      <div>
        <Label htmlFor={`rec-${template.id}`}>Recommended for</Label>
        <Input id={`rec-${template.id}`} name="recommended_for" defaultValue={template.recommended_for ?? ""} />
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={busy} className="flex-1">{busy ? "Saving…" : "Save"}</Button>
        <Button type="button" variant="secondary" onClick={() => setEditing(false)}>Cancel</Button>
      </div>
    </form>
  );
}
