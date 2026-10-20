# Castaneda Strings admin consolidation (preview branch)

## Canonical routes
- Admin login: `/login`
- Dashboard: `/dashboard`
- Quotes: `/quotes`, `/quotes/new`, `/quotes/[id]`, `/quotes/templates`
- Clients: `/clients`, Inquiries: `/inquiries`, Invoices: `/invoices`, Contracts: `/contracts`
- The older EC Creative Studios `/admin/*` paths redirect to Castaneda counterparts for backward compatibility. ECSET code remains in Git for now, but is not the canonical studio admin.

## Database separation
The two historic sets of migrations were incompatible. The EC Creative set was moved into `supabase/legacy-ecset/` without deleting git history. **Do not run database migrations on an unknown database.** Verify the production Supabase project first, export a backup, and compare `public.quotes` fields with the Castaneda migration baseline. The Castaneda schema uses `total_cents` and `quote_items`.

Apply the Castaneda migration series in order: `0001_init`, `0002_templates_portal_contract_fields`, `0003_signature_canvas`, `0004_castaneda_quote_builder`, `0005_castaneda_admin_access`.

### Owner enrollment required
After applying migration 0005, use the **Supabase SQL editor as a trusted database administrator** to register an existing Supabase Auth user's UUID as owner:

```sql
insert into public.cs_admin_members (auth_user_id, role)
values ('<THE_OWNER_AUTH_USERS_ID>', 'owner')
on conflict (auth_user_id) do update set role='owner';
```

There is intentionally no app-side self-register-admin endpoint. Until enrollment, signed-in users cannot read or modify business tables. Test access with an owner and a non-admin before deployment.

### Required environment
Use `.env.example` for Supabase, Resend, Stripe, and public app URL. Use verified server-only values; never put the service role key in `NEXT_PUBLIC_*`.

## Quote flow
1. Find or add client.
2. Link an existing/new client project, or choose no project.
3. Start from a saved package template or blank quote.
4. Add standard/optional/client-choice items, descriptions, quantities, minimum/range prices, fixed tax/discount, notes, invoice-on-accept, expiry, reminders.
5. Save draft, preview, and send. Customer selects add-ons/options before acceptance. A database transaction accepts the quote once and recalculates totals. Optional invoice generation and contract drafting occur only afterward.

## Delivery gates
- CI: `npm ci`, `npm run typecheck`, `npm test`, `npm run build` on the PR branch.
- Verify mobile quote wizard on iOS Safari; new client, existing client, no project, new project, template, blank, item edit, empty draft, and send error.
- Verify two rapid accept taps create no duplicate invoices or contracts.
- Confirm public quote/invoice/contract URLs use server-side opaque IDs and anonymous Supabase client cannot list financial rows.
- Test migrations on a **fresh Castaneda-only** database and rehearse migration against a sanitized backup of production. Do not merge if the live database schema differs.
- Email reminders must be backed by a scheduler, otherwise keep disabled.

## Email composer, quote lifecycle, and Google Calendar
- Create a draft first. **Save & Send** opens `/quotes/:id/send` for editable subject, message, copy-to-self; only the final Send button sends via Resend. A server-controlled quote link is always appended. The demo flow never sends mail.
- The database dispatch ledger serializes sends and uses a stable Resend Idempotency-Key to avoid duplicate send attempts. Recover ambiguous provider responses manually before retrying.
- The Quotes admin has Draft, Sent (includes pending client response), Accepted, Declined, Cancelled, and Expired filters.
- Bookings are confirmed from accepted quotes only when a linked invoice is **paid** and any linked contract is **signed**. The operator supplies the actual event start/end time and time zone. Overlapping confirmed bookings are rejected.
- The Calendar admin shows confirmed bookings even before connecting to Google. Google sync is an opt-in OAuth connection to a **specific signed-in admin's primary calendar**, not a global team credential. Connect via `/calendar`, grant calendar event permission, then confirm bookings or press Sync.
- Google refresh tokens are AES-256-GCM encrypted using `GOOGLE_TOKEN_ENCRYPTION_KEY` and stored in a service-role-only table. Changing that secret requires reconnecting accounts. Disconnecting does **not** delete any existing calendar events.
- Configure `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALENDAR_REDIRECT_URI` exactly matching Google Cloud OAuth web app redirect, and `GOOGLE_TOKEN_ENCRYPTION_KEY`. Enable Google Calendar API and consent scopes `https://www.googleapis.com/auth/calendar.events` and `https://www.googleapis.com/auth/userinfo.email`. Do not put client secrets in `NEXT_PUBLIC_` vars.
- Apply new migration `0006_quote_send_calendar.sql` to the verified Castaneda database **only after** the previous migrations, with a backup. The app preview builds without applying migrations; live admin actions will not work until the migration is applied and an admin owner is enrolled.
- Verify correct production public quote URL via `NEXT_PUBLIC_APP_URL` and sender domain via Resend `RESEND_FROM_EMAIL`. Test a quote to your own address and double-tap send before using real clients.
- Calendar sync is currently one-way and user-triggered at booking confirmation or on Sync. It does not import Google events, auto-delete events, reconcile outside edits, or schedule reminders. Protect against overwriting manual Google changes when extending the sync engine later.
