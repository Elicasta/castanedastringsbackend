import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { formatCents } from "@/lib/currency";
import { QuoteTemplateEditor } from "@/components/admin/quote-template-editor";
import type { QuoteTemplate, QuoteTemplateCategory } from "@/lib/types";

const CATEGORY_LABELS: Record<QuoteTemplateCategory, string> = {
  wedding: "Wedding Collections",
  private_celebration: "Private Celebrations",
  corporate: "Corporate & Brand",
  proposal: "Proposals",
  lessons: "Lessons",
};

export default async function QuoteTemplatesPage() {
  const supabase = await createClient();
  const { data: templates } = await supabase
    .from("quote_templates")
    .select("*")
    .order("sort_order", { ascending: true });

  const grouped = (templates ?? []).reduce<Record<string, QuoteTemplate[]>>((acc, t) => {
    (acc[t.category] ??= []).push(t);
    return acc;
  }, {});

  return (
    <div>
      <PageHeader
        title="Quote Templates"
        description="Productized packages clients can be quoted from in one click. Adjust pricing here as it changes."
      />

      <div className="space-y-8">
        {(Object.keys(CATEGORY_LABELS) as QuoteTemplateCategory[]).map((category) => {
          const items = grouped[category];
          if (!items?.length) return null;
          return (
            <div key={category}>
              <h2 className="font-semibold text-lg mb-3">{CATEGORY_LABELS[category]}</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {items.map((t) => (
                  <Card key={t.id} className={t.status === "archived" ? "opacity-50" : ""}>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="font-medium">{t.name}</p>
                      <p className="font-semibold whitespace-nowrap">{formatCents(t.price_cents)}</p>
                    </div>
                    {t.performance_time && (
                      <p className="text-xs text-muted mb-1">{t.performance_time}</p>
                    )}
                    {t.description && <p className="text-sm text-muted">{t.description}</p>}
                    <div className="mt-3">
                      <QuoteTemplateEditor template={t} />
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
