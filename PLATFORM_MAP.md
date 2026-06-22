# EC Creative Studio Platform — Implementation Map

This build keeps the current ECSET Supabase schema and upgrades it toward the Pixieset-replacement plan.

## Final division of labor

- `eccreativestudios.com`: public marketing site.
- `admin.eccreativestudios.com` or `ecset.vercel.app`: private admin system.
- Pixieset: gallery delivery only, pasted into `projects.gallery_url` manually.

No Pixieset API. No scraping. No iframe retheming.

## Working now

- Admin login lives at `/admin/login`.
- Protected admin pages live under `app/admin/(protected)` while keeping URLs like `/admin/dashboard`.
- Public inquiry bridge lives at `POST /api/public/inquiries`.
- Short public links exist:
  - `/q/[token]` → `/quote/[token]`
  - `/i/[token]` → `/invoice/[token]`
  - `/c/[token]` → `/contract/[token]`
- `.ics` calendar feed endpoint lives at `GET /api/calendar-feed/[token].ics`.
- Existing contract signing flow still captures signature name, email, IP, user agent, and timestamp.
- Existing employee role/RLS migrations remain in place.

## Supabase alignment

The existing ECSET migrations already include most of the studio OS:

- `clients`
- `inquiries`
- `quotes`
- `quote_line_items`
- `contracts`
- `invoices`
- `payments`
- `bookings`
- `projects`
- `project_assignments`
- `project_mood_board_items`
- `project_documents`
- `project_messages`
- `email_logs`
- `status_events`

Migration `0014_platform_map_alignment.sql` adds the missing platform-map primitives without deleting or renaming existing tables:

- client `source`, `status`, `tags`
- project `status`, `gallery_url`, `delivery_due_date`
- `calendar_feed_tokens`
- `campaign_templates`
- `campaigns`
- `campaign_events`

## Public marketing site bridge

The marketing site should call its own server route first, then call this admin app server-to-server.

```ts
await fetch('https://admin.eccreativestudios.com/api/public/inquiries', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': process.env.ECSET_PUBLIC_INTAKE_API_KEY!,
  },
  body: JSON.stringify({
    name: 'Client Name',
    email: 'client@example.com',
    phone: '3055550000',
    sessionType: 'maternity',
    preferredDate: '2026-07-06',
    preferredTimeframe: 'Evening',
    locationPreference: 'Vizcaya or studio',
    visionText: 'Soft editorial maternity session',
    pinterestUrl: '',
    referralSource: 'Instagram',
  }),
});
```

Do not call the admin API directly from browser JS unless you are fine exposing the shared key. Best path: marketing form → marketing server action/API route → ECSET API.

## Next build lake

The system is now shaped correctly. The next contained lake is the deeper admin experience:

- project detail planning board
- campaign composer UI
- calendar feed admin generator
- client portal polish
- employee portal pages
