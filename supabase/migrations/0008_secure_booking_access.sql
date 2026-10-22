-- Security hardening after the Castaneda Strings bootstrap.
-- RLS: viewers may inspect bookings, but only staff/admin/owner can change them.
drop policy if exists cs_bookings_staff on public.cs_bookings;
drop policy if exists cs_bookings_read on public.cs_bookings;
drop policy if exists cs_bookings_write on public.cs_bookings;
create policy cs_bookings_read on public.cs_bookings for select
 to authenticated using(public.cs_is_admin());
create policy cs_bookings_write on public.cs_bookings for all
 to authenticated using(public.cs_can_write()) with check(public.cs_can_write());

-- Limit mutable search_path for ordinary public functions.
alter function public.set_updated_at() set search_path=pg_catalog, public;
alter function public.next_quote_number() set search_path=pg_catalog, public;
alter function public.next_invoice_number() set search_path=pg_catalog, public;
alter function public.mark_past_due_invoices() set search_path=pg_catalog, public;

-- Only the service role should invoke the past-due batch update.
revoke all on function public.mark_past_due_invoices() from public, anon, authenticated;
grant execute on function public.mark_past_due_invoices() to service_role;

-- Google connections remain RLS-locked for all regular users and can only
-- be read/written through appropriately authorized server-side service role.
