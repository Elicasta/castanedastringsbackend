'use client';

import { useState } from 'react';
import { acceptQuoteByToken, declineQuoteByToken } from '@/lib/server-actions/quotes';

export default function QuoteActions({ token }: { token: string }) {
  const [loading, setLoading] = useState<'accept' | 'decline' | null>(null);
  const [result, setResult] = useState<{ accepted?: boolean; declined?: boolean; error?: string } | null>(null);

  const handleAccept = async () => {
    setLoading('accept');
    const res = await acceptQuoteByToken(token);
    setLoading(null);
    if (!res.ok) {
      setResult({ error: res.error });
      return;
    }
    setResult({ accepted: true });
  };

  const handleDecline = async () => {
    setLoading('decline');
    const res = await declineQuoteByToken(token);
    setLoading(null);
    if (!res.ok) {
      setResult({ error: res.error });
      return;
    }
    setResult({ declined: true });
  };

  if (result?.accepted) {
    return (
      <div className="text-center">
        <p className="display-text text-2xl text-matte-dark mb-2">Quote accepted.</p>
        <p className="body-text">We'll follow up shortly with your contract and invoice.</p>
      </div>
    );
  }

  if (result?.declined) {
    return (
      <div className="text-center">
        <p className="display-text text-2xl text-matte-dark mb-2">Got it.</p>
        <p className="body-text">Reach out anytime if you'd like to revisit this.</p>
      </div>
    );
  }

  return (
    <div>
      {result?.error && <p className="text-sm text-red-600 mb-4 text-center">{result.error}</p>}
      <div className="flex items-center justify-center gap-4">
        <button type="button" onClick={handleDecline} disabled={loading !== null} className="btn-secondary px-6 py-3">
          {loading === 'decline' ? 'Declining…' : 'Decline'}
        </button>
        <button type="button" onClick={handleAccept} disabled={loading !== null} className="btn-primary px-9 py-4">
          {loading === 'accept' ? 'Accepting…' : 'Accept Quote'}
        </button>
      </div>
    </div>
  );
}
