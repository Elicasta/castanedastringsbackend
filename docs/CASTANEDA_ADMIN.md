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

## Office admin upgrade (migration 0007)
- **Quotes:** Clicking a sent/pending quote opens a complete **read-only** client version. Edit (pencil) asks for confirmation, atomically cancels the old client acceptance link, and creates an independently numbered draft with copied pricing and items. An accepted quote remains locked. Do not change sent values in place.
- **Payment settings:** `/settings/payments` lets owner/admin update Zelle recipient name, verified email and/or phone, and invoice due days. These values are shown and copyable on client invoice screens. `test@zelle.com` is a demo placeholder only; never use it as a live payment recipient.
- **Email templates:** `/settings/email-templates` edits future quote-send, invoice-send, quote-reminder and payment-reminder subject/body text. The quote composer prepopulates from the quote template; invoice and reminder actions fetch overrides from `cs_email_templates`. Reminder scheduling remains a separate task.
- **Agreements:** `/contracts/templates` creates and edits full performance terms and chooses a default for *future* contracts. Migration 0007 seeds v2 covering booking terms, scope, scheduling, safety, travel, changes, cancellations, force majeure, substitution, and signature. Existing signed agreements do not change. Have a Florida attorney review text before real clients sign.
- **Communications:** `/communications` groups form submissions and inbound Resend emails by client with search, pagination and separate Inbox/Sent/All views. A client conversation shows inquiry history, received messages, replies, and editable From/To/Subject/Body. The From address is always the verified `RESEND_FROM_EMAIL`; operator cannot spoof another sender. Outbound replies use Resend idempotency keys. Incoming messages are deduplicated by provider id. No Gmail mailbox import is implied.

### Connection checklist before real-world use
1. Verify **which Supabase project belongs to Castaneda Strings**, take a backup, and dry-run migrations 0001–0007 against a copy. Enroll the owner and verify viewer accounts cannot mutate records. Production migrations have not been applied.
2. The public marketing repo `Elicasta/castanedastrings` already has a server-side inquiry handler that POSTs to `ADMIN_INTAKE_URL` with `ADMIN_INTAKE_API_KEY`. The backend endpoint is `/api/public/inquiries`. Make `ADMIN_INTAKE_API_KEY` equal `PUBLIC_INTAKE_API_KEY` in **server-only** Vercel variables; confirm URL and redeploy both projects. Never expose this key in client JavaScript.
3. Configure a Resend **receiving subdomain**, e.g. `inbound.castanedastrings.com`, with its own MX records to protect Google Workspace or existing primary-domain MX. Create an inbound mailbox like `reply@inbound.castanedastrings.com`. Set `RESEND_INBOUND_EMAIL`. Add Resend webhook event `email.received` pointing to `https://<verified-public-backend>/api/resend/inbound`, then store its signing secret as `RESEND_WEBHOOK_SECRET`. Test a client email reply and verify it appears once.
4. Set `NEXT_PUBLIC_APP_URL` to the verified, publicly reachable application hosting `/q`, `/i` and `/c`. Quote emails refuse to send without a secure URL. Confirm these pages are accessible to clients without a Vercel sign-in.
5. Use a live Resend verified sending address. Test a quote-to-self, the copy-to-self BCC, invoice delivery and client reply. Verify quote drafts remain unsent if sending fails. Never consider a claim of a Zelle payment as payment confirmation until verified.
6. Review and test cancellation/quote revision while a prior client is opening their quote. Acceptance must be locked out for the old public_id once the revision begins.
7. Outbound reminder templates exist, but automatic scheduling is **not enabled**. Reconnect Google Calendar OAuth when those credentials are supplied.

### Smoke checks
- `npm ci && npm run typecheck && npm test && npm run build`.
- On test database: accept sent quote, open sent quote in admin, trigger edit pen, confirm old link refuses acceptance, edit revision draft and resend through composer.
- Add real test Zelle email and phone in Payment Settings, verify only that value is displayed and copyable on a payable invoice.
- Trigger a marketing form inquiry and ensure its client conversation appears in Inbox, reply through Resend, reply from client and verify threading + idempotency.
- Edit default email and agreement templates and verify newly created documents use updated text while older contracts remain unchanged.

