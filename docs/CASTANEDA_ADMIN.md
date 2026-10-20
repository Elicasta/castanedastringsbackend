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
