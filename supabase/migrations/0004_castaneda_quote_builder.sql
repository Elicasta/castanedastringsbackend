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
