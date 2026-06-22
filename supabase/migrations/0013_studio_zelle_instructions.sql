-- 0013_studio_zelle_instructions.sql
--
-- Spec calls for "Zelle payment instructions" as a studio setting. No
-- /admin/settings page exists yet to edit this through, so it's a plain
-- column for now — editable directly in the database (or the Supabase
-- table editor) until settings gets built. The public invoice page reads
-- this column directly.
--
-- Uses a column DEFAULT rather than an UPDATE against existing rows: in a
-- fresh deploy, migrations run before seed.sql, so an UPDATE here would hit
-- zero rows (the studio doesn't exist yet) and silently do nothing. A
-- DEFAULT applies correctly no matter what order things run in.

alter table studios add column if not exists zelle_instructions text
  default 'Send payment via Zelle to payments@eccreativestudios.com. Include your invoice number in the memo so we can match it quickly.';
