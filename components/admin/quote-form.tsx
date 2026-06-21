"use client";

import { useState } from "react";
import { Input, Label, Textarea, Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { createQuoteAction } from "@/lib/actions/quotes";
import { formatCents, dollarsToCents, sumLineItems } from "@/lib/currency";
import { Plus, Trash2, ChevronDown } from "lucide-react";
import type { Client, QuoteTemplate, QuoteTemplateCategory } from "@/lib/types";
import { cn } from "@/lib/cn";

interface LineItem {
  name: string;
  description: string;
  quantity: string;
  unit_price_dollars: string;
}

const CATEGORY_LABELS: Record<QuoteTemplateCategory, string> = {
  wedding: "Wedding Collections",
  private_celebration: "Private Celebrations",
  corporate: "Corporate & Brand",
  proposal: "Proposals",
  lessons: "Lessons",
};

export function QuoteForm({
  clients,
  templates,
  defaultClientId,
  defaultInquiryId,
  defaultEventType,
  defaultEventDate,
  defaultLocation,
}: {
  clients: Client[];
  templates: QuoteTemplate[];
  defaultClientId?: string;
  defaultInquiryId?: string;
  defaultEventType?: string | null;
  defaultEventDate?: string | null;
  defaultLocation?: string | null;
}) {
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("Performance Quote");
  const [notesToClient, setNotesToClient] = useState("");
  const [items, setItems] = useState<LineItem[]>([
    { name: "", description: "", quantity: "1", unit_price_dollars: "" },
  ]);
  const [discount, setDiscount] = useState("0");
  const [tax, setTax] = useState("0");
  const [pickerOpen, setPickerOpen] = useState(templates.length > 0);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

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

  function applyTemplate(t: QuoteTemplate) {
    setSelectedTemplateId(t.id);
    setTitle(t.name);
    setItems([
      {
        name: t.name,
        description: [t.performance_time, t.description].filter(Boolean).join(" — "),
        quantity: "1",
        unit_price_dollars: (t.price_cents / 100).toFixed(2),
      },
    ]);
    if (t.includes) {
      setNotesToClient(`Includes:\n${t.includes}`);
    }
    setPickerOpen(false);
  }

  async function handleSubmit(formData: FormData) {
    setSaving(true);
    setError(null);
    const payload = {
      client_id: formData.get("client_id"),
      inquiry_id: defaultInquiryId || null,
      title,
      event_type: formData.get("event_type"),
      event_date: formData.get("event_date"),
      location_name: formData.get("location_name"),
      valid_until: formData.get("valid_until"),
      notes_to_client: notesToClient,
      internal_notes: formData.get("internal_notes"),
      discount_cents: dollarsToCents(discount),
      tax_cents: dollarsToCents(tax),
      send: formData.get("intent") === "send",
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

  const grouped = templates.reduce<Record<string, QuoteTemplate[]>>((acc, t) => {
    (acc[t.category] ??= []).push(t);
    return acc;
  }, {});

  return (
    <form action={handleSubmit} className="space-y-5">
      {error && <p className="text-sm text-rose-600 bg-rose-50 rounded-xl p-3">{error}</p>}

      {templates.length > 0 && (
        <div className="rounded-xl border border-border overflow-hidden">
          <button
            type="button"
            onClick={() => setPickerOpen((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 bg-slate-50"
          >
            <span className="text-sm font-medium">
              {selectedTemplateId
                ? `Using: ${templates.find((t) => t.id === selectedTemplateId)?.name}`
                : "Start from a template (optional)"}
            </span>
            <ChevronDown className={cn("size-4 transition-transform", pickerOpen && "rotate-180")} />
          </button>
          {pickerOpen && (
            <div className="p-4 space-y-5 max-h-96 overflow-y-auto">
              {(Object.keys(CATEGORY_LABELS) as QuoteTemplateCategory[]).map((category) => {
                const list = grouped[category];
                if (!list?.length) return null;
                return (
                  <div key={category}>
                    <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">
                      {CATEGORY_LABELS[category]}
                    </p>
                    <div className="space-y-2">
                      {list.map((t) => (
                        <button
                          type="button"
                          key={t.id}
                          onClick={() => applyTemplate(t)}
                          className={cn(
                            "w-full text-left rounded-xl border p-3 hover:border-brand transition-colors",
                            selectedTemplateId === t.id ? "border-brand bg-brand-light" : "border-border"
                          )}
                        >
                          <div className="flex justify-between gap-2">
                            <span className="font-medium text-sm">{t.name}</span>
                            <span className="text-sm font-semibold whitespace-nowrap">
                              {formatCents(t.price_cents)}
                            </span>
                          </div>
                          {t.performance_time && (
                            <p className="text-xs text-muted mt-0.5">{t.performance_time}</p>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

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
        <Input id="title" name="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
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
        <Textarea
          id="notes_to_client"
          name="notes_to_client"
          rows={4}
          value={notesToClient}
          onChange={(e) => setNotesToClient(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="internal_notes">Internal notes</Label>
        <Textarea id="internal_notes" name="internal_notes" rows={2} />
      </div>

      <div className="flex gap-2">
        <Button
          type="submit"
          name="intent"
          value="draft"
          disabled={saving}
          variant="secondary"
          className="flex-1"
        >
          {saving ? "Saving…" : "Save draft"}
        </Button>
        <Button
          type="submit"
          name="intent"
          value="send"
          disabled={saving}
          className="flex-1"
        >
          {saving ? "Sending…" : "Save & send to client"}
        </Button>
      </div>
    </form>
  );
}
