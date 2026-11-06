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

  // ── Serve Marketing Site (site/dist) & Product Web App (web/dist) ───────────
  const siteDist = existsSync(join(process.cwd(), 'site/dist'))
    ? join(process.cwd(), 'site/dist')
    : join(__dirname, '../../site/dist');

  const webDist = existsSync(join(process.cwd(), 'web/dist'))
    ? join(process.cwd(), 'web/dist')
    : join(__dirname, '../../web/dist');

  // Register static assets for marketing site (handles / -> index.html, /_assets/*, favicon.svg, robots.txt)
  if (existsSync(siteDist)) {
    await app.register(fastifyStatic, {
      root: siteDist,
      prefix: '/',
      index: ['index.html'],
      decorateReply: true,
    });

    // Explicit clean routes for marketing pages (handles both /about and /about/)
    const pages = ['about', 'contact', 'privacy-policy', 'terms-and-conditions', 'refund-policy'];
    for (const p of pages) {
      app.get(`/${p}`, async (_req, reply) => {
        return reply.type('text/html; charset=utf-8').sendFile(`${p}/index.html`, siteDist);
      });
      app.get(`/${p}/`, async (_req, reply) => {
        return reply.type('text/html; charset=utf-8').sendFile(`${p}/index.html`, siteDist);
      });
    }
  }

  // Register static assets for React web app (/assets/*)
  if (existsSync(webDist)) {
    await app.register(fastifyStatic, {
      root: webDist,
      prefix: '/assets/',
      decorateReply: false,
    });
  }

  // Redirect /login to /sign-in
  app.get('/login', async (_req, reply) => {
    return reply.redirect('/sign-in');
  });

  // Fallback handler: static files or React SPA
  app.setNotFoundHandler((req, reply) => {
    const rawUrl = (req.raw.url || '/').split('?')[0];

    // API 404
    if (rawUrl.startsWith('/api')) {
      return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'API endpoint not found.' } });
    }

    // Direct /login
    if (rawUrl === '/login' || rawUrl === '/login/') {
      return reply.redirect('/sign-in');
    }

    // Check if it's a static file in webDist (e.g. sw.js, manifest.webmanifest, registerSW.js)
    if (existsSync(webDist)) {
      const webFile = join(webDist, rawUrl.slice(1));
      if (existsSync(webFile) && !rawUrl.endsWith('/')) {
        return reply.sendFile(rawUrl.slice(1), webDist);
      }
      // SPA fallback for all app routes (/sign-in, /shop, /customer, /admin, /s/*)
      return reply.type('text/html; charset=utf-8').sendFile('index.html', webDist);
    }

    reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Not found.' } });
  });

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

