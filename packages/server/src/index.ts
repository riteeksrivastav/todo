import { createApp } from './app.js';
import type { Config } from '@todo/core';

export { createApp };

export function startServer(config: Config): Promise<void> {
  return new Promise((resolve) => {
    const app = createApp(config);
    app.listen(config.serverPort, '127.0.0.1', () => resolve());
  });
}

// allow `node dist/index.js` to start the server using config from disk
if (import.meta.url === `file://${process.argv[1]}`) {
  const { loadConfig } = await import('@todo/core');
  const config = loadConfig();
  startServer(config).then(() => {
    console.log(`todo server running on http://127.0.0.1:${config.serverPort}`);
  });
}
