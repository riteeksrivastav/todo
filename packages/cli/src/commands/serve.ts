import { startServer } from '@todo/server';
import { loadConfig } from '@todo/core';
import kleur from 'kleur';

interface Opts {
  port?: number;
}

export async function serveCommand(opts: Opts): Promise<void> {
  const config = loadConfig();
  const port = opts.port ?? config.serverPort;
  await startServer({ ...config, serverPort: port });
  console.log(kleur.green(`todo server running on http://127.0.0.1:${port}`));
  console.log(kleur.gray('press Ctrl+C to stop.'));
}
