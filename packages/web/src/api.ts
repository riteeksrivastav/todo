import type { Priority, Todo } from './types';

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export interface ListResponse {
  todos: Todo[];
}

export async function fetchTodos(from: string, to: string): Promise<Todo[]> {
  const params = new URLSearchParams({ from, to });
  const data = await request<ListResponse>(`/api/todos?${params}`);
  return data.todos;
}

export interface AddInput {
  content: string;
  date?: string;
  tags?: string[];
  priority?: Priority;
}

export async function createTodo(input: AddInput): Promise<Todo> {
  const data = await request<{ todo: Todo }>(`/api/todos`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return data.todo;
}

export interface UpdateInput {
  content?: string;
  date?: string;
  tags?: string[];
  priority?: Priority | null;
  done?: boolean;
}

export async function patchTodo(id: string, patch: UpdateInput): Promise<Todo> {
  const data = await request<{ todo: Todo }>(`/api/todos/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
  return data.todo;
}

export async function removeTodo(id: string): Promise<Todo> {
  const data = await request<{ todo: Todo }>(`/api/todos/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  return data.todo;
}

export async function restoreTodo(todo: Todo): Promise<Todo> {
  const data = await request<{ todo: Todo }>(`/api/todos/${encodeURIComponent(todo.id)}/restore`, {
    method: 'POST',
    body: JSON.stringify({ todo }),
  });
  return data.todo;
}
