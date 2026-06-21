"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input, Label } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { signContractPublicAction } from "@/lib/actions/contracts";

export function ContractSign({ publicId }: { publicId: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signed, setSigned] = useState(false);

  async function submit() {
    setBusy(true);
    setError(null);
    const result = await signContractPublicAction({
      contract_public_id: publicId,
      signer_name: name,
      signer_email: email,
    });
    setBusy(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setSigned(true);
    router.refresh();
  }

  if (signed) {
    return (
      <div className="rounded-2xl bg-brand-light p-5 text-center">
        <p className="font-medium text-brand-dark">Signed — you&apos;re all set.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-2xl border border-border p-4">
      {error && <p className="text-sm text-rose-600 bg-rose-50 rounded-xl p-3">{error}</p>}
      <div>
        <Label htmlFor="signer_name">Type your full legal name</Label>
        <Input id="signer_name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" />
      </div>
      <div>
        <Label htmlFor="signer_email">Email</Label>
        <Input id="signer_email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <p className="text-xs text-muted">
        By typing your name and clicking sign, you&apos;re acknowledging this agreement. This isn&apos;t a notarized
        legal signature, just a clean record of your acceptance.
      </p>
      <Button className="w-full" onClick={submit} disabled={busy || !name || !email}>
        {busy ? "Signing…" : "Sign agreement"}
      </Button>
    </div>
  );
}
