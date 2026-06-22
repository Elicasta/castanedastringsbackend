import 'server-only';
import { createAdminClient } from '@/lib/supabase/server';

export type CurrentAdmin = {
  id: string;
  studioId: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'team' | 'viewer' | 'photographer' | 'creative_director';
};

/**
 * Returns null if there's no session or no matching admin_users row.
 * Middleware already keeps signed-out users out of /admin, so null here
 * almost always means the auth user exists but has no admin_users row yet
 * (e.g. a Supabase Auth user created without the matching profile row).
 */
export async function getCurrentAdmin(): Promise<CurrentAdmin | null> {
  const supabase = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('admin_users')
    .select('id, studio_id, name, email, role')
    .eq('auth_user_id', user.id)
    .single();

  if (!data) return null;

  return {
    id: data.id,
    studioId: data.studio_id,
    name: data.name,
    email: data.email,
    role: data.role,
  };
}
