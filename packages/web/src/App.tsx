import { useEffect, useMemo, useState } from 'react';
import { useTodos } from './hooks/useTodos';
import type { SortMode, Todo } from './types';
import { TodayPanel } from './components/TodayPanel';
import { DateGroupList } from './components/DateGroupList';
import { EditTodoModal } from './components/EditTodoModal';
import { UndoToast } from './components/UndoToast';
import { SortToggle } from './components/SortToggle';

const SORT_KEY = 'todo.sortMode';
const SIDE_PANEL_KEY = 'todo.sidePanelOpen';

function loadSortMode(): SortMode {
  const v = localStorage.getItem(SORT_KEY);
  return v === 'priority' ? 'priority' : 'created';
}

function loadSidePanelOpen(): boolean {
  const v = localStorage.getItem(SIDE_PANEL_KEY);
  if (v === 'false') return false;
  return true; // default open
}

export default function App() {
  const { todos, today, isLoading, error, add, update, toggleDone, remove, restore } = useTodos();
  const [editing, setEditing] = useState<Todo | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Todo | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>(() => loadSortMode());
  const [sideOpen, setSideOpen] = useState<boolean>(() => loadSidePanelOpen());

  function handleSortChange(m: SortMode) {
    setSortMode(m);
    localStorage.setItem(SORT_KEY, m);
  }

  useEffect(() => {
    localStorage.setItem(SIDE_PANEL_KEY, String(sideOpen));
  }, [sideOpen]);

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
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-[720px]">
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
          <TodayPanel
            today={today}
            todos={buckets.todayList}
            sortMode={sortMode}
            onAdd={add}
            onToggle={toggleDone}
            onEdit={setEditing}
            onDelete={handleDelete}
          />
        )}
      </div>

      {/* Side panel toggle — fixed to viewport top-right, above the panel */}
      <div className="fixed top-6 right-6 z-30">
        <SidePanelToggle open={sideOpen} onToggle={() => setSideOpen((s) => !s)} />
      </div>

      {/* Mobile backdrop */}
      {sideOpen && (
        <div
          className="fixed inset-0 z-10 bg-zinc-900/20 backdrop-blur-sm lg:hidden"
          onClick={() => setSideOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Side panel — overlays without pushing main content */}
      <aside
        aria-hidden={!sideOpen}
        className="fixed top-0 bottom-0 right-0 z-20 bg-white border-l border-zinc-200 shadow-lg overflow-y-auto transition-transform duration-300 ease-out w-full sm:w-[420px]"
        style={{
          transform: sideOpen ? 'translateX(0)' : 'translateX(100%)',
        }}
      >
        <div className="px-6 py-8 flex flex-col gap-8">
          <div className="text-zinc-900 font-semibold text-lg">Upcoming &amp; Past</div>
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
      </aside>

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

function SidePanelToggle({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <div className="relative group">
      <button
        type="button"
        onClick={onToggle}
        aria-label={open ? 'Close upcoming & past panel' : 'Open upcoming & past panel'}
        aria-expanded={open}
        className={
          'h-9 w-9 flex items-center justify-center rounded-lg border transition ' +
          (open
            ? 'bg-zinc-900 border-zinc-900 text-white'
            : 'bg-white border-zinc-200 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50')
        }
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <line x1="15" y1="4" x2="15" y2="20" />
        </svg>
      </button>
      <div
        role="tooltip"
        className="absolute right-0 top-full mt-2 px-2.5 py-1.5 rounded-md bg-zinc-900 text-white text-xs whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 z-40 shadow-lg"
      >
        {open ? 'Hide upcoming & past' : 'Show upcoming & past'}
      </div>
    </div>
  );
}
