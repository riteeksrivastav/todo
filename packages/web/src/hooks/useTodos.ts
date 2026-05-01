import useSWR from 'swr';
import {
  createTodo,
  fetchTodos,
  patchTodo,
  removeTodo,
  restoreTodo,
  type AddInput,
  type UpdateInput,
} from '../api';
import type { Todo } from '../types';
import { addDays, todayISO } from '../lib/dates';

const PAST_DAYS = 30;
const FUTURE_DAYS = 30;

export function useTodos() {
  const today = todayISO();
  const from = addDays(today, -PAST_DAYS);
  const to = addDays(today, FUTURE_DAYS);
  const key = `/api/todos?from=${from}&to=${to}`;

  const { data, error, isLoading, mutate } = useSWR<Todo[]>(
    key,
    () => fetchTodos(from, to),
    { revalidateOnFocus: true, refreshInterval: 30000 },
  );

  async function add(input: AddInput) {
    const created = await createTodo(input);
    await mutate();
    return created;
  }

  async function update(id: string, patch: UpdateInput) {
    // optimistic
    const prev = data;
    if (prev) {
      const next = prev.map((t) => (t.id === id ? { ...t, ...patch, priority: patch.priority === null ? undefined : (patch.priority ?? t.priority) } : t));
      mutate(next, { revalidate: false });
    }
    try {
      const updated = await patchTodo(id, patch);
      await mutate();
      return updated;
    } catch (e) {
      mutate(prev, { revalidate: false });
      throw e;
    }
  }

  async function toggleDone(t: Todo) {
    return update(t.id, { done: !t.done });
  }

  async function remove(id: string): Promise<Todo> {
    const prev = data;
    if (prev) mutate(prev.filter((t) => t.id !== id), { revalidate: false });
    try {
      const removed = await removeTodo(id);
      await mutate();
      return removed;
    } catch (e) {
      mutate(prev, { revalidate: false });
      throw e;
    }
  }

  async function restore(todo: Todo) {
    await restoreTodo(todo);
    await mutate();
  }

  return {
    todos: data ?? [],
    today,
    from,
    to,
    isLoading,
    error,
    add,
    update,
    toggleDone,
    remove,
    restore,
    refresh: () => mutate(),
  };
}
