'use client';

import { useState } from 'react';
import { createStripeCheckoutForInvoice, submitZelleReferenceByToken } from '@/lib/server-actions/invoices';

export default function InvoicePaymentActions({ token, zelleInstructions }: { token: string; zelleInstructions: string | null }) {
  const [cardLoading, setCardLoading] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);

  const [zelleRef, setZelleRef] = useState('');
  const [zelleSubmitted, setZelleSubmitted] = useState(false);
  const [zelleLoading, setZelleLoading] = useState(false);
  const [zelleError, setZelleError] = useState<string | null>(null);

  const handlePayWithCard = async () => {
    setCardLoading(true);
    setCardError(null);
    const result = await createStripeCheckoutForInvoice(token);
    if (!result.ok) {
      setCardError(result.error);
      setCardLoading(false);
      return;
    }
    if (result.checkoutUrl) {
      window.location.href = result.checkoutUrl;
    }
  };

  const handleZelleSubmit = async () => {
    setZelleLoading(true);
    setZelleError(null);
    const result = await submitZelleReferenceByToken(token, zelleRef.trim());
    setZelleLoading(false);
    if (!result.ok) {
      setZelleError(result.error);
      return;
    }
    setZelleSubmitted(true);
  };

  return (
    <div className="space-y-8">
      <div>
        <button
          type="button"
          onClick={handlePayWithCard}
          disabled={cardLoading}
          className="btn-primary w-full py-4 disabled:opacity-50"
        >
          {cardLoading ? 'Redirecting to checkout…' : 'Pay with Card'}
        </button>
        {cardError && <p className="text-sm text-red-600 text-center mt-2">{cardError}</p>}
      </div>

      <div className="vision-card p-6 rounded-sm">
        <p className="label-text mb-3">Pay by Zelle</p>
        {zelleInstructions && (
          <p className="body-text text-xs leading-relaxed mb-4">{zelleInstructions}</p>
        )}

        {zelleSubmitted ? (
          <p className="body-text text-xs">
            Got it — we'll confirm once it lands and update this page.
          </p>
        ) : (
          <>
            <input
              type="text"
              value={zelleRef}
              onChange={(e) => setZelleRef(e.target.value)}
              placeholder="Zelle confirmation number (optional)"
              className="ec-input w-full px-4 py-3 rounded-sm text-sm mb-3"
            />
            <button
              type="button"
              onClick={handleZelleSubmit}
              disabled={zelleLoading}
              className="btn-secondary w-full py-3 disabled:opacity-50"
            >
              {zelleLoading ? 'Submitting…' : 'I Sent It by Zelle'}
            </button>
            {zelleError && <p className="text-sm text-red-600 text-center mt-2">{zelleError}</p>}
          </>
        )}
      </div>
    </div>
  );
}
