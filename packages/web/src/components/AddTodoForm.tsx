import { useEffect, useRef, useState } from 'react';
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
  const [expanded, setExpanded] = useState(false);
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (expanded) inputRef.current?.focus();
  }, [expanded]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const fallback = defaultDate ?? todayISO();
    const parsed = parseInput(value, fallback);
    if (!parsed) return;
    setBusy(true);
    try {
      await onAdd(parsed);
      setValue('');
      setExpanded(false);
    } finally {
      setBusy(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      setValue('');
      setExpanded(false);
    }
  }

  function onBlur() {
    if (!value) setExpanded(false);
  }

  if (!expanded) {
    return (
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setExpanded(true)}
          aria-label="Add a todo"
          className="h-9 w-9 flex items-center justify-center rounded-full bg-zinc-900 text-white hover:bg-zinc-800 shadow-card transition"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      <div className="flex items-center gap-2 px-4 py-3 border border-zinc-300 rounded-xl bg-white focus-within:border-zinc-500 transition">
        <span className="text-zinc-400 text-lg leading-none select-none">+</span>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={onBlur}
          placeholder="Buy milk #grocery !high ^tomorrow"
          className="flex-1 bg-transparent outline-none text-[15px] placeholder:text-zinc-400"
          disabled={busy}
        />
        {value && (
          <button type="submit" className="btn btn-primary h-8 px-3 text-xs" disabled={busy}>
            Add
          </button>
        )}
      </div>
      <div className="px-1 text-xs text-zinc-500">
        <span className="text-pink-600">#tag</span>
        {' '}for tags ·{' '}
        <span className="text-rose-600">!high</span>
        <span className="text-zinc-400">/!med/!low</span> for priority ·{' '}
        <span className="text-amber-600">^tomorrow</span>
        <span className="text-zinc-400">/^YYYY-MM-DD</span> for date ·{' '}
        <span className="text-zinc-400">esc</span> to cancel
      </div>
    </form>
  );
}
