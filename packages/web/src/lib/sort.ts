import type { Priority, SortMode, Todo } from '../types';

const PRIORITY_WEIGHT: Record<Priority | 'none', number> = {
  high: 0,
  medium: 1,
  low: 2,
  none: 3,
};

export function sortForDate(todos: Todo[], mode: SortMode): Todo[] {
  return [...todos].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    if (mode === 'priority') {
      const aw = PRIORITY_WEIGHT[a.priority ?? 'none'];
      const bw = PRIORITY_WEIGHT[b.priority ?? 'none'];
      if (aw !== bw) return aw - bw;
    }
    if (a.order !== b.order) return a.order - b.order;
    return a.createdAt.localeCompare(b.createdAt);
  });
}

export function groupByDate(todos: Todo[]): Map<string, Todo[]> {
  const map = new Map<string, Todo[]>();
  for (const t of todos) {
    const list = map.get(t.date) ?? [];
    list.push(t);
    map.set(t.date, list);
  }
  return map;
}
