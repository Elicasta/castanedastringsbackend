'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/server';

export async function updateProjectStatusLight(projectId: string, light: 'red' | 'yellow' | 'green') {
  const supabase = createAdminClient();
  await supabase.from('projects').update({ status_light: light }).eq('id', projectId);
  revalidatePath(`/admin/projects/${projectId}`);
}

export async function updateProjectDetails(
  projectId: string,
  updates: { session_vision?: string; session_notes?: string; gallery_url?: string }
) {
  const supabase = createAdminClient();
  await supabase.from('projects').update(updates).eq('id', projectId);
  revalidatePath(`/admin/projects/${projectId}`);
  return { ok: true as const };
}

export async function addProjectProp(projectId: string, formData: FormData) {
  const supabase = createAdminClient();
  const { data: existing } = await supabase.from('project_props').select('sort_order').eq('project_id', projectId).order('sort_order', { ascending: false }).limit(1);
  const nextSort = (existing?.[0]?.sort_order ?? -1) + 1;

  await supabase.from('project_props').insert({
    project_id: projectId,
    name: String(formData.get('name')),
    sort_order: nextSort,
  });
  revalidatePath(`/admin/projects/${projectId}`);
}

export async function togglePropChecked(propId: string, projectId: string, checked: boolean) {
  const supabase = createAdminClient();
  await supabase.from('project_props').update({ checked }).eq('id', propId);
  revalidatePath(`/admin/projects/${projectId}`);
}
