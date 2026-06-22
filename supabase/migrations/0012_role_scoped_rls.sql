-- 0012_role_scoped_rls.sql
--
-- This is the file that actually does what the platform map's access table
-- describes. Adding roles in 0011 changed nothing on its own — Postgres
-- doesn't know "photographer" means anything special until a policy says so.
--
-- Two rules being enforced here:
--   1. invoices and payments: owner/admin only. photographer and
--      creative_director get a 403-shaped nothing, not a filtered view —
--      there is no SELECT policy granting them any row, so the table is
--      unreachable for those roles even if the UI has a bug and tries.
--   2. projects (and everything that hangs off a project): photographer
--      only sees projects in project_assignments. creative_director and
--      owner/admin see all of the studio's projects. This applies to the
--      project itself plus props, mood board, documents, and messages —
--      same scoping, since they're all "is this person allowed to see this
--      client's creative work" questions.
--
-- Open decision from the platform map, NOT resolved here: whether
-- creative_director gets full send access to client chat or read-only with
-- a "flag for review" step. This migration gives creative_director full
-- read+write on project_messages, matching "oversight" at minimum. If the
-- answer comes back read-only, that's a one-policy change to this file,
-- not a schema change.

-- ---------- invoices: owner/admin only, no exceptions ----------
drop policy "studio read" on invoices;
drop policy "studio write insert" on invoices;
drop policy "studio write update" on invoices;
drop policy "studio write delete" on invoices;

create policy "financial roles only - select" on invoices
  for select using (studio_id = current_studio_id() and current_admin_role() in ('owner', 'admin'));
create policy "financial roles only - insert" on invoices
  for insert with check (studio_id = current_studio_id() and current_admin_role() in ('owner', 'admin'));
create policy "financial roles only - update" on invoices
  for update using (studio_id = current_studio_id() and current_admin_role() in ('owner', 'admin'));
create policy "financial roles only - delete" on invoices
  for delete using (studio_id = current_studio_id() and current_admin_role() = 'owner');

-- ---------- payments: same rule ----------
drop policy "studio read" on payments;
drop policy "studio write insert" on payments;
drop policy "studio write update" on payments;
drop policy "studio write delete" on payments;

create policy "financial roles only - select" on payments
  for select using (studio_id = current_studio_id() and current_admin_role() in ('owner', 'admin'));
create policy "financial roles only - insert" on payments
  for insert with check (studio_id = current_studio_id() and current_admin_role() in ('owner', 'admin'));
create policy "financial roles only - update" on payments
  for update using (studio_id = current_studio_id() and current_admin_role() in ('owner', 'admin'));
create policy "financial roles only - delete" on payments
  for delete using (studio_id = current_studio_id() and current_admin_role() = 'owner');

-- ---------- project_assignments ----------
alter table project_assignments enable row level security;
create policy "studio read" on project_assignments
  for select using (studio_id = current_studio_id());
create policy "owners and admins manage assignments" on project_assignments
  for all using (studio_id = current_studio_id() and current_admin_role() in ('owner', 'admin'));

-- Helper: does the current admin have visibility into this specific project?
-- owner/admin/creative_director/team/viewer -> any project in their studio.
-- photographer -> only projects they're explicitly assigned to.
create or replace function can_view_project(p_project_id uuid)
returns boolean as $$
  select case
    when current_admin_role() = 'photographer' then
      exists (
        select 1 from project_assignments pa
        where pa.project_id = p_project_id and pa.employee_id = (
          select id from admin_users where auth_user_id = auth.uid()
        )
      )
    else true
  end;
$$ language sql security definer stable;

-- ---------- projects ----------
drop policy "studio read" on projects;
drop policy "studio write insert" on projects;
drop policy "studio write update" on projects;
drop policy "studio write delete" on projects;

create policy "scoped read" on projects
  for select using (studio_id = current_studio_id() and can_view_project(id));
