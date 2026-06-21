"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input, Label } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { signContractPublicAction } from "@/lib/actions/contracts";
import { SignatureCanvas } from "@/components/public/signature-canvas";
import { formatDateTime } from "@/lib/dates";
import { cn } from "@/lib/cn";

export function ContractSign({ publicId }: { publicId: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mode, setMode] = useState<"type" | "draw">("type");
  const [signatureImage, setSignatureImage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signedAt, setSignedAt] = useState<string | null>(null);

  const canSubmit = name.trim().length > 1 && email.includes("@") && (mode === "type" || signatureImage);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const result = await signContractPublicAction({
        contract_public_id: publicId,
        signer_name: name,
        signer_email: email,
        signature_image: mode === "draw" ? signatureImage ?? undefined : undefined,
      });
      if (result?.error) {
        setError(result.error);
        return;
      }
      setSignedAt(new Date().toISOString());
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong signing this. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (signedAt) {
    return (
      <div className="rounded-2xl bg-brand-light p-5 text-center">
        <p className="font-medium text-brand-dark">Signed — you&apos;re all set.</p>
        <p className="text-xs text-brand-dark/70 mt-1">{formatDateTime(signedAt)}</p>
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

      <div>
        <div className="flex rounded-xl border border-border p-1 mb-2">
          <button
            type="button"
            onClick={() => setMode("type")}
            className={cn(
              "flex-1 text-sm font-medium rounded-lg py-1.5",
              mode === "type" ? "bg-brand text-white" : "text-muted"
            )}
          >
            Typed signature
          </button>
          <button
            type="button"
            onClick={() => setMode("draw")}
            className={cn(
              "flex-1 text-sm font-medium rounded-lg py-1.5",
              mode === "draw" ? "bg-brand text-white" : "text-muted"
            )}
          >
            Draw signature
          </button>
        </div>
        {mode === "draw" && <SignatureCanvas onChange={setSignatureImage} />}
      </div>

      <p className="text-xs text-muted">
        By signing, you&apos;re acknowledging this agreement. This isn&apos;t a notarized legal signature, just a
        clean, timestamped record of your acceptance.
      </p>
      <Button className="w-full" onClick={submit} disabled={busy || !canSubmit}>
        {busy ? "Signing…" : "Sign agreement"}
      </Button>
    </div>
  );
}
