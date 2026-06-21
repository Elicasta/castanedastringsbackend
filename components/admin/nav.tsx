"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import {
  LayoutDashboard,
  Inbox,
  FileText,
  Receipt,
  FileSignature,
  MessageSquare,
  Settings,
  Users,
  MoreHorizontal,
} from "lucide-react";
import { useState } from "react";

const SIDEBAR_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/inquiries", label: "Inquiries", icon: Inbox },
  { href: "/quotes", label: "Quotes", icon: FileText },
  { href: "/invoices", label: "Invoices", icon: Receipt },
  { href: "/contracts", label: "Contracts", icon: FileSignature },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/communications", label: "Communications", icon: MessageSquare },
  { href: "/settings", label: "Settings", icon: Settings },
];

const BOTTOM_LINKS = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/inquiries", label: "Inquiries", icon: Inbox },
  { href: "/quotes", label: "Quotes", icon: FileText },
  { href: "/invoices", label: "Invoices", icon: Receipt },
];

const MORE_LINKS = [
  { href: "/contracts", label: "Contracts", icon: FileSignature },
  { href: "/contracts/templates", label: "Contract Templates", icon: FileSignature },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/communications", label: "Communications", icon: MessageSquare },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden md:flex md:w-60 md:flex-col border-r border-border h-screen sticky top-0 px-3 py-5">
      <div className="px-3 mb-6">
        <p className="font-semibold text-lg">Castaneda Strings</p>
        <p className="text-xs text-muted">Admin</p>
      </div>
      <nav className="flex-1 space-y-1">
        {SIDEBAR_LINKS.map((link) => {
          const active = pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active ? "bg-brand-light text-brand-dark" : "text-foreground hover:bg-slate-50"
              )}
            >
              <link.icon className="size-4.5" />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <>
      {moreOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          onClick={() => setMoreOpen(false)}
        >
          <div className="absolute bottom-16 left-3 right-3 rounded-2xl bg-white p-2 shadow-lg">
            {MORE_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMoreOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium hover:bg-slate-50"
              >
                <link.icon className="size-4.5" />
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
      <nav className="fixed bottom-0 inset-x-0 z-50 flex md:hidden border-t border-border bg-white px-1 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]">
        {BOTTOM_LINKS.map((link) => {
          const active = pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 text-[11px] font-medium",
                active ? "text-brand" : "text-muted"
              )}
            >
              <link.icon className="size-5" />
              {link.label}
            </Link>
          );
        })}
        <button
          onClick={() => setMoreOpen(true)}
          className="flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 text-[11px] font-medium text-muted"
        >
          <MoreHorizontal className="size-5" />
          More
        </button>
      </nav>
    </>
  );
}
