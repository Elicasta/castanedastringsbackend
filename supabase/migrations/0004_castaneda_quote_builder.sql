-- Castaneda Strings quote builder, additive migration.
-- This is for the Castaneda Strings schema (quotes.total_cents, quote_items).
-- Do not apply to the archived EC Creative schema.
do $$ begin
 if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='quotes' and column_name='total_cents')
 then raise exception 'Castaneda Strings migration requires quotes.total_cents. Check database target before deploying.'; end if;
end $$;
create table if not exists cs_quote_projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  created_at timestamptz not null default now()
);
create index if not exists idx_cs_quote_projects_client on cs_quote_projects(client_id);
alter table cs_quote_projects enable row level security;
create policy cs_quote_projects_admin on cs_quote_projects for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

alter table quotes add column if not exists cs_project_id uuid references cs_quote_projects(id) on delete set null;
alter table quotes add column if not exists auto_create_invoice boolean not null default true;
alter table quotes add column if not exists reminders_enabled boolean not null default false;
alter table quotes add column if not exists reminder_days_before int not null default 2
  check (reminder_days_before between 1 and 30);

alter table quote_items add column if not exists item_kind text not null default 'standard'
  check (item_kind in ('standard','optional','client_selection'));
alter table quote_items add column if not exists selection_group text;
alter table quote_items add column if not exists selected boolean not null default true;
alter table quote_items add column if not exists range_max_cents integer;
alter table quote_items add column if not exists taxable boolean not null default false;
alter table quote_items add constraint cs_quote_item_range_valid
  check (range_max_cents is null or range_max_cents >= unit_price_cents);
create index if not exists idx_quote_items_quote_kind on quote_items(quote_id, item_kind);

-- Prevent multiple invoice and contract drafts if quote acceptance is retried.
create unique index if not exists ux_cs_invoices_quote_id on invoices(quote_id) where quote_id is not null;
create unique index if not exists ux_cs_contracts_quote_id on contracts(quote_id) where quote_id is not null;

-- Atomically accepts one quote and its customer-selected options.
-- Row locking means double-tapping accept cannot create two accepted transitions.
create or replace function accept_cs_quote(p_public_id text, p_selected_item_ids uuid[] default '{}'::uuid[])
returns uuid
language plpgsql security definer
set search_path=public
as $$
declare q quotes%rowtype;
declare v_subtotal bigint;
declare v_selected_count int;
begin
  if p_selected_item_ids is null then p_selected_item_ids := '{}'::uuid[]; end if;
  select * into q from quotes where public_id=p_public_id for update;
  if not found then raise exception 'Quote not found'; end if;
  if q.status <> 'pending' then raise exception 'Quote already answered'; end if;
  if q.valid_until is not null and q.valid_until < current_date then raise exception 'Quote expired'; end if;

  -- Reject unknown, required, or duplicated selected ids.
  if cardinality(p_selected_item_ids) <> (select count(distinct u.id) from unnest(p_selected_item_ids) as u(id))
     or exists (select 1 from unnest(p_selected_item_ids) as u(id)
        left join quote_items i on i.id=u.id and i.quote_id=q.id and i.item_kind <> 'standard'
        where i.id is null)
  then raise exception 'Invalid quote selections'; end if;

  -- Exactly one choice per named group, optional add-ons may be multi-selected.
  if exists (
    select 1 from quote_items i
    where i.quote_id=q.id and i.item_kind='client_selection' and i.id=any(p_selected_item_ids)
    group by coalesce(nullif(i.selection_group,''),'default')
    having count(*) > 1
  ) then raise exception 'Choose only one option in each group'; end if;

  update quote_items
    set selected = (item_kind='standard' or id=any(p_selected_item_ids))
    where quote_id=q.id;

  select coalesce(sum(i.total_cents),0) into v_subtotal
    from quote_items i where i.quote_id=q.id and i.selected;
  if not exists(select 1 from quote_items where quote_id=q.id and selected)
  then raise exception 'Choose at least one quote item'; end if;

  update quotes set status='accepted', accepted_at=now(),
    subtotal_cents=v_subtotal,
    total_cents=greatest(0,v_subtotal-q.discount_cents+q.tax_cents)
  where id=q.id;

  return q.id;
end $$;
revoke all on function accept_cs_quote(text,uuid[]) from public, anon, authenticated;
grant execute on function accept_cs_quote(text,uuid[]) to service_role;

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
