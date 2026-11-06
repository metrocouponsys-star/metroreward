import type { FastifyInstance } from 'fastify';
import { and, eq, desc, sql, count, gte } from 'drizzle-orm';
import { z } from 'zod';
import { getDb } from '../db/client.ts';
import { shops, programs, stampEvents, rewards, customers, auditLog } from '../db/schema.ts';
import { getSession, requireRole, setSessionCookie } from '../plugins/session.ts';
import { uuid } from '../lib/crypto.ts';
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

  // GET /api/admin/stats — platform-wide metrics
  app.get('/admin/stats', async (req, reply) => {
    const session = getSession(req);
    if (!requireRole(session, 'admin', reply)) return;

    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    const [totalShopsRow] = await db.select({ c: count() }).from(shops);
    const [activeShopsRow] = await db.select({ c: count() }).from(shops).where(eq(shops.isActive, true));
    const [totalCustomersRow] = await db.select({ c: count() }).from(customers);
    const [stampsTodayRow] = await db
      .select({ c: count() })
      .from(stampEvents)
      .where(and(gte(stampEvents.createdAt, todayStart), eq(stampEvents.status, 'counted')));
    const [redeemedTodayRow] = await db
      .select({ c: count() })
      .from(rewards)
      .where(and(gte(rewards.redeemedAt!, todayStart), eq(rewards.status, 'redeemed')));

    return reply.send({
      totalShops: totalShopsRow?.c ?? 0,
      activeShops: activeShopsRow?.c ?? 0,
      totalCustomers: totalCustomersRow?.c ?? 0,
      stampsToday: stampsTodayRow?.c ?? 0,
      redeemedToday: redeemedTodayRow?.c ?? 0,
    });
  });

  // GET /api/admin/shops — list all shops with member & program metrics
  app.get('/admin/shops', async (req, reply) => {
    const session = getSession(req);
    if (!requireRole(session, 'admin', reply)) return;

    const allShops = await db.select().from(shops).orderBy(desc(shops.createdAt));

    const enriched = await Promise.all(
      allShops.map(async (s) => {
        const [prog] = await db.select().from(programs).where(eq(programs.shopId, s.id)).limit(1);
        const [memberCountRow] = await db
          .select({ c: sql<number>`COUNT(DISTINCT ${stampEvents.customerId})` })
          .from(stampEvents)
          .where(and(eq(stampEvents.shopId, s.id), eq(stampEvents.status, 'counted')));
        const [stampsCountRow] = await db
          .select({ c: count() })
          .from(stampEvents)
          .where(and(eq(stampEvents.shopId, s.id), eq(stampEvents.status, 'counted')));

        return {
          id: s.id,
          slug: s.slug,
          name: s.name,
          ownerPhone: s.ownerPhone,
          lat: s.lat,
          lng: s.lng,
          isActive: s.isActive,
          createdAt: s.createdAt,
          memberCount: Number(memberCountRow?.c ?? 0),
          totalStamps: Number(stampsCountRow?.c ?? 0),
          program: prog
            ? {
                stampsRequired: prog.stampsRequired,
                rewardText: prog.rewardText,
                scratchEnabled: prog.scratchEnabled,
              }
            : null,
        };
      }),
    );

    return reply.send({ shops: enriched });
  });

  // POST /api/admin/impersonate/:shopId — Super Admin switches context to specific merchant
  app.post('/admin/impersonate/:shopId', async (req, reply) => {
    const session = getSession(req);
    if (!requireRole(session, 'admin', reply)) return;

    const { shopId } = req.params as { shopId: string };
    const [shop] = await db.select().from(shops).where(eq(shops.id, shopId)).limit(1);
    if (!shop) {
      return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Shop not found.' } });
    }

    setSessionCookie(reply, {
      ...session!,
      shopId: shop.id,
    });

    await writeAudit(db, {
      actorType: 'admin',
      actorId: session!.customerId,
      action: 'shop_impersonate',
      detail: { shopId: shop.id, shopName: shop.name, shopSlug: shop.slug },
    });

    return reply.send({ ok: true, shop: { id: shop.id, name: shop.name, slug: shop.slug } });
  });

  // POST /api/admin/exit-impersonate — clears impersonated shop
  app.post('/admin/exit-impersonate', async (req, reply) => {
    const session = getSession(req);
    if (!requireRole(session, 'admin', reply)) return;

    setSessionCookie(reply, {
      ...session!,
      shopId: undefined,
    });

    return reply.send({ ok: true });
  });

  // POST /api/admin/shops/:id/activate
  app.post('/admin/shops/:id/activate', async (req, reply) => {
    const session = getSession(req);
    if (!requireRole(session, 'admin', reply)) return;

    const { id } = req.params as { id: string };
    await db.update(shops).set({ isActive: true }).where(eq(shops.id, id));

    await writeAudit(db, {
      actorType: 'admin',
      actorId: session!.customerId,
      action: 'shop_activate',
      detail: { shopId: id },
    });

    return reply.send({ ok: true });
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

