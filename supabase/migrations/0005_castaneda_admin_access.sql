-- Castaneda Strings access hardening.
-- IMPORTANT: enroll your owner in cs_admin_members immediately after applying.
-- No auth user is granted business access automatically.
create table if not exists cs_admin_members (
  auth_user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','admin','staff','viewer')),
  created_at timestamptz not null default now()
);
alter table cs_admin_members enable row level security;
create policy cs_admin_self_read on cs_admin_members for select
  using (auth_user_id=auth.uid());
-- Owner provisioning happens through Supabase SQL editor/service role; NOT user input.

create or replace function cs_is_admin()
returns boolean language sql stable security definer
set search_path=public
as $$
  select exists (
    select 1 from cs_admin_members where auth_user_id=auth.uid()
  )
$$;
revoke all on function cs_is_admin() from public, anon;
grant execute on function cs_is_admin() to authenticated;

-- These old anon policies allowed a browser with only the anon key to list
-- ALL customer documents, rather than just the token in a URL. All public
-- document reads already use server-side service role with opaque ids.
drop policy if exists public_read_quotes on quotes;
drop policy if exists public_read_quote_items on quote_items;
drop policy if exists public_read_invoices on invoices;
drop policy if exists public_read_invoice_items on invoice_items;
drop policy if exists public_read_contracts on contracts;

-- Remove authenticated-wide access and replace with explicit admin membership.
do $$
declare t text; p text;
begin
  foreach t in array ARRAY['clients','inquiries','quotes','quote_items',
     'invoices','invoice_items','contract_templates','contracts',
     'email_templates','communications','activity_logs','settings',
     'quote_templates','cs_quote_projects']
  loop
    if to_regclass('public.'||t) is not null then
      for p in select policyname from pg_policies
        where schemaname='public' and tablename=t
      loop
        execute format('drop policy if exists %I on public.%I',p,t);
      end loop;
      execute format('create policy cs_staff_access on public.%I for all using (cs_is_admin()) with check (cs_is_admin())',t);
    end if;
  end loop;
end $$;
