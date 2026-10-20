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

-- Seed a separately identifiable default template. Existing signed contract bodies are untouched.
insert into contract_templates(name,status,body,is_default) values
('Castaneda Strings Performance Agreement v2','active','CASTANEDA STRINGS | LIVE PERFORMANCE AGREEMENT

1. PARTIES AND EVENT
This performance agreement ("Agreement") is between {{business_name}} ("Performer") and {{client_name}} ("Client").
Client email: {{client_email}}
Event: {{event_type}}
Date: {{event_date}}
Scheduled performance time: {{event_time}}
Venue / location: {{location}}
Accepted quote total: {{quote_total}}
Related invoice: {{invoice_number}}

2. SCOPE OF SERVICES
Performer will provide the musicians, musical services, approximate set length, and agreed repertoire described in the accepted quote and any written schedule approved by both parties. Services not included in the quote require written approval and may result in additional charges.

3. DATE RESERVATION AND PAYMENT
A date is reserved only when the accepted quote, required executed agreement, and required payment have been received and acknowledged by Performer. The specific retainer, payment schedule, and remaining balance are stated in the accepted quote and invoice. No additional forfeiture, late fee, or refund restriction is created here unless specifically disclosed and agreed to in writing.

4. EVENT SCHEDULE AND CLIENT COORDINATION
Client will supply the final venue, event coordinator contact, arrival/access instructions, parking and loading details, performance schedule, and any special song requests in reasonable time. Material changes to times, location, lineup, or length must be approved in writing. Performer will make reasonable efforts to accommodate changes but cannot promise availability.

5. VENUE, EQUIPMENT, AND SAFE CONDITIONS
Client is responsible for arranging a safe, accessible performance space and obtaining venue permissions. If amplification or electrical power is required by the accepted quote, Client will provide safe, reliable power and approved placement unless otherwise agreed. Outdoor performance requires suitable shelter from direct sun, precipitation, and unsafe conditions. Performer may stop or decline unsafe performance without an obligation to expose people or equipment to harm; payment/refund consequences will be handled according to applicable law and the parties'' written terms.

6. TRAVEL, PARKING, AND ADDITIONAL COSTS
Any agreed travel, lodging, parking, access, rehearsal, overtime, or equipment charges must be itemized in the quote or accepted in writing before they are incurred. No unapproved additional fee is due solely under this clause.

7. CANCELLATIONS AND POSTPONEMENTS
Cancellation or postponement requests must be made in writing. Refunds, application of existing payments to a new date, and the availability of a replacement date are determined by the specific written booking/payment terms accepted by the parties and applicable law. A new date or materially changed services require mutual written confirmation. This Agreement does not by itself impose a blanket nonrefundable payment.

8. EVENTS OUTSIDE REASONABLE CONTROL
If an event beyond a party''s reasonable control prevents safe or lawful performance (including severe weather, emergency, government restriction, illness affecting essential personnel, or venue closure), the parties will communicate promptly and work in good faith toward rescheduling or a fair resolution of payments for services not performed, subject to applicable law. No party is required to perform illegally or unsafely.

9. SUBSTITUTION AND PERFORMANCE PRACTICES
Performer may suggest a qualified substitute musician only with Client''s prior approval when a booked musician is unavailable. Music selection and arrangements will be coordinated in advance where practical. Unless explicitly purchased, recording, broadcast, distribution, and commercial use rights are not granted by this Agreement.

10. CHANGES, DISPUTES, AND ENTIRE AGREEMENT
Any amendment to the scope, timing, fees, or other material terms must be agreed to in writing by both parties. The accepted quote, invoice terms, and this Agreement form the parties'' booking records. If provisions conflict, the more specific subsequently accepted written term controls to the extent permitted by law. Florida law applies where applicable. Nothing here waives rights that cannot legally be waived.

11. ACKNOWLEDGEMENT
By signing, the Client confirms review of the scope, event details, financial terms, and the terms above, and agrees to use electronic records and signatures for this booking.

Client: {{client_name}}
Performer: {{business_name}}
Date of electronic signature: Recorded at signing.
',true)
on conflict do nothing;
