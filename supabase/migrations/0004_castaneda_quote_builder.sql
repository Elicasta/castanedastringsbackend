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

