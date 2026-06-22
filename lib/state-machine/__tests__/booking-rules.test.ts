import { describe, it, expect } from 'vitest';
import { isBookingReady, isBooked } from '../types';

describe('isBookingReady', () => {
  it('is false until all three conditions are met', () => {
    expect(isBookingReady({ quoteStatus: 'quote_accepted', contractStatus: null, invoicePaymentStatus: null })).toBe(false);
    expect(isBookingReady({ quoteStatus: 'quote_accepted', contractStatus: 'contract_signed', invoicePaymentStatus: null })).toBe(false);
    expect(isBookingReady({ quoteStatus: 'quote_accepted', contractStatus: 'contract_signed', invoicePaymentStatus: 'payment_pending' })).toBe(false);
  });

  it('is true only when quote accepted + contract signed + invoice paid', () => {
    expect(
      isBookingReady({ quoteStatus: 'quote_accepted', contractStatus: 'contract_signed', invoicePaymentStatus: 'paid' })
    ).toBe(true);
  });

  it('is false if quote was only sent, even if contract and invoice are somehow done', () => {
    expect(
      isBookingReady({ quoteStatus: 'quote_sent', contractStatus: 'contract_signed', invoicePaymentStatus: 'paid' })
    ).toBe(false);
  });
});

describe('isBooked', () => {
  it('requires status booked AND both timestamps present', () => {
    expect(isBooked({ bookingStatus: 'booking_ready', startsAt: null, endsAt: null })).toBe(false);
    expect(isBooked({ bookingStatus: 'booked', startsAt: null, endsAt: null })).toBe(false);
    expect(isBooked({ bookingStatus: 'booked', startsAt: '2026-01-01T10:00:00Z', endsAt: null })).toBe(false);
  });

  it('is true once a real booked session with start and end exists', () => {
    expect(
      isBooked({ bookingStatus: 'booked', startsAt: '2026-01-01T10:00:00Z', endsAt: '2026-01-01T11:00:00Z' })
    ).toBe(true);
  });

  // This is the exact bug the whiteboard session caught before any code
  // was written: "they paid, but there's no session on the calendar."
  it('regression: payment_pending or paid status alone never satisfies isBooked', () => {
    expect(isBooked({ bookingStatus: 'booking_ready', startsAt: null, endsAt: null })).toBe(false);
  });
});
