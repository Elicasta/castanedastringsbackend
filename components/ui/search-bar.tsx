"use client";

import { Search } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useTransition } from "react";

export function SearchBar({ placeholder = "Search..." }: { placeholder?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("q") ?? "");
  const [, startTransition] = useTransition();

  function update(next: string) {
    setValue(next);
    const params = new URLSearchParams(searchParams.toString());
    if (next) params.set("q", next);
    else params.delete("q");
    startTransition(() => router.replace(`${pathname}?${params.toString()}`));
  }

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted" />
      <input
        value={value}
        onChange={(e) => update(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-border bg-white pl-9 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
      />
    </div>
  );
}
