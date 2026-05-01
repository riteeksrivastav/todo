import type { AddTodoInput, Config, ListOptions, Priority, SortMode, Todo, UpdateTodoPatch } from './types.js';
import { appendTodoLine, findById, loadMonth, loadRange, saveMonth, withLock } from './storage.js';
import { rollForward } from './rollforward.js';
import { isValidDate, monthKey, nowISO, todayISO } from './dates.js';
import { uniqueId } from './id.js';

const PRIORITY_WEIGHT: Record<Priority | 'none', number> = {
  high: 0,
  medium: 1,
  low: 2,
  none: 3,
};

export function sortForDate(todos: Todo[], mode: SortMode = 'created'): Todo[] {
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

export function addTodo(config: Config, input: AddTodoInput): Promise<Todo> {
  return withLock(() => {
    const date = input.date ?? todayISO();
    if (!isValidDate(date)) throw new Error(`invalid date: ${date}`);
    if (!input.content.trim()) throw new Error('content is required');

    const month = monthKey(date);
    const existing = loadMonth(config, month);
    const taken = new Set(existing.map((t) => t.id));
    const id = uniqueId(date, taken);
    const now = nowISO();
    const maxOrder = existing
      .filter((t) => t.date === date)
      .reduce((acc, t) => Math.max(acc, t.order), -1);

    const todo: Todo = {
      id,
      content: input.content.trim(),
      date,
      tags: input.tags ?? [],
      priority: input.priority,
      done: false,
      createdAt: now,
      updatedAt: now,
      order: maxOrder + 1,
    };

    appendTodoLine(config, todo);
    return todo;
  });
}

export function markDone(config: Config, id: string, done = true): Promise<Todo> {
  return updateTodo(config, id, { done });
}

export function deleteTodo(config: Config, id: string): Promise<Todo> {
  return withLock(() => {
    const found = findById(config, id);
    if (!found) throw new Error(`todo not found: ${id}`);
    const todos = loadMonth(config, found.yyyyMm);
    const removed = todos.splice(found.index, 1)[0]!;
    saveMonth(config, found.yyyyMm, todos);
    return removed;
  });
}

export function restoreTodo(config: Config, todo: Todo): Promise<Todo> {
  return withLock(() => {
    const month = monthKey(todo.date);
    const existing = loadMonth(config, month);
    if (existing.some((t) => t.id === todo.id)) {
      throw new Error(`todo already exists: ${todo.id}`);
    }
    existing.push(todo);
    saveMonth(config, month, existing);
    return todo;
  });
}

export function updateTodo(config: Config, id: string, patch: UpdateTodoPatch): Promise<Todo> {
  return withLock(() => {
    const found = findById(config, id);
    if (!found) throw new Error(`todo not found: ${id}`);

    const next: Todo = { ...found.todo };
    if (patch.content !== undefined) {
      if (!patch.content.trim()) throw new Error('content cannot be empty');
      next.content = patch.content.trim();
    }
    if (patch.tags !== undefined) next.tags = patch.tags;
    if (patch.priority !== undefined) {
      next.priority = patch.priority === null ? undefined : patch.priority;
    }
    if (patch.done !== undefined) {
      next.done = patch.done;
      next.doneAt = patch.done ? nowISO() : undefined;
    }
    let dateChanged = false;
    if (patch.date !== undefined) {
      if (!isValidDate(patch.date)) throw new Error(`invalid date: ${patch.date}`);
      if (patch.date !== next.date) {
        next.date = patch.date;
        dateChanged = true;
      }
    }
    next.updatedAt = nowISO();

    if (dateChanged && monthKey(next.date) !== found.yyyyMm) {
      // remove from old month
      const oldList = loadMonth(config, found.yyyyMm);
      oldList.splice(found.index, 1);
      saveMonth(config, found.yyyyMm, oldList);
      // add to new month
      const newMonth = monthKey(next.date);
      const newList = loadMonth(config, newMonth);
      newList.push(next);
      saveMonth(config, newMonth, newList);
    } else {
      const list = loadMonth(config, found.yyyyMm);
      list[found.index] = next;
      saveMonth(config, found.yyyyMm, list);
    }
    return next;
  });
}

export async function listTodos(config: Config, opts: ListOptions): Promise<Todo[]> {
  await withLock(() => rollForward(config));
  const todos = loadRange(config, opts.from, opts.to);
  if (opts.tags && opts.tags.length) {
    const wanted = new Set(opts.tags);
    return todos.filter((t) => t.tags.some((tag) => wanted.has(tag)));
  }
  return todos;
}

export function groupByDate(todos: Todo[], mode: SortMode = 'created'): Map<string, Todo[]> {
  const map = new Map<string, Todo[]>();
  for (const t of todos) {
    const list = map.get(t.date) ?? [];
    list.push(t);
    map.set(t.date, list);
  }
  for (const [k, v] of map) map.set(k, sortForDate(v, mode));
  return new Map([...map.entries()].sort((a, b) => a[0].localeCompare(b[0])));
}
