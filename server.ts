import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'node:path';
import { createApiRouter } from './server/routes/api.js';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';

// Correlation ID & Logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const correlationId = (req.headers['x-correlation-id'] as string) || `cid-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  res.setHeader('x-correlation-id', correlationId);
  next();
});

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-correlation-id'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Mount API routers
const apiRouter = createApiRouter();
const apiPrefix = process.env.API_PREFIX || '/api/v1';

// Support both root routes and prefixed routes (/api, /api/v1, etc.)
app.use(apiPrefix, apiRouter);
if (apiPrefix !== '/api') {
  app.use('/api', apiRouter);
}
app.use('/', apiRouter);

// Start Vite middleware or static server
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response, next: NextFunction) => {
      if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
        return next();
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`[BuyO Backend] Server listening on http://${HOST}:${PORT}`);
    console.log(`[BuyO Backend] API Prefix: ${apiPrefix}`);
  });
}

startServer().catch((err) => {
  console.error('[BuyO Backend] Failed to start server:', err);
  process.exit(1);
});
