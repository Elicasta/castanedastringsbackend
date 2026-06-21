-- Castaneda Strings Admin: initial schema
create extension if not exists "pgcrypto";

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============ CLIENTS ============
create table clients (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  full_name text generated always as (trim(first_name || ' ' || last_name)) stored,
  email text,
  phone text,
  instagram_handle text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_clients_updated_at before update on clients
  for each row execute function set_updated_at();
create index idx_clients_email on clients(email);

-- ============ INQUIRIES ============
create table inquiries (
  id uuid primary key default gen_random_uuid(),
  public_id text unique not null,
  client_id uuid references clients(id) on delete set null,
  source text,
  status text not null default 'new' check (status in ('new','awaiting_response','quoted','booked','cancelled','archived')),
  event_type text,
  event_date date,
  event_start_time time,
  event_end_time time,
  location_name text,
  location_address text,
  guest_count integer,
  requested_services text,
  message text,
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_inquiries_updated_at before update on inquiries
  for each row execute function set_updated_at();
create index idx_inquiries_client_id on inquiries(client_id);
create index idx_inquiries_status on inquiries(status);
create index idx_inquiries_created_at on inquiries(created_at);
create unique index idx_inquiries_public_id on inquiries(public_id);

-- ============ QUOTES ============
create table quotes (
  id uuid primary key default gen_random_uuid(),
  public_id text unique not null,
  inquiry_id uuid references inquiries(id) on delete set null,
  client_id uuid references clients(id) on delete set null,
  quote_number text unique,
  status text not null default 'draft' check (status in ('draft','sent','pending','accepted','declined','cancelled','expired')),
  title text not null default 'Performance Quote',
  event_type text,
  event_date date,
  location_name text,
  subtotal_cents integer not null default 0,
  discount_cents integer not null default 0,
  tax_cents integer not null default 0,
  total_cents integer not null default 0,
  currency text not null default 'usd',
  valid_until date,
  accepted_at timestamptz,
  cancelled_at timestamptz,
  notes_to_client text,
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_quotes_updated_at before update on quotes
  for each row execute function set_updated_at();
create index idx_quotes_client_id on quotes(client_id);
create index idx_quotes_inquiry_id on quotes(inquiry_id);
create index idx_quotes_status on quotes(status);
create index idx_quotes_created_at on quotes(created_at);
create unique index idx_quotes_public_id on quotes(public_id);

create table quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references quotes(id) on delete cascade,
  name text not null,
  description text,
  quantity numeric not null default 1,
  unit_price_cents integer not null default 0,
  total_cents integer not null default 0,
  sort_order integer not null default 0
);
create index idx_quote_items_quote_id on quote_items(quote_id);

-- ============ INVOICES ============
create table invoices (
  id uuid primary key default gen_random_uuid(),
  public_id text unique not null,
  quote_id uuid references quotes(id) on delete set null,
  inquiry_id uuid references inquiries(id) on delete set null,
  client_id uuid references clients(id) on delete set null,
  invoice_number text unique,
  status text not null default 'draft' check (status in ('draft','sent','payment_pending','paid','past_due','cancelled','refunded')),
  subtotal_cents integer not null default 0,
  discount_cents integer not null default 0,
  tax_cents integer not null default 0,
  total_cents integer not null default 0,
  amount_paid_cents integer not null default 0,
  balance_due_cents integer not null default 0,
  currency text not null default 'usd',
  due_date date,
  paid_at timestamptz,
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  zelle_reference text,
  payment_method text check (payment_method in ('stripe','zelle','cash','check','other')),
  pdf_url text,
  notes_to_client text,
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_invoices_updated_at before update on invoices
  for each row execute function set_updated_at();
create index idx_invoices_client_id on invoices(client_id);
create index idx_invoices_quote_id on invoices(quote_id);
create index idx_invoices_status on invoices(status);
create index idx_invoices_created_at on invoices(created_at);
create unique index idx_invoices_public_id on invoices(public_id);

create table invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices(id) on delete cascade,
  name text not null,
  description text,
  quantity numeric not null default 1,
  unit_price_cents integer not null default 0,
  total_cents integer not null default 0,
  sort_order integer not null default 0
);
create index idx_invoice_items_invoice_id on invoice_items(invoice_id);

-- ============ CONTRACT TEMPLATES / CONTRACTS ============
create table contract_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text not null default 'active' check (status in ('active','archived')),
  body text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_contract_templates_updated_at before update on contract_templates
  for each row execute function set_updated_at();

create table contracts (
  id uuid primary key default gen_random_uuid(),
  public_id text unique not null,
  contract_template_id uuid references contract_templates(id) on delete set null,
  inquiry_id uuid references inquiries(id) on delete set null,
  quote_id uuid references quotes(id) on delete set null,
  invoice_id uuid references invoices(id) on delete set null,
  client_id uuid references clients(id) on delete set null,
  status text not null default 'draft' check (status in ('draft','sent','pending','signed','cancelled')),
  title text not null default 'Performance Agreement',
  body text not null default '',
  sent_at timestamptz,
  signed_at timestamptz,
  signer_name text,
  signer_email text,
  signer_ip text,
  signer_user_agent text,
  signature_text text,
  pdf_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_contracts_updated_at before update on contracts
  for each row execute function set_updated_at();
create index idx_contracts_client_id on contracts(client_id);
create index idx_contracts_quote_id on contracts(quote_id);
create index idx_contracts_invoice_id on contracts(invoice_id);
create index idx_contracts_status on contracts(status);
create index idx_contracts_created_at on contracts(created_at);
create unique index idx_contracts_public_id on contracts(public_id);

-- ============ EMAIL TEMPLATES ============
create table email_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  subject text not null,
  body text not null,
  status text not null default 'active' check (status in ('active','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_email_templates_updated_at before update on email_templates
  for each row execute function set_updated_at();

-- ============ COMMUNICATIONS ============
create table communications (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete set null,
  inquiry_id uuid references inquiries(id) on delete set null,
  quote_id uuid references quotes(id) on delete set null,
  invoice_id uuid references invoices(id) on delete set null,
  contract_id uuid references contracts(id) on delete set null,
  channel text not null check (channel in ('email','phone','text','note','system')),
  direction text not null default 'outbound' check (direction in ('inbound','outbound','internal')),
  subject text,
  body text,
  resend_email_id text,
  status text not null default 'logged' check (status in ('draft','sent','delivered','failed','received','logged')),
  created_at timestamptz not null default now()
);
create index idx_communications_client_id on communications(client_id);
create index idx_communications_created_at on communications(created_at);

-- ============ ACTIVITY LOGS ============
create table activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor text not null default 'admin',
  action text not null,
  entity_type text not null,
  entity_id uuid,
  description text,
  created_at timestamptz not null default now()
);
create index idx_activity_logs_entity on activity_logs(entity_type, entity_id);
create index idx_activity_logs_created_at on activity_logs(created_at);

-- ============ SETTINGS ============
create table settings (
  id uuid primary key default gen_random_uuid(),
  business_name text not null default 'Castaneda Strings',
  business_email text,
  business_phone text,
  business_address text,
  zelle_name text,
  zelle_email text,
  zelle_phone text,
  stripe_account_enabled boolean not null default false,
  default_invoice_due_days integer not null default 7,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_settings_updated_at before update on settings
  for each row execute function set_updated_at();
insert into settings (business_name) values ('Castaneda Strings');

-- ============ SEQUENTIAL NUMBERING ============
create sequence quote_number_seq start 1;
create sequence invoice_number_seq start 1;

create or replace function next_quote_number() returns text language plpgsql as $$
declare n int;
begin
  n := nextval('quote_number_seq');
  return 'CS-Q-' || lpad(n::text, 4, '0');
end;
$$;

create or replace function next_invoice_number() returns text language plpgsql as $$
declare n int;
begin
  n := nextval('invoice_number_seq');
  return 'CS-INV-' || lpad(n::text, 4, '0');
end;
$$;

-- ============ PAST DUE HELPER ============
create or replace function mark_past_due_invoices() returns int language plpgsql as $$
declare affected int;
begin
  update invoices
    set status = 'past_due'
    where status in ('sent','payment_pending')
      and due_date is not null
      and due_date < current_date;
  get diagnostics affected = row_count;
  return affected;
end;
$$;

-- ============ RLS ============
alter table clients enable row level security;
alter table inquiries enable row level security;
alter table quotes enable row level security;
alter table quote_items enable row level security;
alter table invoices enable row level security;
alter table invoice_items enable row level security;
alter table contract_templates enable row level security;
alter table contracts enable row level security;
alter table email_templates enable row level security;
alter table communications enable row level security;
alter table activity_logs enable row level security;
alter table settings enable row level security;

-- Admin (authenticated) full access
create policy admin_all_clients on clients for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy admin_all_inquiries on inquiries for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy admin_all_quotes on quotes for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy admin_all_quote_items on quote_items for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy admin_all_invoices on invoices for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy admin_all_invoice_items on invoice_items for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy admin_all_contract_templates on contract_templates for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy admin_all_contracts on contracts for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy admin_all_email_templates on email_templates for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy admin_all_communications on communications for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy admin_all_activity_logs on activity_logs for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy admin_all_settings on settings for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Public read-only by public_id (anon role). Actual row selection is filtered in app code by public_id;
-- this policy allows anon to SELECT only these tables, app queries always filter on public_id.
create policy public_read_quotes on quotes for select using (auth.role() = 'anon');
create policy public_read_quote_items on quote_items for select using (auth.role() = 'anon');
create policy public_read_invoices on invoices for select using (auth.role() = 'anon');
create policy public_read_invoice_items on invoice_items for select using (auth.role() = 'anon');
create policy public_read_contracts on contracts for select using (auth.role() = 'anon');

-- Public mutation: quote accept/decline, invoice paid-via-stripe-webhook (service role bypasses RLS anyway),
-- contract signing. We intentionally do NOT grant anon UPDATE here — all public mutations
-- go through server actions using the service-role client, which bypasses RLS after
-- the server action itself validates public_id + allowed status transitions.
