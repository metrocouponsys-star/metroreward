import { and, eq, isNull, lte, sql, count, gte, inArray, desc } from 'drizzle-orm';
import type { Db } from '../db/client.ts';
import {
  reminders, reminderMutes, rewards, stampEvents, customers, shops, programs,
} from '../db/schema.ts';
import { sendPushToCustomer } from './push.ts';
import { addDays, currentHourIST } from '../lib/utils.ts';
import { CONSTANTS } from '../lib/constants.ts';
import { uuid } from '../lib/crypto.ts';

export function isQuietHourIST(hour: number = currentHourIST()): boolean {
  return hour >= CONSTANTS.QUIET_START_HOUR_IST || hour < CONSTANTS.QUIET_END_HOUR_IST;
}

/** Check if customer should receive reminders for a shop (mute + frequency + max ignored) */
export async function canSendReminder(
  db: Db,
  customerId: string,
  shopId: string,
  now: Date = new Date(),
): Promise<boolean> {
  // 1. Mute check
  const [muted] = await db
    .select()
    .from(reminderMutes)
    .where(and(eq(reminderMutes.customerId, customerId), eq(reminderMutes.shopId, shopId)))
    .limit(1);
  if (muted) return false;

  // 2. Minimum 3-day interval check
  const threeDaysAgo = addDays(now, -CONSTANTS.REMINDER_MIN_INTERVAL_DAYS);
  const [recentSent] = await db
    .select({ c: count() })
    .from(reminders)
    .where(
      and(
        eq(reminders.customerId, customerId),
        eq(reminders.shopId, shopId),
        gte(reminders.sentAt!, threeDaysAgo),
      ),
    );
  if ((recentSent?.c ?? 0) > 0) return false;

  // 3. Stop after 3 ignored reminders without activity
  const [lastEvent] = await db
    .select({ createdAt: stampEvents.createdAt })
    .from(stampEvents)
    .where(and(eq(stampEvents.customerId, customerId), eq(stampEvents.shopId, shopId)))
    .orderBy(desc(stampEvents.createdAt))
    .limit(1);

  const ignoredQuery = db
    .select({ c: count() })
    .from(reminders)
    .where(
      and(
        eq(reminders.customerId, customerId),
        eq(reminders.shopId, shopId),
        sql`${reminders.sentAt} IS NOT NULL`,
        lastEvent ? gte(reminders.sentAt!, lastEvent.createdAt) : sql`1=1`,
      ),
    );

  const [ignored] = await ignoredQuery;
  if ((ignored?.c ?? 0) >= CONSTANTS.REMINDER_MAX_IGNORED) return false;

  return true;
}

/** Evaluate triggers and schedule/send due reminders */
export async function processReminders(db: Db, now: Date = new Date()): Promise<{ sent: number; skipped?: string }> {
  const hour = currentHourIST();
  if (isQuietHourIST(hour)) {
    return { sent: 0, skipped: 'quiet_hours' };
  }

  // 1. Scan Trigger 1: Reward earned and unclaimed (3 days, then 10 days)
  const threeDaysAgo = addDays(now, -3);
  const tenDaysAgo = addDays(now, -10);

  const unclaimedRewards = await db
    .select()
    .from(rewards)
    .where(and(eq(rewards.status, 'earned'), lte(rewards.createdAt, threeDaysAgo)));

  for (const reward of unclaimedRewards) {
    const ageDays = (now.getTime() - reward.createdAt.getTime()) / 86_400_000;
    if (ageDays >= 3 && ageDays < 15) {
      // Check if we already scheduled/sent for this reward
      const [existing] = await db
        .select()
        .from(reminders)
        .where(
          and(
            eq(reminders.customerId, reward.customerId),
            eq(reminders.shopId, reward.shopId),
            eq(reminders.kind, 'reward_ready'),
            gte(reminders.sendAfter, reward.createdAt),
          ),
        )
        .limit(1);

      if (!existing) {
        await db.insert(reminders).values({
          id: uuid(),
          customerId: reward.customerId,
          shopId: reward.shopId,
          kind: 'reward_ready',
          sendAfter: now,
        });
      }
    }
  }

  // 2. Scan Trigger 4: Scratch prize expiring in 3 days
  const inThreeDays = addDays(now, 3);
  const expiringRewards = await db
    .select()
    .from(rewards)
    .where(
      and(
        eq(rewards.status, 'earned'),
        eq(rewards.source, 'scratch'),
        sql`${rewards.expiresAt} IS NOT NULL`,
        lte(rewards.expiresAt!, inThreeDays),
        gte(rewards.expiresAt!, now),
      ),
    );

  for (const exp of expiringRewards) {
    const [existing] = await db
      .select()
      .from(reminders)
      .where(
        and(
          eq(reminders.customerId, exp.customerId),
          eq(reminders.shopId, exp.shopId),
          eq(reminders.kind, 'prize_expiring'),
        ),
      )
      .limit(1);

    if (!existing) {
      await db.insert(reminders).values({
        id: uuid(),
        customerId: exp.customerId,
        shopId: exp.shopId,
        kind: 'prize_expiring',
        sendAfter: now,
      });
    }
  }

  // 3. Process all due un-sent reminders
  const due = await db
    .select()
    .from(reminders)
    .where(and(isNull(reminders.sentAt), isNull(reminders.cancelledAt), lte(reminders.sendAfter, now)))
    .limit(100);

  let sent = 0;

  for (const r of due) {
    const allowed = await canSendReminder(db, r.customerId, r.shopId, now);
    if (!allowed) {
      await db.update(reminders).set({ cancelledAt: now }).where(eq(reminders.id, r.id));
      continue;
    }

    const [shop] = await db.select({ name: shops.name }).from(shops).where(eq(shops.id, r.shopId)).limit(1);
    const shopName = shop?.name ?? 'the shop';

    let title = 'Stamp';
    let body = '';
    switch (r.kind) {
      case 'reward_ready':
        title = 'Reward waiting!';
        body = `Your reward is waiting at ${shopName}. Claim it!`;
        break;
      case 'one_to_go':
        title = 'Almost there!';
        body = `One more stamp and you get a reward at ${shopName}.`;
        break;
      case 'win_back':
        title = 'We miss you!';
        body = `It has been a while. Come back to ${shopName} for a stamp.`;
        break;
      case 'prize_expiring':
        title = 'Prize expiring soon!';
        body = `Your prize at ${shopName} expires in 3 days.`;
        break;
    }

    await sendPushToCustomer(db, r.customerId, { title, body });
    await db.update(reminders).set({ sentAt: now }).where(eq(reminders.id, r.id));
    sent++;
  }

  return { sent };
}

