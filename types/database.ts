/**
 * STUB. Replace this entire file by running, after your Supabase project
 * exists and migrations are pushed:
 *
 *   npx supabase gen types typescript --project-id <your-project-ref> > types/database.ts
 *
 * Until then this intentionally widens to `any` on the row level so the
 * rest of the codebase compiles. Don't ship to production without
 * regenerating this — you lose all column-name type safety until you do.
 */
export type Database = {
  public: {
    Tables: Record<string, { Row: any; Insert: any; Update: any }>;
    Functions: Record<string, { Args: any; Returns: any }>;
  };
};
