"use client";

import Link from "next/link";
import { useSearchParams, usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

export function StatusTabs({ tabs }: { tabs: { label: string; value: string }[] }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const active = searchParams.get("status") ?? tabs[0].value;

  return (
    <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
      {tabs.map((tab) => {
        const params = new URLSearchParams(searchParams.toString());
        if (tab.value === tabs[0].value) params.delete("status");
        else params.set("status", tab.value);
        const href = `${pathname}?${params.toString()}`;
        const isActive = active === tab.value;
        return (
          <Link
            key={tab.value}
            href={href}
            className={cn(
              "whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
              isActive ? "bg-brand text-white" : "text-muted hover:bg-slate-100"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
