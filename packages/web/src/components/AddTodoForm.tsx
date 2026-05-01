import { useState } from 'react';
import type { AddInput } from '../api';
import type { Priority } from '../types';
import { addDays, todayISO } from '../lib/dates';

interface Props {
  defaultDate?: string;
  onAdd: (input: AddInput) => Promise<unknown>;
}

const PRIORITY_TOKENS: Record<string, Priority> = {
  high: 'high',
  hi: 'high',
  med: 'medium',
  medium: 'medium',
  low: 'low',
};

function parseInput(raw: string, fallbackDate: string): AddInput | null {
  const text = raw.trim();
  if (!text) return null;
  const today = todayISO();
  let date = fallbackDate;
  let priority: Priority | undefined;
  const tags: string[] = [];

  const tokens = text.split(/\s+/);
  const contentTokens: string[] = [];
  for (const token of tokens) {
    if (token.startsWith('#') && token.length > 1) {
      tags.push(token.slice(1));
    } else if (token.startsWith('!') && token.length > 1) {
      const key = token.slice(1).toLowerCase();
      if (key in PRIORITY_TOKENS) priority = PRIORITY_TOKENS[key];
      else contentTokens.push(token);
    } else if (token.startsWith('^') && token.length > 1) {
      const v = token.slice(1).toLowerCase();
      if (v === 'today') date = today;
      else if (v === 'tomorrow') date = addDays(today, 1);
      else if (v === 'yesterday') date = addDays(today, -1);
      else if (/^\d{4}-\d{2}-\d{2}$/.test(v)) date = v;
      else contentTokens.push(token);
    } else {
      contentTokens.push(token);
    }
  }
  const content = contentTokens.join(' ').trim();
  if (!content) return null;
  return { content, date, tags, priority };
}

export function AddTodoForm({ defaultDate, onAdd }: Props) {
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const fallback = defaultDate ?? todayISO();
    const parsed = parseInput(value, fallback);
    if (!parsed) return;
    setBusy(true);
    try {
      await onAdd(parsed);
      setValue('');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex items-center gap-2 px-4 py-3 border border-zinc-200 rounded-xl bg-white focus-within:border-zinc-400 transition">
      <span className="text-zinc-400 text-lg leading-none select-none">+</span>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Add a todo… use #tag, !high, ^tomorrow"
        className="flex-1 bg-transparent outline-none text-[15px] placeholder:text-zinc-400"
        disabled={busy}
      />
      {value && (
        <button type="submit" className="btn btn-primary h-8 px-3 text-xs" disabled={busy}>
          Add
        </button>
      )}
    </form>
  );
}
