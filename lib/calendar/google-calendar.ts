import 'server-only';
import { google } from 'googleapis';

type CreateEventArgs = {
  startsAt: string;
  endsAt: string;
  timezone: string;
  location?: string;
};

/**
 * Real implementation, but assumes a single studio-wide refresh token
 * (GOOGLE_CALENDAR_REFRESH_TOKEN) set up once in Settings, not per-admin
 * OAuth. That matches the spec's "Google Calendar API or calendar adapter"
 * framing — one calendar for the studio, not one per team member.
 *
 * If GOOGLE_CALENDAR_CLIENT_ID is unset, the caller (confirmBooking) never
 * calls this at all and calendar_sync_status stays 'not_applicable'. If the
 * credentials are set but the API call fails (expired refresh token, Google
 * outage, whatever), this throws and confirmBooking catches it, marks
 * 'failed', and keeps the booking. That's the contract — never let calendar
 * sync take the booking down with it.
 */
export async function createGoogleCalendarEvent(args: CreateEventArgs): Promise<string> {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CALENDAR_CLIENT_ID,
    process.env.GOOGLE_CALENDAR_CLIENT_SECRET
  );
  oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_CALENDAR_REFRESH_TOKEN });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  const response = await calendar.events.insert({
    calendarId: process.env.GOOGLE_CALENDAR_ID,
    requestBody: {
      summary: 'Session',
      location: args.location,
      start: { dateTime: args.startsAt, timeZone: args.timezone },
      end: { dateTime: args.endsAt, timeZone: args.timezone },
    },
  });

  if (!response.data.id) {
    throw new Error('Google Calendar did not return an event id');
  }

  return response.data.id;
}
