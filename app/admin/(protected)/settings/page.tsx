import { createAdminClient } from '@/lib/supabase/server';
import { getCurrentAdmin } from '@/lib/server-actions/current-admin';
import { updateStudioSettings } from '@/lib/server-actions/settings-admin';

export default async function SettingsPage() {
  const admin = await getCurrentAdmin();
  const supabase = createAdminClient();
  const { data: studio } = await supabase.from('studios').select('*').eq('id', admin?.studioId).single();

  const canEdit = admin?.role === 'owner' || admin?.role === 'admin';

  return (
    <div className="max-w-lg">
      <h1 className="text-lg font-semibold text-neutral-900 mb-1">Settings</h1>
      <p className="text-sm text-neutral-500 mb-6">
        {canEdit ? 'Studio-wide settings.' : `You're signed in as ${admin?.role} — only owners and admins can change these.`}
      </p>

      <form action={updateStudioSettings} className="rounded-lg border border-neutral-200 bg-white p-6 space-y-5">
        <div>
          <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1">Studio name</label>
          <input
            name="name"
            defaultValue={studio?.name}
            disabled={!canEdit}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm disabled:bg-neutral-50"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1">
            Zelle payment instructions
          </label>
          <p className="text-xs text-neutral-400 mb-2">Shown to clients on every invoice page next to the "I Sent It by Zelle" button.</p>
          <textarea
            name="zelle_instructions"
            defaultValue={studio?.zelle_instructions ?? ''}
            disabled={!canEdit}
            rows={3}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm disabled:bg-neutral-50"
          />
        </div>
        {canEdit && (
          <button type="submit" className="rounded-md bg-neutral-900 text-white text-sm px-4 py-2">
            Save settings
          </button>
        )}
      </form>

      <p className="text-xs text-neutral-400 mt-4">
        Stripe enable/disable, calendar enable/disable, default timezone, default session duration, and Resend
        from-email aren't wired to settings yet — those still come from environment variables in `.env.local`.
      </p>
    </div>
  );
}
