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

-- Transactional draft replacement. The server validates shape with Zod first;
-- the database locks, checks authorization, and writes the header + items together.
create or replace function update_cs_quote_draft(
 p_quote_id uuid, p_expected_updated_at timestamptz, p_quote jsonb
) returns void language plpgsql security definer set search_path=public as $$
declare q quotes%rowtype; v_subtotal bigint; v_discount bigint; v_tax bigint;
begin
 if not cs_is_admin() then raise exception 'Not authorized'; end if;
 select * into q from quotes where id=p_quote_id for update;
 if not found or q.status <> 'draft' then raise exception 'Only draft quotes may be edited'; end if;
 if q.updated_at <> p_expected_updated_at then raise exception 'Quote changed in another session. Refresh and retry'; end if;
 if coalesce(jsonb_array_length(p_quote->'items'),0)>100 then raise exception 'Too many items'; end if;
 if exists(select 1 from jsonb_to_recordset(p_quote->'items')
   as i(name text, quantity numeric,unit_price_cents bigint,item_kind text,range_max_cents bigint)
   where trim(coalesce(name,''))='' or quantity<=0 or quantity>10000
     or unit_price_cents<0 or unit_price_cents>2147483647
     or (range_max_cents is not null and range_max_cents<unit_price_cents)
     or item_kind not in ('standard','optional','client_selection'))
 then raise exception 'Invalid line items'; end if;
 if (p_quote->>'cs_project_id') is not null
   and not exists(select 1 from cs_quote_projects where id=(p_quote->>'cs_project_id')::uuid and client_id=q.client_id)
 then raise exception 'Project must belong to the client'; end if;
 v_discount := greatest(0,(p_quote->>'discount_cents')::bigint);
 v_tax := greatest(0,(p_quote->>'tax_cents')::bigint);
 delete from quote_items where quote_id=p_quote_id;
 insert into quote_items(quote_id,name,description,quantity,unit_price_cents,total_cents,sort_order,item_kind,selected,selection_group,range_max_cents,taxable)
 select p_quote_id, x.name,x.description,x.quantity,x.unit_price_cents,
   round(x.quantity*x.unit_price_cents)::integer,(x.ordinality-1)::int,
   x.item_kind,(x.item_kind='standard'),x.selection_group,x.range_max_cents,coalesce(x.taxable,false)
 from jsonb_to_recordset(p_quote->'items') with ordinality as x(
   name text,description text,quantity numeric,unit_price_cents bigint,
   item_kind text,selected boolean,selection_group text,range_max_cents bigint,taxable boolean,
   ordinality bigint);
 select coalesce(sum(total_cents),0) into v_subtotal from quote_items where quote_id=p_quote_id and selected;
 if v_discount>v_subtotal then raise exception 'Discount exceeds subtotal'; end if;
 update quotes set
  cs_project_id=nullif(p_quote->>'cs_project_id','')::uuid,
  title=trim(p_quote->>'title'),event_type=nullif(p_quote->>'event_type',''),
  event_date=nullif(p_quote->>'event_date','')::date,location_name=nullif(p_quote->>'location_name',''),
  valid_until=nullif(p_quote->>'valid_until','')::date,
  notes_to_client=nullif(p_quote->>'notes_to_client',''),internal_notes=nullif(p_quote->>'internal_notes',''),
  auto_create_invoice=coalesce((p_quote->>'auto_create_invoice')::boolean,true),
  reminders_enabled=coalesce((p_quote->>'reminders_enabled')::boolean,false),
  reminder_days_before=coalesce((p_quote->>'reminder_days_before')::integer,2),
  subtotal_cents=v_subtotal,discount_cents=v_discount,tax_cents=v_tax,
  total_cents=greatest(0,v_subtotal-v_discount+v_tax)
 where id=p_quote_id;
end $$;
-- This function depends on cs_is_admin() from migration 0005.
revoke all on function update_cs_quote_draft(uuid,timestamptz,jsonb) from public, anon;
grant execute on function update_cs_quote_draft(uuid,timestamptz,jsonb) to authenticated;
