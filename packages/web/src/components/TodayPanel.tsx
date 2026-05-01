import type { SortMode, Todo } from '../types';
import { sortForDate } from '../lib/sort';
import { fullDateLabel } from '../lib/dates';
import { TodoItem } from './TodoItem';
import { AddTodoForm } from './AddTodoForm';
import type { AddInput } from '../api';

interface Props {
  today: string;
  todos: Todo[];
  sortMode: SortMode;
  onAdd: (input: AddInput) => Promise<unknown>;
  onToggle: (todo: Todo) => void;
  onEdit: (todo: Todo) => void;
  onDelete: (todo: Todo) => void;
}

export function TodayPanel({ today, todos, sortMode, onAdd, onToggle, onEdit, onDelete }: Props) {
  const sorted = sortForDate(todos, sortMode);
  const open = sorted.filter((t) => !t.done).length;

  return (
    <section className="flex flex-col gap-4">
      <header>
        <div className="text-xs uppercase tracking-wider text-zinc-500">Today</div>
        <h1 className="text-3xl font-semibold text-zinc-900 mt-1">{fullDateLabel(today)}</h1>
        <p className="text-sm text-zinc-500 mt-1">
          {open === 0 ? 'All clear.' : `${open} open ${open === 1 ? 'task' : 'tasks'}`}
        </p>
      </header>

      <AddTodoForm defaultDate={today} onAdd={onAdd} />

      <div className="card divide-y divide-zinc-100">
        {sorted.length === 0 ? (
          <div className="px-4 py-12 text-center text-zinc-400 text-sm">
            Nothing on your list. Add something above.
          </div>
        ) : (
          sorted.map((t) => (
            <TodoItem
              key={t.id}
              todo={t}
              onToggle={() => onToggle(t)}
              onEdit={() => onEdit(t)}
              onDelete={() => onDelete(t)}
            />
          ))
        )}
      </div>
    </section>
  );
}
