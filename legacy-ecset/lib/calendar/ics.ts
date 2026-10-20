import 'server-only';
import { createEvent } from 'ics';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

type GenerateIcsArgs = {
  bookingId: string;
  startsAt: string;
  endsAt: string;
  timezone: string;
  title: string;
  location?: string;
};

export async function generateIcsFile(args: GenerateIcsArgs): Promise<string | null> {
  const start = new Date(args.startsAt);
  const end = new Date(args.endsAt);

  const { error, value } = createEvent({
    start: [start.getUTCFullYear(), start.getUTCMonth() + 1, start.getUTCDate(), start.getUTCHours(), start.getUTCMinutes()],
    end: [end.getUTCFullYear(), end.getUTCMonth() + 1, end.getUTCDate(), end.getUTCHours(), end.getUTCMinutes()],
    title: args.title,
    location: args.location,
    startInputType: 'utc',
    endInputType: 'utc',
  });

  if (error || !value) {
    throw error ?? new Error('ICS generation failed');
  }

  const supabase = createServiceRoleClient();
  const path = `bookings/${args.bookingId}.ics`;

  const { error: uploadError } = await supabase.storage
    .from('booking-files')
    .upload(path, value, { contentType: 'text/calendar', upsert: true });

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabase.storage.from('booking-files').getPublicUrl(path);
  return data.publicUrl;
}
