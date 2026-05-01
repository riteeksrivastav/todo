import { Command } from 'commander';
import kleur from 'kleur';
import { initCommand } from './commands/init.js';
import { addCommand } from './commands/add.js';
import { listCommand } from './commands/list.js';
import { doneCommand } from './commands/done.js';
import { deleteCommand } from './commands/delete.js';
import { updateCommand } from './commands/update.js';
import { serveCommand } from './commands/serve.js';

const program = new Command();
program
  .name('todo')
  .description('a tiny local todo CLI')
  .version('0.1.0');

program
  .command('init')
  .description('initialize todo storage and config')
  .option('--data-dir <path>', 'directory to store JSONL files')
  .option('--port <number>', 'port for the HTTP server', (v) => parseInt(v, 10))
  .option('--force', 'overwrite existing config')
  .action(initCommand);

program
  .command('add')
  .description('add a new todo')
  .argument('<content...>', 'todo content')
  .option('--tags <list>', 'comma-separated tags')
  .option('--date <YYYY-MM-DD>', 'scheduled date (default: today)')
  .option('--priority <level>', 'high|medium|low')
  .action(addCommand);

program
  .command('list')
  .description('list todos')
  .option('--date <when>', 'today | YYYY-MM-DD | all', 'default')
  .option('--tags <list>', 'comma-separated tag filter')
  .option('--sort <mode>', 'created | priority', 'created')
  .action(listCommand);

program
  .command('done')
  .description('mark a todo as done')
  .argument('<id>')
  .option('--undo', 'mark as not done instead')
  .action(doneCommand);

program
  .command('delete')
  .description('delete a todo')
  .argument('<id>')
  .action(deleteCommand);

program
  .command('update')
  .description('update a todo')
  .argument('<id>')
  .option('--content <text>')
  .option('--date <YYYY-MM-DD>')
  .option('--tags <list>', 'comma-separated tags')
  .option('--priority <level>', 'high|medium|low|none')
  .action(updateCommand);

program
  .command('serve')
  .description('run the HTTP API server')
  .option('--port <number>', 'override port', (v) => parseInt(v, 10))
  .action(serveCommand);

program.parseAsync().catch((err: Error) => {
  console.error(kleur.red('error: ') + err.message);
  process.exit(1);
});
