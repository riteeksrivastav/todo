import type { AddTodoInput, Priority } from '@todo/core';
import { addDays, isValidDate, todayISO } from '@todo/core';

const PRIORITY_TOKENS: Record<string, Priority> = {
  high: 'high', hi: 'high',
  med: 'medium', medium: 'medium',
  low: 'low',
};

export function parseAdd(raw: string, fallbackDate: string): AddTodoInput | null {
  const text = raw.trim();
  if (!text) return null;
  const today = todayISO();
  let date = fallbackDate;
  let priority: Priority | undefined;
  const tags: string[] = [];
  const contentTokens: string[] = [];

  for (const token of text.split(/\s+/)) {
    if (token.startsWith('#') && token.length > 1) {
      tags.push(token.slice(1));
    } else if (token.startsWith('!') && token.length > 1) {
      const k = token.slice(1).toLowerCase();
      if (k in PRIORITY_TOKENS) priority = PRIORITY_TOKENS[k];
      else contentTokens.push(token);
    } else if (token.startsWith('^') && token.length > 1) {
      const v = token.slice(1).toLowerCase();
      if (v === 'today') date = today;
      else if (v === 'tomorrow') date = addDays(today, 1);
      else if (v === 'yesterday') date = addDays(today, -1);
      else if (isValidDate(v)) date = v;
      else contentTokens.push(token);
    } else {
      contentTokens.push(token);
    }
  }
  const content = contentTokens.join(' ').trim();
  if (!content) return null;
  return { content, date, tags, priority };
}
