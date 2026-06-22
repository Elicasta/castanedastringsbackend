-- supabase/seed/seed.sql
-- Run with: npm run seed  (requires DATABASE_URL pointed at your Supabase db)
-- Safe to re-run: every insert is guarded so this never creates duplicates.

insert into studios (name, slug)
values ('EC Creative Studios', 'ec-creative-studios')
on conflict (slug) do nothing;

do $$
declare
  v_studio_id uuid;
begin
  select id into v_studio_id from studios where slug = 'ec-creative-studios';

  -- ---------- quote templates ----------
  insert into quote_templates (studio_id, name, session_type, title, story_intro, default_terms, default_items, active)
  select v_studio_id, x.name, x.session_type, x.title, x.story_intro, x.terms, x.items, true
  from (values
    ('Maternity Session', 'maternity', 'Your Maternity Session',
     'A quiet, golden hour built around you in this season.',
     'A 50% retainer secures your date. Final gallery delivered within 3 weeks.',
     '[{"name":"Maternity Session","description":"60-90 min session, studio or on-location","quantity":1,"unit_price":650}]'::jsonb),
    ('Newborn Session', 'newborn', 'Your Newborn Session',
     'Slow, soft, and centered on the first days.',
     'A 50% retainer secures your date. Final gallery delivered within 3 weeks.',
     '[{"name":"Newborn Session","description":"In-home or studio, 2-3 hour session","quantity":1,"unit_price":750}]'::jsonb),
    ('Family Lifestyle Session', 'family', 'Your Family Session',
     'Real moments, not posed ones.',
     'A 50% retainer secures your date. Final gallery delivered within 2 weeks.',
     '[{"name":"Family Lifestyle Session","description":"60 min on-location session","quantity":1,"unit_price":550}]'::jsonb),
    ('Branding Session', 'branding', 'Your Branding Session',
     'Images that work as hard as you do.',
     'Full payment due to confirm. Final gallery delivered within 1 week.',
     '[{"name":"Branding Session","description":"Half-day branding session","quantity":1,"unit_price":950}]'::jsonb),
    ('Headshots', 'headshots', 'Your Headshots Session',
     'Clean, confident, on-brand.',
     'Full payment due to confirm. Final gallery delivered within 1 week.',
     '[{"name":"Headshots Session","description":"30 min studio session","quantity":1,"unit_price":350}]'::jsonb),
    ('Wedding / Event', 'wedding', 'Your Wedding Day Coverage',
     'The whole day, told honestly.',
     'A 50% retainer secures your date. Balance due 14 days before the event.',
     '[{"name":"Wedding Day Coverage","description":"8 hours of coverage","quantity":1,"unit_price":3200}]'::jsonb)
  ) as x(name, session_type, title, story_intro, terms, items)
  where not exists (
    select 1 from quote_templates qt where qt.studio_id = v_studio_id and qt.name = x.name
  );

  -- ---------- contract templates ----------
  insert into contract_templates (studio_id, name, session_type, title, body, active)
  select v_studio_id, x.name, x.session_type, x.title, x.body, true
  from (values
    ('Standard Photography Agreement', null, 'Photography Services Agreement',
     'This agreement is between {{studio_name}} and {{client_name}} for a {{session_type}} session on {{session_date}}. Retainer is non-refundable. Rescheduling requires 48 hours notice.'),
    ('Wedding / Event Agreement', 'wedding', 'Wedding & Event Services Agreement',
     'This agreement is between {{studio_name}} and {{client_name}} for coverage of their event on {{session_date}}. Retainer secures the date and is non-refundable. Final balance due 14 days prior.')
  ) as x(name, session_type, title, body)
  where not exists (
    select 1 from contract_templates ct where ct.studio_id = v_studio_id and ct.name = x.name
  );

  -- ---------- invoice templates ----------
  insert into invoice_templates (studio_id, name, session_type, title, intro_text, terms_text, active)
  select v_studio_id, x.name, x.session_type, x.title, x.intro, x.terms, true
  from (values
    ('Standard Session Invoice', null, 'Session Invoice',
     'Thank you for booking with EC Creative Studios. Here is your invoice.',
     'Payment due within 7 days of invoice date unless otherwise noted on your contract.'),
    ('Wedding / Event Invoice', 'wedding', 'Wedding & Event Invoice',
     'Thank you for trusting us with your day. Here is your invoice.',
     'Retainer due immediately to secure your date. Balance due 14 days prior to the event.')
  ) as x(name, session_type, title, intro, terms)
  where not exists (
    select 1 from invoice_templates it where it.studio_id = v_studio_id and it.name = x.name
  );

  -- ---------- email templates: one row per trigger_key the system sends ----------
  insert into email_templates (studio_id, name, subject, body, trigger_key, active)
  select v_studio_id, x.name, x.subject, x.body, x.trigger_key, true
  from (values
    ('Inquiry Received', 'New inquiry: {{firstName}}', '<p>New inquiry from {{firstName}}.</p>', 'inquiry_received'),
    ('Quote Sent', 'Your session quote is ready', '<p>Hi {{firstName}}, your quote is ready: {{quoteUrl}}</p>', 'quote_sent'),
    ('Quote Accepted', 'Quote accepted', '<p>{{firstName}} accepted their quote.</p>', 'quote_accepted'),
    ('Contract Sent', 'Please review and sign your contract', '<p>Hi {{firstName}}, please review and sign: {{contractUrl}}</p>', 'contract_sent'),
    ('Contract Signed', 'Contract signed', '<p>{{firstName}} signed their contract.</p>', 'contract_signed'),
    ('Invoice Sent', 'Your invoice is ready', '<p>Hi {{firstName}}, your invoice is ready: {{invoiceUrl}}</p>', 'invoice_sent'),
    ('Payment Received', 'Payment received', '<p>Payment received from {{firstName}}.</p>', 'payment_received'),
    ('Not Yet Booked Reminder', 'Your session is not booked yet',
     '<p>Hi {{firstName}}, your date isn''t secured yet. Please sign your contract and pay your invoice to lock in your session. Once complete, you''ll receive the scheduling link.</p>',
     'not_yet_booked_reminder'),
    ('Scheduling Link', 'You''re ready to pick your session date',
     '<p>Hi {{firstName}}, pick your date and time here: {{schedulingUrl}}</p>', 'scheduling_link'),
    ('Booking Confirmation', 'Your session is booked',
     '<p>Hi {{firstName}}, you''re booked for {{sessionDate}}. Add it to your calendar: {{icsUrl}}</p>', 'booking_confirmation'),
    ('Portal Setup', 'Your session portal is ready',
     '<p>Hey {{firstName}}, your session portal is ready. Inside you''ll find your session details, inspiration, notes, documents, location, weather, and a direct place to send ideas to our creative team. {{portalUrl}}</p>',
     'portal_setup')
  ) as x(name, subject, body, trigger_key)
  where not exists (
    select 1 from email_templates et where et.studio_id = v_studio_id and et.trigger_key = x.trigger_key
  );
end $$;
