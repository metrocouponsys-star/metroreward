import type { FastifyInstance } from 'fastify';
import { and, eq, desc, sql } from 'drizzle-orm';
import { z } from 'zod';
import { getDb } from '../db/client.ts';
import { shops, programs, stampEvents, auditLog } from '../db/schema.ts';
import { getSession, requireRole } from '../plugins/session.ts';
import { uuid, randomHex } from '../lib/crypto.ts';
import { writeAudit } from '../services/audit.ts';
import crypto from 'node:crypto';

const CreateShopBody = z.object({
  slug: z.string().min(2).max(64).regex(/^[a-z0-9-]+$/),
  name: z.string().min(1).max(128),
  ownerPhone: z.string().min(10).max(20),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

export async function adminRoutes(app: FastifyInstance) {
  const db = getDb();

  // POST /api/admin/shops
  app.post('/admin/shops', async (req, reply) => {
    const session = getSession(req);
    if (!requireRole(session, 'admin', reply)) return;

    const body = CreateShopBody.safeParse(req.body);
    if (!body.success) {
      return reply.code(400).send({ error: { code: 'VALIDATION', message: 'Invalid shop data.', details: body.error.flatten() } });
    }

    const { normalizePhone } = await import('../lib/utils.ts');
    const phone = normalizePhone(body.data.ownerPhone);
    const qrSecret = crypto.randomBytes(32);

    const shopId = uuid();
    await db.insert(shops).values({
      id: shopId,
      slug: body.data.slug,
      name: body.data.name,
      ownerPhone: phone,
      lat: body.data.lat,
      lng: body.data.lng,
      qrSecret,
      isActive: true,
      createdAt: new Date(),
    });

    // Create default program
    await db.insert(programs).values({
      id: uuid(),
      shopId,
      stampsRequired: 8,
      rewardText: 'Stamp card reward',
      cooldownMinutes: 360,
      maxStampsPerDay: 2,
      requireApproval: false,
      scratchEnabled: true,
      scratchEveryNVisits: 1,
      prizeExpiryDays: 30,
    });

    await writeAudit(db, {
      actorType: 'admin',
      actorId: session!.customerId,
      action: 'shop_create',
      detail: { shopId, slug: body.data.slug, name: body.data.name },
    });

    return reply.code(201).send({ ok: true, shopId });
  });

  // GET /api/admin/shops
  app.get('/admin/shops', async (req, reply) => {
    const session = getSession(req);
    if (!requireRole(session, 'admin', reply)) return;

    const allShops = await db.select().from(shops).orderBy(desc(shops.createdAt));
    return reply.send({ shops: allShops });
  });

  // POST /api/admin/shops/:id/deactivate
  app.post('/admin/shops/:id/deactivate', async (req, reply) => {
    const session = getSession(req);
    if (!requireRole(session, 'admin', reply)) return;

    const { id } = req.params as { id: string };
    await db.update(shops).set({ isActive: false }).where(eq(shops.id, id));

    await writeAudit(db, {
      actorType: 'admin',
      actorId: session!.customerId,
      action: 'shop_deactivate',
      detail: { shopId: id },
    });

    return reply.send({ ok: true });
  });

  // GET /api/admin/flags — stamp events with location_mismatch or high frequency
  app.get('/admin/flags', async (req, reply) => {
    const session = getSession(req);
    if (!requireRole(session, 'admin', reply)) return;

    const flagged = await db
      .select()
      .from(stampEvents)
      .where(
        sql`JSON_LENGTH(${stampEvents.flags}) > 0`,
      )
      .orderBy(desc(stampEvents.createdAt))
      .limit(200);

    return reply.send({ flags: flagged });
  });
}

