import 'dotenv/config';
import path from 'node:path';
import express, { type NextFunction, type Request, type Response } from 'express';
import { initializeDatabase } from './server/storage.ts';
import { tasksRouter } from './server/routes/tasks.ts';
import { settingsRouter } from './server/routes/settings.ts';
import { ValidationError } from './server/validation.ts';

const PORT = Number(process.env.PORT) || 3000;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

async function startServer() {
  await initializeDatabase();

  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '100kb' }));

  // REST API routes
  app.use('/api/tasks', tasksRouter);
  app.use('/api/settings', settingsRouter);

  // Unknown API route handler
  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'API endpoint not found.' });
  });

  // Centralized API error handler
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof ValidationError) {
      res.status(err.statusCode).json({
        error: err.message,
        details: err.details,
      });
      return;
    }

    if (err instanceof SyntaxError && 'status' in err) {
      res.status(400).json({ error: 'Malformed JSON payload.' });
      return;
    }

    console.error('[TaskFlow API Error]', err);
    res.status(500).json({
      error: 'An unexpected server error occurred. Please try again.',
    });
  });

  if (IS_PRODUCTION) {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distDir, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[TaskFlow] Server listening on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[TaskFlow] Failed to start server:', err);
  process.exit(1);
});
