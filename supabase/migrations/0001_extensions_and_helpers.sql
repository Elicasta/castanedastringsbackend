-- 0001_extensions_and_helpers.sql
-- Extensions + the one helper every table needs (updated_at trigger).

create extension if not exists "pgcrypto";   -- gen_random_uuid()
create extension if not exists "btree_gist"; -- exclusion constraint -> no double booking

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;
