import { b64url, b64urlDecode, hmac, safeEqual, uuid } from '../lib/crypto.ts';
import { CONSTANTS } from '../lib/constants.ts';
import { env } from '../lib/env.ts';

export interface QrPayload {
  shopId: string;
  issuedAt: number;
  nonce: string;
}

export interface CustomerQrPayload {
  customerId: string;
  issuedAt: number;
  nonce: string;
}

/** Build a signed QR token for a shop */
export function issueQrToken(shopId: string, qrSecret: Buffer): string {
  const payload: QrPayload = {
    shopId,
    issuedAt: Date.now(),
    nonce: uuid().replace(/-/g, '').slice(0, 16),
  };
  const data = b64url(Buffer.from(JSON.stringify(payload)));
  const sig = hmac(qrSecret, data);
  return `${data}.${sig}`;
}

export type VerifyQrResult =
  | { ok: true; payload: QrPayload }
  | { ok: false; code: 'TOKEN_INVALID' | 'TOKEN_EXPIRED' };

/** Verify a QR token. Accepts current and one previous window (45 s each = 90 s total). */
export function verifyQrToken(
  token: string,
  shopId: string,
  qrSecret: Buffer,
): VerifyQrResult {
  const parts = token.split('.');
  if (parts.length !== 2) return { ok: false, code: 'TOKEN_INVALID' };

  const [data, sig] = parts as [string, string];
  const expectedSig = hmac(qrSecret, data);
  if (!safeEqual(sig, expectedSig)) return { ok: false, code: 'TOKEN_INVALID' };

  let payload: QrPayload;
  try {
    payload = JSON.parse(b64urlDecode(data).toString()) as QrPayload;
  } catch {
    return { ok: false, code: 'TOKEN_INVALID' };
  }

  if (payload.shopId !== shopId) return { ok: false, code: 'TOKEN_INVALID' };

  const age = Date.now() - payload.issuedAt;
  // Accept current (0–45 s) and previous (45–90 s) windows
  if (age < 0 || age > CONSTANTS.TOKEN_TTL_MS * CONSTANTS.TOKEN_WINDOW) {
    return { ok: false, code: 'TOKEN_EXPIRED' };
  }

  return { ok: true, payload };
}

/** Build a rotating customer personal QR token (reverse scanning mode) */
export function issueCustomerToken(customerId: string): string {
  const secretKey = Buffer.from(env.SESSION_SECRET);
  const payload: CustomerQrPayload = {
    customerId,
    issuedAt: Date.now(),
    nonce: uuid().replace(/-/g, '').slice(0, 16),
  };
  const data = b64url(Buffer.from(JSON.stringify(payload)));
  const sig = hmac(secretKey, data);
  return `${data}.${sig}`;
}

export type VerifyCustomerQrResult =
  | { ok: true; payload: CustomerQrPayload }
  | { ok: false; code: 'TOKEN_INVALID' | 'TOKEN_EXPIRED' };

/** Verify a customer personal QR token */
export function verifyCustomerToken(token: string): VerifyCustomerQrResult {
  const parts = token.split('.');
  if (parts.length !== 2) return { ok: false, code: 'TOKEN_INVALID' };

  const [data, sig] = parts as [string, string];
  const secretKey = Buffer.from(env.SESSION_SECRET);
  const expectedSig = hmac(secretKey, data);
  if (!safeEqual(sig, expectedSig)) return { ok: false, code: 'TOKEN_INVALID' };

  let payload: CustomerQrPayload;
  try {
    payload = JSON.parse(b64urlDecode(data).toString()) as CustomerQrPayload;
  } catch {
    return { ok: false, code: 'TOKEN_INVALID' };
  }

  const age = Date.now() - payload.issuedAt;
  // Accept up to 90 seconds
  if (age < 0 || age > 90_000) {
    return { ok: false, code: 'TOKEN_EXPIRED' };
  }

  return { ok: true, payload };
}
