import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { and, eq } from 'drizzle-orm';
import { getDb } from '../db/client.ts';
import { shops } from '../db/schema.ts';
import { verifyQrToken } from '../services/token.ts';
import { processStamp } from '../services/stamp.ts';
import { getSession, requireAuth } from '../plugins/session.ts';

const ScanBody = z.object({
  slug: z.string(),
  token: z.string(),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

export async function scanRoutes(app: FastifyInstance) {
  const db = getDb();

  // POST /api/scan
  app.post(
    '/scan',
    {
      config: {
        rateLimit: {
          max: 10,
          timeWindow: '1 minute',
        },
      },
    },
    async (req, reply) => {
    const session = getSession(req);
    if (!requireAuth(session, reply)) return;

    const body = ScanBody.safeParse(req.body);
    if (!body.success) {
      return reply.code(400).send({ error: { code: 'VALIDATION', message: 'Invalid scan data.' } });
    }

    const { slug, token, lat, lng } = body.data;

    // Load shop
    const [shop] = await db
      .select()
      .from(shops)
      .where(eq(shops.slug, slug))
      .limit(1);

    if (!shop) {
      return reply.code(404).send({ error: { code: 'SHOP_NOT_FOUND', message: 'Shop not found.' } });
    }

    if (!shop.isActive) {
      return reply.code(403).send({ error: { code: 'SHOP_INACTIVE', message: 'This shop is not active right now.' } });
    }

    // Verify token
    const tokenResult = verifyQrToken(token, shop.id, shop.qrSecret);
    if (!tokenResult.ok) {
      return reply.code(400).send({
        error: {
          code: tokenResult.code,
          message: tokenResult.code === 'TOKEN_EXPIRED'
            ? 'That QR expired. Ask the shop to show it again.'
            : 'That QR code is not valid. Ask the shop to show it again.',
        },
      });
    }

    const nonce = tokenResult.payload.nonce;

    const result = await processStamp(db, {
      shopId: shop.id,
      customerId: session!.customerId!,
      tokenNonce: nonce,
      lat,
      lng,
      shopLat: shop.lat,
      shopLng: shop.lng,
      ip: req.ip,
    });

    if (!result.ok) {
      const statusMap: Record<string, number> = {
        COOLDOWN_ACTIVE: 429,
        DAILY_LIMIT: 429,
        SHOP_INACTIVE: 403,
        TOKEN_INVALID: 400,
      };
      return reply.code(statusMap[result.code] ?? 400).send({
        error: { code: result.code, message: result.code, details: (result as { details?: unknown }).details },
      });
    }

    return reply.send({
      ok: true,
      shopName: shop.name,
      shopSlug: shop.slug,
      stampId: result.stampId,
      status: result.status,
      rewardId: result.rewardId,
      scratchCardId: result.scratchCardId,
    });
  });
}

