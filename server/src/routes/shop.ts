import type { FastifyInstance } from 'fastify';
import { and, eq, desc, gte, sql, count } from 'drizzle-orm';
import { getDb } from '../db/client.ts';
import {
  shops, programs, stampEvents, rewards, customers, scratchCards, scratchPrizes,
} from '../db/schema.ts';
import { getSession, requireRole } from '../plugins/session.ts';
import { issueQrToken } from '../services/token.ts';
import { writeAudit } from '../services/audit.ts';
import { z } from 'zod';

const ProgramSchema = z.object({
  stampsRequired: z.number().int().min(2).max(30),
  rewardText: z.string().max(256),
  cooldownMinutes: z.number().int().min(60).max(1440),
  maxStampsPerDay: z.number().int().min(1).max(10),
  requireApproval: z.boolean(),
  scratchEnabled: z.boolean(),
  scratchEveryNVisits: z.number().int().min(1).max(20),
  prizeExpiryDays: z.number().int().min(1).max(365),
});

const ScratchPrizeSchema = z.object({
  id: z.string().optional(),
  title: z.string().max(128),
  weight: z.number().int().min(1),
  stock: z.number().int().min(0).nullable(),
  isNoPrize: z.boolean(),
  isActive: z.boolean(),
});

export async function shopRoutes(app: FastifyInstance) {
  const db = getDb();

  async function getShopForSession(req: Parameters<typeof getSession>[0], reply: Parameters<typeof requireRole>[2]) {
    const session = getSession(req);
    if (!requireRole(session, 'shop', reply)) return null;
    const shopId = session!.shopId;
    if (!shopId) {
      reply.code(403).send({ error: { code: 'FORBIDDEN', message: 'No shop linked to this account.' } });
      return null;
    }
    const [shop] = await db.select().from(shops).where(eq(shops.id, shopId)).limit(1);
    return shop ?? null;
  }

  // GET /api/shop/qr-token
  app.get('/shop/qr-token', async (req, reply) => {
    const shop = await getShopForSession(req, reply);
    if (!shop) return;

    const token = issueQrToken(shop.id, shop.qrSecret);
    const qrUrl = `${process.env.BASE_URL}/s/${shop.slug}?t=${token}`;

    return reply.send({ token, qrUrl, shopName: shop.name, shopSlug: shop.slug });
  });

  // POST /api/shop/scan-customer — staff scans customer rotating personal QR
  app.post('/shop/scan-customer', async (req, reply) => {
    const shop = await getShopForSession(req, reply);
    if (!shop) return;

    const { token, lat, lng } = req.body as { token: string; lat?: number; lng?: number };
    if (!token || typeof token !== 'string') {
      return reply.code(400).send({ error: { code: 'VALIDATION', message: 'Customer token is required.' } });
    }

    const { verifyCustomerToken } = await import('../services/token.ts');
    const tokenRes = verifyCustomerToken(token);
    if (!tokenRes.ok) {
      return reply.code(400).send({
        error: {
          code: tokenRes.code,
          message: tokenRes.code === 'TOKEN_EXPIRED'
            ? 'Customer QR expired. Ask customer to refresh their code.'
            : 'Invalid customer QR code.',
        },
      });
    }

    const { processStamp } = await import('../services/stamp.ts');
    const result = await processStamp(db, {
      shopId: shop.id,
      customerId: tokenRes.payload.customerId,
      tokenNonce: tokenRes.payload.nonce,
      lat,
      lng,
      shopLat: shop.lat,
      shopLng: shop.lng,
      ip: req.ip,
    });

    if (!result.ok) {
      return reply.code(400).send({
        error: { code: result.code, message: result.code, details: (result as { details?: unknown }).details },
      });
    }

    const [customer] = await db
      .select({ name: customers.name, phone: customers.phone })
      .from(customers)
      .where(eq(customers.id, tokenRes.payload.customerId))
      .limit(1);

    return reply.send({
      ok: true,
      customerName: customer?.name || 'Customer',
      customerPhone: customer?.phone || '',
      stampId: result.stampId,
      status: result.status,
      rewardId: result.rewardId,
      scratchCardId: result.scratchCardId,
    });
  });

  // GET /api/shop/feed?since=
  app.get('/shop/feed', async (req, reply) => {
    const shop = await getShopForSession(req, reply);
    if (!shop) return;

    const { since } = req.query as { since?: string };
    const sinceDate = since ? new Date(since) : new Date(Date.now() - 86_400_000);

    const events = await db
      .select({
        id: stampEvents.id,
        customerId: stampEvents.customerId,
        status: stampEvents.status,
        flags: stampEvents.flags,
        voidReason: stampEvents.voidReason,
        createdAt: stampEvents.createdAt,
        customerName: customers.name,
        customerPhone: customers.phone,
      })
      .from(stampEvents)
      .leftJoin(customers, eq(stampEvents.customerId, customers.id))
      .where(and(eq(stampEvents.shopId, shop.id), gte(stampEvents.createdAt, sinceDate)))
      .orderBy(desc(stampEvents.createdAt))
      .limit(100);

    return reply.send({ events });
  });

  // GET /api/shop/summary
  app.get('/shop/summary', async (req, reply) => {
    const shop = await getShopForSession(req, reply);
    if (!shop) return;

    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    const [stampsToday] = await db
      .select({ c: count() })
      .from(stampEvents)
      .where(and(eq(stampEvents.shopId, shop.id), gte(stampEvents.createdAt, todayStart), eq(stampEvents.status, 'counted')));

    const [redeemed] = await db
      .select({ c: count() })
      .from(rewards)
      .where(and(eq(rewards.shopId, shop.id), eq(rewards.status, 'redeemed'), gte(rewards.redeemedAt!, todayStart)));

    const [scratchWins] = await db
      .select({ c: count() })
      .from(scratchCards)
      .leftJoin(scratchPrizes, eq(scratchCards.prizeId, scratchPrizes.id))
      .where(and(eq(scratchCards.shopId, shop.id), gte(scratchCards.createdAt, todayStart), eq(scratchPrizes.isNoPrize, false)));

    return reply.send({
      stampsToday: stampsToday?.c ?? 0,
      redeemedToday: redeemed?.c ?? 0,
      scratchWinsToday: scratchWins?.c ?? 0,
    });
  });

  // GET /api/shop/customers
  app.get('/shop/customers', async (req, reply) => {
    const shop = await getShopForSession(req, reply);
    if (!shop) return;

    const rows = await db
      .select({
        customerId: stampEvents.customerId,
        customerName: customers.name,
        customerPhone: customers.phone,
        lastVisit: sql<Date>`MAX(${stampEvents.createdAt})`,
        totalStamps: sql<number>`COUNT(*)`,
      })
      .from(stampEvents)
      .leftJoin(customers, eq(stampEvents.customerId, customers.id))
      .where(and(eq(stampEvents.shopId, shop.id), eq(stampEvents.status, 'counted')))
      .groupBy(stampEvents.customerId, customers.name, customers.phone)
      .orderBy(sql`MAX(${stampEvents.createdAt}) DESC`);

    return reply.send({ customers: rows });
  });

  // GET /api/shop/customers/export.csv — CSV export of customer list
  app.get('/shop/customers/export.csv', async (req, reply) => {
    const shop = await getShopForSession(req, reply);
    if (!shop) return;

    const rows = await db
      .select({
        customerId: stampEvents.customerId,
        customerName: customers.name,
        customerPhone: customers.phone,
        lastVisit: sql<Date>`MAX(${stampEvents.createdAt})`,
        totalStamps: sql<number>`COUNT(*)`,
      })
      .from(stampEvents)
      .leftJoin(customers, eq(stampEvents.customerId, customers.id))
      .where(and(eq(stampEvents.shopId, shop.id), eq(stampEvents.status, 'counted')))
      .groupBy(stampEvents.customerId, customers.name, customers.phone)
      .orderBy(sql`MAX(${stampEvents.createdAt}) DESC`);

    function escapeCsv(val: unknown): string {
      const str = String(val ?? '');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    }

    const header = ['Customer Name', 'Phone', 'Total Stamps', 'Last Visit (IST)', 'Customer ID'].join(',');
    const lines = rows.map((r) => [
      escapeCsv(r.customerName || 'Anonymous'),
      escapeCsv(r.customerPhone),
      r.totalStamps,
      escapeCsv(r.lastVisit ? new Date(r.lastVisit).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : ''),
      escapeCsv(r.customerId),
    ].join(','));

    const csvContent = [header, ...lines].join('\r\n');
    const dateStr = new Date().toISOString().slice(0, 10);

    reply.header('Content-Type', 'text/csv; charset=utf-8');
    reply.header('Content-Disposition', `attachment; filename="${shop.slug}-customers-${dateStr}.csv"`);
    return reply.send(csvContent);
  });

  // POST /api/shop/redeem
  app.post('/shop/redeem', async (req, reply) => {
    const shop = await getShopForSession(req, reply);
    if (!shop) return;

    const { code } = req.body as { code: string };
    if (!code || typeof code !== 'string') {
      return reply.code(400).send({ error: { code: 'VALIDATION', message: 'Code is required.' } });
    }

    const now = new Date();

    // Atomic update with row lock
    const result = await db
      .update(rewards)
      .set({ status: 'redeemed', redeemedAt: now })
      .where(
        and(
          eq(rewards.code, code.toUpperCase()),
          eq(rewards.shopId, shop.id),
          eq(rewards.status, 'claimed'),
          gte(rewards.codeExpiresAt!, now),
        ),
      );

    const affected = (result[0] as unknown as { affectedRows?: number })?.affectedRows ?? 0;
    if (affected === 0) {
      return reply.code(400).send({ error: { code: 'CODE_USED_OR_EXPIRED', message: 'Code already used or expired.' } });
    }

    const [reward] = await db
      .select()
      .from(rewards)
      .where(and(eq(rewards.code, code.toUpperCase()), eq(rewards.shopId, shop.id)))
      .limit(1);

    await writeAudit(db, {
      actorType: 'shop',
      actorId: shop.id,
      action: 'redeem',
      detail: { code, rewardId: reward?.id },
    });

    return reply.send({ ok: true, reward });
  });

  // POST /api/shop/stamps/:id/approve
  app.post('/shop/stamps/:id/approve', async (req, reply) => {
    const shop = await getShopForSession(req, reply);
    if (!shop) return;

    const { id } = req.params as { id: string };
    const result = await db
      .update(stampEvents)
      .set({ status: 'counted' })
      .where(and(eq(stampEvents.id, id), eq(stampEvents.shopId, shop.id), eq(stampEvents.status, 'pending')));

    const affected = (result[0] as unknown as { affectedRows?: number })?.affectedRows ?? 0;
    if (affected === 0) {
      return reply.code(404).send({ error: { code: 'CODE_NOT_FOUND', message: 'Stamp not found or already processed.' } });
    }

    await writeAudit(db, { actorType: 'shop', actorId: shop.id, action: 'stamp_approve', detail: { stampId: id } });
    return reply.send({ ok: true });
  });

  // POST /api/shop/stamps/:id/void
  app.post('/shop/stamps/:id/void', async (req, reply) => {
    const shop = await getShopForSession(req, reply);
    if (!shop) return;

    const { id } = req.params as { id: string };
    const { reason } = req.body as { reason?: string };

    const result = await db
      .update(stampEvents)
      .set({ status: 'voided', voidReason: reason ?? 'No reason given' })
      .where(
        and(
          eq(stampEvents.id, id),
          eq(stampEvents.shopId, shop.id),
          eq(stampEvents.status, 'counted'),
        ),
      );

    const affected = (result[0] as unknown as { affectedRows?: number })?.affectedRows ?? 0;
    if (affected === 0) {
      return reply.code(404).send({ error: { code: 'CODE_NOT_FOUND', message: 'Stamp not found.' } });
    }

    await writeAudit(db, { actorType: 'shop', actorId: shop.id, action: 'stamp_void', detail: { stampId: id, reason } });
    return reply.send({ ok: true });
  });

  // GET /api/shop/program
  app.get('/shop/program', async (req, reply) => {
    const shop = await getShopForSession(req, reply);
    if (!shop) return;

    const [prog] = await db.select().from(programs).where(eq(programs.shopId, shop.id)).limit(1);
    return reply.send({ program: prog ?? null });
  });

  // PUT /api/shop/program
  app.put('/shop/program', async (req, reply) => {
    const shop = await getShopForSession(req, reply);
    if (!shop) return;

    const body = ProgramSchema.safeParse(req.body);
    if (!body.success) {
      return reply.code(400).send({ error: { code: 'VALIDATION', message: 'Invalid program data.', details: body.error.flatten() } });
    }

    const [existing] = await db.select().from(programs).where(eq(programs.shopId, shop.id)).limit(1);

    const { uuid } = await import('../lib/crypto.ts');

    if (existing) {
      await db.update(programs).set(body.data).where(eq(programs.id, existing.id));
    } else {
      await db.insert(programs).values({ id: uuid(), shopId: shop.id, ...body.data });
    }

    await writeAudit(db, { actorType: 'shop', actorId: shop.id, action: 'program_update', detail: body.data });
    return reply.send({ ok: true });
  });

  // GET /api/shop/scratch-prizes
  app.get('/shop/scratch-prizes', async (req, reply) => {
    const shop = await getShopForSession(req, reply);
    if (!shop) return;

    const prizes = await db.select().from(scratchPrizes).where(eq(scratchPrizes.shopId, shop.id));
    const total = prizes.reduce((s, p) => s + (p.isActive ? p.weight : 0), 0);
    const enriched = prizes.map((p) => ({
      ...p,
      percentage: total > 0 && p.isActive ? Math.round((p.weight / total) * 1000) / 10 : 0,
    }));

    return reply.send({ prizes: enriched });
  });

  // PUT /api/shop/scratch-prizes
  app.put('/shop/scratch-prizes', async (req, reply) => {
    const shop = await getShopForSession(req, reply);
    if (!shop) return;

    const body = z.array(ScratchPrizeSchema).safeParse(req.body);
    if (!body.success) {
      return reply.code(400).send({ error: { code: 'VALIDATION', message: 'Invalid prize data.' } });
    }

    const { uuid } = await import('../lib/crypto.ts');

    await db.transaction(async (tx) => {
      for (const prize of body.data) {
        if (prize.id) {
          await tx
            .update(scratchPrizes)
            .set({ title: prize.title, weight: prize.weight, stock: prize.stock, isNoPrize: prize.isNoPrize, isActive: prize.isActive })
            .where(and(eq(scratchPrizes.id, prize.id), eq(scratchPrizes.shopId, shop.id)));
        } else {
          await tx.insert(scratchPrizes).values({
            id: uuid(),
            shopId: shop.id,
            title: prize.title,
            weight: prize.weight,
            stock: prize.stock,
            isNoPrize: prize.isNoPrize,
            isActive: prize.isActive,
          });
        }
      }
    });

    return reply.send({ ok: true });
  });
}

