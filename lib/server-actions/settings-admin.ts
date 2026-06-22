'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/server';
import { getCurrentAdmin } from '@/lib/server-actions/current-admin';

export async function updateStudioSettings(formData: FormData) {
  const admin = await getCurrentAdmin();
  if (!admin) return { ok: false as const, error: 'Not signed in.' };

  // Only owner/admin should be able to change studio-wide settings —
  // photographer/creative_director roles exist for production work, not
  // business configuration.
  if (admin.role !== 'owner' && admin.role !== 'admin') {
    return { ok: false as const, error: 'Only owners and admins can change studio settings.' };
  }

  const supabase = createAdminClient();
  await supabase
    .from('studios')
    .update({
      name: String(formData.get('name')),
      zelle_instructions: String(formData.get('zelle_instructions') ?? ''),
    })
    .eq('id', admin.studioId);

  revalidatePath('/admin/settings');
  return { ok: true as const };
}
