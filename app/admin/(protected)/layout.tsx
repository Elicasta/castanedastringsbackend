import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentAdmin } from '@/lib/server-actions/current-admin';
import { signOut } from '@/lib/server-actions/auth';

const NAV_ITEMS = [
  { href: '/admin/dashboard', label: 'Dashboard' },
  { href: '/admin/inquiries', label: 'Inquiries' },
  { href: '/admin/quotes', label: 'Quotes' },
  { href: '/admin/contracts', label: 'Contracts' },
  { href: '/admin/invoices', label: 'Invoices' },
  { href: '/admin/calendar', label: 'Calendar' },
  { href: '/admin/projects', label: 'Projects' },
  { href: '/admin/clients', label: 'Clients' },
  { href: '/admin/email-logs', label: 'Email Logs' },
  { href: '/admin/settings', label: 'Settings' },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getCurrentAdmin();

  // Middleware keeps signed-out users out, but a signed-in auth user with
  // no matching admin_users row would otherwise see a broken dashboard.
  if (!admin) {
    redirect('/admin/login');
  }

  return (
    <div className="min-h-screen flex bg-neutral-50">
      <aside className="w-56 border-r border-neutral-200 bg-white flex flex-col">
        <div className="px-5 py-5 border-b border-neutral-200">
          <p className="text-sm font-semibold text-neutral-900">EC Creative Studios</p>
          <p className="text-xs text-neutral-500 mt-0.5">{admin.name} · {admin.role}</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-md px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <form action={signOut} className="px-3 py-4 border-t border-neutral-200">
          <button type="submit" className="w-full text-left text-sm text-neutral-500 hover:text-neutral-900 px-3 py-1.5">
            Sign out
          </button>
        </form>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
