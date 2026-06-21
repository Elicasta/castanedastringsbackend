import { STATUS_COLORS, STATUS_LABELS } from "@/lib/status";
import { cn } from "@/lib/cn";

export function StatusPill({ status, className }: { status: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap",
        STATUS_COLORS[status] ?? "bg-slate-100 text-slate-700",
        className
      )}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
