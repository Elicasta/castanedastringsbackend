export function formatCents(cents: number | null | undefined, currency = "usd"): string {
  const value = (cents ?? 0) / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(value);
}

export function dollarsToCents(dollars: number | string): number {
  const n = typeof dollars === "string" ? parseFloat(dollars) : dollars;
  return Math.round((n || 0) * 100);
}

export function sumLineItems(items: { quantity: number; unit_price_cents: number }[]): number {
  return items.reduce((sum, item) => sum + Math.round(item.quantity * item.unit_price_cents), 0);
}
