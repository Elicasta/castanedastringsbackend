-- 0002_studios_and_admin_users.sql

create table studios (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger trg_studios_updated_at before update on studios
  for each row execute function set_updated_at();

create type admin_role as enum ('owner', 'admin', 'team', 'viewer');

create table admin_users (
  id            uuid primary key default gen_random_uuid(),
  studio_id     uuid not null references studios(id) on delete cascade,
  auth_user_id  uuid not null unique references auth.users(id) on delete cascade,
  name          text not null,
  email         text not null,
  role          admin_role not null default 'team',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index idx_admin_users_studio on admin_users(studio_id);
create trigger trg_admin_users_updated_at before update on admin_users
  for each row execute function set_updated_at();

-- Returns the studio_id of the currently authenticated admin user.
-- Every RLS policy from here on filters on studio_id = current_studio_id().
-- SECURITY DEFINER: lets this function read admin_users even though
-- admin_users itself has RLS enabled (avoids policy recursion).
create or replace function current_studio_id()
returns uuid as $$
  select studio_id from admin_users where auth_user_id = auth.uid() limit 1;
$$ language sql security definer stable;
