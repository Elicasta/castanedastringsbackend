-- 0010_rls_policies.sql
--
-- SECURITY MODEL, READ THIS FIRST:
--
-- 1. Every table below has RLS enabled with NO anon policies at all.
--    The anon key can do nothing against these tables. Full stop.
--
-- 2. Admin dashboard access uses Supabase Auth (authenticated role).
--    Every policy scopes to studio_id = current_studio_id(), which resolves
--    the signed-in admin's studio via admin_users.auth_user_id = auth.uid().
--    An admin literally cannot query another studio's row, RLS blocks it
--    at the database level regardless of what the app code does.
--
-- 3. Public token pages (/quote/[token], /contract/[token], /invoice/[token],
--    /book/[token], /client/[slug]) NEVER talk to Supabase from the browser
--    and never use the anon key for data. They are server actions / route
--    handlers that use the SERVICE ROLE key, manually verify the token
--    matches the requested record, and return only that record. Service
--    role bypasses RLS entirely, which is fine here because the token check
--    in application code is the actual access control for that path.
--
-- 4. Stripe webhooks run server-side only with the service role key.
--    There is intentionally no path for a browser to mark an invoice paid.

create or replace function current_admin_role()
returns admin_role as $$
  select role from admin_users where auth_user_id = auth.uid() limit 1;
$$ language sql security definer stable;

-- ---------- studios ----------
alter table studios enable row level security;

create policy "admins read own studio" on studios
  for select using (id = current_studio_id());

create policy "owners update own studio" on studios
  for update using (id = current_studio_id() and current_admin_role() = 'owner');

-- ---------- admin_users ----------
alter table admin_users enable row level security;

create policy "admins read own studio team" on admin_users
  for select using (studio_id = current_studio_id());

create policy "owners and admins manage team" on admin_users
  for insert with check (studio_id = current_studio_id() and current_admin_role() in ('owner', 'admin'));

create policy "owners and admins update team" on admin_users
  for update using (studio_id = current_studio_id() and current_admin_role() in ('owner', 'admin'));

create policy "owners remove team" on admin_users
  for delete using (studio_id = current_studio_id() and current_admin_role() = 'owner');

-- ---------- generic studio-scoped tables ----------
-- Same shape for every remaining table: admins can fully manage rows that
-- belong to their studio, viewers can read but not write (enforced via role
-- check on the write policies), nobody else can do anything.

do $$
declare
  t text;
  -- NOTE: quote_line_items, project_props, project_mood_board_items,
  -- project_documents, project_messages are deliberately NOT in this list.
  -- They have no studio_id column of their own (they join through quotes/
  -- projects), so they get their own policies further down this file.
  tables text[] := array[
    'clients', 'inquiries',
    'quote_templates', 'quotes',
    'contract_templates', 'contracts',
    'invoice_templates', 'invoices', 'payments',
    'availability_rules', 'availability_blackouts', 'bookings',
    'projects',
    'email_templates', 'email_logs', 'status_events'
  ];
begin
  foreach t in array tables loop
    execute format('alter table %I enable row level security;', t);

    execute format($f$
      create policy "studio read" on %I
      for select using (studio_id = current_studio_id());
    $f$, t);

    execute format($f$
      create policy "studio write insert" on %I
      for insert with check (
        studio_id = current_studio_id() and current_admin_role() != 'viewer'
      );
    $f$, t);

    execute format($f$
      create policy "studio write update" on %I
      for update using (
        studio_id = current_studio_id() and current_admin_role() != 'viewer'
      );
    $f$, t);

    execute format($f$
      create policy "studio write delete" on %I
      for delete using (
        studio_id = current_studio_id() and current_admin_role() in ('owner', 'admin')
      );
    $f$, t);
  end loop;
end $$;

-- ---------- quote_line_items: joins through quotes, no studio_id of its own ----------
alter table quote_line_items enable row level security;

create policy "studio read via quote" on quote_line_items
  for select using (
    exists (select 1 from quotes q where q.id = quote_line_items.quote_id and q.studio_id = current_studio_id())
  );
create policy "studio write insert via quote" on quote_line_items
  for insert with check (
    exists (select 1 from quotes q where q.id = quote_line_items.quote_id and q.studio_id = current_studio_id())
    and current_admin_role() != 'viewer'
  );
create policy "studio write update via quote" on quote_line_items
  for update using (
    exists (select 1 from quotes q where q.id = quote_line_items.quote_id and q.studio_id = current_studio_id())
    and current_admin_role() != 'viewer'
  );
create policy "studio write delete via quote" on quote_line_items
  for delete using (
    exists (select 1 from quotes q where q.id = quote_line_items.quote_id and q.studio_id = current_studio_id())
    and current_admin_role() in ('owner', 'admin')
  );

-- project_props, project_mood_board_items, project_documents, project_messages
-- all join through projects the same way.
do $$
declare
  t text;
  tables text[] := array['project_props', 'project_mood_board_items', 'project_documents', 'project_messages'];
begin
  foreach t in array tables loop
    execute format('alter table %I enable row level security;', t);

    execute format($f$
      create policy "studio read via project" on %I
      for select using (
        exists (select 1 from projects p where p.id = %I.project_id and p.studio_id = current_studio_id())
      );
    $f$, t, t);

    execute format($f$
      create policy "studio write insert via project" on %I
      for insert with check (
        exists (select 1 from projects p where p.id = %I.project_id and p.studio_id = current_studio_id())
        and current_admin_role() != 'viewer'
      );
    $f$, t, t);

    execute format($f$
      create policy "studio write update via project" on %I
      for update using (
        exists (select 1 from projects p where p.id = %I.project_id and p.studio_id = current_studio_id())
        and current_admin_role() != 'viewer'
      );
    $f$, t, t);

    execute format($f$
      create policy "studio write delete via project" on %I
      for delete using (
        exists (select 1 from projects p where p.id = %I.project_id and p.studio_id = current_studio_id())
        and current_admin_role() in ('owner', 'admin')
      );
    $f$, t, t);
  end loop;
end $$;
