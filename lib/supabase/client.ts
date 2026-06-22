import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

/**
 * Browser client for admin dashboard client components (forms, realtime
 * subscriptions, etc). Still goes through the anon key + RLS, same as
 * createAdminClient on the server. Never import this into anything under
 * app/(public)/* — public/token routes don't use Supabase from the client
 * at all, see lib/supabase/service-role.ts and the architecture note in
 * supabase/migrations/0010_rls_policies.sql.
 */
export function createBrowserSupabaseClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
