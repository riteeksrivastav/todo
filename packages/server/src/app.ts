import express, { type Express } from 'express';
import cors from 'cors';
import { buildRoutes } from './routes.js';
import type { Config } from '@todo/core';

export function createApp(config?: Config): Express {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));
  app.use(buildRoutes(config));
  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err);
    res.status(500).json({ error: err.message });
  });
  return app;
}
