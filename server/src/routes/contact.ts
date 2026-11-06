import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { randomUUID, createHash } from 'node:crypto';
import { sql } from 'drizzle-orm';
import { contactRequests } from '../db/schema.ts';
import { getDb } from '../db/client.ts';
import { normalizePhone } from '../lib/utils.ts';
import { env } from '../lib/env.ts';

/**
 * POST /api/public/contact
 * Public contact form endpoint with honeypot + time-to-submit spam protection.
 * Rate limited: 5 per hour per IP (counted in MySQL).
 */

const contactSchema = z.object({
  name: z.string().min(2).max(80),
  phone: z.string().min(10).max(20),
  shopName: z.string().max(100).optional(),
  city: z.string().max(80).optional(),
  email: z.string().email().optional().or(z.literal('')),
  topic: z.enum(['pilot', 'question', 'data_request', 'grievance']),
  preferredChannel: z.enum(['whatsapp', 'call', 'email']),
  message: z.string().max(1000).optional(),
  consent: z.literal(true),
  website: z.string().max(0), // honeypot — must be empty
  startedAt: z.string().datetime(),
});

function hashIp(ip: string): string {
  return createHash('sha256').update(ip).digest('hex');
}

export async function contactRoutes(app: FastifyInstance) {
  const db = getDb();

  // POST /api/public/contact
  app.post('/public/contact', async (request, reply) => {
    // CORS — allow only from SITE_ORIGIN if set
    const siteOrigin = env.SITE_ORIGIN || '';
    if (siteOrigin) {
      reply.header('Access-Control-Allow-Origin', siteOrigin);
      reply.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
      reply.header('Access-Control-Allow-Headers', 'Content-Type');
    }

    // Parse + validate
    const parsed = contactSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        ok: false,
        error: 'VALIDATION',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const data = parsed.data;

    // Spam check: time-to-submit >= 3 seconds
    const startedAt = new Date(data.startedAt);
    const elapsed = Date.now() - startedAt.getTime();
    if (elapsed < 3000) {
      // Silently accept but don't store (looks like a bot)
      return reply.status(201).send({ ok: true });
    }

    // Rate limit: 5 per hour per IP
    const ip = (request.ip || '').split(',')[0].trim();
    const ipHashed = hashIp(ip);
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const [countResult] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(contactRequests)
      .where(
        sql`${contactRequests.ipHash} = ${ipHashed} AND ${contactRequests.createdAt} > ${oneHourAgo}`,
      );

    if ((countResult?.count ?? 0) >= 5) {
      return reply.status(429).send({
        ok: false,
        error: 'RATE_LIMITED',
        message: 'Too many requests. Please try again later.',
      });
    }

    // Normalise phone
    const normalisedPhone = normalizePhone(data.phone);

    // Insert
    const id = randomUUID();
    await db.insert(contactRequests).values({
      id,
      name: data.name,
      phone: normalisedPhone,
      email: data.email || null,
      shopName: data.shopName || null,
      city: data.city || null,
      topic: data.topic,
      preferredChannel: data.preferredChannel,
      message: data.message || null,
      consentAt: new Date(),
      ipHash: ipHashed,
    });

    // Send notification email (best-effort)
    try {
      const { sendContactNotification } = await import('../services/contact-email.ts');
      await sendContactNotification({
        id,
        name: data.name,
        phone: normalisedPhone,
        email: data.email,
        shopName: data.shopName,
        city: data.city,
        topic: data.topic,
        preferredChannel: data.preferredChannel,
        message: data.message,
      });
    } catch (emailErr) {
      // Still return 201 — log the error
      request.log.error({ err: emailErr }, 'Failed to send contact notification email');
    }

    return reply.status(201).send({ ok: true });
  });

  // OPTIONS handler for CORS preflight
  app.options('/public/contact', async (_request, reply) => {
    const siteOrigin = env.SITE_ORIGIN || '';
    if (siteOrigin) {
      reply.header('Access-Control-Allow-Origin', siteOrigin);
      reply.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
      reply.header('Access-Control-Allow-Headers', 'Content-Type');
    }
    return reply.status(204).send();
  });
}

/**
 * Delete contact requests older than 12 months.
 * Called from the cron endpoint.
 */
export async function cleanupOldContactRequests(): Promise<number> {
  const db = getDb();
  const cutoff = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
  const result = await db
    .delete(contactRequests)
    .where(sql`${contactRequests.createdAt} < ${cutoff}`);

  return (result[0] as unknown as { affectedRows?: number })?.affectedRows ?? 0;
}
