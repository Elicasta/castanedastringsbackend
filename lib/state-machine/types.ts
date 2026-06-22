// Mirrors the Postgres enums created in supabase/migrations. Keep these in
// sync by hand — there are only a handful of enums and generating them from
// the DB adds a build step for little benefit at this size.

export type QuoteStatus =
  | 'quote_drafted' | 'quote_sent' | 'quote_viewed'
  | 'quote_accepted' | 'quote_declined' | 'quote_expired';

export type ContractStatus =
  | 'contract_drafted' | 'contract_sent' | 'contract_viewed' | 'contract_signed';

export type InvoicePaymentStatus =
  | 'draft' | 'sent' | 'viewed' | 'payment_pending'
  | 'paid' | 'past_due' | 'cancelled' | 'refunded';

export type BookingStatus =
  | 'booking_ready' | 'scheduled' | 'booked' | 'rescheduled' | 'cancelled' | 'completed';

export type CalendarSyncStatus = 'not_applicable' | 'queued' | 'synced' | 'failed';

export type StatusLight = 'red' | 'yellow' | 'green';

export type PaymentProvider = 'stripe' | 'zelle' | 'manual';

/**
 * The single rule that decides when a client is allowed to schedule.
 * Nothing else in the app should re-derive this logic — every caller goes
 * through isBookingReady() so there is exactly one place this can be wrong.
 */
export function isBookingReady(args: {
  quoteStatus: QuoteStatus;
  contractStatus: ContractStatus | null;
  invoicePaymentStatus: InvoicePaymentStatus | null;
}): boolean {
  return (
    args.quoteStatus === 'quote_accepted' &&
    args.contractStatus === 'contract_signed' &&
    args.invoicePaymentStatus === 'paid'
  );
}

/**
 * The rule that decides when a booking (and therefore a project + portal)
 * is allowed to exist. Booking Ready is necessary but not sufficient —
 * a date/time has to actually be selected too.
 */
export function isBooked(args: {
  bookingStatus: BookingStatus;
  startsAt: string | null;
  endsAt: string | null;
}): boolean {
  return (
    args.bookingStatus === 'booked' &&
    args.startsAt !== null &&
    args.endsAt !== null
  );
}
