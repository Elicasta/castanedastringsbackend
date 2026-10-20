-- 0008_projects.sql
-- A project (and therefore the client portal) is only ever created by the
-- confirmBooking server action, after status = 'booked' is true. There is
-- no UI path and no client-callable function that creates a project directly.

create type status_light as enum ('red', 'yellow', 'green');

create table projects (
  id              uuid primary key default gen_random_uuid(),
  studio_id       uuid not null references studios(id) on delete cascade,
  client_id       uuid not null references clients(id) on delete cascade,
  booking_id      uuid not null references bookings(id) on delete cascade,
  inquiry_id      uuid references inquiries(id) on delete set null,
  name            text not null,
  slug            text not null,
  session_type    text,
  session_title   text,
  session_vision  text,
  session_notes   text,
  status_light    status_light not null default 'yellow',
  portal_token    text not null unique,
  portal_sent_at  timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  -- One project per booking. Prevents the "build a project twice" race if
  -- the booking confirmation action is ever retried.
  constraint uq_projects_booking unique (booking_id)
);
create unique index idx_projects_studio_slug on projects(studio_id, slug);
create index idx_projects_client on projects(client_id);
create index idx_projects_token on projects(portal_token);
create trigger trg_projects_updated_at before update on projects
  for each row execute function set_updated_at();

create table project_props (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references projects(id) on delete cascade,
  name        text not null,
  notes       text,
  checked     boolean not null default false,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index idx_project_props_project on project_props(project_id);
create trigger trg_project_props_updated_at before update on project_props
  for each row execute function set_updated_at();

create table project_mood_board_items (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references projects(id) on delete cascade,
  title       text,
  image_url   text not null,
  source_url  text,
  notes       text,
  tags        text[] not null default '{}',
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index idx_mood_board_items_project on project_mood_board_items(project_id);
create trigger trg_mood_board_items_updated_at before update on project_mood_board_items
  for each row execute function set_updated_at();

create type project_document_type as enum (
  'invoice', 'quote', 'contract', 'inquiry_form', 'prep_guide', 'other'
);

create table project_documents (
  id             uuid primary key default gen_random_uuid(),
  project_id     uuid not null references projects(id) on delete cascade,
  document_type  project_document_type not null,
  title          text not null,
  source_id      uuid,   -- e.g. the invoices.id / quotes.id / contracts.id this points to
  source_table   text,   -- 'invoices' | 'quotes' | 'contracts' | 'inquiries' | null for uploaded files
  file_url       text,   -- set when there's a static file (prep guide PDF, etc)
  status         text,   -- mirrors the source record's status for display, refreshed on read
  sort_order     int not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index idx_project_documents_project on project_documents(project_id);
create trigger trg_project_documents_updated_at before update on project_documents
  for each row execute function set_updated_at();

create type message_sender_type as enum ('client', 'admin', 'system');

create table project_messages (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references projects(id) on delete cascade,
  sender_type  message_sender_type not null,
  sender_name  text not null,
  sender_email text,
  body         text not null,
  read_at      timestamptz,
  created_at   timestamptz not null default now()
);
create index idx_project_messages_project on project_messages(project_id, created_at desc);
