import { and, eq, gte, lt, isNull, sql, count } from 'drizzle-orm';
import type { Db } from '../db/client.ts';
import { otpRequests } from '../db/schema.ts';
import {
  generateOtp,
  sha256,
  uuid,
} from '../lib/crypto.ts';
import { addMinutes } from '../lib/utils.ts';
import { CONSTANTS } from '../lib/constants.ts';
import { otpSender } from './otpSender.ts';

export type OtpResult =
  | { ok: true }
  | { ok: false; code: 'OTP_LOCKED' | 'OTP_RATE_LIMIT' | 'OTP_RESEND_TOO_SOON' };

export type VerifyResult =
  | { ok: true }
  | { ok: false; code: 'OTP_INVALID' | 'OTP_LOCKED' | 'OTP_EXPIRED' };

export async function requestOtp(
  db: Db,
  phone: string,
  ip: string,
): Promise<OtpResult> {
  const now = new Date();
  const hourAgo = new Date(now.getTime() - 3_600_000);
  const minuteAgo = new Date(now.getTime() - CONSTANTS.OTP_RESEND_SECONDS * 1000);

  // Check 15-minute lock if 5 failed attempts
  const lockWindow = addMinutes(now, -CONSTANTS.OTP_LOCK_MINUTES);
  const [locked] = await db
    .select({ id: otpRequests.id })
    .from(otpRequests)
    .where(
      and(
        eq(otpRequests.phone, phone),
        gte(otpRequests.attempts, CONSTANTS.OTP_MAX_ATTEMPTS),
        gte(otpRequests.createdAt, lockWindow),
      ),
    )
    .limit(1);
  if (locked) {
    return { ok: false, code: 'OTP_LOCKED' };
  }

  // Check hourly per phone
  const [phoneCount] = await db
    .select({ c: count() })
    .from(otpRequests)
    .where(and(eq(otpRequests.phone, phone), gte(otpRequests.createdAt, hourAgo)));
  if ((phoneCount?.c ?? 0) >= CONSTANTS.OTP_HOURLY_PER_PHONE) {
    return { ok: false, code: 'OTP_RATE_LIMIT' };
  }

  // Check hourly per IP
  const [ipCount] = await db
    .select({ c: count() })
    .from(otpRequests)
    .where(and(eq(otpRequests.ip, ip), gte(otpRequests.createdAt, hourAgo)));
  if ((ipCount?.c ?? 0) >= CONSTANTS.OTP_HOURLY_PER_IP) {
    return { ok: false, code: 'OTP_RATE_LIMIT' };
  }

  // Check 60s resend cooldown — find latest unconsumed for phone
  const [latest] = await db
    .select({ createdAt: otpRequests.createdAt })
    .from(otpRequests)
    .where(and(eq(otpRequests.phone, phone), isNull(otpRequests.consumedAt), gte(otpRequests.expiresAt, now)))
    .orderBy(sql`${otpRequests.createdAt} DESC`)
    .limit(1);
  if (latest && latest.createdAt > minuteAgo) {
    return { ok: false, code: 'OTP_RESEND_TOO_SOON' };
  }

  const code = generateOtp();
  const codeHash = sha256(code);

  await db.insert(otpRequests).values({
    id: uuid(),
    phone,
    codeHash,
    ip,
    attempts: 0,
    expiresAt: addMinutes(now, 5),
    createdAt: now,
  });

  await otpSender.send(phone, code);
  return { ok: true };
}

export async function verifyOtp(
  db: Db,
  phone: string,
  code: string,
  ip: string,
): Promise<VerifyResult> {
  const now = new Date();

  const lockWindow = addMinutes(now, -CONSTANTS.OTP_LOCK_MINUTES);
  const [locked] = await db
    .select({ id: otpRequests.id })
    .from(otpRequests)
    .where(
      and(
        eq(otpRequests.phone, phone),
        gte(otpRequests.attempts, CONSTANTS.OTP_MAX_ATTEMPTS),
        gte(otpRequests.createdAt, lockWindow),
      ),
    )
    .limit(1);
  if (locked) {
    return { ok: false, code: 'OTP_LOCKED' };
  }

  // Find the latest active request for this phone
  const [req] = await db
    .select()
    .from(otpRequests)
    .where(
      and(
        eq(otpRequests.phone, phone),
        isNull(otpRequests.consumedAt),
        gte(otpRequests.expiresAt, now),
      ),
    )
    .orderBy(sql`${otpRequests.createdAt} DESC`)
    .limit(1);

  if (!req) {
    return { ok: false, code: 'OTP_EXPIRED' };
  }

  // Check lock
  if (req.attempts >= CONSTANTS.OTP_MAX_ATTEMPTS) {
    return { ok: false, code: 'OTP_LOCKED' };
  }

  const hash = sha256(code);
  if (hash !== req.codeHash) {
    // Increment attempts
    await db
      .update(otpRequests)
      .set({ attempts: req.attempts + 1 })
      .where(eq(otpRequests.id, req.id));

    if (req.attempts + 1 >= CONSTANTS.OTP_MAX_ATTEMPTS) {
      return { ok: false, code: 'OTP_LOCKED' };
    }
    return { ok: false, code: 'OTP_INVALID' };
  }

  // Mark consumed
  await db
    .update(otpRequests)
    .set({ consumedAt: now })
    .where(eq(otpRequests.id, req.id));

  return { ok: true };
}

