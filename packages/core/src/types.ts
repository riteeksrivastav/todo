export type Priority = 'high' | 'medium' | 'low';

export type SortMode = 'created' | 'priority';

export interface Todo {
  id: string;
  content: string;
  date: string;
  originalDate?: string;
  tags: string[];
  priority?: Priority;
  done: boolean;
  doneAt?: string;
  createdAt: string;
  updatedAt: string;
  order: number;
}

export interface Config {
  dataDir: string;
  serverPort: number;
}

export interface AddTodoInput {
  content: string;
  date?: string;
  tags?: string[];
  priority?: Priority;
}

export interface UpdateTodoPatch {
  content?: string;
  date?: string;
  tags?: string[];
  priority?: Priority | null;
  done?: boolean;
}

export interface ListOptions {
  from: string;
  to: string;
  tags?: string[];
}
