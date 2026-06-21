"use client";

import { useState } from "react";
import { Input, Label, Textarea, Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { createQuoteAction } from "@/lib/actions/quotes";
import { formatCents, dollarsToCents, sumLineItems } from "@/lib/currency";
import { Plus, Trash2 } from "lucide-react";
import type { Client } from "@/lib/types";

interface LineItem {
  name: string;
  description: string;
  quantity: string;
  unit_price_dollars: string;
}

export function QuoteForm({
  clients,
  defaultClientId,
  defaultInquiryId,
  defaultEventType,
  defaultEventDate,
  defaultLocation,
}: {
  clients: Client[];
  defaultClientId?: string;
  defaultInquiryId?: string;
  defaultEventType?: string | null;
  defaultEventDate?: string | null;
  defaultLocation?: string | null;
}) {
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState<LineItem[]>([
    { name: "", description: "", quantity: "1", unit_price_dollars: "" },
  ]);
  const [discount, setDiscount] = useState("0");
  const [tax, setTax] = useState("0");

  const subtotal = sumLineItems(
    items.map((i) => ({
      quantity: parseFloat(i.quantity) || 0,
      unit_price_cents: dollarsToCents(i.unit_price_dollars || 0),
    }))
  );
  const total = Math.max(0, subtotal - dollarsToCents(discount) + dollarsToCents(tax));

  function updateItem(i: number, patch: Partial<LineItem>) {
    setItems((prev) => prev.map((item, idx) => (idx === i ? { ...item, ...patch } : item)));
  }

  async function handleSubmit(formData: FormData) {
    setSaving(true);
    setError(null);
    const payload = {
      client_id: formData.get("client_id"),
      inquiry_id: defaultInquiryId || null,
      title: formData.get("title"),
      event_type: formData.get("event_type"),
      event_date: formData.get("event_date"),
      location_name: formData.get("location_name"),
      valid_until: formData.get("valid_until"),
      notes_to_client: formData.get("notes_to_client"),
      internal_notes: formData.get("internal_notes"),
      discount_cents: dollarsToCents(discount),
      tax_cents: dollarsToCents(tax),
      items: items
        .filter((i) => i.name.trim())
        .map((i) => ({
          name: i.name,
          description: i.description,
          quantity: parseFloat(i.quantity) || 1,
          unit_price_cents: dollarsToCents(i.unit_price_dollars || 0),
        })),
    };
    const result = await createQuoteAction(payload);
    setSaving(false);
    if (result?.error) setError(result.error);
  }

  return (
    <form action={handleSubmit} className="space-y-5">
      {error && <p className="text-sm text-rose-600 bg-rose-50 rounded-xl p-3">{error}</p>}

      <div>
        <Label htmlFor="client_id">Client</Label>
        <Select id="client_id" name="client_id" defaultValue={defaultClientId} required>
          <option value="">Select a client…</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>{c.full_name}</option>
          ))}
        </Select>
      </div>

      <div>
        <Label htmlFor="title">Quote title</Label>
        <Input id="title" name="title" defaultValue="Performance Quote" required />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="event_type">Event type</Label>
          <Input id="event_type" name="event_type" defaultValue={defaultEventType ?? ""} />
        </div>
        <div>
          <Label htmlFor="event_date">Event date</Label>
          <Input id="event_date" name="event_date" type="date" defaultValue={defaultEventDate ?? ""} />
        </div>
      </div>

      <div>
        <Label htmlFor="location_name">Venue</Label>
        <Input id="location_name" name="location_name" defaultValue={defaultLocation ?? ""} />
      </div>

      <div>
        <Label htmlFor="valid_until">Valid until</Label>
        <Input id="valid_until" name="valid_until" type="date" />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Line items</Label>
          <button
            type="button"
            onClick={() =>
              setItems((prev) => [...prev, { name: "", description: "", quantity: "1", unit_price_dollars: "" }])
            }
            className="text-sm text-brand font-medium flex items-center gap-1"
          >
            <Plus className="size-4" /> Add item
          </button>
        </div>
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="rounded-xl border border-border p-3 space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Solo violin — ceremony"
                  value={item.name}
                  onChange={(e) => updateItem(i, { name: e.target.value })}
                />
                <button type="button" onClick={() => setItems((prev) => prev.filter((_, idx) => idx !== i))}>
                  <Trash2 className="size-4 text-muted" />
                </button>
              </div>
              <Input
                placeholder="Description (optional)"
                value={item.description}
                onChange={(e) => updateItem(i, { description: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  step="0.5"
                  min="0"
                  placeholder="Qty"
                  value={item.quantity}
                  onChange={(e) => updateItem(i, { quantity: e.target.value })}
                />
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Unit price ($)"
                  value={item.unit_price_dollars}
                  onChange={(e) => updateItem(i, { unit_price_dollars: e.target.value })}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="discount_display">Discount ($)</Label>
          <Input
            id="discount_display"
            type="number"
            step="0.01"
            min="0"
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="tax_display">Tax ($)</Label>
          <Input
            id="tax_display"
            type="number"
            step="0.01"
            min="0"
            value={tax}
            onChange={(e) => setTax(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-xl bg-brand-light p-4 flex items-center justify-between">
        <span className="text-sm font-medium">Total</span>
        <span className="text-lg font-semibold">{formatCents(total)}</span>
      </div>

      <div>
        <Label htmlFor="notes_to_client">Notes to client</Label>
        <Textarea id="notes_to_client" name="notes_to_client" rows={2} />
      </div>
      <div>
        <Label htmlFor="internal_notes">Internal notes</Label>
        <Textarea id="internal_notes" name="internal_notes" rows={2} />
      </div>

      <Button type="submit" disabled={saving} className="w-full">
        {saving ? "Saving…" : "Save draft quote"}
      </Button>
    </form>
  );
}
