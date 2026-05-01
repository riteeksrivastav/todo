import kleur from 'kleur';
import { loadConfig, markDone } from '@todo/core';

interface Opts {
  undo?: boolean;
}

export async function doneCommand(id: string, opts: Opts): Promise<void> {
  const config = loadConfig();
  const t = await markDone(config, id, !opts.undo);
  if (t.done) console.log(kleur.green('done: ') + t.content);
  else console.log(kleur.yellow('reopened: ') + t.content);
}
