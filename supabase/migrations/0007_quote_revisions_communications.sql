-- 0007: safe quote revisions, admin communications inbox, editable emails and default contract selection.
-- Apply only to a verified Castaneda Strings database after 0006.
alter table quotes add column if not exists revision_of uuid references quotes(id) on delete set null;
create index if not exists cs_quote_revision_idx on quotes(revision_of);
alter table contract_templates add column if not exists is_default boolean not null default false;
create unique index if not exists cs_default_agreement_one on contract_templates(is_default) where is_default;

create table if not exists cs_email_templates(
 template_key text primary key check(template_key in ('quote_sent','invoice_sent','quote_reminder','payment_reminder')),
 subject text not null check(length(trim(subject))>=3),
 body text not null check(length(trim(body))>=5),
 updated_at timestamptz not null default now()
);
alter table cs_email_templates enable row level security;
create policy cs_email_templates_read on cs_email_templates for select using(cs_is_admin());
create policy cs_email_templates_write on cs_email_templates for all
 using(exists(select 1 from cs_admin_members where auth_user_id=auth.uid() and role in ('owner','admin')))
 with check(exists(select 1 from cs_admin_members where auth_user_id=auth.uid() and role in ('owner','admin')));
insert into cs_email_templates(template_key,subject,body) values
('quote_sent','Quote {{quote_number}} from Castaneda Strings',E'Hi {{client_first_name}},\n\nPlease review the quote for your {{event_type}} on {{event_date}}. Let us know if you have any questions or changes.\n\nThanks,\nCastaneda Strings'),
('invoice_sent','Your invoice {{invoice_number}} from Castaneda Strings',E'Hi {{client_first_name}},\n\nYour invoice for {{event_type}} is ready. The total is {{total}}, due {{due_date}}.\n\n{{invoice_link}}\n\nThanks,\nCastaneda Strings'),
('quote_reminder','Reminder: quote {{quote_number}}','Hi {{client_first_name}},\n\nA friendly reminder to review your quote:\n{{quote_link}}\n\nCastaneda Strings'),
('payment_reminder','Payment reminder: {{invoice_number}}','Hi {{client_first_name}},\n\nYour invoice {{invoice_number}} has a remaining balance of {{total}}.\n{{invoice_link}}\n\nCastaneda Strings')
on conflict(template_key) do nothing;

alter table communications add column if not exists from_email text;
alter table communications add column if not exists to_email text;
alter table communications add column if not exists reply_to_id uuid references communications(id) on delete set null;
alter table communications add column if not exists message_id_header text;
alter table communications add column if not exists reply_request_id uuid;
create unique index if not exists cs_communications_resend_unique
 on communications(resend_email_id) where resend_email_id is not null;
create unique index if not exists cs_communications_reply_request_unique
 on communications(reply_request_id) where reply_request_id is not null;
create index if not exists cs_communications_direction_created on communications(direction,created_at desc);
create index if not exists cs_communications_inquiry on communications(inquiry_id);
-- No direct anonymous access to this table. Earlier cs_staff_access remains in force.

create or replace function cs_begin_quote_revision(p_quote_id uuid)
returns uuid language plpgsql security definer set search_path=public as $$
declare original quotes%rowtype; new_id uuid; v_number text;
begin
 if not cs_is_admin() or not exists (select 1 from cs_admin_members
   where auth_user_id=auth.uid() and role in ('owner','admin','staff'))
 then raise exception 'Not authorized to revise quotes'; end if;
 select * into original from quotes where id=p_quote_id for update;
 if not found or original.status not in ('sent','pending') then
   raise exception 'Only sent or awaiting-response quotes can be revised'; end if;
 if exists (select 1 from quotes where revision_of=original.id and status='draft')
 then raise exception 'An unsent revision already exists. Open it from Quotes.'; end if;
 -- Replace the old public acceptance link immediately. Previous quote retained read-only.
 update quotes set status='cancelled',cancelled_at=now() where id=original.id;
 v_number:=next_quote_number();
 insert into quotes (
  public_id, inquiry_id, client_id, cs_project_id, revision_of, quote_number,
  title, event_type,event_date,location_name,subtotal_cents,discount_cents,
  tax_cents,total_cents,valid_until,notes_to_client,internal_notes,
  auto_create_invoice,reminders_enabled,reminder_days_before,currency,status
 ) values (
  'q_'||encode(gen_random_bytes(18),'hex'),original.inquiry_id,original.client_id,
  original.cs_project_id,original.id,v_number,original.title,original.event_type,
  original.event_date,original.location_name,original.subtotal_cents,
  original.discount_cents,original.tax_cents,original.total_cents,original.valid_until,
  original.notes_to_client,original.internal_notes,original.auto_create_invoice,
  original.reminders_enabled,original.reminder_days_before,original.currency,'draft'
 ) returning id into new_id;
 insert into quote_items(quote_id,name,description,quantity,unit_price_cents,
   total_cents,sort_order,item_kind,selected,selection_group,range_max_cents,taxable)
 select new_id,name,description,quantity,unit_price_cents,total_cents,sort_order,
   item_kind,selected,selection_group,range_max_cents,taxable
 from quote_items where quote_id=original.id;
 insert into activity_logs(action,entity_type,entity_id,description)
 values ('revised','quote',original.id,'Quote cancelled and replaced by draft '||v_number);
 return new_id;
end $$;
revoke all on function cs_begin_quote_revision(uuid) from public,anon;
grant execute on function cs_begin_quote_revision(uuid) to authenticated;
