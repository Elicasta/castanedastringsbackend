'use server';

import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/server';

export async function signIn(formData: { email: string; password: string }) {
  const supabase = createAdminClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: formData.email,
    password: formData.password,
  });

  if (error) {
    return { ok: false as const, error: error.message };
  }
  return { ok: true as const };
}

export async function signOut() {
  const supabase = createAdminClient();
  await supabase.auth.signOut();
  redirect('/admin/login');
}
