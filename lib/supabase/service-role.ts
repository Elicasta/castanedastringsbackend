import 'server-only';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

/**
 * Service role client. Bypasses RLS completely. This is intentional and is
 * the ONLY client used by:
 *   - /quote/[token], /contract/[token], /invoice/[token], /book/[token],
 *     /client/[slug] route handlers and server actions
 *   - the Stripe webhook handler
 *   - admin server actions that need to write status_events / cross-studio
 *     system operations
 *
 * The `import 'server-only'` line makes Next.js throw a build error if this
 * file is ever imported from a Client Component. That is the actual safety
 * net here, not RLS — RLS does not apply to this client at all.
 *
 * Every function that uses this client MUST validate its own access control
 * in code (token match, studio_id match) before returning data. There is no
 * database-level backstop once you're holding this client.
 */
export function createServiceRoleClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
