import { describe, it, expect } from 'vitest';
import {
  uuid, sha256, hmac, safeEqual, generateOtp, generateRewardCode,
  b64url, b64urlDecode, randomInt, randomHex,
} from '../lib/crypto.ts';

describe('crypto utilities', () => {
  it('uuid returns a valid v4 UUID', () => {
    const id = uuid();
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  it('sha256 returns 64 hex chars', () => {
    const hash = sha256('hello');
    expect(hash).toHaveLength(64);
    expect(hash).toBe('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
  });

  it('hmac returns a hex digest', () => {
    const key = Buffer.from('my-secret-key');
    const result = hmac(key, 'data');
    expect(result).toHaveLength(64);
  });

  it('safeEqual returns true for matching strings', () => {
    expect(safeEqual('abc', 'abc')).toBe(true);
    expect(safeEqual('abc', 'def')).toBe(false);
    expect(safeEqual('abc', 'abcd')).toBe(false);
  });

  it('generateOtp returns a 6-digit string', () => {
    for (let i = 0; i < 100; i++) {
      const otp = generateOtp();
      expect(otp).toMatch(/^\d{6}$/);
    }
  });

  it('generateRewardCode returns 8 chars without confusable letters', () => {
    for (let i = 0; i < 100; i++) {
      const code = generateRewardCode();
      expect(code).toHaveLength(8);
      expect(code).not.toMatch(/[01OI]/);
    }
  });

  it('b64url round-trips', () => {
    const buf = Buffer.from('hello world');
    const encoded = b64url(buf);
    expect(encoded).not.toContain('+');
    expect(encoded).not.toContain('/');
    expect(b64urlDecode(encoded).toString()).toBe('hello world');
  });

  it('randomInt stays in range', () => {
    for (let i = 0; i < 500; i++) {
      const n = randomInt(10);
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThan(10);
    }
  });

  it('randomHex returns correct length', () => {
    expect(randomHex(16)).toHaveLength(32);
    expect(randomHex(32)).toHaveLength(64);
  });
});

