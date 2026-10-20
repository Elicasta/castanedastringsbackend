'use server';

import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { sendSessionVisionNotification } from '@/lib/email/session-vision-template';
import type { FormData } from '@/app/(public)/inquire/types';
import type { InquiryType } from '@/lib/server-actions/inquiries';

type SubmitResult = { ok: true } | { ok: false; error: string };

async function getDefaultStudioId(supabase: ReturnType<typeof createServiceRoleClient>) {
  const { data } = await supabase.from('studios').select('id').eq('slug', 'ec-creative-studios').single();
  return data?.id ?? null;
}

function splitName(fullName: string): { firstName: string; lastName: string } {
  const trimmed = fullName.trim();
  const firstSpace = trimmed.indexOf(' ');
  if (firstSpace === -1) return { firstName: trimmed, lastName: '' };
  return { firstName: trimmed.slice(0, firstSpace), lastName: trimmed.slice(firstSpace + 1) };
}

/**
 * The form's `uploadedFiles` (raw File objects) never reach the server —
 * page.tsx strips them before the fetch/action call, same as the original
 * reference build did. `uploadedFileNames` (just the names) does come
 * through and gets stored. Actual file storage is a real gap, not silently
 * dropped: see README "Known limitations" once this gets wired to Supabase
 * Storage for real uploads.
 */
export async function submitSessionVisionInquiry(
  formData: Omit<FormData, 'uploadedFiles'>
): Promise<SubmitResult> {
  const supabase = createServiceRoleClient();

  const studioId = await getDefaultStudioId(supabase);
  if (!studioId) {
    return { ok: false, error: 'Something went wrong on our end. Please try again or reach out directly.' };
  }

  const { firstName, lastName } = splitName(formData.fullName);

  const { data: existingClient } = await supabase
    .from('clients')
    .select('id')
    .eq('studio_id', studioId)
    .eq('email', formData.email)
    .maybeSingle();

  let clientId = existingClient?.id;

  if (!clientId) {
    const { data: newClient, error: clientError } = await supabase
      .from('clients')
      .insert({
        studio_id: studioId,
        first_name: firstName,
        last_name: lastName,
        email: formData.email,
        phone: formData.phone || null,
        instagram_handle: formData.instagramHandle || null,
      })
      .select('id')
      .single();

    if (clientError || !newClient) {
      return { ok: false, error: 'Could not save your information. Please try again.' };
    }
    clientId = newClient.id;
  }

  // The story-section answers are the closest thing to a single "vision"
  // statement — pulled together here so the admin inquiry list shows
  // something human-readable without opening the raw JSON every time.
  const visionText = [formData.meaningfulSeason, formData.rememberYearsFromNow, formData.oneImageFeeling]
    .filter(Boolean)
    .join('\n\n');

  const { data: inquiry, error: inquiryError } = await supabase
    .from('inquiries')
    .insert({
      studio_id: studioId,
      client_id: clientId,
      inquiry_type: formData.sessionType as InquiryType,
      session_type: formData.sessionType,
      preferred_timeframe: formData.preferredDates || null,
      location_preference: formData.environments.join(', ') || null,
      vision_text: visionText || null,
      pinterest_url: formData.inspirationLinks || null,
      raw_form_data: formData,
      status: 'inquiry_received',
    })
    .select('id')
    .single();

  if (inquiryError || !inquiry) {
    return { ok: false, error: 'Could not submit your session vision. Please try again.' };
  }

  await supabase.rpc('log_status_event', {
    p_studio_id: studioId,
    p_entity_type: 'inquiry',
    p_entity_id: inquiry.id,
    p_event_type: 'inquiry_received',
    p_title: `New ${formData.sessionType} session vision from ${formData.fullName}`,
  });

  const { data: notifyTargets } = await supabase
    .from('admin_users')
    .select('email')
    .eq('studio_id', studioId)
    .in('role', ['owner', 'admin']);

  for (const target of notifyTargets ?? []) {
    await sendSessionVisionNotification({
      studioId,
      toEmail: target.email,
      formData,
      relatedIds: { client_id: clientId, inquiry_id: inquiry.id },
    });
  }

  return { ok: true };
}
