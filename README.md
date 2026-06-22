# EC Creative Studios — Booking OS

Native replacement for the inquiry → quote → contract → invoice → payment →
scheduling → booking → project → client portal pipeline. Pixieset is reduced
to gallery hosting only (manual link, no API). Built fresh, new Supabase
project, new repo, per the build decision on 2026-06-21.

## What's actually done right now

Six layers exist now, and the entire admin dashboard from the original spec
is built: `/inquire`, every admin page (dashboard, inquiries, quotes,
contracts, invoices, calendar, projects, clients, email logs, settings),
the database/security foundation, and a fixed production deploy bug.

### The rest of the admin dashboard, just added

- **`/admin/clients`** — CRM list, detail page shows every inquiry, quote,
  contract, invoice, and booking tied to that person in one place, plus
  editable internal notes and tags (the same `tags[]` column the platform
  map called out for future email segmentation).
- **`/admin/calendar`** — add/remove weekly availability rules and blackout
  dates, see upcoming booked sessions. This is the missing piece that makes
  the booking page possible — until a rule exists here, there's nothing for
  a future booking page to offer a client.
- **`/admin/projects`** — list + detail with a status-light picker
  (red/yellow/green), editable session vision/notes, the prop checklist,
  and the one field that touches Pixieset: a plain `gallery_url` text input,
  pasted in by hand. Will be empty until the booking page exists, since a
  project only gets created once a client is fully booked — that's
  expected, not broken.
- **`/admin/settings`** — real UI for studio name and Zelle instructions,
  replacing the "edit it directly in the database" workaround from the
  invoices pass. Gated to owner/admin roles; photographer/creative_director
  see it read-only. Stripe/calendar toggles and default timezone/duration
  aren't wired here yet — still environment variables for now, said
  plainly on the page itself rather than left undocumented.
- **`/admin/email-logs`** — read-only history of every email sent. No
  "resend" button: `email_logs` stores the subject that was sent but not
  the full body, so there's nothing to actually resend from that table.
  A real resend means re-running whatever action sent the original (e.g.
  clicking "Send quote" again), not resending from the log — said directly
  on the page instead of faking a button that wouldn't work.

Full nav now has all ten admin sections. Verified with a real production
build, empty third-party keys: 24 routes compile clean.

### Critical fix: module-load-time API client crashes (from earlier pass, still relevant)

Your Vercel deploy failed with `Error: Missing API key. Pass it to the
constructor new Resend("re_123")` while collecting page data for
`/admin/contracts/[id]`. Root cause: `lib/email/send.ts` created the Resend
client at module scope — `const resend = new Resend(process.env.RESEND_API_KEY!)`
— which runs the instant *anything* imports that file, including during
Next's build-time page-data collection, before env vars are guaranteed to
be in play. A missing or empty key there took the whole build down, even
though `/admin/contracts/[id]` never actually sends an email during build.

Same bug shape existed with the Stripe client in `lib/server-actions/invoices.ts`
(used there) and `lib/payments/stripe-webhook.ts` (instantiated but never
actually used in that file — removed entirely, dead code on top of the bug).

Fixed all three with lazy singleton getters instead of module-scope
instantiation — the client now only gets created the moment it's actually
needed, not on import. **Verified by reproducing your exact failure
condition**: built locally with `RESEND_API_KEY` and `STRIPE_SECRET_KEY`
completely unset (not placeholder strings, which is what let this slip
through undetected in earlier passes) — all 16 routes compiled clean,
including `/admin/contracts/[id]`, the page that actually failed for you.

This is worth remembering as a pattern for anything added later: never
instantiate a third-party SDK client at module scope if the module might get
imported by a page that doesn't use it. Lazy-init always.

### Invoices (from the previous pass)

- **`/admin/invoices`** — list with payment status, flags invoices where a
  client has self-reported a Zelle send that still needs confirming.
- **`/admin/invoices/[id]`** — total/paid/balance, "Send invoice" button,
  and when a client has submitted a Zelle reference, an inline confirm
  panel (`AdminZelleConfirm.tsx`) — admin reviews the reference and clicks
  "Mark Zelle Paid" only after actually checking the bank, never automatic.
