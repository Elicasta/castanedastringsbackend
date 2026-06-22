-- 0003_clients_and_inquiries.sql

create table clients (
  id                       uuid primary key default gen_random_uuid(),
  studio_id                uuid not null references studios(id) on delete cascade,
  first_name               text not null,
  last_name                text not null,
  email                    text not null,
  phone                    text,
  instagram_handle         text,
  preferred_contact_method text,
  notes                    text,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);
create index idx_clients_studio on clients(studio_id);
create index idx_clients_email on clients(studio_id, email);
create trigger trg_clients_updated_at before update on clients
  for each row execute function set_updated_at();

create type inquiry_type as enum (
  'maternity', 'newborn', 'family', 'couples', 'engagement',
  'branding', 'headshots', 'wedding', 'event', 'custom'
);

create type inquiry_status as enum (
  'inquiry_received', 'inquiry_reviewed', 'archived', 'cancelled'
);

create table inquiries (
  id                   uuid primary key default gen_random_uuid(),
  studio_id            uuid not null references studios(id) on delete cascade,
  client_id            uuid not null references clients(id) on delete cascade,
  inquiry_type         inquiry_type not null,
  session_type         text,
  preferred_date       date,
  preferred_timeframe  text,
  location_preference  text,
  vision_text          text,
  pinterest_url        text,
  referral_source      text,
  raw_form_data        jsonb not null default '{}'::jsonb,
  status               inquiry_status not null default 'inquiry_received',
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index idx_inquiries_studio on inquiries(studio_id);
create index idx_inquiries_client on inquiries(client_id);
create index idx_inquiries_status on inquiries(studio_id, status);
create trigger trg_inquiries_updated_at before update on inquiries
  for each row execute function set_updated_at();
