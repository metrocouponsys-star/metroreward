import webpush from 'web-push';
import { and, eq, isNull, lt } from 'drizzle-orm';
import type { Db } from '../db/client.ts';
import { pushSubscriptions } from '../db/schema.ts';
import { env } from '../lib/env.ts';

if (env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    `mailto:admin@stamp.app`,
    env.VAPID_PUBLIC_KEY,
    env.VAPID_PRIVATE_KEY,
  );
}

export async function sendPushToCustomer(
  db: Db,
  customerId: string,
  payload: { title: string; body: string; url?: string },
): Promise<void> {
  if (!env.VAPID_PUBLIC_KEY) return;

  const subs = await db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.customerId, customerId));

  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: sub.keys as webpush.PushSubscription['keys'] },
        JSON.stringify(payload),
      );
    } catch (err: unknown) {
      const status = (err as { statusCode?: number }).statusCode;
      if (status === 410 || status === 404) {
        // Subscription expired — remove it
        await db
          .delete(pushSubscriptions)
          .where(eq(pushSubscriptions.id, sub.id));
      }
    }
  }
}

