import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/server';

const LIGHT_STYLES: Record<string, string> = {
  red: 'bg-red-500',
  yellow: 'bg-amber-400',
  green: 'bg-green-500',
};

export default async function ProjectsListPage() {
  const supabase = createAdminClient();
  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, session_type, status_light, created_at, clients(first_name, last_name)')
    .order('created_at', { ascending: false });

  return (
    <div>
      <h1 className="text-lg font-semibold text-neutral-900 mb-1">Projects</h1>
      <p className="text-sm text-neutral-500 mb-6">
        A project only exists once a client is fully booked — quote accepted, contract signed, invoice paid, and a date selected.
      </p>

      <div className="rounded-lg border border-neutral-200 bg-white overflow-hidden">
        {!projects || projects.length === 0 ? (
          <p className="px-5 py-8 text-sm text-neutral-500 text-center">
            No projects yet — none of your clients have reached fully-booked status. That's expected until the booking page is built.
          </p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {projects.map((project: any) => (
              <li key={project.id} className="px-5 py-3 flex items-center justify-between hover:bg-neutral-50">
                <Link href={`/admin/projects/${project.id}`} className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full ${LIGHT_STYLES[project.status_light] ?? 'bg-neutral-300'}`} />
                  <span className="text-sm font-medium text-neutral-900">{project.name}</span>
                </Link>
                <span className="text-xs text-neutral-500">{new Date(project.created_at).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
