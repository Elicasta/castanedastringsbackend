import 'server-only';
import { nanoid } from 'nanoid';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { isBookingReady } from '@/lib/state-machine/types';
import { generateIcsFile } from '@/lib/calendar/ics';
import { createGoogleCalendarEvent } from '@/lib/calendar/google-calendar';
import { sendTransactionalEmail } from '@/lib/email/send';

/**
 * The single gate that decides whether a client gets a scheduling link.
 * Called after every event that could complete the trio: quote accepted,
 * contract signed, invoice paid (stripe webhook or manual zelle). Safe to
 * call redundantly — if a booking row already exists for this quote, it's
 * returned as-is instead of creating a duplicate.
 */
export async function checkAndPromoteToBookingReady(quoteId: string) {
  const supabase = createServiceRoleClient();

  const { data: quote } = await supabase
    .from('quotes')
    .select('id, studio_id, client_id, inquiry_id, status')
    .eq('id', quoteId)
    .single();
  if (!quote) return { promoted: false as const };

  const { data: contract } = await supabase
    .from('contracts')
    .select('id, status')
    .eq('quote_id', quoteId)
    .maybeSingle();

  const { data: invoice } = await supabase
    .from('invoices')
    .select('id, status:payment_status')
    .eq('quote_id', quoteId)
    .maybeSingle();

  const ready = isBookingReady({
    quoteStatus: quote.status as any,
    contractStatus: (contract?.status as any) ?? null,
    invoicePaymentStatus: (invoice?.status as any) ?? null,
  });

  if (!ready) return { promoted: false as const };

  const { data: existingBooking } = await supabase
    .from('bookings')
    .select('id, public_token')
    .eq('quote_id', quoteId)
    .maybeSingle();

  if (existingBooking) return { promoted: false as const, bookingId: existingBooking.id };

  const publicToken = `bk_${nanoid(24)}`;

  const { data: booking, error } = await supabase
    .from('bookings')
    .insert({
      studio_id: quote.studio_id,
      client_id: quote.client_id,
      inquiry_id: quote.inquiry_id,
      quote_id: quote.id,
      contract_id: contract?.id ?? null,
      invoice_id: invoice?.id ?? null,
      status: 'booking_ready',
      public_token: publicToken,
    })
    .select('id, public_token')
    .single();

  if (error || !booking) return { promoted: false as const };

  await supabase.rpc('log_status_event', {
    p_studio_id: quote.studio_id,
    p_entity_type: 'booking',
    p_entity_id: booking.id,
    p_event_type: 'booking_ready',
    p_title: 'Client is booking ready',
  });

  const { data: client } = await supabase
    .from('clients')
    .select('email, first_name')
    .eq('id', quote.client_id)
    .single();

  if (client) {
    await sendTransactionalEmail({
      studioId: quote.studio_id,
      triggerKey: 'scheduling_link',
      toEmail: client.email,
      relatedIds: { client_id: quote.client_id, booking_id: booking.id, quote_id: quote.id },
      data: {
        firstName: client.first_name,
        schedulingUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/book/${booking.public_token}`,
      },
    });
  }

  return { promoted: true as const, bookingId: booking.id };
}

type ConfirmBookingInput = {
  bookingToken: string;
  startsAt: string; // ISO timestamp
  endsAt: string;
  timezone: string;
  locationName?: string;
  locationAddress?: string;
};

type ConfirmBookingResult =
  | { ok: true; alreadyBooked: boolean; bookingId: string; projectSlug: string | null; portalUrl: string | null }
  | { ok: false; error: string; slotTaken?: boolean };

/**
 * THE function in this whole codebase that the "never create a project
 * before booked" rule depends on. There is no other code path that creates
 * a projects row. If this function isn't called, no project exists, no
 * matter what state the quote/contract/invoice are in.
 *
 * Concurrency: the actual "no double booking" guarantee is the exclusion
 * constraint in migration 0007, not a check we run here first. Two people
 * could call this for the same slot at the same instant and Postgres
 * resolves it correctly either way. We just catch the resulting error
 * (23P01) and turn it into a clean message instead of a 500.
 */
export async function confirmBooking(input: ConfirmBookingInput): Promise<ConfirmBookingResult> {
  const supabase = createServiceRoleClient();

  const { data: booking, error: fetchError } = await supabase
    .from('bookings')
    .select('id, studio_id, client_id, quote_id, contract_id, invoice_id, inquiry_id, status')
    .eq('public_token', input.bookingToken)
    .single();

  if (fetchError || !booking) {
    return { ok: false, error: 'Booking link not found.' };
  }

  if (booking.status === 'booked') {
    const { data: existingProject } = await supabase
      .from('projects')
      .select('slug, portal_token')
      .eq('booking_id', booking.id)
      .maybeSingle();
    return {
      ok: true,
      alreadyBooked: true,
      bookingId: booking.id,
      projectSlug: existingProject?.slug ?? null,
      portalUrl: existingProject ? `${process.env.NEXT_PUBLIC_SITE_URL}/client/${existingProject.slug}` : null,
    };
  }

  if (booking.status !== 'booking_ready') {
    return { ok: false, error: 'This booking is not in a state that can be scheduled.' };
  }

  const { error: updateError } = await supabase
    .from('bookings')
    .update({
      starts_at: input.startsAt,
      ends_at: input.endsAt,
      timezone: input.timezone,
      location_name: input.locationName ?? null,
      location_address: input.locationAddress ?? null,
      status: 'booked',
    })
    .eq('id', booking.id)
    .eq('status', 'booking_ready'); // belt-and-suspenders against a double-submit race

  if (updateError) {
    const code = (updateError as { code?: string }).code;
    if (code === '23P01') {
      return { ok: false, error: 'That time was just taken. Please pick another slot.', slotTaken: true };
    }
    return { ok: false, error: 'Could not confirm booking. Please try again.' };
  }

  await supabase.rpc('log_status_event', {
    p_studio_id: booking.studio_id,
    p_entity_type: 'booking',
    p_entity_id: booking.id,
    p_event_type: 'booked',
    p_title: 'Session booked',
    p_metadata: { starts_at: input.startsAt, ends_at: input.endsAt },
  });

  // Calendar sync is best-effort. A failure here must never undo the
  // booking — the spec is explicit about this. We record the failure so
  // the admin dashboard can show a warning and offer a retry.
  let icsUrl: string | null = null;
  let googleEventId: string | null = null;
  let calendarSyncStatus: 'synced' | 'failed' | 'queued' = 'queued';

  try {
    icsUrl = await generateIcsFile({
      bookingId: booking.id,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      timezone: input.timezone,
      title: 'Session',
      location: input.locationAddress,
    });
  } catch {
    icsUrl = null;
  }

  try {
    if (process.env.GOOGLE_CALENDAR_CLIENT_ID) {
      googleEventId = await createGoogleCalendarEvent({
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        timezone: input.timezone,
        location: input.locationAddress,
      });
      calendarSyncStatus = 'synced';
    } else {
      calendarSyncStatus = 'not_applicable' as any;
    }
  } catch {
    calendarSyncStatus = 'failed';
  }

  await supabase
    .from('bookings')
    .update({
      ics_file_url: icsUrl,
      google_calendar_event_id: googleEventId,
      calendar_sync_status: calendarSyncStatus,
    })
    .eq('id', booking.id);

  if (calendarSyncStatus === 'failed') {
    await supabase.rpc('log_status_event', {
      p_studio_id: booking.studio_id,
      p_entity_type: 'booking',
      p_entity_id: booking.id,
      p_event_type: 'calendar_sync_failed',
      p_title: 'Google Calendar sync failed',
      p_description: 'Booking is still confirmed. Retry calendar sync from the booking detail page.',
    });
  }

  const project = await createProjectForBooking(booking.id);

  return {
    ok: true,
    alreadyBooked: false,
    bookingId: booking.id,
    projectSlug: project?.slug ?? null,
    portalUrl: project ? `${process.env.NEXT_PUBLIC_SITE_URL}/client/${project.slug}` : null,
  };
}

/**
 * Creates the project + seeds its document cards + sends the portal setup
 * email. Only ever called from confirmBooking, right after a booking flips
 * to 'booked'. Idempotent via the unique constraint on projects.booking_id —
 * if this somehow runs twice, the second insert fails and we fetch the row
 * that already exists instead of erroring the booking flow.
 */
async function createProjectForBooking(bookingId: string) {
  const supabase = createServiceRoleClient();

  const { data: existing } = await supabase
    .from('projects')
    .select('id, slug, portal_token')
    .eq('booking_id', bookingId)
    .maybeSingle();
  if (existing) return existing;

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, studio_id, client_id, inquiry_id, quote_id, contract_id, invoice_id')
    .eq('id', bookingId)
    .single();
  if (!booking) return null;

  const { data: client } = await supabase
    .from('clients')
    .select('first_name, last_name, email')
    .eq('id', booking.client_id)
    .single();
  if (!client) return null;

  const { data: inquiry } = booking.inquiry_id
    ? await supabase.from('inquiries').select('inquiry_type, session_type').eq('id', booking.inquiry_id).single()
    : { data: null };

  const slug = `${slugify(`${client.first_name}-${client.last_name}`)}-${nanoid(6)}`;
  const portalToken = `pt_${nanoid(24)}`;

  const { data: project, error } = await supabase
    .from('projects')
    .insert({
      studio_id: booking.studio_id,
      client_id: booking.client_id,
      booking_id: booking.id,
      inquiry_id: booking.inquiry_id,
      name: `${client.first_name} ${client.last_name} — ${inquiry?.session_type ?? 'Session'}`,
      slug,
      session_type: inquiry?.session_type ?? inquiry?.inquiry_type ?? null,
      status_light: 'yellow',
      portal_token: portalToken,
    })
    .select('id, slug, portal_token')
    .single();

  if (error || !project) {
    // Race: another request created it first. Fetch and use that one.
    const { data: raceWinner } = await supabase
      .from('projects')
      .select('id, slug, portal_token')
      .eq('booking_id', bookingId)
      .maybeSingle();
    return raceWinner ?? null;
  }

  await seedProjectDocuments(project.id, booking);

  await supabase.rpc('log_status_event', {
    p_studio_id: booking.studio_id,
    p_entity_type: 'project',
    p_entity_id: project.id,
    p_event_type: 'project_created',
    p_title: 'Project and client portal created',
  });

  await supabase.from('projects').update({ portal_sent_at: new Date().toISOString() }).eq('id', project.id);

  await sendTransactionalEmail({
    studioId: booking.studio_id,
    triggerKey: 'portal_setup',
    toEmail: client.email,
    relatedIds: { client_id: booking.client_id, project_id: project.id, booking_id: booking.id },
    data: {
      firstName: client.first_name,
      portalUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/client/${project.slug}`,
    },
  });

  return project;
}

async function seedProjectDocuments(
  projectId: string,
  booking: { quote_id: string | null; contract_id: string | null; invoice_id: string | null; inquiry_id: string | null }
) {
  const supabase = createServiceRoleClient();

  const rows = [
    booking.invoice_id && { document_type: 'invoice' as const, title: 'Invoice', source_id: booking.invoice_id, source_table: 'invoices' },
    booking.quote_id && { document_type: 'quote' as const, title: 'Quote', source_id: booking.quote_id, source_table: 'quotes' },
    booking.contract_id && { document_type: 'contract' as const, title: 'Contract', source_id: booking.contract_id, source_table: 'contracts' },
    booking.inquiry_id && { document_type: 'inquiry_form' as const, title: 'Inquiry Form', source_id: booking.inquiry_id, source_table: 'inquiries' },
  ].filter(Boolean) as Array<{ document_type: string; title: string; source_id: string; source_table: string }>;

  if (rows.length === 0) return;

  await supabase.from('project_documents').insert(
    rows.map((row, i) => ({ project_id: projectId, sort_order: i, ...row }))
  );
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
