import { Router, type Request, type Response, type NextFunction } from 'express';
import {
  addTodo,
  deleteTodo,
  listTodos,
  loadConfig,
  restoreTodo,
  updateTodo,
  type Config,
  type Priority,
  type Todo,
} from '@todo/core';

const VALID_PRIORITIES: Priority[] = ['high', 'medium', 'low'];

function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

function getConfig(override?: Config): Config {
  return override ?? loadConfig();
}

export function buildRoutes(configOverride?: Config): Router {
  const router = Router();

  router.get('/api/config', (_req, res) => {
    const config = getConfig(configOverride);
    res.json(config);
  });

  router.get(
    '/api/todos',
    asyncHandler(async (req, res) => {
      const config = getConfig(configOverride);
      const from = String(req.query.from ?? '');
      const to = String(req.query.to ?? '');
      if (!from || !to) {
        res.status(400).json({ error: 'from and to query params are required' });
        return;
      }
      const tags = req.query.tags
        ? String(req.query.tags).split(',').map((t) => t.trim()).filter(Boolean)
        : undefined;
      const todos = await listTodos(config, { from, to, tags });
      res.json({ todos });
    }),
  );

  router.post(
    '/api/todos',
    asyncHandler(async (req, res) => {
      const config = getConfig(configOverride);
      const { content, date, tags, priority } = req.body ?? {};
      if (typeof content !== 'string' || !content.trim()) {
        res.status(400).json({ error: 'content is required' });
        return;
      }
      if (priority !== undefined && priority !== null && !VALID_PRIORITIES.includes(priority)) {
        res.status(400).json({ error: 'invalid priority' });
        return;
      }
      const todo = await addTodo(config, {
        content,
        date,
        tags: Array.isArray(tags) ? tags : undefined,
        priority: priority ?? undefined,
      });
      res.status(201).json({ todo });
    }),
  );

  router.patch(
    '/api/todos/:id',
    asyncHandler(async (req, res) => {
      const config = getConfig(configOverride);
      const { content, date, tags, priority, done } = req.body ?? {};
      const patch: Parameters<typeof updateTodo>[2] = {};
      if (content !== undefined) patch.content = content;
      if (date !== undefined) patch.date = date;
      if (tags !== undefined) patch.tags = Array.isArray(tags) ? tags : [];
      if (priority !== undefined) patch.priority = priority;
      if (done !== undefined) patch.done = Boolean(done);
      try {
        const id = req.params.id ?? '';
        const todo = await updateTodo(config, id, patch);
        res.json({ todo });
      } catch (err) {
        res.status(404).json({ error: (err as Error).message });
      }
    }),
  );

  router.delete(
    '/api/todos/:id',
    asyncHandler(async (req, res) => {
      const config = getConfig(configOverride);
      try {
        const id = req.params.id ?? '';
        const todo = await deleteTodo(config, id);
        res.json({ todo });
      } catch (err) {
        res.status(404).json({ error: (err as Error).message });
      }
    }),
  );

  router.post(
    '/api/todos/:id/restore',
    asyncHandler(async (req, res) => {
      const config = getConfig(configOverride);
      const todo = req.body?.todo as Todo | undefined;
      if (!todo || todo.id !== req.params.id) {
        res.status(400).json({ error: 'todo body required and id must match' });
        return;
      }
      const saved = await restoreTodo(config, todo);
      res.json({ todo: saved });
    }),
  );

  return router;
}
