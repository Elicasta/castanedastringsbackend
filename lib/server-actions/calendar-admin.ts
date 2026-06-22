'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/server';
import { getCurrentAdmin } from '@/lib/server-actions/current-admin';

export async function createAvailabilityRule(formData: FormData) {
  const admin = await getCurrentAdmin();
  if (!admin) return;

  const supabase = createAdminClient();
  await supabase.from('availability_rules').insert({
    studio_id: admin.studioId,
    name: String(formData.get('name') ?? 'Availability'),
    day_of_week: Number(formData.get('day_of_week')),
    start_time: String(formData.get('start_time')),
    end_time: String(formData.get('end_time')),
    slot_duration_minutes: Number(formData.get('slot_duration_minutes') ?? 60),
    buffer_before_minutes: Number(formData.get('buffer_before_minutes') ?? 0),
    buffer_after_minutes: Number(formData.get('buffer_after_minutes') ?? 0),
  });

  revalidatePath('/admin/calendar');
}

export async function deleteAvailabilityRule(ruleId: string) {
  const supabase = createAdminClient();
  await supabase.from('availability_rules').delete().eq('id', ruleId);
  revalidatePath('/admin/calendar');
}

export async function createBlackout(formData: FormData) {
  const admin = await getCurrentAdmin();
  if (!admin) return;

  const supabase = createAdminClient();
  await supabase.from('availability_blackouts').insert({
    studio_id: admin.studioId,
    title: String(formData.get('title') ?? 'Blocked'),
    starts_at: String(formData.get('starts_at')),
    ends_at: String(formData.get('ends_at')),
    reason: String(formData.get('reason') ?? ''),
  });

  revalidatePath('/admin/calendar');
}

export async function deleteBlackout(blackoutId: string) {
  const supabase = createAdminClient();
  await supabase.from('availability_blackouts').delete().eq('id', blackoutId);
  revalidatePath('/admin/calendar');
}
