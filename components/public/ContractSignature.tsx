'use client';

import { useState } from 'react';
import { signContractByToken } from '@/lib/server-actions/contracts';

export default function ContractSignature({ token, clientEmail }: { token: string; clientEmail: string }) {
  const [signedName, setSignedName] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ signed?: boolean; error?: string } | null>(null);

  const canSign = signedName.trim().length > 1 && agreed;

  const handleSign = async () => {
    setLoading(true);
    const res = await signContractByToken({
      token,
      signedName: signedName.trim(),
      signedEmail: clientEmail,
      signatureData: signedName.trim(),
    });
    setLoading(false);
    if (!res.ok) {
      setResult({ error: res.error });
      return;
    }
    setResult({ signed: true });
  };

  if (result?.signed) {
    return (
      <div className="text-center">
        <p className="display-text text-2xl text-matte-dark mb-2">Signed.</p>
        <p className="body-text">Your invoice is next — we'll be in touch shortly.</p>
      </div>
    );
  }

  return (
    <div>
      <label className="label-text block mb-2">Type your full legal name to sign *</label>
      <input
        type="text"
        value={signedName}
        onChange={(e) => setSignedName(e.target.value)}
        placeholder="Full name"
        className="ec-input w-full px-5 py-4 rounded-sm text-sm mb-4"
      />

      <label className="flex items-start gap-3 mb-6 cursor-pointer">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-1"
        />
        <span className="body-text text-xs leading-relaxed">
          I have read this agreement and agree to its terms. I understand that typing my name above
          constitutes my legal signature.
        </span>
      </label>

      {result?.error && <p className="text-sm text-red-600 mb-4 text-center">{result.error}</p>}

      <div className="flex justify-center">
        <button
          type="button"
          onClick={handleSign}
          disabled={!canSign || loading}
          className="btn-primary px-9 py-4 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? 'Signing…' : 'Sign Agreement'}
        </button>
      </div>
    </div>
  );
}
