import { format, parseISO, isPast, isValid } from "date-fns";

export function formatDate(value: string | null | undefined, pattern = "MMM d, yyyy"): string {
  if (!value) return "—";
  const d = typeof value === "string" ? parseISO(value) : value;
  if (!isValid(d)) return "—";
  return format(d, pattern);
}

export function formatDateTime(value: string | null | undefined): string {
  return formatDate(value, "MMM d, yyyy 'at' h:mm a");
}

export function isOverdue(dueDate: string | null | undefined): boolean {
  if (!dueDate) return false;
  const d = parseISO(dueDate);
  return isValid(d) && isPast(d);
}