- **`/invoice/[token]`** — the client-facing page. Two payment paths:
  - **"Pay with Card"** calls the real Stripe Checkout session creation
    code (`createStripeCheckoutForInvoice`). This is real, not a stand-in
    in the sense of being fake — it's the actual integration. It just can't
    complete a real payment until real Stripe keys are in `.env.local`,
    which you're setting up. Once they're in, this button works end to end
    with no further code changes.
  - **"I Sent It by Zelle"** lets the client optionally enter a reference
    number. This does *not* mark the invoice paid — per spec, only an admin
    can do that, manually, after verifying the transfer actually landed.
    It just flags the invoice and logs a status event so it surfaces in
    the admin list instead of living in a text thread.
- **`/api/webhooks/stripe`** — the actual route your Stripe webhook should
  point at, subscribed to `checkout.session.completed`. Verifies the
  signature itself (the only place that sees the raw request body, which
  signature verification requires), then delegates to the idempotent
  handler logic from the very first pass.

### Contracts (from the previous pass)

- **`/admin/contracts`** — list with status. Nothing creates these
  manually; one auto-drafts the moment a quote is accepted (built in the
  first pass, `lib/server-actions/draft-on-accept.ts`).
- **`/admin/contracts/[id]`** — shows the contract body with merge fields
  already resolved (`{{client_name}}`, `{{session_type}}`, etc. replaced
  with real values via `lib/server-actions/contract-merge.ts`), a "Send
  contract" button, and once signed: signer name, email, timestamp, and IP.
- **`/contract/[token]`** — public signing page, same design system as
  `/inquire` and `/quote/[token]`. Signature is typed-full-name + checkbox
  (clickwrap), not a drawn signature pad — a real scope call, not an
  oversight, noted below.

**One thing worth being honest about:** `session_date` is one of the merge
fields the seeded contract templates reference, but at the point a contract
gets signed, no date has been picked yet — booking happens after the
invoice is paid, several steps later in the state machine. Rather than
leave a broken `{{session_date}}` on the page or fake a date, it resolves to
"to be scheduled once your contract is signed and invoice is paid." That's
the actual state of things, said plainly.

**Same bug class as the quotes pass, caught and fixed again:**
`signContractByToken` is called directly from a client component
(`ContractSignature.tsx`), so it needed `'use server'`, not `server-only` —
fixed the same way as `quotes.ts` last time. Also moved IP address and user
agent capture server-side (`next/headers`) instead of trusting them as
client-supplied input, which the original version did — a client should
never be the one reporting its own IP for an audit trail.

### Still missing, not started

Every admin page now exists. What's left is entirely client-facing:
`/book/[token]` and `/client/[slug]`. Availability-based slot calculation
for booking doesn't exist yet — `confirmBooking` (from the first pass)
accepts an explicit start/end and trusts the database exclusion constraint,
it doesn't compute what slots are open in the first place. The admin side
now has somewhere to define those rules (`/admin/calendar`), but nothing
reads them yet to offer a client real options.

### Quoting (from the previous pass)

- **`/admin/login`** — Supabase Auth email/password. Middleware
  (`middleware.ts`) protects every `/admin/*` route and bounces signed-out
  visitors here; bounces signed-in visitors away from the login page itself.
- **`/admin/dashboard`** — real counts pulled live from the database (new
  inquiries, quotes pending, etc.), not placeholder numbers. Recent activity
  feed reads straight from `status_events`.
- **`/admin/inquiries`** — list with status filter, detail page shows every
  field the Session Vision form captured (feelings, environments, styling,
  story answers), plus a rules-based "suggested approach" from
  `lib/server-actions/quote-advisor.ts` (no AI, per the original spec).
- **`/admin/quotes`** — "Create quote" on an inquiry auto-drafts one from
  the suggested template's line items. Quote detail page has inline-editable
  line items (quantity/price, total recalculates) and a "Send quote" button
  that emails the client and flips status to `quote_sent`.
