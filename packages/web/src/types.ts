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
