import type { Todo } from '../types';

interface Props {
  todo: Todo;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function TodoItem({ todo, onToggle, onEdit, onDelete }: Props) {
  return (
    <div className="group flex items-start gap-3 px-4 py-3 rounded-xl hover:bg-zinc-50 transition">
      <button
        type="button"
        onClick={onToggle}
        aria-label={todo.done ? 'mark as not done' : 'mark as done'}
        className={
          'mt-0.5 shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition ' +
          (todo.done
            ? 'bg-zinc-900 border-zinc-900 text-white'
            : 'border-zinc-300 hover:border-zinc-500')
        }
      >
        {todo.done && (
          <svg viewBox="0 0 12 12" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M2 6.5l2.5 2.5L10 3.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      <button
        type="button"
        onClick={onEdit}
        className="flex-1 text-left min-w-0"
      >
        <div
          className={
            'text-[15px] leading-snug break-words ' +
            (todo.done ? 'line-through text-zinc-400' : 'text-zinc-900')
          }
        >
          {todo.content}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          {todo.priority && <PriorityBadge priority={todo.priority} />}
          {todo.tags.map((tag) => (
            <span key={tag} className="chip">
              #{tag}
            </span>
          ))}
          {todo.originalDate && todo.originalDate !== todo.date && (
            <span className="text-xs text-amber-600">from {todo.originalDate}</span>
          )}
        </div>
      </button>

      <button
        type="button"
        onClick={onDelete}
        aria-label="delete"
        className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition shrink-0 text-zinc-400 hover:text-rose-500 p-1.5 rounded-md"
      >
        <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 4h10M6 4V2.5a.5.5 0 01.5-.5h3a.5.5 0 01.5.5V4M5 4l.5 9a1 1 0 001 1h3a1 1 0 001-1L11 4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}

function PriorityBadge({ priority }: { priority: 'high' | 'medium' | 'low' }) {
  const map = {
    high: 'bg-rose-50 text-rose-700',
    medium: 'bg-amber-50 text-amber-700',
    low: 'bg-sky-50 text-sky-700',
  };
  const label = { high: 'High', medium: 'Medium', low: 'Low' };
  return <span className={`chip ${map[priority]}`}>{label[priority]}</span>;
}
