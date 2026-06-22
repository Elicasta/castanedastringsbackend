-- 0014_platform_map_alignment.sql
-- Keeps the existing ECSET schema, but aligns it with the EC Creative Studio Platform map.
-- Important: Pixieset remains gallery delivery only. The only Pixieset-touching field is projects.gallery_url.

-- ---------- clients: campaign segmentation / CRM metadata ----------
alter table clients add column if not exists source text;
alter table clients add column if not exists status text not null default 'lead';
alter table clients add column if not exists tags text[] not null default '{}';
create index if not exists idx_clients_tags on clients using gin (tags);

-- ---------- projects: planning state / manual gallery delivery ----------
alter table projects add column if not exists status text not null default 'inquiry';
alter table projects add column if not exists gallery_url text;
alter table projects add column if not exists delivery_due_date date;

alter table projects drop constraint if exists chk_projects_status;
alter table projects add constraint chk_projects_status check (
  status in ('inquiry', 'invoice_sent', 'planning', 'booked', 'delivered', 'archived')
);

-- ---------- calendar feed tokens ----------
-- Bookings remain the source of truth for scheduled sessions. This token table powers:
-- GET /api/calendar-feed/[token].ics
create table if not exists calendar_feed_tokens (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references studios(id) on delete cascade,
  token text unique not null default encode(gen_random_bytes(24), 'hex'),
  name text not null default 'Studio Calendar Feed',
  scope text not null default 'studio' check (scope in ('studio', 'client', 'employee')),
  client_id uuid references clients(id) on delete cascade,
  employee_id uuid references admin_users(id) on delete cascade,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists idx_calendar_feed_tokens_studio on calendar_feed_tokens(studio_id);
create unique index if not exists idx_calendar_feed_tokens_token on calendar_feed_tokens(token);

alter table calendar_feed_tokens enable row level security;
drop policy if exists "studio read" on calendar_feed_tokens;
drop policy if exists "owners and admins manage calendar feeds" on calendar_feed_tokens;
create policy "studio read" on calendar_feed_tokens
  for select using (studio_id = current_studio_id());
create policy "owners and admins manage calendar feeds" on calendar_feed_tokens
  for all using (studio_id = current_studio_id() and current_admin_role() in ('owner', 'admin'))
  with check (studio_id = current_studio_id() and current_admin_role() in ('owner', 'admin'));

-- ---------- campaign primitives ----------
-- Resend Audiences/Broadcasts can be wired against these tables later. For v1,
-- clients.tags is the segmentation source of truth.
create table if not exists campaign_templates (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references studios(id) on delete cascade,
  name text not null,
  subject text not null,
  body text not null,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_campaign_templates_updated_at before update on campaign_templates
  for each row execute function set_updated_at();
create index if not exists idx_campaign_templates_studio on campaign_templates(studio_id);

create table if not exists campaigns (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references studios(id) on delete cascade,
  name text not null,
  segment_tag text not null,
  subject text not null,
  body text not null,
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'sent', 'cancelled')),
  resend_audience_id text,
  resend_broadcast_id text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_campaigns_updated_at before update on campaigns
  for each row execute function set_updated_at();
create index if not exists idx_campaigns_studio on campaigns(studio_id);
create index if not exists idx_campaigns_segment_tag on campaigns(studio_id, segment_tag);

create table if not exists campaign_events (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references studios(id) on delete cascade,
  campaign_id uuid references campaigns(id) on delete cascade,
  client_id uuid references clients(id) on delete set null,
  event_type text not null check (event_type in ('sent','delivered','opened','clicked','bounced','complained','unsubscribed')),
  resend_event_id text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_campaign_events_campaign on campaign_events(campaign_id, created_at desc);
create index if not exists idx_campaign_events_client on campaign_events(client_id, created_at desc);

alter table campaign_templates enable row level security;
alter table campaigns enable row level security;
alter table campaign_events enable row level security;

drop policy if exists "studio read" on campaign_templates;
drop policy if exists "studio write insert" on campaign_templates;
drop policy if exists "studio write update" on campaign_templates;
drop policy if exists "studio write delete" on campaign_templates;
create policy "studio read" on campaign_templates for select using (studio_id = current_studio_id());
create policy "studio write insert" on campaign_templates for insert with check (studio_id = current_studio_id() and current_admin_role() in ('owner', 'admin'));
create policy "studio write update" on campaign_templates for update using (studio_id = current_studio_id() and current_admin_role() in ('owner', 'admin'));
create policy "studio write delete" on campaign_templates for delete using (studio_id = current_studio_id() and current_admin_role() = 'owner');

drop policy if exists "studio read" on campaigns;
drop policy if exists "studio write insert" on campaigns;
drop policy if exists "studio write update" on campaigns;
drop policy if exists "studio write delete" on campaigns;
create policy "studio read" on campaigns for select using (studio_id = current_studio_id());
create policy "studio write insert" on campaigns for insert with check (studio_id = current_studio_id() and current_admin_role() in ('owner', 'admin'));
create policy "studio write update" on campaigns for update using (studio_id = current_studio_id() and current_admin_role() in ('owner', 'admin'));
create policy "studio write delete" on campaigns for delete using (studio_id = current_studio_id() and current_admin_role() = 'owner');

drop policy if exists "studio read" on campaign_events;
drop policy if exists "system insert campaign events" on campaign_events;
create policy "studio read" on campaign_events for select using (studio_id = current_studio_id());
-- Inserts for campaign webhook/event ingestion should use the service role client.

-- ---------- platform map notes ----------
comment on column projects.gallery_url is 'Manual Pixieset gallery link. No Pixieset API calls, scraping, or iframe retheming.';
comment on table project_assignments is 'Role-scoped employee assignment table. Photographers see assigned projects only after RLS migration 0012.';
comment on table campaigns is 'Campaign composer/send tracking shell. Resend Audiences/Broadcasts integration plugs in here.';
