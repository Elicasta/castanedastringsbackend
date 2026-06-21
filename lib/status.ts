import type { InquiryStatus, QuoteStatus, InvoiceStatus, ContractStatus } from "./types";

// Single source of truth for what status can move to what.
// Every server action that changes a status must check through these maps.

export const INQUIRY_TRANSITIONS: Record<InquiryStatus, InquiryStatus[]> = {
  new: ["awaiting_response", "cancelled", "archived"],
  awaiting_response: ["quoted", "cancelled", "archived"],
  quoted: ["booked", "cancelled", "archived"],
  booked: ["cancelled", "archived"],
  cancelled: ["archived"],
  archived: [],
};

export const QUOTE_TRANSITIONS: Record<QuoteStatus, QuoteStatus[]> = {
  draft: ["sent", "pending", "cancelled"],
  sent: ["pending", "cancelled"],
  pending: ["accepted", "declined", "cancelled", "expired"],
  accepted: [],
  declined: [],
  cancelled: [],
  expired: [],
};

export const INVOICE_TRANSITIONS: Record<InvoiceStatus, InvoiceStatus[]> = {
  draft: ["sent", "payment_pending", "cancelled"],
  sent: ["payment_pending", "past_due", "paid", "cancelled"],
  payment_pending: ["paid", "past_due", "cancelled"],
  past_due: ["paid", "cancelled"],
  paid: ["refunded"],
  cancelled: [],
  refunded: [],
};

export const CONTRACT_TRANSITIONS: Record<ContractStatus, ContractStatus[]> = {
  draft: ["sent", "pending", "cancelled"],
  sent: ["pending", "cancelled"],
  pending: ["signed", "cancelled"],
  signed: [],
  cancelled: [],
};

function canTransition<S extends string>(
  map: Record<S, S[]>,
  from: S,
  to: S
): boolean {
  return from === to || map[from]?.includes(to);
}

export function canTransitionInquiry(from: InquiryStatus, to: InquiryStatus) {
  return canTransition(INQUIRY_TRANSITIONS, from, to);
}
export function canTransitionQuote(from: QuoteStatus, to: QuoteStatus) {
  return canTransition(QUOTE_TRANSITIONS, from, to);
}
export function canTransitionInvoice(from: InvoiceStatus, to: InvoiceStatus) {
  return canTransition(INVOICE_TRANSITIONS, from, to);
}
export function canTransitionContract(from: ContractStatus, to: ContractStatus) {
  return canTransition(CONTRACT_TRANSITIONS, from, to);
}

export class InvalidTransitionError extends Error {
  constructor(entity: string, from: string, to: string) {
    super(`Can't move ${entity} from "${from}" to "${to}".`);
    this.name = "InvalidTransitionError";
  }
}

export const STATUS_LABELS: Record<string, string> = {
  new: "New",
  awaiting_response: "Awaiting Response",
  quoted: "Quoted",
  booked: "Booked",
  cancelled: "Cancelled",
  archived: "Archived",
  draft: "Draft",
  sent: "Sent",
  pending: "Pending",
  accepted: "Accepted",
  declined: "Declined",
  expired: "Expired",
  payment_pending: "Payment Pending",
  paid: "Paid",
  past_due: "Past Due",
  refunded: "Refunded",
  signed: "Signed",
};

export const STATUS_COLORS: Record<string, string> = {
  new: "bg-slate-100 text-slate-700",
  awaiting_response: "bg-amber-100 text-amber-700",
  quoted: "bg-sky-100 text-sky-700",
  booked: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-rose-100 text-rose-700",
  archived: "bg-slate-100 text-slate-500",
  draft: "bg-slate-100 text-slate-700",
  sent: "bg-sky-100 text-sky-700",
  pending: "bg-amber-100 text-amber-700",
  accepted: "bg-emerald-100 text-emerald-700",
  declined: "bg-rose-100 text-rose-700",
  expired: "bg-slate-100 text-slate-500",
  payment_pending: "bg-amber-100 text-amber-700",
  paid: "bg-emerald-100 text-emerald-700",
  past_due: "bg-rose-100 text-rose-700",
  refunded: "bg-slate-100 text-slate-500",
  signed: "bg-emerald-100 text-emerald-700",
};
