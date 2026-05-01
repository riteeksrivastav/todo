import kleur from 'kleur';
import {
  addDays,
  groupByDate,
  listTodos,
  loadConfig,
  todayISO,
  type SortMode,
  type Todo,
} from '@todo/core';

interface Opts {
  date?: string;
  tags?: string;
  sort?: string;
}

export async function listCommand(opts: Opts): Promise<void> {
  const config = loadConfig();
  const today = todayISO();

  let from: string;
  let to: string;

  const when = opts.date ?? 'default';
  if (when === 'all') {
    from = addDays(today, -365);
    to = addDays(today, 365);
  } else if (when === 'today') {
    from = today;
    to = today;
  } else if (when === 'default') {
    from = addDays(today, -7);
    to = addDays(today, 7);
  } else {
    from = when;
    to = when;
  }

  const tags = opts.tags ? opts.tags.split(',').map((t) => t.trim()).filter(Boolean) : undefined;
  const sortMode: SortMode = opts.sort === 'priority' ? 'priority' : 'created';

  const todos = await listTodos(config, { from, to, tags });
  if (!todos.length) {
    console.log(kleur.gray('no todos in range.'));
    return;
  }

  const grouped = groupByDate(todos, sortMode);
  for (const [date, list] of grouped) {
    const label = date === today ? `${date} ${kleur.bold('(today)')}` : date;
    console.log('');
    console.log(kleur.cyan(label));
    for (const t of list) printTodo(t);
  }
}

function printTodo(t: Todo): void {
  const checkbox = t.done ? kleur.green('✓') : kleur.gray('◯');
  const id = kleur.gray(t.id);
  const content = t.done ? kleur.strikethrough(kleur.gray(t.content)) : t.content;
  const tags = t.tags.length ? ' ' + t.tags.map((tag) => kleur.magenta(`#${tag}`)).join(' ') : '';
  const prio = t.priority ? ' ' + priorityBadge(t.priority) : '';
  const original = t.originalDate && t.originalDate !== t.date ? kleur.yellow(` (from ${t.originalDate})`) : '';
  console.log(`  ${checkbox} ${id}  ${content}${tags}${prio}${original}`);
}

function priorityBadge(p: 'high' | 'medium' | 'low'): string {
  if (p === 'high') return kleur.red('!high');
  if (p === 'medium') return kleur.yellow('!med');
  return kleur.blue('!low');
}
