"use client";

import { useState, type ReactNode } from "react";
import { Button } from "./button";

export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel = "Confirm",
  variant = "primary",
  onConfirm,
}: {
  trigger: ReactNode;
  title: string;
  description?: string;
  confirmLabel?: string;
  variant?: "primary" | "danger";
  onConfirm: () => Promise<void> | void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  return (
    <>
      <span onClick={() => setOpen(true)}>{trigger}</span>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5">
            <h3 className="font-semibold text-lg">{title}</h3>
            {description && <p className="text-sm text-muted mt-1.5">{description}</p>}
            <div className="flex gap-2 mt-5">
              <Button variant="secondary" className="flex-1" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                variant={variant}
                className="flex-1"
                disabled={loading}
                onClick={async () => {
                  setLoading(true);
                  await onConfirm();
                  setLoading(false);
                  setOpen(false);
                }}
              >
                {loading ? "Working…" : confirmLabel}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
