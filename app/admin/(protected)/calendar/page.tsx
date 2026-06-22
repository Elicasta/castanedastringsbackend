import { createAdminClient } from '@/lib/supabase/server';
import { createAvailabilityRule, deleteAvailabilityRule, createBlackout, deleteBlackout } from '@/lib/server-actions/calendar-admin';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default async function CalendarPage() {
  const supabase = createAdminClient();

  const [{ data: rules }, { data: blackouts }, { data: upcoming }] = await Promise.all([
    supabase.from('availability_rules').select('*').order('day_of_week'),
    supabase.from('availability_blackouts').select('*').order('starts_at'),
    supabase
      .from('bookings')
      .select('id, starts_at, ends_at, location_name, clients(first_name, last_name)')
      .eq('status', 'booked')
      .gte('starts_at', new Date().toISOString())
      .order('starts_at')
      .limit(20),
  ]);

  return (
    <div className="max-w-3xl space-y-10">
      <div>
        <h1 className="text-lg font-semibold text-neutral-900 mb-1">Calendar</h1>
        <p className="text-sm text-neutral-500">Availability rules, blackout dates, and what's actually booked.</p>
      </div>

      <section>
        <h2 className="text-sm font-medium text-neutral-900 mb-3">Upcoming booked sessions</h2>
        <div className="rounded-lg border border-neutral-200 bg-white">
          {!upcoming || upcoming.length === 0 ? (
            <p className="px-5 py-6 text-sm text-neutral-500">Nothing booked yet.</p>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {upcoming.map((b: any) => (
                <li key={b.id} className="px-5 py-3 text-sm flex justify-between">
                  <span className="text-neutral-800">{b.clients?.first_name} {b.clients?.last_name}</span>
                  <span className="text-neutral-500">{new Date(b.starts_at).toLocaleString()}{b.location_name ? ` · ${b.location_name}` : ''}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-medium text-neutral-900 mb-3">Weekly availability</h2>
        <div className="rounded-lg border border-neutral-200 bg-white mb-4">
          {!rules || rules.length === 0 ? (
            <p className="px-5 py-6 text-sm text-neutral-500">No availability rules yet. Add one below — until you do, the booking page has no open slots to offer.</p>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {rules.map((rule) => (
                <li key={rule.id} className="px-5 py-3 text-sm flex items-center justify-between">
                  <span className="text-neutral-800">
                    {DAY_NAMES[rule.day_of_week]} · {rule.start_time}–{rule.end_time} · {rule.slot_duration_minutes}min slots
                  </span>
                  <form action={deleteAvailabilityRule.bind(null, rule.id)}>
                    <button type="submit" className="text-xs text-red-600 hover:underline">Remove</button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </div>
        <form action={createAvailabilityRule} className="rounded-lg border border-neutral-200 bg-white p-4 grid grid-cols-2 gap-3">
          <select name="day_of_week" required className="rounded-md border border-neutral-300 px-3 py-2 text-sm">
            {DAY_NAMES.map((day, i) => <option key={day} value={i}>{day}</option>)}
          </select>
          <input name="name" placeholder="Name (e.g. Weekday sessions)" className="rounded-md border border-neutral-300 px-3 py-2 text-sm" />
          <input name="start_time" type="time" required className="rounded-md border border-neutral-300 px-3 py-2 text-sm" />
          <input name="end_time" type="time" required className="rounded-md border border-neutral-300 px-3 py-2 text-sm" />
          <input name="slot_duration_minutes" type="number" defaultValue={60} placeholder="Slot minutes" className="rounded-md border border-neutral-300 px-3 py-2 text-sm" />
          <input name="buffer_before_minutes" type="number" defaultValue={0} placeholder="Buffer before (min)" className="rounded-md border border-neutral-300 px-3 py-2 text-sm" />
          <input name="buffer_after_minutes" type="number" defaultValue={0} placeholder="Buffer after (min)" className="rounded-md border border-neutral-300 px-3 py-2 text-sm" />
          <button type="submit" className="col-span-2 rounded-md bg-neutral-900 text-white text-sm py-2">Add availability rule</button>
        </form>
      </section>

      <section>
        <h2 className="text-sm font-medium text-neutral-900 mb-3">Blackout dates</h2>
        <div className="rounded-lg border border-neutral-200 bg-white mb-4">
          {!blackouts || blackouts.length === 0 ? (
            <p className="px-5 py-6 text-sm text-neutral-500">No blackout dates.</p>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {blackouts.map((b) => (
                <li key={b.id} className="px-5 py-3 text-sm flex items-center justify-between">
                  <span className="text-neutral-800">
                    {b.title} · {new Date(b.starts_at).toLocaleString()} – {new Date(b.ends_at).toLocaleString()}
                  </span>
                  <form action={deleteBlackout.bind(null, b.id)}>
                    <button type="submit" className="text-xs text-red-600 hover:underline">Remove</button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </div>
        <form action={createBlackout} className="rounded-lg border border-neutral-200 bg-white p-4 grid grid-cols-2 gap-3">
          <input name="title" placeholder="Title (e.g. Vacation)" required className="col-span-2 rounded-md border border-neutral-300 px-3 py-2 text-sm" />
          <input name="starts_at" type="datetime-local" required className="rounded-md border border-neutral-300 px-3 py-2 text-sm" />
          <input name="ends_at" type="datetime-local" required className="rounded-md border border-neutral-300 px-3 py-2 text-sm" />
          <input name="reason" placeholder="Reason (optional)" className="col-span-2 rounded-md border border-neutral-300 px-3 py-2 text-sm" />
          <button type="submit" className="col-span-2 rounded-md bg-neutral-900 text-white text-sm py-2">Add blackout</button>
        </form>
      </section>
    </div>
  );
}
