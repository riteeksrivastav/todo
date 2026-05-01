import kleur from 'kleur';
import { addTodo, loadConfig, type Priority } from '@todo/core';

interface Opts {
  tags?: string;
  date?: string;
  priority?: string;
}

const VALID_PRIORITIES: Priority[] = ['high', 'medium', 'low'];

export async function addCommand(content: string[], opts: Opts): Promise<void> {
  const text = content.join(' ').trim();
  if (!text) throw new Error('content is required');
  const config = loadConfig();

  let priority: Priority | undefined;
  if (opts.priority) {
    if (!VALID_PRIORITIES.includes(opts.priority as Priority)) {
      throw new Error(`invalid priority "${opts.priority}" (use high|medium|low)`);
    }
    priority = opts.priority as Priority;
  }

  const tags = opts.tags
    ? opts.tags.split(',').map((t) => t.trim()).filter(Boolean)
    : [];

  const todo = await addTodo(config, {
    content: text,
    date: opts.date,
    tags,
    priority,
  });

  console.log(kleur.green('added ') + kleur.gray(todo.id) + ' ' + todo.content + dim(`  ${todo.date}`));
}

function dim(s: string): string {
  return kleur.gray(s);
}
