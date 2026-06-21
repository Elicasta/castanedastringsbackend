-- v2: quote template catalog, expanded contract fields, client portal access.

-- ============ CLIENT PORTAL ACCESS ============
-- Every client gets a stable, secret link to a portal page listing all of
-- their quotes/invoices/contracts in one place. No login needed — the link
-- itself is the credential, same pattern as quote/invoice/contract public_ids.
alter table clients add column portal_public_id text unique
  default ('portal_' || encode(gen_random_bytes(16), 'hex'));

-- Backfill existing clients with a portal id (random hex, no JS dependency needed in SQL).
update clients
  set portal_public_id = 'portal_' || encode(gen_random_bytes(16), 'hex')
  where portal_public_id is null;

alter table clients alter column portal_public_id set not null;
create unique index idx_clients_portal_public_id on clients(portal_public_id);

-- ============ QUOTE TEMPLATES ============
-- Productized, click-to-use starting points for new quotes. Admin can adjust
-- price/items after picking one — this just removes the blank-page problem.
create table quote_templates (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('wedding', 'private_celebration', 'corporate', 'proposal', 'lessons')),
  name text not null,
  price_cents integer not null,
  performance_time text,
  description text,
  includes text,
  recommended_for text,
  status text not null default 'active' check (status in ('active', 'archived')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_quote_templates_updated_at before update on quote_templates
  for each row execute function set_updated_at();
create index idx_quote_templates_category on quote_templates(category);

alter table quote_templates enable row level security;
create policy admin_all_quote_templates on quote_templates for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

insert into quote_templates (category, name, price_cents, performance_time, description, includes, recommended_for, sort_order) values
-- Wedding Collections
('wedding', 'Ceremony Collection', 49500, null,
  'Perfect for intimate weddings and couples looking for elegant live music during their ceremony.',
  E'Guest arrival prelude music\nProcessional music\nBridal entrance\nUnity ceremony music (if applicable)\nRecessional music\nCoordination with planner or officiant\nCustom song selections',
  'Ceremony-only weddings, elopements, church weddings, and intimate celebrations.', 1),
('wedding', 'Signature Wedding Collection', 79500, 'Up to 2.5 hours',
  'Our most popular wedding experience.',
  E'Full ceremony music\nCocktail hour performance\nCustom song selections\nPlanner coordination\nTimeline consultation',
  'Couples wanting a complete ceremony and cocktail hour experience.', 2),
('wedding', 'Luxury Wedding Collection', 129500, 'Up to 4 hours',
  'A complete live music experience designed for luxury weddings and elevated celebrations.',
  E'Ceremony music\nCocktail hour performance\nReception highlights\nMultiple custom song selections\nPlanner collaboration\nPremium event support',
  'Luxury weddings, destination weddings, and full-event coverage.', 3),
-- Private Celebrations
('private_celebration', 'Essential Event', 40000, 'Up to 1 hour',
  'Up to 1 hour of live violin performance.', null,
  'Baby showers, bridal showers, birthday parties, baptisms, anniversaries, intimate gatherings, church events, and private dinners.', 4),
('private_celebration', 'Classic Event', 70000, 'Up to 2 hours',
  'Up to 2 hours of live violin performance.', null,
  'Larger celebrations requiring music throughout guest arrival, dining, or social time.', 5),
('private_celebration', 'Signature Event', 90000, 'Up to 3 hours',
  'Up to 3 hours of live violin performance.', null,
  'Quinceaneras, engagement parties, milestone birthdays, holiday gatherings, and larger family celebrations.', 6),
('private_celebration', 'Premium Event', 120000, 'Up to 4 hours',
  'Up to 4 hours of live violin performance.', null,
  'Large-scale celebrations, private luxury events, and all-day experiences.', 7),
-- Corporate & Brand
('corporate', 'Corporate & Brand Experience', 50000, 'Up to 1 hour',
  'Up to 1 hour of live performance.', null,
  'Brand launches, networking events, luxury retail activations, grand openings, content events, and corporate receptions.', 8),
('corporate', 'Corporate & Brand Signature', 90000, 'Up to 2 hours',
  'Up to 2 hours of live performance.', null,
  'Company celebrations, conferences, client appreciation events, influencer activations, and upscale networking experiences.', 9),
('corporate', 'Corporate & Brand Premium', 120000, 'Up to 3 hours',
  'Up to 3 hours of live performance.', null,
  'Multi-segment events requiring music throughout the guest experience.', 10),
('corporate', 'Corporate & Brand Full Experience', 150000, 'Up to 4 hours',
  'Up to 4 hours of live performance.', null,
  'Luxury corporate functions, gala events, fundraising events, and large-scale brand experiences.', 11),
-- Proposals
('proposal', 'Proposal Essential', 50000, 'Up to 45 minutes onsite',
  'A romantic live violin performance for your proposal moment.',
  E'Custom proposal song\nArrival coordination\nUp to 45 minutes onsite',
  null, 12),
('proposal', 'Premium Proposal Experience', 72500, 'Up to 90 minutes onsite',
  'A fully curated proposal experience.',
  E'Custom proposal song\nExtended performance time\nCoordination with planner or photographer\nMultiple song selections\nUp to 90 minutes onsite',
  null, 13),
-- Lessons
('lessons', 'Private Violin Lessons', 20000, 'One 60-minute lesson per week',
  'Monthly violin lessons, beginner through intermediate.',
  E'One 60-minute lesson per week\nFour lessons per month\nPersonalized instruction\nBeginner through intermediate levels\nNo long-term contract required — pause or cancel with notice',
  null, 14);

-- ============ CONTRACT DETAIL FIELDS ============
-- Service flags, deposit/balance split, planner contact, and song requests —
-- captured per-contract so the agreement reflects exactly what was booked.
alter table contracts add column service_ceremony boolean not null default false;
alter table contracts add column service_cocktail_hour boolean not null default false;
alter table contracts add column service_reception boolean not null default false;
alter table contracts add column service_proposal boolean not null default false;
alter table contracts add column service_corporate boolean not null default false;
alter table contracts add column service_custom_song boolean not null default false;
alter table contracts add column deposit_amount_cents integer;
alter table contracts add column balance_due_cents integer;
alter table contracts add column planner_name text;
alter table contracts add column planner_phone text;
alter table contracts add column song_requests text;
alter table contracts add column client_signature text;

-- public contract pages need to read/write these alongside the existing columns;
-- no new RLS policy needed since contracts already has admin_all + public_read policies.
