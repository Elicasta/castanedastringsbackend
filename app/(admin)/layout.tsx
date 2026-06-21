import { Sidebar, BottomNav } from "@/components/admin/nav";
import { logoutAction } from "@/lib/actions/auth";
import { LogOut } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="hidden md:flex items-center justify-end gap-3 border-b border-border px-6 py-3">
          <form action={logoutAction}>
            <button className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
              <LogOut className="size-4" /> Sign out
            </button>
          </form>
        </header>
        <main className="flex-1 px-4 sm:px-6 py-5 pb-24 md:pb-8 max-w-5xl w-full">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
