import { describe, it, expect } from 'vitest';
import {
  issueQrToken, verifyQrToken,
  issueCustomerToken, verifyCustomerToken,
} from '../services/token.ts';
import { b64url, hmac } from '../lib/crypto.ts';
import crypto from 'node:crypto';

const qrSecret = crypto.randomBytes(32);
const shopId = crypto.randomUUID();
const customerId = crypto.randomUUID();

describe('QR token', () => {
  it('issues and verifies a valid token', () => {
    const token = issueQrToken(shopId, qrSecret);
    const result = verifyQrToken(token, shopId, qrSecret);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.payload.shopId).toBe(shopId);
      expect(result.payload.nonce).toHaveLength(16);
    }
  });

  it('rejects a tampered token', () => {
    const token = issueQrToken(shopId, qrSecret);
    const tampered = token.slice(0, -5) + 'XXXXX';
    const result = verifyQrToken(tampered, shopId, qrSecret);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('TOKEN_INVALID');
  });

  it('rejects a token for a different shop', () => {
    const otherShopId = crypto.randomUUID();
    const token = issueQrToken(shopId, qrSecret);
    const result = verifyQrToken(token, otherShopId, qrSecret);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('TOKEN_INVALID');
  });

  it('rejects a token with a different secret', () => {
    const otherSecret = crypto.randomBytes(32);
    const token = issueQrToken(shopId, qrSecret);
    const result = verifyQrToken(token, shopId, otherSecret);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('TOKEN_INVALID');
  });

  it('rejects an expired token (>90s old)', () => {
    const payload = {
      shopId,
      issuedAt: Date.now() - 100_000,
      nonce: 'testnoooooonce01',
    };
    const data = b64url(Buffer.from(JSON.stringify(payload)));
    const sig = hmac(qrSecret, data);
    const token = `${data}.${sig}`;
    const result = verifyQrToken(token, shopId, qrSecret);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('TOKEN_EXPIRED');
  });

  it('accepts a token within the previous window (45-90s old)', () => {
    const payload = {
      shopId,
      issuedAt: Date.now() - 60_000,
      nonce: 'testnoooooonce02',
    };
    const data = b64url(Buffer.from(JSON.stringify(payload)));
    const sig = hmac(qrSecret, data);
    const token = `${data}.${sig}`;
    const result = verifyQrToken(token, shopId, qrSecret);
    expect(result.ok).toBe(true);
  });

  it('rejects garbage input', () => {
    expect(verifyQrToken('garbage', shopId, qrSecret).ok).toBe(false);
    expect(verifyQrToken('', shopId, qrSecret).ok).toBe(false);
    expect(verifyQrToken('a.b.c', shopId, qrSecret).ok).toBe(false);
  });
});

describe('Customer personal QR token (reverse mode)', () => {
  it('issues and verifies a valid customer token', () => {
    const token = issueCustomerToken(customerId);
    const res = verifyCustomerToken(token);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.payload.customerId).toBe(customerId);
      expect(res.payload.nonce).toHaveLength(16);
    }
  });

  it('rejects tampered customer token', () => {
    const token = issueCustomerToken(customerId);
    const tampered = token.slice(0, -6) + 'AAAAAA';
    const res = verifyCustomerToken(tampered);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.code).toBe('TOKEN_INVALID');
  });

  it('rejects expired customer token (>90s)', () => {
    const secretKey = Buffer.from(process.env.SESSION_SECRET || 'test-secret-that-is-at-least-32-characters-long-enough');
    const payload = {
      customerId,
      issuedAt: Date.now() - 100_000,
      nonce: 'cust_nonce_12345',
    };
    const data = b64url(Buffer.from(JSON.stringify(payload)));
    const sig = hmac(secretKey, data);
    const token = `${data}.${sig}`;
    const res = verifyCustomerToken(token);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.code).toBe('TOKEN_EXPIRED');
  });
});
