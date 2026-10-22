import 'server-only';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { sendTransactionalEmail } from '@/lib/email/send';

export type InquiryType =
  | 'maternity' | 'newborn' | 'family' | 'couples' | 'engagement'
  | 'branding' | 'headshots' | 'wedding' | 'event' | 'custom';

export type InquiryInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  instagramHandle?: string;
  preferredContactMethod?: string;
  inquiryType: InquiryType;
  preferredDate?: string;
  preferredTimeframe?: string;
  locationPreference?: string;
  visionText?: string;
  pinterestUrl?: string;
  referralSource?: string;
};

type SubmitResult = { ok: true } | { ok: false; error: string };

/**
 * Looks up the one studio that exists right now. Multi-studio routing
 * (subdomain or slug-based) isn't built yet — the `studios` table already
 * supports it, this is just the seam where that logic plugs in later
 * instead of a schema change. Hardcoded to EC Creative's seeded slug for now.
 */
async function getDefaultStudioId(supabase: ReturnType<typeof createServiceRoleClient>) {
  const { data } = await supabase
    .from('studios')
    .select('id')
    .eq('slug', 'ec-creative-studios')
    .single();
  return data?.id ?? null;
}

export async function submitInquiry(input: InquiryInput): Promise<SubmitResult> {
  const supabase = createServiceRoleClient();

  const studioId = await getDefaultStudioId(supabase);
  if (!studioId) {
    return { ok: false, error: 'Studio not found. Run supabase/seed/seed.sql first.' };
  }

  // Find existing client by email within this studio, or create a new one.
  // A returning client re-inquiring shouldn't fork into a duplicate client row.
  const { data: existingClient } = await supabase
    .from('clients')
    .select('id')
    .eq('studio_id', studioId)
    .eq('email', input.email)
    .maybeSingle();

  let clientId = existingClient?.id;

  if (!clientId) {
    const { data: newClient, error: clientError } = await supabase
      .from('clients')
      .insert({
        studio_id: studioId,
        first_name: input.firstName,
        last_name: input.lastName,
        email: input.email,
        phone: input.phone ?? null,
        instagram_handle: input.instagramHandle ?? null,
        preferred_contact_method: input.preferredContactMethod ?? null,
      })
      .select('id')
      .single();

    if (clientError || !newClient) {
      return { ok: false, error: 'Could not save your information. Please try again.' };
    }
    clientId = newClient.id;
  }

  const { data: inquiry, error: inquiryError } = await supabase
    .from('inquiries')
    .insert({
      studio_id: studioId,
      client_id: clientId,
      inquiry_type: input.inquiryType,
      session_type: input.inquiryType,
      preferred_date: input.preferredDate || null,
      preferred_timeframe: input.preferredTimeframe ?? null,
      location_preference: input.locationPreference ?? null,
      vision_text: input.visionText ?? null,
      pinterest_url: input.pinterestUrl ?? null,
      referral_source: input.referralSource ?? null,
      raw_form_data: input,
      status: 'inquiry_received',
    })
    .select('id')
    .single();

  if (inquiryError || !inquiry) {
    return { ok: false, error: 'Could not submit your inquiry. Please try again.' };
  }

  await supabase.rpc('log_status_event', {
    p_studio_id: studioId,
    p_entity_type: 'inquiry',
    p_entity_id: inquiry.id,
    p_event_type: 'inquiry_received',
    p_title: `New ${input.inquiryType} inquiry from ${input.firstName} ${input.lastName}`,
  });

  // Notify every owner/admin on the studio. Photographers/creative directors
  // don't get this — inquiries are a sales-stage concern, not yet a project.
  const { data: notifyTargets } = await supabase
    .from('admin_users')
    .select('email')
    .eq('studio_id', studioId)
    .in('role', ['owner', 'admin']);

  for (const target of notifyTargets ?? []) {
    await sendTransactionalEmail({
      studioId,
      triggerKey: 'inquiry_received',
      toEmail: target.email,
      relatedIds: { client_id: clientId, inquiry_id: inquiry.id },
      data: { firstName: input.firstName, lastName: input.lastName, inquiryType: input.inquiryType },
    });
  }

  return { ok: true };
}
