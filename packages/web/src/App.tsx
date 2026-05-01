import { useMemo, useState } from 'react';
import { useTodos } from './hooks/useTodos';
import type { SortMode, Todo } from './types';
import { TodayPanel } from './components/TodayPanel';
import { DateGroupList } from './components/DateGroupList';
import { EditTodoModal } from './components/EditTodoModal';
import { UndoToast } from './components/UndoToast';
import { SortToggle } from './components/SortToggle';

const SORT_KEY = 'todo.sortMode';

function loadSortMode(): SortMode {
  const v = localStorage.getItem(SORT_KEY);
  return v === 'priority' ? 'priority' : 'created';
}

export default function App() {
  const { todos, today, isLoading, error, add, update, toggleDone, remove, restore } = useTodos();
  const [editing, setEditing] = useState<Todo | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Todo | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>(() => loadSortMode());

  function handleSortChange(m: SortMode) {
    setSortMode(m);
    localStorage.setItem(SORT_KEY, m);
  }

  const buckets = useMemo(() => {
    const todayList: Todo[] = [];
    const past: Todo[] = [];
    const future: Todo[] = [];
    for (const t of todos) {
      if (t.date === today) todayList.push(t);
      else if (t.date < today) past.push(t);
      else future.push(t);
    }
    return { todayList, past, future };
  }, [todos, today]);

  async function handleDelete(t: Todo) {
    await remove(t.id);
    setPendingDelete(t);
  }

  async function handleUndoDelete() {
    if (!pendingDelete) return;
    await restore(pendingDelete);
    setPendingDelete(null);
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="text-zinc-900 font-semibold text-lg">Todo</div>
          <SortToggle value={sortMode} onChange={handleSortChange} />
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 text-rose-700 text-sm">
            Failed to load todos: {String((error as Error).message ?? error)}
            <div className="mt-1 text-xs text-rose-600">
              Make sure the API server is running: <code>todo serve</code>
            </div>
          </div>
        )}

        {isLoading && todos.length === 0 ? (
          <div className="text-center py-20 text-zinc-400">Loading…</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-8">
            <TodayPanel
              today={today}
              todos={buckets.todayList}
              sortMode={sortMode}
              onAdd={add}
              onToggle={toggleDone}
              onEdit={setEditing}
              onDelete={handleDelete}
            />

            <div className="flex flex-col gap-8">
              <DateGroupList
                title="Upcoming"
                emptyHint="Nothing planned in the next 30 days."
                today={today}
                todos={buckets.future}
                sortMode={sortMode}
                onToggle={toggleDone}
                onEdit={setEditing}
                onDelete={handleDelete}
              />
              <DateGroupList
                title="Past 30 days"
                emptyHint="No history in the last 30 days."
                today={today}
                todos={buckets.past}
                sortMode={sortMode}
                reverseSort
                onToggle={toggleDone}
                onEdit={setEditing}
                onDelete={handleDelete}
              />
            </div>
          </div>
        )}
      </div>

      {editing && (
        <EditTodoModal
          todo={editing}
          onClose={() => setEditing(null)}
          onSave={update}
        />
      )}

      {pendingDelete && (
        <UndoToast
          message={`Deleted "${pendingDelete.content}"`}
          onUndo={handleUndoDelete}
          onDismiss={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
}
