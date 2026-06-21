import { getDashboardData } from "@/lib/dashboard";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { ButtonLink } from "@/components/ui/button";
import { formatDate, formatDateTime } from "@/lib/dates";
import { Inbox, FileText, Receipt, FilePlus, FileSignature, AlertTriangle } from "lucide-react";

export default async function DashboardPage() {
  const { counts, recentActivity, upcomingEvents } = await getDashboardData();

  const stats = [
    { label: "Awaiting Response", value: counts.inquiriesAwaiting, icon: Inbox, href: "/inquiries" },
    { label: "Active Quotes", value: counts.quotesActive, icon: FileText, href: "/quotes" },
    { label: "Accepted Quotes", value: counts.quotesAccepted, icon: FileText, href: "/quotes?status=accepted" },
    { label: "Payment Pending", value: counts.invoicesPending, icon: Receipt, href: "/invoices" },
    {
      label: "Past Due",
      value: counts.invoicesPastDue,
      icon: AlertTriangle,
      href: "/invoices?status=past_due",
      alert: counts.invoicesPastDue > 0,
    },
  ];

  return (
    <div>
      <PageHeader title="Dashboard" description="Here's where things stand today." />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        {stats.map((s) => (
          <a key={s.label} href={s.href}>
            <Card className={s.alert ? "border-rose-200 bg-rose-50" : ""}>
              <s.icon className={`size-5 mb-2 ${s.alert ? "text-rose-600" : "text-brand"}`} />
              <p className="text-2xl font-semibold">{s.value}</p>
              <p className="text-xs text-muted mt-0.5">{s.label}</p>
            </Card>
          </a>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        <ButtonLink href="/inquiries/new" variant="primary">
          <FilePlus className="size-4" /> New Inquiry
        </ButtonLink>
        <ButtonLink href="/quotes" variant="secondary">
          <FileText className="size-4" /> New Quote
        </ButtonLink>
        <ButtonLink href="/invoices" variant="secondary">
          <Receipt className="size-4" /> New Invoice
        </ButtonLink>
        <ButtonLink href="/contracts/templates" variant="secondary">
          <FileSignature className="size-4" /> New Contract Template
        </ButtonLink>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <h2 className="font-semibold mb-3">Upcoming Events</h2>
          {upcomingEvents.length === 0 ? (
            <p className="text-sm text-muted">Nothing booked yet.</p>
          ) : (
            <div className="space-y-2">
              {upcomingEvents.map((q) => (
                <Card key={q.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{q.title}</p>
                    <p className="text-xs text-muted">
                      {/* @ts-expect-error joined relation */}
                      {q.client?.full_name} · {formatDate(q.event_date)}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="font-semibold mb-3">Recent Activity</h2>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-muted">Nothing yet.</p>
          ) : (
            <div className="space-y-2">
              {recentActivity.map((a) => (
                <Card key={a.id} className="py-3">
                  <p className="text-sm">{a.description ?? `${a.action} ${a.entity_type}`}</p>
                  <p className="text-xs text-muted mt-0.5">{formatDateTime(a.created_at)}</p>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
