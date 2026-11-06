import type { FastifyInstance } from 'fastify';
import { and, eq, desc, sql, count, gte } from 'drizzle-orm';
import { z } from 'zod';
import { getDb } from '../db/client.ts';
import {
  shops, programs, stampEvents, rewards, customers, scratchCards, scratchPrizes, reminders, reminderMutes, auditLog,
} from '../db/schema.ts';
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
  stampsRequired: z.number().int().min(2).max(30).optional(),
  rewardText: z.string().max(256).optional(),
  cooldownMinutes: z.number().int().min(0).max(1440).optional(),
  maxStampsPerDay: z.number().int().min(1).max(20).optional(),
  scratchEnabled: z.boolean().optional(),
});

const UpdateShopBody = z.object({
  slug: z.string().min(2).max(64).regex(/^[a-z0-9-]+$/).optional(),
  name: z.string().min(1).max(128).optional(),
  ownerPhone: z.string().min(10).max(20).optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  isActive: z.boolean().optional(),
  stampsRequired: z.number().int().min(2).max(30).optional(),
  rewardText: z.string().max(256).optional(),
  cooldownMinutes: z.number().int().min(0).max(1440).optional(),
  maxStampsPerDay: z.number().int().min(1).max(20).optional(),
  scratchEnabled: z.boolean().optional(),
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

    // Create program
    await db.insert(programs).values({
      id: uuid(),
      shopId,
      stampsRequired: body.data.stampsRequired ?? 6,
      rewardText: body.data.rewardText || 'Free item or reward of your choice',
      cooldownMinutes: body.data.cooldownMinutes ?? 60,
      maxStampsPerDay: body.data.maxStampsPerDay ?? 2,
      requireApproval: false,
      scratchEnabled: body.data.scratchEnabled ?? true,
      scratchEveryNVisits: 1,
      prizeExpiryDays: 30,
    });

    // Create default starter scratch prizes
    await db.insert(scratchPrizes).values([
      {
        id: uuid(),
        shopId,
        title: '15% Off Your Next Order',
        weight: 50,
        stock: null,
        isNoPrize: false,
        isActive: true,
      },
      {
        id: uuid(),
        shopId,
        title: 'Free Treat / Special Perk',
        weight: 30,
        stock: 50,
        isNoPrize: false,
        isActive: true,
      },
      {
        id: uuid(),
        shopId,
        title: 'Better luck next visit!',
        weight: 20,
        stock: null,
        isNoPrize: true,
        isActive: true,
      },
    ]);

    await writeAudit(db, {
      actorType: 'admin',
      actorId: session!.customerId,
      action: 'shop_create',
      detail: { shopId, slug: body.data.slug, name: body.data.name },
    });

    return reply.code(201).send({ ok: true, shopId });
  });

  // GET /api/admin/shops/:id — single merchant detailed inspection
  app.get('/admin/shops/:id', async (req, reply) => {
    const session = getSession(req);
    if (!requireRole(session, 'admin', reply)) return;

    const { id } = req.params as { id: string };
    const [shop] = await db.select().from(shops).where(eq(shops.id, id)).limit(1);
    if (!shop) return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Shop not found.' } });

    const [prog] = await db.select().from(programs).where(eq(programs.shopId, id)).limit(1);
    const prizes = await db.select().from(scratchPrizes).where(eq(scratchPrizes.shopId, id));

    const [memberCountRow] = await db
      .select({ c: sql<number>`COUNT(DISTINCT ${stampEvents.customerId})` })
      .from(stampEvents)
      .where(and(eq(stampEvents.shopId, id), eq(stampEvents.status, 'counted')));
    const [stampsCountRow] = await db
      .select({ c: count() })
      .from(stampEvents)
      .where(and(eq(stampEvents.shopId, id), eq(stampEvents.status, 'counted')));

    return reply.send({
      shop,
      program: prog,
      scratchPrizes: prizes,
      memberCount: Number(memberCountRow?.c ?? 0),
      totalStamps: Number(stampsCountRow?.c ?? 0),
    });
  });

  // PUT /api/admin/shops/:id — Edit merchant details & program rules
  app.put('/admin/shops/:id', async (req, reply) => {
    const session = getSession(req);
    if (!requireRole(session, 'admin', reply)) return;

    const { id } = req.params as { id: string };
    const [shop] = await db.select().from(shops).where(eq(shops.id, id)).limit(1);
    if (!shop) return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Shop not found.' } });

    const body = UpdateShopBody.safeParse(req.body);
    if (!body.success) {
      return reply.code(400).send({ error: { code: 'VALIDATION', message: 'Invalid data.', details: body.error.flatten() } });
    }

    const { normalizePhone } = await import('../lib/utils.ts');
    const shopUpdates: Partial<typeof shops.$inferInsert> = {};
    if (body.data.name) shopUpdates.name = body.data.name;
    if (body.data.slug) shopUpdates.slug = body.data.slug;
    if (body.data.ownerPhone) shopUpdates.ownerPhone = normalizePhone(body.data.ownerPhone);
    if (body.data.lat !== undefined) shopUpdates.lat = body.data.lat;
    if (body.data.lng !== undefined) shopUpdates.lng = body.data.lng;
    if (body.data.isActive !== undefined) shopUpdates.isActive = body.data.isActive;

    if (Object.keys(shopUpdates).length > 0) {
      await db.update(shops).set(shopUpdates).where(eq(shops.id, id));
    }

    const progUpdates: Partial<typeof programs.$inferInsert> = {};
    if (body.data.stampsRequired !== undefined) progUpdates.stampsRequired = body.data.stampsRequired;
    if (body.data.rewardText !== undefined) progUpdates.rewardText = body.data.rewardText;
    if (body.data.cooldownMinutes !== undefined) progUpdates.cooldownMinutes = body.data.cooldownMinutes;
    if (body.data.maxStampsPerDay !== undefined) progUpdates.maxStampsPerDay = body.data.maxStampsPerDay;
    if (body.data.scratchEnabled !== undefined) progUpdates.scratchEnabled = body.data.scratchEnabled;

    if (Object.keys(progUpdates).length > 0) {
      await db.update(programs).set(progUpdates).where(eq(programs.shopId, id));
    }

    await writeAudit(db, {
      actorType: 'admin',
      actorId: session!.customerId,
      action: 'shop_update',
      detail: { shopId: id, updates: body.data },
    });

    return reply.send({ ok: true });
  });

  // DELETE /api/admin/shops/:id — Delete merchant account and purge data safely
  app.delete('/admin/shops/:id', async (req, reply) => {
    const session = getSession(req);
    if (!requireRole(session, 'admin', reply)) return;

    const { id } = req.params as { id: string };
    const [shop] = await db.select().from(shops).where(eq(shops.id, id)).limit(1);
    if (!shop) return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Shop not found.' } });

    // Cascade delete in child-first order
    await db.delete(scratchCards).where(eq(scratchCards.shopId, id));
    await db.delete(scratchPrizes).where(eq(scratchPrizes.shopId, id));
    await db.delete(rewards).where(eq(rewards.shopId, id));
    await db.delete(stampEvents).where(eq(stampEvents.shopId, id));
    await db.delete(programs).where(eq(programs.shopId, id));
    await db.delete(reminders).where(eq(reminders.shopId, id));
    await db.delete(reminderMutes).where(eq(reminderMutes.shopId, id));
    await db.delete(shops).where(eq(shops.id, id));

    await writeAudit(db, {
      actorType: 'admin',
      actorId: session!.customerId,
      action: 'shop_delete',
      detail: { shopId: id, shopName: shop.name },
    });

    return reply.send({ ok: true });
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

