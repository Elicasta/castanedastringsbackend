-- 0005_contracts.sql

create table contract_templates (
  id            uuid primary key default gen_random_uuid(),
  studio_id     uuid not null references studios(id) on delete cascade,
  name          text not null,
  session_type  text,
  title         text not null,
  body          text not null,
  merge_fields  jsonb not null default '[]'::jsonb, -- ["client_name", "session_date", ...]
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index idx_contract_templates_studio on contract_templates(studio_id);
create trigger trg_contract_templates_updated_at before update on contract_templates
  for each row execute function set_updated_at();

create type contract_status as enum (
  'contract_drafted', 'contract_sent', 'contract_viewed', 'contract_signed'
);

create table contracts (
  id                    uuid primary key default gen_random_uuid(),
  studio_id             uuid not null references studios(id) on delete cascade,
  client_id             uuid not null references clients(id) on delete cascade,
  inquiry_id            uuid references inquiries(id) on delete set null,
  quote_id              uuid references quotes(id) on delete set null,
  contract_template_id  uuid references contract_templates(id) on delete set null,
  title                 text not null,
  body                  text not null,
  status                contract_status not null default 'contract_drafted',
  public_token          text not null unique,
  signed_name           text,
  signed_email          text,
  signature_data        text, -- base64 signature image or typed signature string
  signed_at             timestamptz,
  ip_address            text,
  user_agent            text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create index idx_contracts_studio on contracts(studio_id);
create index idx_contracts_client on contracts(client_id);
create index idx_contracts_quote on contracts(quote_id);
create index idx_contracts_token on contracts(public_token);
create index idx_contracts_status on contracts(studio_id, status);
create trigger trg_contracts_updated_at before update on contracts
  for each row execute function set_updated_at();

-- Note on "client signs contract twice": there's nothing to constrain at the
-- DB level here (id is already unique). The guard belongs in the server
-- action: signContract() must check status = 'contract_sent'/'contract_viewed'
-- before writing, and return the existing signed record unchanged if the
-- contract is already 'contract_signed'. See lib/server-actions/contracts.ts.
