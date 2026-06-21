import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role client. Bypasses RLS entirely.
 *
 * ONLY use this for:
 *  - public client-facing pages (/q, /i, /c) where we manually validate
 *    public_id + allowed status transitions before any mutation
 *  - the Stripe webhook
 *
 * Never expose this client or its key to the browser.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
