-- 0011_employee_roles_and_assignments.sql
--
-- Brings the role model in line with the actual access rule: owner sees
-- everything, photographer and creative_director get scoped access to
-- creative work and zero access to money, full stop. This file only adds
-- enum values and columns/tables. The actual enforcement is migration 0012
-- — adding a role here does nothing by itself, RLS has to be taught to
-- care about it, which is the next file.

-- New enum values must land in their own migration, separate from anything
-- that uses them, or Postgres will reject the reference in the same
-- transaction. That's why this is its own file with nothing else enum-related.
alter type admin_role add value if not exists 'photographer';
alter type admin_role add value if not exists 'creative_director';

create table project_assignments (
  id          uuid primary key default gen_random_uuid(),
  studio_id   uuid not null references studios(id) on delete cascade,
  project_id  uuid not null references projects(id) on delete cascade,
  employee_id uuid not null references admin_users(id) on delete cascade,
  role_on_project text, -- free text, e.g. 'lead photographer', 'second shooter'
  created_at  timestamptz not null default now(),
  constraint uq_project_assignment unique (project_id, employee_id)
);
create index idx_project_assignments_project on project_assignments(project_id);
create index idx_project_assignments_employee on project_assignments(employee_id);

-- Segmentation for email campaigns (Phase 2, per the platform map's build
-- order). The column costs nothing to add now and is painful to backfill
-- once there are hundreds of client rows with no tags on them.
alter table clients add column if not exists tags text[] not null default '{}';
create index idx_clients_tags on clients using gin (tags);

-- Manual Pixieset gallery link. This is the one field in this entire system
-- that touches Pixieset, and it's just a URL, no API, no scraping. Pasted
-- in by the admin after creating the gallery in the Pixieset dashboard.
alter table projects add column if not exists gallery_url text;

-- Lets the admin UI show "sent by [name]" for staff messages, and gives the
-- creative-director "flag for review" workflow (open decision, not yet
-- chosen) something concrete to attach to later instead of free-text only.
alter table project_messages add column if not exists sender_admin_user_id uuid references admin_users(id);

alter table project_mood_board_items add column if not exists uploaded_by uuid references admin_users(id);
