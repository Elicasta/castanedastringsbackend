'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/server';

export async function updateClientNotes(clientId: string, notes: string) {
  const supabase = createAdminClient();
  await supabase.from('clients').update({ notes }).eq('id', clientId);
  revalidatePath(`/admin/clients/${clientId}`);
  return { ok: true as const };
}

export async function updateClientTags(clientId: string, tags: string[]) {
  const supabase = createAdminClient();
  await supabase.from('clients').update({ tags }).eq('id', clientId);
  revalidatePath(`/admin/clients/${clientId}`);
  return { ok: true as const };
}
