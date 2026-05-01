import { useMemo, useState } from 'react';
import type { SortMode, Todo } from '../types';
import { dateLabel } from '../lib/dates';
import { groupByDate, sortForDate } from '../lib/sort';
import { TodoItem } from './TodoItem';

interface Props {
  title: string;
  todos: Todo[];           // already filtered to date range
  today: string;
  sortMode: SortMode;
  emptyHint: string;
  reverseSort?: boolean;   // past = newest first; future = soonest first
  onToggle: (todo: Todo) => void;
  onEdit: (todo: Todo) => void;
  onDelete: (todo: Todo) => void;
}

export function DateGroupList({ title, todos, sortMode, reverseSort, emptyHint, today, onToggle, onEdit, onDelete }: Props) {
  const grouped = useMemo(() => {
    const map = groupByDate(todos);
    const dates = [...map.keys()].sort();
    if (reverseSort) dates.reverse();
    return dates.map((d) => ({ date: d, items: sortForDate(map.get(d) ?? [], sortMode) }));
  }, [todos, sortMode, reverseSort]);

  return (
    <section className="flex flex-col gap-3">
      <header className="flex items-baseline justify-between">
        <h2 className="text-xs uppercase tracking-wider text-zinc-500">{title}</h2>
        <span className="text-xs text-zinc-400">{todos.length} {todos.length === 1 ? 'item' : 'items'}</span>
      </header>

      {grouped.length === 0 ? (
        <p className="text-sm text-zinc-400 px-1">{emptyHint}</p>
      ) : (
        <div className="flex flex-col gap-3">
          {grouped.map((g) => (
            <DayGroup
              key={g.date}
              date={g.date}
              items={g.items}
              today={today}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </section>
  );
}

interface DayProps {
  date: string;
  items: Todo[];
  today: string;
  onToggle: (todo: Todo) => void;
  onEdit: (todo: Todo) => void;
  onDelete: (todo: Todo) => void;
}

function DayGroup({ date, items, today, onToggle, onEdit, onDelete }: DayProps) {
  const [open, setOpen] = useState(true);
  const openCount = items.filter((t) => !t.done).length;
  return (
    <div className="card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-50 transition"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-zinc-900">{dateLabel(date, today)}</span>
          <span className="text-xs text-zinc-400">{date}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500">
            {openCount}/{items.length}
          </span>
          <svg
            viewBox="0 0 12 12"
            className={`w-3 h-3 text-zinc-400 transition-transform ${open ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M3 4.5l3 3 3-3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </button>
      {open && (
        <div className="divide-y divide-zinc-100 border-t border-zinc-100">
          {items.map((t) => (
            <TodoItem
              key={t.id}
              todo={t}
              onToggle={() => onToggle(t)}
              onEdit={() => onEdit(t)}
              onDelete={() => onDelete(t)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
