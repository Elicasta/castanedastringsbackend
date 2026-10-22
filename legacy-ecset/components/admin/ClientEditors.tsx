'use client';

import { useState } from 'react';
import { updateClientNotes, updateClientTags } from '@/lib/server-actions/clients-admin';

export function NotesEditor({ clientId, initialNotes }: { clientId: string; initialNotes: string | null }) {
  const [notes, setNotes] = useState(initialNotes ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleBlur = async () => {
    setSaving(true);
    await updateClientNotes(clientId, notes);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={handleBlur}
        rows={4}
        placeholder="Internal notes — not visible to the client"
        className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
      />
      <p className="text-xs text-neutral-400 mt-1">{saving ? 'Saving…' : saved ? 'Saved' : 'Saves automatically when you click away'}</p>
    </div>
  );
}

export function TagsEditor({ clientId, initialTags }: { clientId: string; initialTags: string[] }) {
  const [tags, setTags] = useState<string[]>(initialTags);
  const [input, setInput] = useState('');

  const addTag = async () => {
    const value = input.trim();
    if (!value || tags.includes(value)) return;
    const updated = [...tags, value];
    setTags(updated);
    setInput('');
    await updateClientTags(clientId, updated);
  };

  const removeTag = async (tag: string) => {
    const updated = tags.filter((t) => t !== tag);
    setTags(updated);
    await updateClientTags(clientId, updated);
  };

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {tags.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => removeTag(tag)}
            className="text-xs px-2 py-1 rounded-full bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            title="Click to remove"
          >
            {tag} ×
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
          placeholder="Add a tag, e.g. mini-session-leads"
          className="flex-1 rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
        />
        <button type="button" onClick={addTag} className="text-sm rounded-md border border-neutral-300 px-3 py-1.5">
          Add
        </button>
      </div>
    </div>
  );
}
