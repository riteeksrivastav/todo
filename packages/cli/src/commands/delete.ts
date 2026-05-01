import kleur from 'kleur';
import { deleteTodo, loadConfig } from '@todo/core';

export async function deleteCommand(id: string): Promise<void> {
  const config = loadConfig();
  const removed = await deleteTodo(config, id);
  console.log(kleur.red('deleted: ') + removed.content);
}