## Authenticated Studio Office navigation (October 20 update)
The **real** admin is the authenticated `/dashboard` route, not `/preview/admin` (which now redirects to `/dashboard`). The old sample admin components were deleted. The persistent desktop sidebar and mobile navigation are implemented in `components/admin/nav.tsx`, with contextual navigation in the sticky workspace header.

Live workspaces:
- Overview: `/dashboard` provides database-backed queues for new inquiries, draft quotes, incoming messages and confirmed bookings. Missing database tables show errors instead of fabricated counts.
- Communications: `/communications` Inbox/Sent/All. Open a client conversation at `/communications/client/:id`, then reply through Resend. Inquiries and quote details link to that workspace.
- Booking pipeline: `/inquiries`, `/quotes`, `/invoices`, `/contracts`, and `/calendar`. Each has real record views; high-volume lists are paginated, with search or status filters where supported.
- Clients: `/clients` offers search, pagination, linked record counts and a direct conversation action.
- Configuration: `/settings`, `/settings/payments`, `/settings/email-templates`, `/contracts/templates`, and `/quotes/templates`. Edit actions use authenticated server actions and database records, not browser-only state.

Routes require a valid Supabase session plus membership in `cs_admin_members`. Vercel preview sharing does **not** bypass login. The connected Supabase project accessible to ChatGPT was not identifiable as the Castaneda Strings database; do not run migrations against unrelated named projects. Once the correct project has been verified, apply/test migrations, log in and exercise each tab against real test records.

## Strings Supabase connection verified — October 21, 2026
- Dedicated Supabase project: `castanedastrings`, ref `eamgpxfzqfgjcfvyeolx`, Ohio region. Restored from inactive; verified ACTIVE_HEALTHY.
- The database had no public tables or migration records prior to setup. Built the admin schema from repository migrations 0001 through 0008; verified 19 RLS-enabled public tables, a business settings row, four managed email templates, and default agreement templates.
- IMPORTANT MIGRATION HISTORY: migrations `0001`, `0002`, `0003` executed successfully while the Supabase project was still restoring but were not recorded in `supabase_migrations`. Migrations `0004` through `0008` were recorded. **Do not blindly run `supabase db push` until this history discrepancy is repaired**.
- Vercel branch `feat/castaneda-mobile-quotes-flow` has isolated preview-only `NEXT_PUBLIC_SUPABASE_URL` and correct legacy anon key. Production environment was not modified.
- The branch-specific `SUPABASE_SERVICE_ROLE_KEY` is intentionally an invalid marker until the real Strings service role credential is set in Vercel securely. This prevents mixing data or writes with an unrelated project. Public inquiry ingestion, privileged email dispatch, and privileged writes are not end-to-end functional yet.
- Existing Supabase Auth identity: `castanedastrings@atomicmail.io` (email confirmed); not implicitly granted admin privileges. Desired owner email `castanedaeli0@gmail.com` is not yet an Auth user.
- A preview-branch-only `/register` page allows creation of the intended owner Auth user with a fresh password. Supabase email verification may be required. **Do not grant owner membership until email ownership is verified**; then insert a single owner member with the verified `auth.users.id`. The old temporary preview login never authorizes actual database access.
- RLS: migration 0008 restricts `cs_bookings` writes to `cs_can_write()` and pins helper function search paths. Security advisor still flags privileged definer RPCs (review execution grants) and leaked-password protection (turn on in Supabase Auth security settings). `cs_google_connections` intentionally exposes no RLS policy and is service-role-only.
- NEXT: finish email owner verification and grant role; install the correct Strings service-role secret in branch-specific Vercel settings; configure publicly accessible stable app URL and email delivery; then test create/edit/send/accept/pay/sign/confirm booking and Google Calendar OAuth. Do not merge this branch while owner/login and provider integration checks are incomplete.
