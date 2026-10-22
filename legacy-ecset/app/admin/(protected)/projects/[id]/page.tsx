import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/server';
import { addProjectProp } from '@/lib/server-actions/projects-admin';
import { StatusLightPicker, SessionDetailsEditor, PropChecklist } from '@/components/admin/ProjectEditors';

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const supabase = createAdminClient();

  const { data: project } = await supabase
    .from('projects')
    .select('*, clients(first_name, last_name, email), bookings(starts_at, ends_at, location_name, location_address)')
    .eq('id', params.id)
    .single();

  if (!project) notFound();

  const { data: props } = await supabase.from('project_props').select('id, name, checked').eq('project_id', project.id).order('sort_order');

  const client = project.clients as any;
  const booking = project.bookings as any;

  return (
    <div className="max-w-2xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-neutral-900">{project.name}</h1>
          <p className="text-sm text-neutral-500">{client.first_name} {client.last_name} · {client.email}</p>
          {booking?.starts_at && (
            <p className="text-sm text-neutral-500 mt-1">
              {new Date(booking.starts_at).toLocaleString()}{booking.location_name ? ` · ${booking.location_name}` : ''}
            </p>
          )}
        </div>
        <StatusLightPicker projectId={project.id} current={project.status_light} />
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white p-6 mb-6">
        <SessionDetailsEditor
          projectId={project.id}
          initialVision={project.session_vision}
          initialNotes={project.session_notes}
          initialGalleryUrl={project.gallery_url}
        />
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white p-6">
        <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-3">Prop list</p>
        <PropChecklist projectId={project.id} props={props ?? []} />
        <form action={addProjectProp.bind(null, project.id)} className="flex gap-2 mt-4">
          <input
            name="name"
            placeholder="Add a prop"
            required
            className="flex-1 rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
          />
          <button type="submit" className="text-sm rounded-md border border-neutral-300 px-3 py-1.5">Add</button>
        </form>
      </div>

      {project.portal_token && (
        <p className="text-xs text-neutral-400 mt-4">
          Portal link: {process.env.NEXT_PUBLIC_SITE_URL}/client/{project.slug}
        </p>
      )}
    </div>
  );
}
