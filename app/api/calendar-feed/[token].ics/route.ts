import { createServiceRoleClient } from '@/lib/supabase/service-role';

function escapeIcs(value: string | null | undefined) {
  return (value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

function toIcsDateTime(value: string | null | undefined) {
  if (!value) return null;
  return new Date(value).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

export async function GET(_request: Request, { params }: { params: { token: string } }) {
  const token = params.token.replace(/\.ics$/, '');
  const supabase = createServiceRoleClient() as any;

  const { data: feed } = await supabase
    .from('calendar_feed_tokens')
    .select('id, studio_id, scope, client_id, employee_id, is_active')
    .eq('token', token)
    .eq('is_active', true)
    .maybeSingle();

  if (!feed) {
    return new Response('Not found', { status: 404 });
  }

  let query = supabase
    .from('bookings')
    .select('id, studio_id, client_id, starts_at, ends_at, location_name, location_address, status, clients(first_name,last_name), inquiries(session_type)')
    .eq('studio_id', feed.studio_id)
    .in('status', ['scheduled', 'booked', 'completed'])
    .order('starts_at', { ascending: true })
    .limit(300);

  if (feed.scope === 'client' && feed.client_id) {
    query = query.eq('client_id', feed.client_id);
  }

  const { data: bookings } = await query;
  const now = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');

  const events = (bookings ?? [])
    .map((booking: any) => {
      const start = toIcsDateTime(booking.starts_at);
      const end = toIcsDateTime(booking.ends_at);
      if (!start || !end) return '';

      const clientName = [booking.clients?.first_name, booking.clients?.last_name].filter(Boolean).join(' ');
      const sessionType = booking.inquiries?.session_type || 'Session';
      const location = [booking.location_name, booking.location_address].filter(Boolean).join(' — ');

      return [
        'BEGIN:VEVENT',
        `UID:${booking.id}@eccreativestudios.com`,
        `DTSTAMP:${now}`,
        `DTSTART:${start}`,
        `DTEND:${end}`,
        `SUMMARY:${escapeIcs(`EC Creative: ${sessionType}${clientName ? ` — ${clientName}` : ''}`)}`,
        `LOCATION:${escapeIcs(location)}`,
        `DESCRIPTION:${escapeIcs('EC Creative Studios booked session.')}`,
        'END:VEVENT',
      ].join('\r\n');
    })
    .filter(Boolean)
    .join('\r\n');

  const body = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//EC Creative Studios//Studio Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    events,
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n');

  return new Response(body, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}
