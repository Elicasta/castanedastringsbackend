-- Send composer delivery gate and confirmed booking/calendar connection.
-- Run only on the Castaneda Strings database after 0005.
create table if not exists cs_quote_dispatches(
 quote_id uuid primary key references quotes(id) on delete cascade,
 status text not null default 'processing' check(status in ('processing','sent','failed')),
 subject text not null, message text not null,
 to_email text not null, copy_email text,
 idempotency_key text not null unique,
 provider_email_id text,
 attempted_at timestamptz not null default now(), sent_at timestamptz,
 last_error text
);
alter table cs_quote_dispatches enable row level security;
create policy cs_quote_dispatches_staff on cs_quote_dispatches
 for select using(cs_is_admin());
-- Never expose a direct INSERT/UPDATE client API. Only atomic RPCs may mutate.

create or replace function cs_claim_quote_dispatch(
 p_quote_id uuid, p_subject text, p_message text, p_copy_email text default null)
returns text language plpgsql security definer set search_path=public as $$
declare q quotes%rowtype; d cs_quote_dispatches%rowtype; v_inserted text;
begin
 if not cs_is_admin() then raise exception 'Not authorized'; end if;
 select * into q from quotes where id=p_quote_id for update;
 if not found or q.status <> 'draft' then raise exception 'Only unsent drafts can be emailed'; end if;
 if not exists(select 1 from quote_items where quote_id=q.id) then raise exception 'Add an item before sending'; end if;
 if q.valid_until is not null and q.valid_until < current_date then raise exception 'Quote expired'; end if;
 if char_length(trim(p_subject))<3 or char_length(p_subject)>180 then raise exception 'Invalid subject'; end if;
 if char_length(trim(p_message))<5 or char_length(p_message)>12000 then raise exception 'Invalid message'; end if;
 insert into cs_quote_dispatches(quote_id,status,subject,message,to_email,copy_email,idempotency_key)
 select q.id,'processing',p_subject,p_message,lower(c.email),p_copy_email,'cs-quote-'||q.id::text||'-v1'
 from clients c where c.id=q.client_id and c.email is not null and c.email ~* '^[^@[:space:]]+@[^@[:space:]]+\\.[^@[:space:]]+$'
 on conflict (quote_id) do nothing returning idempotency_key into v_inserted;
 if v_inserted is not null then return v_inserted; end if;
 select * into d from cs_quote_dispatches where quote_id=q.id for update;
 if not found then raise exception 'Client has no valid email'; end if;
 if d.status='sent' then raise exception 'This quote was already sent'; end if;
 if d.status='processing' and d.attempted_at > now()-interval '10 minutes'
 then raise exception 'A send attempt is already in progress'; end if;
 -- Retries use the *original content* and provider key so an uncertain
 -- provider response cannot send a changed message as a second email.
 if d.subject <> p_subject or d.message <> p_message or d.copy_email is distinct from p_copy_email
 then raise exception 'A previous attempt exists. Retry with the original message'; end if;
 update cs_quote_dispatches set status='processing',attempted_at=now(),last_error=null where quote_id=q.id;
 return d.idempotency_key;
end $$;
revoke all on function cs_claim_quote_dispatch(uuid,text,text,text) from public,anon;
grant execute on function cs_claim_quote_dispatch(uuid,text,text,text) to authenticated;

create table if not exists cs_google_connections(
 auth_user_id uuid primary key references auth.users(id) on delete cascade,
 account_email text not null, calendar_id text not null default 'primary',
 encrypted_refresh_token text not null,
 connected_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
alter table cs_google_connections enable row level security;
-- Tokens are accessed only through the server's service role.

create table if not exists cs_bookings(
 id uuid primary key default gen_random_uuid(),
 quote_id uuid not null unique references quotes(id) on delete restrict,
 client_id uuid not null references clients(id) on delete restrict,
 title text not null, location text,
 event_date date not null, start_time time not null,end_time time not null,
 time_zone text not null default 'America/New_York',
 status text not null default 'confirmed' check(status in ('confirmed','cancelled')),
 google_event_id text,google_event_url text,google_calendar_owner uuid references auth.users(id),
 sync_status text not null default 'not_connected'
  check(sync_status in ('not_connected','pending','synced','failed')),
 sync_error text,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 constraint cs_booking_time_order check(end_time>start_time)
);
create index if not exists cs_bookings_date_idx on cs_bookings(event_date);
alter table cs_bookings enable row level security;
create policy cs_bookings_staff on cs_bookings for all using(cs_is_admin()) with check(cs_is_admin());

-- A paid invoice and, if a contract exists, a signed agreement are required.
-- Advisory locking by date prevents concurrent booking confirmations in one slot.
create or replace function cs_confirm_booking(
 p_quote_id uuid,p_event_date date,p_start_time time,p_end_time time,p_time_zone text default 'America/New_York'
) returns uuid language plpgsql security definer set search_path=public as $$
declare q quotes%rowtype; v_id uuid;
begin
 if not cs_is_admin() then raise exception 'Not authorized'; end if;
 if p_event_date is null or p_start_time is null or p_end_time is null or p_end_time<=p_start_time
 then raise exception 'A valid start and end time are required'; end if;
 if char_length(trim(p_time_zone))=0 then raise exception 'Choose a time zone'; end if;
 perform pg_advisory_xact_lock(hashtext(p_event_date::text));
 select * into q from quotes where id=p_quote_id for update;
 if not found or q.status<>'accepted' then raise exception 'Quote must be accepted first'; end if;
 if q.client_id is null then raise exception 'Quote is missing a client'; end if;
 if not exists(select 1 from invoices where quote_id=q.id and status='paid')
 then raise exception 'A paid invoice is required to confirm booking'; end if;
 if exists(select 1 from contracts where quote_id=q.id and status <> 'signed')
 then raise exception 'The agreement must be signed to confirm'; end if;
 select id into v_id from cs_bookings where quote_id=q.id and status='confirmed';
 if v_id is not null then return v_id; end if;
 if exists(select 1 from cs_bookings where status='confirmed' and event_date=p_event_date
   and start_time<p_end_time and end_time>p_start_time)
 then raise exception 'A confirmed performance already overlaps this time'; end if;
 insert into cs_bookings(quote_id,client_id,title,location,event_date,start_time,end_time,time_zone)
 values(q.id,q.client_id,q.title,q.location_name,p_event_date,p_start_time,p_end_time,p_time_zone)
 returning id into v_id;
 return v_id;
end $$;
revoke all on function cs_confirm_booking(uuid,date,time,time,text) from public,anon;
grant execute on function cs_confirm_booking(uuid,date,time,time,text) to authenticated;
