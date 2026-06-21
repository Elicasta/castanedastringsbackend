# Castaneda Strings — Admin

One-admin backend for running Castaneda Strings: inquiries → quotes → invoices → contracts → payments.
Built for `admin.castanedastrings.com`. Public client links live at `castanedastrings.com/q`, `/i`, `/c`
(point `NEXT_PUBLIC_APP_URL` at whichever domain serves those public routes — it can be the same deploy).

## Stack

Next.js (App Router) · TypeScript · Tailwind v4 · Supabase (Postgres + Auth) · Resend · Stripe

## Setup

1. **Create a Supabase project.**
2. **Run the migration:**
   ```
   supabase link --project-ref <your-ref>
   supabase db push
   ```
   or paste `supabase/migrations/0001_init.sql` into the SQL editor.
3. **Create your admin user** in Supabase Auth (Dashboard → Authentication → Add user). There's
   intentionally no public signup — one admin account, created by hand.
4. **Copy env vars:**
   ```
   cp .env.example .env.local
   ```
   Fill in:
   - `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase → Settings → API
   - `SUPABASE_SERVICE_ROLE_KEY` — same page, **never** expose this to the browser
   - `RESEND_API_KEY` / `RESEND_FROM_EMAIL` — resend.com, verify your sending domain first
   - `STRIPE_SECRET_KEY` — Stripe dashboard (test key while developing)
   - `STRIPE_WEBHOOK_SECRET` — see below
   - `NEXT_PUBLIC_APP_URL` — where public `/q`, `/i`, `/c` links resolve
   - `ADMIN_APP_URL` — `https://admin.castanedastrings.com`
5. **Install and run:**
   ```
   npm install
   npm run dev
   ```
6. **Stripe webhook (local dev):**
   ```
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
   Copy the printed signing secret into `STRIPE_WEBHOOK_SECRET`. In production, add a webhook
   endpoint in the Stripe dashboard pointing at `https://admin.castanedastrings.com/api/stripe/webhook`
   for `checkout.session.completed` and `payment_intent.succeeded`.

## Seed data (optional, dev only)

`supabase/seed/seed.sql` has two demo clients/inquiries and one contract template. Never run it
against production — it uses fixed UUIDs for repeatable local testing only.

## How the core flow works

1. Admin logs an **inquiry** (or it lands in `/inquiries/new` manually for now — no public inquiry
   form is built in v1, by design).
2. Admin opens the inquiry → **New quote** → adds line items → sends.
3. Client opens `/q/[publicId]`, accepts or declines.
4. On accept: an **invoice** auto-generates from the quote, and a **contract** auto-generates from
   the first active contract template (if one exists). Both links are shown to the client immediately.
5. Client pays the invoice by card (Stripe Checkout) or sees Zelle instructions. Card payments are
   marked paid automatically by the webhook; Zelle payments are marked paid manually from the
   invoice page.
6. Client signs the contract by typing their name — this records name, email, IP, user agent, and
   timestamp. It is **not** a legally-binding e-signature system, just a clean acknowledgement trail.
7. Every email sent (and every manual note) shows up in **Communications**.

## What's deliberately not built (v1 scope)

Full email inbox sync, AI replies, multiple staff roles, complex automations, accounting exports,
recurring invoices, a "real" e-signature vendor, client account logins. If volume grows past what
one admin can track by eye, those are the next lakes — not this one.

## Project structure

```
app/(admin)/        # authenticated admin routes (sidebar + bottom nav)
app/q,/i,/c/         # public client-facing pages, no auth, looked up by public_id
app/api/stripe/      # webhook
lib/actions/         # all server actions (mutations), one file per domain
lib/status.ts        # the only place status transitions are allowed/denied
lib/email/           # Resend wrapper + plain-text templates
supabase/migrations/ # schema, RLS, sequential numbering, past-due helper
```

## Connecting your website's inquiry form (separate repo)

The marketing site (castanedastrings.com) is a different codebase, so it can't call a server
action directly. Instead it POSTs to a small public API route on this app:

```
POST https://admin.castanedastrings.com/api/public/inquiries
Headers: x-api-key: <PUBLIC_INTAKE_API_KEY>
Body (JSON): { name, email, phone?, event_type?, event_date?, location_name?, guest_count?, message? }
```

Set `PUBLIC_INTAKE_API_KEY` to a long random string in **this** app's env vars, and put the same
value in the marketing site's env vars (never in client-side code — the call must happen from
the marketing site's own server, e.g. inside its form's server action or API route).

This creates the client + inquiry, logs activity, and fires an automatic "got your inquiry" email.
It shows up in `/inquiries` immediately, status `new`.
