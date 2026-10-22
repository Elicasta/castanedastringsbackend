-- 0007_availability_and_bookings.sql

create table availability_rules (
  id                     uuid primary key default gen_random_uuid(),
  studio_id              uuid not null references studios(id) on delete cascade,
  name                   text not null,
  day_of_week            int not null check (day_of_week between 0 and 6), -- 0 = Sunday
  start_time             time not null,
  end_time               time not null,
  slot_duration_minutes  int not null default 60,
  buffer_before_minutes  int not null default 0,
  buffer_after_minutes   int not null default 0,
  active                 boolean not null default true,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);
create index idx_availability_rules_studio on availability_rules(studio_id);
create trigger trg_availability_rules_updated_at before update on availability_rules
  for each row execute function set_updated_at();

create table availability_blackouts (
  id          uuid primary key default gen_random_uuid(),
  studio_id   uuid not null references studios(id) on delete cascade,
  title       text not null,
  starts_at   timestamptz not null,
  ends_at     timestamptz not null,
  reason      text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index idx_availability_blackouts_studio on availability_blackouts(studio_id);
create trigger trg_availability_blackouts_updated_at before update on availability_blackouts
  for each row execute function set_updated_at();

create type booking_status as enum (
  'booking_ready', 'scheduled', 'booked', 'rescheduled', 'cancelled', 'completed'
);

create type calendar_sync_status as enum (
  'not_applicable', 'queued', 'synced', 'failed'
);

create table bookings (
  id                       uuid primary key default gen_random_uuid(),
  studio_id                uuid not null references studios(id) on delete cascade,
  client_id                uuid not null references clients(id) on delete cascade,
  inquiry_id               uuid references inquiries(id) on delete set null,
  quote_id                 uuid references quotes(id) on delete set null,
  contract_id              uuid references contracts(id) on delete set null,
  invoice_id               uuid references invoices(id) on delete set null,
  -- starts_at/ends_at are null while status = 'booking_ready' (client hasn't
  -- picked a date yet). They are required once status moves to 'booked'.
  starts_at                timestamptz,
  ends_at                  timestamptz,
  timezone                 text not null default 'America/New_York',
  location_name            text,
  location_address         text,
  apple_maps_url           text,
  google_maps_url          text,
  status                   booking_status not null default 'booking_ready',
  calendar_sync_status     calendar_sync_status not null default 'not_applicable',
  google_calendar_event_id text,
  ics_file_url             text,
  public_token             text not null unique,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),

  constraint chk_booked_has_time check (
    status not in ('booked', 'scheduled', 'completed') or (starts_at is not null and ends_at is not null)
  ),

  -- Generated range column powers the exclusion constraint below.
  time_range tstzrange generated always as (
    case when starts_at is not null and ends_at is not null
      then tstzrange(starts_at, ends_at, '[)')
      else null
    end
  ) stored
);
create index idx_bookings_studio on bookings(studio_id);
create index idx_bookings_client on bookings(client_id);
create index idx_bookings_invoice on bookings(invoice_id);
create index idx_bookings_token on bookings(public_token);
create index idx_bookings_status on bookings(studio_id, status);
create trigger trg_bookings_updated_at before update on bookings
  for each row execute function set_updated_at();

-- THE actual no-double-booking guarantee. Postgres will reject any insert/
-- update that creates two active bookings for the same studio with
-- overlapping time ranges. This holds even under concurrent requests,
-- which an application-level "check then insert" check does not.
-- Only enforced for statuses that represent a real calendar hold.
alter table bookings add constraint excl_no_double_booking
  exclude using gist (
    studio_id with =,
    time_range with &&
  )
  where (status in ('scheduled', 'booked', 'completed'));
