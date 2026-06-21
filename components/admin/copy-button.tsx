"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard access denied — silently ignore, not worth surfacing an error for
    }
  }

  return (
    <button type="button" onClick={copy} className="shrink-0">
      {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5 text-muted" />}
    </button>
  );
}
