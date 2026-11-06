import {
  and, eq, gte, sql, count, lt, inArray,
} from 'drizzle-orm';
import type { Db } from '../db/client.ts';
import {
  stampEvents, rewards, programs, scratchCards, scratchPrizes, customers,
} from '../db/schema.ts';
import { uuid } from '../lib/crypto.ts';
import { addMinutes, addDays, haversineMeters } from '../lib/utils.ts';
import { CONSTANTS } from '../lib/constants.ts';
import { selectPrize } from './scratch.ts';
import { writeAudit } from './audit.ts';

export type ScanResult =
  | { ok: true; stampId: string; status: 'pending' | 'counted'; rewardId?: string; scratchCardId?: string }
  | { ok: false; code: string; details?: Record<string, unknown> };

export async function processStamp(
  db: Db,
  opts: {
    shopId: string;
    customerId: string;
    tokenNonce: string;
    lat?: number;
    lng?: number;
    shopLat?: number | null;
    shopLng?: number | null;
    ip: string;
  },
): Promise<ScanResult> {
  const now = new Date();

  const [prog] = await db
    .select()
    .from(programs)
    .where(eq(programs.shopId, opts.shopId))
    .limit(1);

  if (!prog) return { ok: false, code: 'SHOP_INACTIVE' };

  // ── Customer hourly scan rate limit (30/hour) ───────────────────────────────
  const hourAgo = new Date(now.getTime() - 3_600_000);
  const [customerScans] = await db
    .select({ c: count() })
    .from(stampEvents)
    .where(
      and(
        eq(stampEvents.customerId, opts.customerId),
        gte(stampEvents.createdAt, hourAgo),
      ),
    );

  if ((customerScans?.c ?? 0) >= CONSTANTS.SCAN_PER_HOUR_PER_CUSTOMER) {
    return { ok: false, code: 'RATE_LIMITED' };
  }

  // ── Cooldown check ──────────────────────────────────────────────────────────
  const cooldownStart = addMinutes(now, -prog.cooldownMinutes);
  const [lastStamp] = await db
    .select({ createdAt: stampEvents.createdAt })
    .from(stampEvents)
    .where(
      and(
        eq(stampEvents.shopId, opts.shopId),
        eq(stampEvents.customerId, opts.customerId),
        inArray(stampEvents.status, ['pending', 'counted']),
        gte(stampEvents.createdAt, cooldownStart),
      ),
    )
    .orderBy(sql`${stampEvents.createdAt} DESC`)
    .limit(1);

  if (lastStamp) {
    const nextAllowedAt = addMinutes(lastStamp.createdAt, prog.cooldownMinutes);
    return {
      ok: false,
      code: 'COOLDOWN_ACTIVE',
      details: { next_allowed_at: nextAllowedAt.toISOString() },
    };
  }

  // ── Daily limit check ───────────────────────────────────────────────────────
  const todayStart = new Date(now);
  todayStart.setUTCHours(0, 0, 0, 0);

  const [todayCount] = await db
    .select({ c: count() })
    .from(stampEvents)
    .where(
      and(
        eq(stampEvents.shopId, opts.shopId),
        eq(stampEvents.customerId, opts.customerId),
        inArray(stampEvents.status, ['pending', 'counted']),
        gte(stampEvents.createdAt, todayStart),
      ),
    );

  if ((todayCount?.c ?? 0) >= prog.maxStampsPerDay) {
    return { ok: false, code: 'DAILY_LIMIT' };
  }

  // ── Location flags ──────────────────────────────────────────────────────────
  const flags: Record<string, unknown> = {};
  if (opts.lat != null && opts.lng != null && opts.shopLat != null && opts.shopLng != null) {
    const dist = haversineMeters(opts.lat, opts.lng, opts.shopLat, opts.shopLng);
    if (dist > CONSTANTS.MAX_DISTANCE_METERS) {
      flags.location_mismatch = true;
      flags.distance_meters = Math.round(dist);
    }
  }

  const stampStatus = prog.requireApproval ? 'pending' : 'counted';
  const stampId = uuid();
  let rewardId: string | undefined;
  let scratchCardId: string | undefined;
  let isIdempotentDuplicate = false;

  // ── Execute in ONE transaction ──────────────────────────────────────────────
  await db.transaction(async (tx) => {
    // 1. Idempotent insert on nonce
    await tx.insert(stampEvents).ignore().values({
      id: stampId,
      shopId: opts.shopId,
      customerId: opts.customerId,
      tokenNonce: opts.tokenNonce,
      status: stampStatus,
      flags,
      createdAt: now,
    });

    const [inserted] = await tx
      .select({ id: stampEvents.id })
      .from(stampEvents)
      .where(
        and(
          eq(stampEvents.shopId, opts.shopId),
          eq(stampEvents.customerId, opts.customerId),
          eq(stampEvents.tokenNonce, opts.tokenNonce),
        ),
      )
      .limit(1);

    if (!inserted || inserted.id !== stampId) {
      isIdempotentDuplicate = true;
      return;
    }

    if (stampStatus === 'counted') {
      // 2. Check stamp balance in tx
      const balance = await getStampBalance(tx as unknown as Db, opts.shopId, opts.customerId, prog.stampsRequired);
      if (balance.balance >= prog.stampsRequired) {
        // Card full — issue reward
        rewardId = uuid();
        await tx.insert(rewards).values({
          id: rewardId,
          shopId: opts.shopId,
          customerId: opts.customerId,
          source: 'stamp_card',
          title: prog.rewardText || 'Stamp card reward',
          status: 'earned',
          createdAt: now,
        });
      }

      // 3. Issue scratch card if due
      if (prog.scratchEnabled) {
        const visitCount = await getCountedStampCount(tx as unknown as Db, opts.shopId, opts.customerId);
        if (visitCount % prog.scratchEveryNVisits === 0) {
          const prize = await selectPrize(tx as unknown as Db, opts.shopId);
          if (prize) {
            scratchCardId = uuid();
            let scratchRewardId: string | undefined;

            if (!prize.isNoPrize) {
              scratchRewardId = uuid();
              const expiresAt = addDays(now, prog.prizeExpiryDays);
              await tx.insert(rewards).values({
                id: scratchRewardId,
                shopId: opts.shopId,
                customerId: opts.customerId,
                source: 'scratch',
                title: prize.title,
                status: 'earned',
                expiresAt,
                createdAt: now,
              });
            }

            await tx.insert(scratchCards).values({
              id: scratchCardId,
              shopId: opts.shopId,
              customerId: opts.customerId,
              stampEventId: stampId,
              prizeId: prize.id,
              rewardId: scratchRewardId,
              createdAt: now,
            });
          }
        }
      }
    }
  });

  if (isIdempotentDuplicate) {
    return { ok: false, code: 'TOKEN_INVALID' };
  }

  await writeAudit(db, {
    actorType: 'customer',
    actorId: opts.customerId,
    action: 'stamp',
    detail: { shopId: opts.shopId, stampId, status: stampStatus, flags },
  });

  return { ok: true, stampId, status: stampStatus, rewardId, scratchCardId };
}

