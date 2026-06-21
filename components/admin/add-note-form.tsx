"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { addManualNoteAction } from "@/lib/actions/communications";

export function AddNoteForm() {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!body.trim()) return;
    setSaving(true);
    await addManualNoteAction({ body });
    setBody("");
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <Textarea
        placeholder="Logged a call with the client about timeline…"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={2}
      />
      <Button onClick={submit} disabled={saving} variant="secondary" className="w-full">
        {saving ? "Saving…" : "Add note"}
      </Button>
    </div>
  );
}
