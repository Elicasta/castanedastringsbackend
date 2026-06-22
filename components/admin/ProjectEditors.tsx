'use client';

import { useState } from 'react';
import { updateProjectStatusLight, updateProjectDetails, togglePropChecked } from '@/lib/server-actions/projects-admin';

const LIGHTS: Array<'red' | 'yellow' | 'green'> = ['red', 'yellow', 'green'];
const LIGHT_STYLES: Record<string, string> = { red: 'bg-red-500', yellow: 'bg-amber-400', green: 'bg-green-500' };

export function StatusLightPicker({ projectId, current }: { projectId: string; current: string }) {
  const [light, setLight] = useState(current);

  return (
    <div className="flex items-center gap-2">
      {LIGHTS.map((l) => (
        <button
          key={l}
          type="button"
          onClick={async () => {
            setLight(l);
            await updateProjectStatusLight(projectId, l);
          }}
          className={`w-6 h-6 rounded-full border-2 ${LIGHT_STYLES[l]} ${light === l ? 'border-neutral-900' : 'border-transparent opacity-40'}`}
          title={l}
        />
      ))}
    </div>
  );
}

export function SessionDetailsEditor({
  projectId,
  initialVision,
  initialNotes,
  initialGalleryUrl,
}: {
  projectId: string;
  initialVision: string | null;
  initialNotes: string | null;
  initialGalleryUrl: string | null;
}) {
  const [vision, setVision] = useState(initialVision ?? '');
  const [notes, setNotes] = useState(initialNotes ?? '');
  const [galleryUrl, setGalleryUrl] = useState(initialGalleryUrl ?? '');
  const [saving, setSaving] = useState(false);

  const save = async (updates: Record<string, string>) => {
    setSaving(true);
    await updateProjectDetails(projectId, updates);
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1">Session vision</label>
        <textarea
          value={vision}
          onChange={(e) => setVision(e.target.value)}
          onBlur={() => save({ session_vision: vision })}
          rows={3}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1">Session notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => save({ session_notes: notes })}
          rows={3}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1">
          Gallery link (Pixieset, pasted manually once you create it there)
        </label>
        <input
          type="text"
          value={galleryUrl}
          onChange={(e) => setGalleryUrl(e.target.value)}
          onBlur={() => save({ gallery_url: galleryUrl })}
          placeholder="https://yourstudio.pixieset.com/..."
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>
      {saving && <p className="text-xs text-neutral-400">Saving…</p>}
    </div>
  );
}

export function PropChecklist({ projectId, props: initialProps }: { projectId: string; props: Array<{ id: string; name: string; checked: boolean }> }) {
  const [props, setProps] = useState(initialProps);

  const toggle = async (propId: string, checked: boolean) => {
    setProps((prev) => prev.map((p) => (p.id === propId ? { ...p, checked } : p)));
    await togglePropChecked(propId, projectId, checked);
  };

  if (props.length === 0) return <p className="text-sm text-neutral-400">No props added yet.</p>;

  return (
    <ul className="space-y-1.5">
      {props.map((prop) => (
        <li key={prop.id} className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={prop.checked} onChange={(e) => toggle(prop.id, e.target.checked)} />
          <span className={prop.checked ? 'line-through text-neutral-400' : 'text-neutral-800'}>{prop.name}</span>
        </li>
      ))}
    </ul>
  );
}