- **`/quote/[token]`** — the client-facing page that email links to. Same
  design system as `/inquire`. Accept/decline buttons call the existing
  `acceptQuoteByToken`/`declineQuoteByToken` server actions from the first
  pass — those already handle the idempotency and expiration edge cases.

That pass also caught a `server-only` vs `'use server'` bug the same way the
contracts pass did above — `quotes.ts` was the first one to hit it.

### `/inquire` (from the first pass)

The cinematic Session Vision form ported from your reference repo, with one
real bug fixed: the source repo's `ContactSection.tsx` (name, phone,
Instagram, session type) was built but never wired into the page flow, so
submissions there would have captured only an email address. Fixed by
merging those fields into the final step. Submit path also rewired from
"email only, no database write" to a real server action that creates the
client/inquiry rows and keeps the full rich payload.

### Verified, not just written

- All 12 migrations run clean on a fresh Postgres instance, in order, zero
  manual fixes needed (`supabase/migrations/0001` through `0012`).
- The no-double-booking exclusion constraint was tested directly: an
  overlapping booking insert is rejected by Postgres itself, a
  non-overlapping one succeeds, an unscheduled booking-ready row (no
  start/end yet) is allowed, and a `booked` row missing an end time is
  rejected by a check constraint.
- Role-scoped RLS was tested as a real non-superuser Postgres role (RLS is
  bypassed for table owners/superusers, so this had to be a separate role to
  mean anything): a photographer sees only their assigned project and zero
  invoices anywhere; a creative director sees all projects and zero
  invoices; an owner sees everything. The invoice document card inside
  `project_documents` is invisible to both non-financial roles while the
  contract card stays visible — tested, not assumed.
- `supabase/seed/seed.sql` runs clean and is idempotent (ran it twice,
  second run inserted zero new rows).
- The state machine's two governing functions (`isBookingReady`, `isBooked`)
  have unit tests, including the specific regression for the bug the
  whiteboard session caught before any code existed: a paid invoice with no
  selected date/time must never read as booked.

## Stack

Next.js App Router, TypeScript, Tailwind, Supabase (Postgres + Auth +
Storage), Stripe, Resend, `ics` for calendar files, `googleapis` for Google
Calendar (optional, see below).

## File tree (what exists so far)

```
supabase/
  migrations/
    0001_extensions_and_helpers.sql
    0002_studios_and_admin_users.sql
    0003_clients_and_inquiries.sql
    0004_quotes.sql
    0005_contracts.sql
    0006_invoices_and_payments.sql
    0007_availability_and_bookings.sql      <- no-double-booking constraint lives here
    0008_projects.sql
    0009_email_and_status_events.sql
    0010_rls_policies.sql                   <- base studio-scoped RLS
    0011_employee_roles_and_assignments.sql <- photographer/creative_director roles, tags, gallery_url
    0012_role_scoped_rls.sql                <- the actual financial lockout + project scoping
  seed/
    seed.sql                                <- EC Creative Studios + templates, idempotent

lib/
  supabase/
    server.ts        <- admin session client (Server Components/Actions), RLS applies
    client.ts         <- browser client for admin dashboard, RLS applies
    service-role.ts    <- bypasses RLS, used only by public-token routes + webhooks
  state-machine/
    types.ts           <- isBookingReady / isBooked, the two rules everything else defers to
    __tests__/booking-rules.test.ts
  server-actions/
    quotes.ts           <- accept/decline by token, idempotent
    draft-on-accept.ts   <- auto-drafts contract + invoice once quote accepted
    contracts.ts          <- sign by token, idempotent against double-sign
    invoices.ts             <- Stripe checkout creation, manual Zelle confirmation
    bookings.ts               <- checkAndPromoteToBookingReady + confirmBooking + project creation
  payments/
    stripe-webhook.ts          <- the only path allowed to mark an invoice paid via card
  calendar/
    ics.ts                      <- generates + uploads .ics to Supabase Storage
    google-calendar.ts           <- best-effort sync, failure never blocks the booking
  email/
    send.ts                       <- every email logs to email_logs, success or failure

types/database.ts  <- STUB, regenerate after first deploy (see below)
.env.example
package.json
```

