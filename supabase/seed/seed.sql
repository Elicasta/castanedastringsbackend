-- DEV/DEMO SEED DATA ONLY. Never run this against production.
-- Run with: supabase db execute -f supabase/seed/seed.sql  (or paste into the SQL editor)

insert into clients (id, first_name, last_name, email, phone) values
  ('00000000-0000-0000-0000-000000000001', 'Maria', 'Lopez', 'maria@example.com', '305-555-0101'),
  ('00000000-0000-0000-0000-000000000002', 'James', 'Carter', 'james@example.com', '305-555-0102');

insert into inquiries (id, public_id, client_id, status, event_type, event_date, location_name, message) values
  ('00000000-0000-0000-0000-000000000101', 'inq_seed_demo_001', '00000000-0000-0000-0000-000000000001', 'new', 'Wedding ceremony', current_date + 60, 'Vizcaya Museum & Gardens', 'Looking for solo violin during the ceremony.'),
  ('00000000-0000-0000-0000-000000000102', 'inq_seed_demo_002', '00000000-0000-0000-0000-000000000002', 'awaiting_response', 'Corporate gala', current_date + 30, 'Biltmore Hotel', 'Need background music for a 200-guest dinner.');

insert into contract_templates (id, name, status, body) values
  ('00000000-0000-0000-0000-000000000201', 'Standard Performance Agreement', 'active',
   'This agreement is between {{business_name}} and {{client_name}} for {{event_type}} on {{event_date}} at {{location}}.

Total: {{quote_total}}
Invoice: {{invoice_number}}

Both parties agree to the date, time, and pricing above.');
