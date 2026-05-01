import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Todo, Config } from './types.js';
import { monthKey, monthRange } from './dates.js';

let lockChain: Promise<unknown> = Promise.resolve();

export function withLock<T>(fn: () => T | Promise<T>): Promise<T> {
  const next = lockChain.then(() => fn());
  lockChain = next.catch(() => undefined);
  return next;
}

function monthFile(config: Config, yyyyMm: string): string {
  return join(config.dataDir, `${yyyyMm}.jsonl`);
}

function ensureDir(config: Config): void {
  if (!existsSync(config.dataDir)) mkdirSync(config.dataDir, { recursive: true });
}

export function loadMonth(config: Config, yyyyMm: string): Todo[] {
  const path = monthFile(config, yyyyMm);
  if (!existsSync(path)) return [];
  const raw = readFileSync(path, 'utf8');
  if (!raw.trim()) return [];
  const lines = raw.split('\n').filter((l) => l.trim().length > 0);
  const result: Todo[] = [];
  for (const line of lines) {
    try {
      result.push(JSON.parse(line) as Todo);
    } catch {
      // skip malformed lines
    }
  }
  return result;
}

export function saveMonth(config: Config, yyyyMm: string, todos: Todo[]): void {
  ensureDir(config);
  const path = monthFile(config, yyyyMm);
  const tmp = `${path}.tmp`;
  const body = todos.map((t) => JSON.stringify(t)).join('\n');
  writeFileSync(tmp, body.length ? body + '\n' : '', 'utf8');
  renameSync(tmp, path);
}

export function appendTodoLine(config: Config, todo: Todo): void {
  ensureDir(config);
  const path = monthFile(config, monthKey(todo.date));
  appendFileSync(path, JSON.stringify(todo) + '\n', 'utf8');
}

export function loadRange(config: Config, fromDate: string, toDate: string): Todo[] {
  const months = monthRange(fromDate, toDate);
  const out: Todo[] = [];
  for (const m of months) {
    for (const t of loadMonth(config, m)) {
      if (t.date >= fromDate && t.date <= toDate) out.push(t);
    }
  }
  return out;
}

export interface FoundTodo {
  todo: Todo;
  yyyyMm: string;
  index: number;
}

export function findById(config: Config, id: string, hintMonths: string[] = []): FoundTodo | null {
  const datePart = id.split('-')[0];
  const candidates = new Set<string>(hintMonths);
  if (datePart && datePart.length === 6) {
    const yyyy = '20' + datePart.slice(0, 2);
    const mm = datePart.slice(2, 4);
    candidates.add(`${yyyy}-${mm}`);
  }
  // also try a wider sweep over recent months as fallback
  const now = new Date();
  for (let i = -2; i <= 2; i++) {
    const dt = new Date(now.getFullYear(), now.getMonth() + i, 1);
    candidates.add(`${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`);
  }
  for (const m of candidates) {
    const todos = loadMonth(config, m);
    const idx = todos.findIndex((t) => t.id === id);
    if (idx >= 0) return { todo: todos[idx]!, yyyyMm: m, index: idx };
  }
  return null;
}
