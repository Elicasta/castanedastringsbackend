-- 0006_invoices_and_payments.sql

create table invoice_templates (
  id            uuid primary key default gen_random_uuid(),
  studio_id     uuid not null references studios(id) on delete cascade,
  name          text not null,
  session_type  text,
  title         text not null,
  intro_text    text,
  terms_text    text,
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index idx_invoice_templates_studio on invoice_templates(studio_id);
create trigger trg_invoice_templates_updated_at before update on invoice_templates
  for each row execute function set_updated_at();

create type invoice_payment_status as enum (
  'draft', 'sent', 'viewed', 'payment_pending', 'paid',
  'past_due', 'cancelled', 'refunded'
);

create sequence invoice_number_seq start 1001;

create table invoices (
  id                          uuid primary key default gen_random_uuid(),
  studio_id                   uuid not null references studios(id) on delete cascade,
  client_id                   uuid not null references clients(id) on delete cascade,
  inquiry_id                  uuid references inquiries(id) on delete set null,
  quote_id                    uuid references quotes(id) on delete set null,
  contract_id                 uuid references contracts(id) on delete set null,
  invoice_number              text not null default ('INV-' || nextval('invoice_number_seq')::text),
  title                       text not null,
  intro_text                  text,
  subtotal                    numeric(10,2) not null default 0,
  discount_amount             numeric(10,2) not null default 0,
  tax_amount                  numeric(10,2) not null default 0,
  total                       numeric(10,2) not null default 0,
  amount_paid                 numeric(10,2) not null default 0,
  balance_due                 numeric(10,2) not null default 0,
  payment_status              invoice_payment_status not null default 'draft',
  payment_method              text, -- 'stripe' | 'zelle' | 'manual' | null until paid
  stripe_checkout_session_id  text,
  stripe_payment_intent_id    text,
  zelle_reference             text,
  due_date                    date,
  public_token                text not null unique,
  paid_at                     timestamptz,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);
create index idx_invoices_studio on invoices(studio_id);
create index idx_invoices_client on invoices(client_id);
create index idx_invoices_contract on invoices(contract_id);
create index idx_invoices_token on invoices(public_token);
create index idx_invoices_status on invoices(studio_id, payment_status);
create index idx_invoices_stripe_session on invoices(stripe_checkout_session_id);
create trigger trg_invoices_updated_at before update on invoices
  for each row execute function set_updated_at();

create type payment_provider as enum ('stripe', 'zelle', 'manual');
create type payment_status as enum ('pending', 'succeeded', 'failed', 'refunded');

create table payments (
  id                  uuid primary key default gen_random_uuid(),
  studio_id           uuid not null references studios(id) on delete cascade,
  invoice_id          uuid not null references invoices(id) on delete cascade,
  client_id           uuid not null references clients(id) on delete cascade,
  provider            payment_provider not null,
  provider_reference  text, -- stripe payment_intent id, zelle ref number, or null for manual
  amount              numeric(10,2) not null,
  status              payment_status not null default 'pending',
  raw_payload         jsonb not null default '{}'::jsonb, -- full stripe event / manual note
  paid_at             timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index idx_payments_studio on payments(studio_id);
create index idx_payments_invoice on payments(invoice_id);
create trigger trg_payments_updated_at before update on payments
  for each row execute function set_updated_at();

-- Stripe webhook idempotency: a given Stripe event/payment_intent should only
-- ever produce one succeeded payment row per invoice. This unique index is
-- the actual enforcement; the webhook handler also checks before inserting,
-- but this is the backstop if two webhook deliveries race each other.
create unique index idx_payments_provider_ref_unique
  on payments(invoice_id, provider, provider_reference)
  where provider_reference is not null;