/** Balance for a customer at a shop */
export async function getStampBalance(
  db: Db,
  shopId: string,
  customerId: string,
  stampsRequired: number,
): Promise<{ counted: number; cardsIssued: number; balance: number; overflow: number }> {
  const [stampCount] = await db
    .select({ c: count() })
    .from(stampEvents)
    .where(
      and(
        eq(stampEvents.shopId, shopId),
        eq(stampEvents.customerId, customerId),
        eq(stampEvents.status, 'counted'),
      ),
    );

  const [rewardCount] = await db
    .select({ c: count() })
    .from(rewards)
    .where(
      and(
        eq(rewards.shopId, shopId),
        eq(rewards.customerId, customerId),
        eq(rewards.source, 'stamp_card'),
      ),
    );

  const counted = stampCount?.c ?? 0;
  const cardsIssued = rewardCount?.c ?? 0;
  const balance = counted - cardsIssued * stampsRequired;
  const overflow = balance - stampsRequired;

  return { counted, cardsIssued, balance, overflow };
}

async function getCountedStampCount(db: Db, shopId: string, customerId: string): Promise<number> {
  const [row] = await db
    .select({ c: count() })
    .from(stampEvents)
    .where(
      and(
        eq(stampEvents.shopId, shopId),
        eq(stampEvents.customerId, customerId),
        eq(stampEvents.status, 'counted'),
      ),
    );
  return row?.c ?? 0;
}
