import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/server';
import { suggestQuoteApproach } from '@/lib/server-actions/quote-advisor';
import { createQuoteFromInquiry } from '@/lib/server-actions/quotes-admin';

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value || (Array.isArray(value) && value.length === 0)) return null;
  return (
    <div className="mb-4">
      <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-sm text-neutral-800 whitespace-pre-wrap">{Array.isArray(value) ? value.join(', ') : value}</p>
    </div>
  );
}

export default async function InquiryDetailPage({ params }: { params: { id: string } }) {
  const supabase = createAdminClient();

  const { data: inquiry } = await supabase
    .from('inquiries')
    .select('*, clients(id, first_name, last_name, email, phone, instagram_handle)')
    .eq('id', params.id)
    .single();

  if (!inquiry) notFound();

  const client = inquiry.clients as any;
  const raw = (inquiry.raw_form_data ?? {}) as Record<string, any>;

  const advice = suggestQuoteApproach({
    inquiryType: inquiry.inquiry_type,
    locationPreference: inquiry.location_preference,
    visionText: inquiry.vision_text,
  });

  const { data: existingQuote } = await supabase
    .from('quotes')
    .select('id')
    .eq('inquiry_id', inquiry.id)
    .maybeSingle();

  return (
    <div className="max-w-3xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-neutral-900">
            {client.first_name} {client.last_name}
          </h1>
          <p className="text-sm text-neutral-500">{client.email} {client.phone ? `· ${client.phone}` : ''}</p>
        </div>
        {existingQuote ? (
          <a href={`/admin/quotes/${existingQuote.id}`} className="text-sm rounded-md bg-neutral-900 text-white px-4 py-2">
            View quote
          </a>
        ) : (
          <form action={createQuoteFromInquiry.bind(null, inquiry.id)}>
            <button type="submit" className="text-sm rounded-md bg-neutral-900 text-white px-4 py-2">
              Create quote
            </button>
          </form>
        )}
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 px-5 py-4 mb-6">
        <p className="text-xs font-medium text-amber-800 uppercase tracking-wide mb-1">Suggested approach</p>
        <p className="text-sm text-amber-900 font-medium">{advice.suggestedQuoteTemplateName}</p>
        <p className="text-sm text-amber-800 mt-1">{advice.suggestedFollowUp}</p>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white p-6">
        <Field label="Session Type" value={inquiry.session_type ?? inquiry.inquiry_type} />
        <Field label="Preferred Dates" value={raw.preferredDates ?? inquiry.preferred_timeframe} />
        <Field label="Instagram" value={client.instagram_handle ? `@${client.instagram_handle}` : null} />

        <Field label="Session Feeling" value={raw.sessionFeelings} />
        <Field label="Moments That Matter" value={raw.momentsThatMatter} />
        <Field label="What to Avoid" value={[...(raw.avoidFeelings ?? []), raw.avoidOther].filter(Boolean)} />

        <Field label="Environments" value={raw.environments} />
        <Field label="Colors & Textures" value={raw.colorsTextures} />
        <Field label="Inspiration Links" value={raw.inspirationLinks} />

        <Field label="Styling Guidance" value={raw.stylingGuidance} />
        <Field label="Wardrobe Direction" value={raw.wardrobeDirection} />
        <Field label="Movement Preference" value={raw.movementPreference} />
        <Field label="Nervous About" value={raw.nervousAbout} />

        <Field label="What makes this season meaningful" value={raw.meaningfulSeason} />
        <Field label="What they want to remember" value={raw.rememberYearsFromNow} />
        <Field label="The one image they hope exists" value={raw.oneImageFeeling} />
        <Field label="Why they chose EC Creative" value={raw.whyECCreative} />
      </div>
    </div>
  );
}
