import 'dotenv/config';
import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import fastifyStatic from '@fastify/static';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { env } from './lib/env.ts';
import { authRoutes } from './routes/auth.ts';
import { scanRoutes } from './routes/scan.ts';
import { customerRoutes } from './routes/customer.ts';
import { shopRoutes } from './routes/shop.ts';
import { adminRoutes } from './routes/admin.ts';
import { cronRoutes } from './routes/cron.ts';
import { contactRoutes } from './routes/contact.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));

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

// ── Serve built web app ───────────────────────────────────────────────────────
const webDist = join(__dirname, '../../web/dist');
if (existsSync(webDist)) {
  await app.register(fastifyStatic, {
    root: webDist,
    wildcard: false,
  });

  // SPA fallback
  app.setNotFoundHandler((_req, reply) => {
    reply.sendFile('index.html', webDist);
  });
} else {
  app.setNotFoundHandler((_req, reply) => {
    reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Not found.' } });
  });
}

// ── Start ─────────────────────────────────────────────────────────────────────
try {
  await app.listen({ port: env.PORT, host: '0.0.0.0' });
  console.log(`✅  Stamp server listening on port ${env.PORT}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}

