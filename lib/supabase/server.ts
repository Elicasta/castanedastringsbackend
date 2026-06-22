import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';

/**
 * Use this in Server Components, Server Actions, and Route Handlers that
 * run on behalf of a signed-in admin user. It reads the admin's session
 * from cookies, so RLS policies (studio_id = current_studio_id()) apply
 * automatically. This client can NEVER see another studio's data, even if
 * the code calling it has a bug. That guarantee is the point of using this
 * client instead of the service role client for anything admin-facing.
 */
export function createAdminClient() {
  const cookieStore = cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options) {
          try {
            cookieStore.set(name, value, options);
          } catch {
            // Called from a Server Component, not an Action/Route Handler.
            // Next.js middleware refreshes the session instead. Safe to ignore.
          }
        },
        remove(name: string, options) {
          try {
            cookieStore.set(name, '', options);
          } catch {
            // Same as above.
          }
        },
      },
    }
  );
}
