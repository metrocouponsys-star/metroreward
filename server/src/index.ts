import 'dotenv/config';
import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import fastifyStatic from '@fastify/static';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { env, dbReady, resolvePort } from './lib/env.ts';
import { authRoutes } from './routes/auth.ts';
import { scanRoutes } from './routes/scan.ts';
import { customerRoutes } from './routes/customer.ts';
import { shopRoutes } from './routes/shop.ts';
import { adminRoutes } from './routes/admin.ts';
import { cronRoutes } from './routes/cron.ts';
import { contactRoutes } from './routes/contact.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function start() {
  const app = Fastify({
    logger: { level: env.NODE_ENV === 'production' ? 'info' : 'debug' },
    trustProxy: true,
  });

  // ── Security ──────────────────────────────────────────────────────────────────
  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'blob:'],
        connectSrc: ["'self'"],
        workerSrc: ["'self'", 'blob:'],
      },
    },
  });

  await app.register(cookie, { secret: env.SESSION_SECRET });

  await app.register(rateLimit, {
    global: false,
    max: 300,
    timeWindow: '1 minute',
    errorResponseBuilder: () => ({
      error: { code: 'RATE_LIMITED', message: 'Too many requests. Wait a moment and try again.' },
    }),
  });

  // ── API routes ────────────────────────────────────────────────────────────────
  await app.register(
    async (api) => {
      await authRoutes(api);
      await scanRoutes(api);
      await customerRoutes(api);
      await shopRoutes(api);
      await adminRoutes(api);
      await cronRoutes(api);
      await contactRoutes(api);

      api.get('/health', async () => ({
        ok: true,
        ts: new Date().toISOString(),
        env: env.NODE_ENV,
      }));
    },
    { prefix: '/api' },
  );

  // ── Health probe ─────────────────────────────────────────────────────────────
  app.get('/health', async () => ({
    ok: true,
    status: 'healthy',
    db: dbReady ? 'configured' : 'missing-DATABASE_URL',
    ts: new Date().toISOString(),
  }));

  // ── Serve built web app ───────────────────────────────────────────────────────
  const webDist = existsSync(join(process.cwd(), 'web/dist'))
    ? join(process.cwd(), 'web/dist')
    : join(__dirname, '../../web/dist');

  if (existsSync(webDist)) {
    await app.register(fastifyStatic, {
      root: webDist,
      wildcard: false,
    });

    // SPA fallback (send index.html for non-API routes)
    app.setNotFoundHandler((req, reply) => {
      if (req.raw.url?.startsWith('/api')) {
        return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'API endpoint not found.' } });
      }
      reply.sendFile('index.html', webDist);
    });
  } else {
    app.setNotFoundHandler((_req, reply) => {
      reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Not found.' } });
    });
  }

  // ── Start ─────────────────────────────────────────────────────────────────────
  const portOrSocket = resolvePort();
  console.log(`🚀 Starting Stamp — PORT env="${process.env.PORT || env.PORT}" resolved="${portOrSocket}" db=${dbReady ? 'ready' : 'NOT SET'}`);
  try {
    if (typeof portOrSocket === 'string' && isNaN(Number(portOrSocket))) {
      // Unix socket
      await app.listen({ path: portOrSocket });
      console.log(`✅ Stamp server listening on socket ${portOrSocket}`);
    } else {
      const port = typeof portOrSocket === 'number' ? portOrSocket : parseInt(portOrSocket, 10) || 3000;
      try {
        await app.listen({ port, host: '0.0.0.0' });
        console.log(`✅ Stamp server listening on 0.0.0.0:${port}`);
      } catch {
        // Fallback: listen without explicit host if 0.0.0.0 fails
        await app.listen({ port });
        console.log(`✅ Stamp server listening on port ${port}`);
      }
    }
  } catch (err) {
    app.log.error(err);
    console.error('❌ Fastify app.listen failed:', err);
    process.exit(1);
  }

  return app;
}

// Start immediately without top-level await (required by LiteSpeed / lsnode.js)
start().catch((err) => {
  console.error('❌ Fatal error during server startup:', err);
  process.exit(1);
});