## Local setup

1. `npm install`
2. Create a new Supabase project (per the build decision: clean slate, not
   reusing an existing one).
3. Copy `.env.example` to `.env.local`, fill in Supabase URL/keys, Stripe
   keys, Resend key. Google Calendar and Weather vars are optional —
   leaving them blank disables those features cleanly, it doesn't break
   anything (see `calendar_sync_status: 'not_applicable'` logic).
4. Push the schema: `supabase link --project-ref <ref>` then
   `npm run db:migrate` (runs `supabase db push`).
5. Regenerate types against your real project:
   `npx supabase gen types typescript --project-id <ref> > types/database.ts`
   — replaces the stub in `types/database.ts`. Skipping this step means you
   have no column-name type safety anywhere in the app.
6. Seed templates: `DATABASE_URL=<your-connection-string> npm run seed`
7. `npm run dev`

## Tests

`npm run test` runs the vitest suite (currently the state-machine unit
tests). The booking-constraint and role-RLS behavior described above were
verified directly against a live Postgres instance during this build —
that verification isn't automated yet. Recommended next step: stand up a
`supabase start` local instance in CI and turn those manual checks into real
integration tests rather than re-trusting that a future migration doesn't
quietly break them.

## Known limitations / honest gaps

- **No pages yet.** Public token routes (`/quote/[token]`, `/contract/[token]`,
  `/invoice/[token]`, `/book/[token]`, `/client/[slug]`) and the entire
  `/admin` tree don't exist. The server actions they'll call do.
- **No availability/slot-calculation logic yet.** `availability_rules` and
  `availability_blackouts` tables exist; nothing reads them yet to compute
  open slots for the booking page. `confirmBooking` accepts an explicit
  start/end and lets the database's exclusion constraint be the actual
  guard — it doesn't yet check availability_rules before offering a slot.
- **Google Calendar adapter is real code, untested against a live Google
  account** in this pass — no Google credentials were available to test
  against. The failure-handling contract (never block a booking on calendar
  failure) is implemented and the conditional skip when no client ID is set
  is implemented, but the happy path hasn't hit real Google infra yet.
- **Weather, maps, mood board UI, chat UI**: schema exists, no
  implementation yet — correctly deferred per the "skeleton vs full visual
  build" call, which landed on "build everything in the spec," so these are
  the next pass, not cut.
- **Email campaigns (Resend Audiences), Instagram DM automation, calendar
  subscribe feed**: intentionally not started. These are Phase 2/3 per your
  own platform map's build order (steps 6–8), after core CRM/contracts/
  sessions. Building them now would be the exact "drift into a giant
  platform" the original spec warned against.
- **Open decision, unresolved on purpose**: creative_director's client chat
  access is currently full read+write (matches "oversight" at minimum). If
  the answer is read-only + flag-for-review instead, that's a single policy
  change in `0012_role_scoped_rls.sql`, not a schema change — flagged there
  in a comment.
- **Employee auth model** (separate logins per employee vs. shared team
  login): built assuming separate logins, one `admin_users` row per real
  person, since that's what the role-scoped RLS in 0012 depends on to mean
  anything. A shared login would make the photographer/creative_director
  distinction unenforceable at the database level.

## Next recommended build step

This is now the last big piece: `/book/[token]`, and it needs real
availability-slot calculation first — read `availability_rules` +
`availability_blackouts` (both manageable now via `/admin/calendar`) +
existing `bookings`, compute actual open slots for a given date range.
Once that exists, `confirmBooking` (already built, first pass) can accept
a real selected slot instead of trusting the caller blindly, and
`checkAndPromoteToBookingReady` starts actually firing for the first time —
nothing in the system has reached `booking_ready` yet, since that needs a
real paid invoice with your Stripe keys in place. After booking: the client
portal, `/client/[slug]`, which is the last public route standing.