create policy "owners and admins create projects" on projects
  for insert with check (studio_id = current_studio_id() and current_admin_role() in ('owner', 'admin'));
create policy "scoped update" on projects
  for update using (
    studio_id = current_studio_id()
    and can_view_project(id)
    and current_admin_role() != 'viewer'
  );
create policy "owners and admins delete projects" on projects
  for delete using (studio_id = current_studio_id() and current_admin_role() in ('owner', 'admin'));

-- ---------- project_props, project_mood_board_items, project_messages ----------
-- Same scoping as projects: visible if you can view the parent project.
-- No financial sensitivity in these tables, so no document_type filtering
-- needed here (that's specific to project_documents, below).
do $$
declare
  t text;
  tables text[] := array['project_props', 'project_mood_board_items', 'project_messages'];
begin
  foreach t in array tables loop
    execute format('drop policy "studio read via project" on %I;', t);
    execute format('drop policy "studio write insert via project" on %I;', t);
    execute format('drop policy "studio write update via project" on %I;', t);
    execute format('drop policy "studio write delete via project" on %I;', t);

    execute format($f$
      create policy "scoped read via project" on %I
      for select using (
        exists (
          select 1 from projects p
          where p.id = %I.project_id and p.studio_id = current_studio_id() and can_view_project(p.id)
        )
      );
    $f$, t, t);

    execute format($f$
      create policy "scoped write insert via project" on %I
      for insert with check (
        exists (
          select 1 from projects p
          where p.id = %I.project_id and p.studio_id = current_studio_id() and can_view_project(p.id)
        )
        and current_admin_role() != 'viewer'
      );
    $f$, t, t);

    execute format($f$
      create policy "scoped write update via project" on %I
      for update using (
        exists (
          select 1 from projects p
          where p.id = %I.project_id and p.studio_id = current_studio_id() and can_view_project(p.id)
        )
        and current_admin_role() != 'viewer'
      );
    $f$, t, t);

    execute format($f$
      create policy "scoped write delete via project" on %I
      for delete using (
        exists (
          select 1 from projects p
          where p.id = %I.project_id and p.studio_id = current_studio_id() and can_view_project(p.id)
        )
        and current_admin_role() in ('owner', 'admin')
      );
    $f$, t, t);
  end loop;
end $$;

-- ---------- project_documents: same project scoping, PLUS hide the
-- invoice document card from photographer and creative_director. Quote/
-- contract/inquiry/prep-guide cards stay visible to them — judgment call,
-- flagged in the comment block at the top of this file. ----------
drop policy "studio read via project" on project_documents;
drop policy "studio write insert via project" on project_documents;
drop policy "studio write update via project" on project_documents;
drop policy "studio write delete via project" on project_documents;

create policy "scoped read via project, financials hidden" on project_documents
  for select using (
    exists (
      select 1 from projects p
      where p.id = project_documents.project_id and p.studio_id = current_studio_id() and can_view_project(p.id)
    )
    and (
      document_type != 'invoice'
      or current_admin_role() in ('owner', 'admin')
    )
  );

create policy "scoped write insert via project" on project_documents
  for insert with check (
    exists (
      select 1 from projects p
      where p.id = project_documents.project_id and p.studio_id = current_studio_id() and can_view_project(p.id)
    )
    and current_admin_role() in ('owner', 'admin')
  );

create policy "scoped write update via project" on project_documents
  for update using (
    exists (
      select 1 from projects p
      where p.id = project_documents.project_id and p.studio_id = current_studio_id() and can_view_project(p.id)
    )
    and current_admin_role() in ('owner', 'admin')
  );

create policy "scoped write delete via project" on project_documents
  for delete using (
    exists (
      select 1 from projects p
      where p.id = project_documents.project_id and p.studio_id = current_studio_id() and can_view_project(p.id)
    )
    and current_admin_role() in ('owner', 'admin')
  );
