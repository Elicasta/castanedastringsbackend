'use client';

import { useState, useTransition } from 'react';
import { updateQuoteLineItem } from '@/lib/server-actions/quotes-admin';

type LineItem = {
  id: string;
  name: string;
  description: string | null;
  quantity: number;
  unit_price: number;
  total: number;
};

export default function QuoteLineItemsEditor({ lineItems, locked }: { lineItems: LineItem[]; locked: boolean }) {
  const [items, setItems] = useState(lineItems);
  const [, startTransition] = useTransition();

  const handleChange = (id: string, field: 'quantity' | 'unit_price', value: number) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const handleBlur = (id: string, field: 'quantity' | 'unit_price', value: number) => {
    startTransition(() => {
      updateQuoteLineItem(id, { [field]: value });
    });
  };

  return (
    <table className="w-full text-sm">
      <thead className="text-neutral-500 text-xs uppercase tracking-wide">
        <tr>
          <th className="text-left py-2 font-medium">Item</th>
          <th className="text-right py-2 font-medium w-20">Qty</th>
          <th className="text-right py-2 font-medium w-28">Unit price</th>
          <th className="text-right py-2 font-medium w-28">Total</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-neutral-100">
        {items.map((item) => (
          <tr key={item.id}>
            <td className="py-3 pr-3">
              <p className="font-medium text-neutral-900">{item.name}</p>
              {item.description && <p className="text-xs text-neutral-500">{item.description}</p>}
            </td>
            <td className="py-3">
              <input
                type="number"
                min={0}
                value={item.quantity}
                disabled={locked}
                onChange={(e) => handleChange(item.id, 'quantity', Number(e.target.value))}
                onBlur={(e) => handleBlur(item.id, 'quantity', Number(e.target.value))}
                className="w-full text-right border border-neutral-200 rounded px-2 py-1 disabled:bg-neutral-50"
              />
            </td>
            <td className="py-3">
              <input
                type="number"
                min={0}
                step="0.01"
                value={item.unit_price}
                disabled={locked}
                onChange={(e) => handleChange(item.id, 'unit_price', Number(e.target.value))}
                onBlur={(e) => handleBlur(item.id, 'unit_price', Number(e.target.value))}
                className="w-full text-right border border-neutral-200 rounded px-2 py-1 disabled:bg-neutral-50"
              />
            </td>
            <td className="py-3 text-right font-medium text-neutral-900">
              ${(item.quantity * item.unit_price).toLocaleString()}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
