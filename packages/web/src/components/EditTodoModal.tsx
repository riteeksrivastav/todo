import { useEffect, useState } from 'react';
import type { Priority, Todo } from '../types';
import type { UpdateInput } from '../api';

interface Props {
  todo: Todo;
  onClose: () => void;
  onSave: (id: string, patch: UpdateInput) => Promise<unknown>;
}

export function EditTodoModal({ todo, onClose, onSave }: Props) {
  const [content, setContent] = useState(todo.content);
  const [date, setDate] = useState(todo.date);
  const [tagsText, setTagsText] = useState(todo.tags.join(', '));
  const [priority, setPriority] = useState<Priority | ''>(todo.priority ?? '');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function save() {
    if (!content.trim()) return;
    setBusy(true);
    const patch: UpdateInput = {
      content: content.trim(),
      date,
      tags: tagsText.split(',').map((t) => t.trim()).filter(Boolean),
      priority: priority === '' ? null : priority,
    };
    try {
      await onSave(todo.id, patch);
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-zinc-900/30 backdrop-blur-sm" onClick={onClose}>
      <div className="card w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-zinc-900 mb-4">Edit todo</h3>

        <div className="flex flex-col gap-4">
          <Field label="Content">
            <input
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-zinc-200 focus:border-zinc-400 outline-none text-sm"
            />
          </Field>

          <Field label="Date">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-zinc-200 focus:border-zinc-400 outline-none text-sm"
            />
          </Field>

          <Field label="Tags (comma separated)">
            <input
              type="text"
              value={tagsText}
              onChange={(e) => setTagsText(e.target.value)}
              placeholder="work, personal"
              className="w-full h-10 px-3 rounded-lg border border-zinc-200 focus:border-zinc-400 outline-none text-sm"
            />
          </Field>

          <Field label="Priority">
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority | '')}
              className="w-full h-10 px-3 rounded-lg border border-zinc-200 focus:border-zinc-400 outline-none text-sm bg-white"
            >
              <option value="">None</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </Field>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={save} disabled={busy || !content.trim()}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-xs font-medium text-zinc-500 mb-1.5">{label}</div>
      {children}
    </label>
  );
}
