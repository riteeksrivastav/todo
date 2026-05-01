import type { Config, Todo } from './types.js';
import { loadMonth, saveMonth } from './storage.js';
import { addMonths, monthKey, nowISO, todayISO } from './dates.js';

export function rollForward(config: Config, today: string = todayISO()): void {
  const currentMonth = monthKey(today);
  const prevMonth = addMonths(currentMonth, -1);

  const months = [prevMonth, currentMonth];
  const moved: Todo[] = [];
  const monthsToSave = new Set<string>();

  for (const m of months) {
    const todos = loadMonth(config, m);
    const remaining: Todo[] = [];
    let mutated = false;
    for (const t of todos) {
      if (!t.done && t.date < today) {
        const updated: Todo = {
          ...t,
          originalDate: t.originalDate ?? t.date,
          date: today,
          updatedAt: nowISO(),
        };
        moved.push(updated);
        mutated = true;
        if (m === currentMonth) {
          // stays in current month, just rewrite in place — defer to merge below
        }
      } else {
        remaining.push(t);
      }
    }
    if (mutated) {
      saveMonth(config, m, remaining);
      monthsToSave.add(m);
    }
  }

  if (moved.length) {
    const target = loadMonth(config, currentMonth);
    target.push(...moved);
    saveMonth(config, currentMonth, target);
  }
}
