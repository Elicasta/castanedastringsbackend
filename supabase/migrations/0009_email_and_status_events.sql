-- 0009_email_and_status_events.sql

create table email_templates (
  id          uuid primary key default gen_random_uuid(),
  studio_id   uuid not null references studios(id) on delete cascade,
  name        text not null,
  subject     text not null,
  body        text not null,
  trigger_key text not null, -- e.g. 'quote_sent', 'not_yet_booked_reminder', 'portal_setup'
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index idx_email_templates_studio on email_templates(studio_id);
create unique index idx_email_templates_trigger on email_templates(studio_id, trigger_key);
create trigger trg_email_templates_updated_at before update on email_templates
  for each row execute function set_updated_at();

create type email_log_status as enum ('queued', 'sent', 'delivered', 'failed');

create table email_logs (
  id                 uuid primary key default gen_random_uuid(),
  studio_id          uuid not null references studios(id) on delete cascade,
  client_id          uuid references clients(id) on delete set null,
  inquiry_id         uuid references inquiries(id) on delete set null,
  quote_id           uuid references quotes(id) on delete set null,
  contract_id        uuid references contracts(id) on delete set null,
  invoice_id         uuid references invoices(id) on delete set null,
  booking_id         uuid references bookings(id) on delete set null,
  project_id         uuid references projects(id) on delete set null,
  resend_message_id  text,
  to_email           text not null,
  subject            text not null,
  status             email_log_status not null default 'queued',
  error_message      text,
  created_at         timestamptz not null default now()
);
create index idx_email_logs_studio on email_logs(studio_id, created_at desc);
create index idx_email_logs_client on email_logs(client_id);

-- One append-only table for every meaningful state change across the whole
-- system. entity_type/entity_id is a loose polymorphic reference on purpose
-- (status_events shouldn't need a migration every time a new entity type
-- shows up) — admin dashboard "recent activity" reads straight from this.
create table status_events (
  id           uuid primary key default gen_random_uuid(),
  studio_id    uuid not null references studios(id) on delete cascade,
  entity_type  text not null, -- 'inquiry' | 'quote' | 'contract' | 'invoice' | 'booking' | 'project'
  entity_id    uuid not null,
  event_type   text not null, -- 'quote_accepted', 'invoice_paid_stripe', 'contract_signed', ...
  title        text not null,
  description  text,
  metadata     jsonb not null default '{}'::jsonb,
  created_by   uuid references admin_users(id) on delete set null, -- null = system/client action
  created_at   timestamptz not null default now()
);
create index idx_status_events_studio on status_events(studio_id, created_at desc);
create index idx_status_events_entity on status_events(entity_type, entity_id);

create or replace function log_status_event(
  p_studio_id   uuid,
  p_entity_type text,
  p_entity_id   uuid,
  p_event_type  text,
  p_title       text,
  p_description text default null,
  p_metadata    jsonb default '{}'::jsonb,
  p_created_by  uuid default null
)
returns uuid as $$
declare
  v_id uuid;
begin
  insert into status_events (
    studio_id, entity_type, entity_id, event_type, title, description, metadata, created_by
  ) values (
    p_studio_id, p_entity_type, p_entity_id, p_event_type, p_title, p_description, p_metadata, p_created_by
  ) returning id into v_id;
  return v_id;
end;
$$ language plpgsql security definer;
