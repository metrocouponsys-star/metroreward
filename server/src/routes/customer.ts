import type { FastifyInstance } from 'fastify';
import { and, eq, desc } from 'drizzle-orm';
import { getDb } from '../db/client.ts';
import { rewards, stampEvents, shops, programs, scratchCards, scratchPrizes } from '../db/schema.ts';
import { getSession, requireAuth } from '../plugins/session.ts';
import { getStampBalance } from '../services/stamp.ts';

export async function customerRoutes(app: FastifyInstance) {
  const db = getDb();

  // GET /api/cards — all cards for the current customer
  app.get('/cards', async (req, reply) => {
    const session = getSession(req);
    if (!requireAuth(session, reply)) return;

    const customerId = session!.customerId!;

    // Find all shops where the customer has stamp events
    const events = await db
      .select({ shopId: stampEvents.shopId })
      .from(stampEvents)
      .where(and(eq(stampEvents.customerId, customerId), eq(stampEvents.status, 'counted')))
      .groupBy(stampEvents.shopId);

    const cards = await Promise.all(
      events.map(async ({ shopId }) => {
        const [shop] = await db.select().from(shops).where(eq(shops.id, shopId)).limit(1);
        const [prog] = await db.select().from(programs).where(eq(programs.shopId, shopId)).limit(1);
        if (!shop || !prog) return null;
        const balance = await getStampBalance(db, shopId, customerId, prog.stampsRequired);
        return {
          shopId,
          shopName: shop.name,
          shopSlug: shop.slug,
          stampsRequired: prog.stampsRequired,
          ...balance,
        };
      }),
    );

    return reply.send({ cards: cards.filter(Boolean) });
  });

  // GET /api/cards/:slug — single shop card
  app.get('/cards/:slug', async (req, reply) => {
    const session = getSession(req);
    if (!requireAuth(session, reply)) return;

    const customerId = session!.customerId!;
    const { slug } = req.params as { slug: string };

    const [shop] = await db.select().from(shops).where(eq(shops.slug, slug)).limit(1);
    if (!shop) {
      return reply.code(404).send({ error: { code: 'SHOP_NOT_FOUND', message: 'Shop not found.' } });
    }

    const [prog] = await db.select().from(programs).where(eq(programs.shopId, shop.id)).limit(1);
    if (!prog) {
      return reply.code(404).send({ error: { code: 'SHOP_NOT_FOUND', message: 'Program not found.' } });
    }

    const balance = await getStampBalance(db, shop.id, customerId, prog.stampsRequired);

    // Recent stamp events
    const recentStamps = await db
      .select()
      .from(stampEvents)
      .where(and(eq(stampEvents.shopId, shop.id), eq(stampEvents.customerId, customerId)))
      .orderBy(desc(stampEvents.createdAt))
      .limit(20);

    return reply.send({
      shop: { id: shop.id, name: shop.name, slug: shop.slug },
      program: {
        stampsRequired: prog.stampsRequired,
        rewardText: prog.rewardText,
        cooldownMinutes: prog.cooldownMinutes,
        scratchEnabled: prog.scratchEnabled,
      },
      ...balance,
      recentStamps,
    });
  });

  // GET /api/rewards
  app.get('/rewards', async (req, reply) => {
    const session = getSession(req);
    if (!requireAuth(session, reply)) return;

    const customerId = session!.customerId!;

    const userRewards = await db
      .select()
      .from(rewards)
      .where(eq(rewards.customerId, customerId))
      .orderBy(desc(rewards.createdAt));

    // Enrich with shop names
    const enriched = await Promise.all(
      userRewards.map(async (r) => {
        const [shop] = await db.select({ name: shops.name, slug: shops.slug }).from(shops).where(eq(shops.id, r.shopId)).limit(1);
        return { ...r, shopName: shop?.name, shopSlug: shop?.slug };
      }),
    );

    return reply.send({ rewards: enriched });
  });

  // POST /api/rewards/:id/claim
  app.post('/rewards/:id/claim', async (req, reply) => {
    const session = getSession(req);
    if (!requireAuth(session, reply)) return;

    const customerId = session!.customerId!;
    const { id } = req.params as { id: string };

    const [reward] = await db
      .select()
      .from(rewards)
      .where(and(eq(rewards.id, id), eq(rewards.customerId, customerId)))
      .limit(1);

    if (!reward) {
      return reply.code(404).send({ error: { code: 'REWARD_NOT_FOUND', message: 'Reward not found.' } });
    }

    if (reward.status !== 'earned') {
      return reply.code(400).send({ error: { code: 'CODE_USED_OR_EXPIRED', message: 'This reward cannot be claimed.' } });
    }

    const { generateRewardCode } = await import('../lib/crypto.ts');
    const { addMinutes } = await import('../lib/utils.ts');
    const { CONSTANTS } = await import('../lib/constants.ts');
    const { writeAudit } = await import('../services/audit.ts');

    const code = generateRewardCode();
    const codeExpiresAt = addMinutes(new Date(), CONSTANTS.CLAIM_CODE_TTL_MINUTES);

    await db
      .update(rewards)
      .set({ status: 'claimed', code, codeExpiresAt })
      .where(eq(rewards.id, id));

    await writeAudit(db, {
      actorType: 'customer',
      actorId: customerId,
      action: 'reward_claim',
      detail: { rewardId: id, shopId: reward.shopId },
    });

    return reply.send({
      ok: true,
      code,
      codeExpiresAt: codeExpiresAt.toISOString(),
      title: reward.title,
    });
  });

  // GET /api/scratch/:id
  app.get('/scratch/:id', async (req, reply) => {
    const session = getSession(req);
    if (!requireAuth(session, reply)) return;

    const customerId = session!.customerId!;
    const { id } = req.params as { id: string };

    const [card] = await db
      .select()
      .from(scratchCards)
      .where(and(eq(scratchCards.id, id), eq(scratchCards.customerId, customerId)))
      .limit(1);

    if (!card) {
      return reply.code(404).send({ error: { code: 'SCRATCH_NOT_FOUND', message: 'Scratch card not found.' } });
    }

    // Hide prize until revealed
    const isRevealed = !!card.revealedAt;
    if (!isRevealed) {
      return reply.send({ id: card.id, revealed: false, createdAt: card.createdAt });
    }

    const [prize] = await db.select().from(scratchPrizes).where(eq(scratchPrizes.id, card.prizeId)).limit(1);

    return reply.send({
      id: card.id,
      revealed: true,
      revealedAt: card.revealedAt,
      prize: prize ? { title: prize.title, isNoPrize: prize.isNoPrize } : null,
      rewardId: card.rewardId,
      createdAt: card.createdAt,
    });
  });

  // POST /api/scratch/:id/reveal
  app.post('/scratch/:id/reveal', async (req, reply) => {
    const session = getSession(req);
    if (!requireAuth(session, reply)) return;

    const customerId = session!.customerId!;
    const { id } = req.params as { id: string };

    const [card] = await db
      .select()
      .from(scratchCards)
      .where(and(eq(scratchCards.id, id), eq(scratchCards.customerId, customerId)))
      .limit(1);

    if (!card) {
      return reply.code(404).send({ error: { code: 'SCRATCH_NOT_FOUND', message: 'Scratch card not found.' } });
    }

    if (card.revealedAt) {
      return reply.code(400).send({ error: { code: 'SCRATCH_ALREADY_REVEALED', message: 'This card has already been revealed.' } });
    }

    await db
      .update(scratchCards)
      .set({ revealedAt: new Date() })
      .where(eq(scratchCards.id, id));

    const [prize] = await db.select().from(scratchPrizes).where(eq(scratchPrizes.id, card.prizeId)).limit(1);

    return reply.send({
      ok: true,
      prize: prize ? { title: prize.title, isNoPrize: prize.isNoPrize } : null,
      rewardId: card.rewardId,
    });
  });

  // POST /api/push/subscribe
  app.post('/push/subscribe', async (req, reply) => {
    const session = getSession(req);
    if (!requireAuth(session, reply)) return;

    const { endpoint, keys } = req.body as { endpoint: string; keys: { p256dh: string; auth: string } };

    const { pushSubscriptions } = await import('../db/schema.ts');
    const { uuid } = await import('../lib/crypto.ts');

    await db
      .insert(pushSubscriptions)
      .ignore()
      .values({
        id: uuid(),
        customerId: session!.customerId!,
        endpoint,
        keys,
        createdAt: new Date(),
      });

    return reply.send({ ok: true });
  });

  // POST /api/shops/:slug/mute
  app.post('/shops/:slug/mute', async (req, reply) => {
    const session = getSession(req);
    if (!requireAuth(session, reply)) return;

    const { slug } = req.params as { slug: string };
    const [shop] = await db.select().from(shops).where(eq(shops.slug, slug)).limit(1);
    if (!shop) return reply.code(404).send({ error: { code: 'SHOP_NOT_FOUND', message: 'Shop not found.' } });

    const { reminderMutes } = await import('../db/schema.ts');
    await db
      .insert(reminderMutes)
      .ignore()
      .values({ customerId: session!.customerId!, shopId: shop.id });

    return reply.send({ ok: true });
  });

  // GET /api/customer/qr-token — customer personal rotating QR for reverse scanning
  app.get('/customer/qr-token', async (req, reply) => {
    const session = getSession(req);
    if (!requireAuth(session, reply)) return;

    const { issueCustomerToken } = await import('../services/token.ts');
    const token = issueCustomerToken(session!.customerId!);

    const [customer] = await db
      .select({ name: customers.name, phone: customers.phone })
      .from(customers)
      .where(eq(customers.id, session!.customerId!))
      .limit(1);

    return reply.send({
      ok: true,
      token,
      customerId: session!.customerId!,
      name: customer?.name || 'Customer',
      phone: customer?.phone || session!.phone,
    });
  });

  // GET /api/shops/public — business discovery
  app.get('/shops/public', async (_req, reply) => {
    const activeShops = await db
      .select({
        id: shops.id,
        name: shops.name,
        slug: shops.slug,
        lat: shops.lat,
        lng: shops.lng,
        stampsRequired: programs.stampsRequired,
        rewardText: programs.rewardText,
      })
      .from(shops)
      .leftJoin(programs, eq(shops.id, programs.shopId))
      .where(eq(shops.isActive, true));

    return reply.send({ shops: activeShops });
  });
}

