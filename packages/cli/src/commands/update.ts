import kleur from 'kleur';
import { loadConfig, updateTodo, type Priority, type UpdateTodoPatch } from '@todo/core';

interface Opts {
  content?: string;
  date?: string;
  tags?: string;
  priority?: string;
}

const VALID_PRIORITIES = ['high', 'medium', 'low', 'none'];

export async function updateCommand(id: string, opts: Opts): Promise<void> {
  const config = loadConfig();
  const patch: UpdateTodoPatch = {};
  if (opts.content !== undefined) patch.content = opts.content;
  if (opts.date !== undefined) patch.date = opts.date;
  if (opts.tags !== undefined) {
    patch.tags = opts.tags.split(',').map((t) => t.trim()).filter(Boolean);
  }
  if (opts.priority !== undefined) {
    if (!VALID_PRIORITIES.includes(opts.priority)) {
      throw new Error(`invalid priority "${opts.priority}" (use high|medium|low|none)`);
    }
    patch.priority = opts.priority === 'none' ? null : (opts.priority as Priority);
  }
  if (!Object.keys(patch).length) {
    console.log(kleur.yellow('nothing to update.'));
    return;
  }
  const updated = await updateTodo(config, id, patch);
  console.log(kleur.cyan('updated: ') + updated.content);
}
