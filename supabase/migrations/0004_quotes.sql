-- 0004_quotes.sql

create table quote_templates (
  id              uuid primary key default gen_random_uuid(),
  studio_id       uuid not null references studios(id) on delete cascade,
  name            text not null,
  session_type    text,
  title           text not null,
  description     text,
  story_intro     text,
  default_terms   text,
  default_items   jsonb not null default '[]'::jsonb, -- [{name, description, quantity, unit_price}]
  active          boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index idx_quote_templates_studio on quote_templates(studio_id);
create trigger trg_quote_templates_updated_at before update on quote_templates
  for each row execute function set_updated_at();

create type quote_status as enum (
  'quote_drafted', 'quote_sent', 'quote_viewed',
  'quote_accepted', 'quote_declined', 'quote_expired'
);

create table quotes (
  id                 uuid primary key default gen_random_uuid(),
  studio_id          uuid not null references studios(id) on delete cascade,
  client_id          uuid not null references clients(id) on delete cascade,
  inquiry_id         uuid references inquiries(id) on delete set null,
  quote_template_id  uuid references quote_templates(id) on delete set null,
  title              text not null,
  story_intro        text,
  description        text,
  subtotal           numeric(10,2) not null default 0,
  discount_amount    numeric(10,2) not null default 0,
  tax_amount         numeric(10,2) not null default 0,
  total              numeric(10,2) not null default 0,
  status             quote_status not null default 'quote_drafted',
  public_token       text not null unique,
  accepted_at        timestamptz,
  declined_at        timestamptz,
  expires_at         timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index idx_quotes_studio on quotes(studio_id);
create index idx_quotes_client on quotes(client_id);
create index idx_quotes_inquiry on quotes(inquiry_id);
create index idx_quotes_token on quotes(public_token);
create index idx_quotes_status on quotes(studio_id, status);
create trigger trg_quotes_updated_at before update on quotes
  for each row execute function set_updated_at();

create table quote_line_items (
  id          uuid primary key default gen_random_uuid(),
  quote_id    uuid not null references quotes(id) on delete cascade,
  name        text not null,
  description text,
  quantity    numeric(10,2) not null default 1,
  unit_price  numeric(10,2) not null default 0,
  total       numeric(10,2) not null default 0,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index idx_quote_line_items_quote on quote_line_items(quote_id);
create trigger trg_quote_line_items_updated_at before update on quote_line_items
  for each row execute function set_updated_at();
