import { describe, it, expect, beforeAll } from 'vitest';

// Set env vars BEFORE importing modules that call parseEnv
import { vi } from 'vitest';
vi.stubEnv('DATABASE_URL', 'mysql://test:test@localhost:3306/test');
vi.stubEnv('SESSION_SECRET', 'test-secret-that-is-at-least-32-characters-long-enough');
vi.stubEnv('BASE_URL', 'http://localhost:3000');
vi.stubEnv('CRON_SECRET', 'test-cron-secret-1234567890');
vi.stubEnv('NODE_ENV', 'test');

const { encodeSession, decodeSession } = await import('../plugins/session.ts');

describe('session encoding', () => {
  it('encodes and decodes a customer session', () => {
    const data = {
      customerId: 'cust-123',
      phone: '+919876543210',
      role: 'customer' as const,
    };
    const cookie = encodeSession(data);
    const decoded = decodeSession(cookie);
    expect(decoded).toEqual(data);
  });

  it('encodes and decodes a shop session', () => {
    const data = {
      customerId: 'cust-456',
      shopId: 'shop-789',
      phone: '+919876543210',
      role: 'shop' as const,
    };
    const cookie = encodeSession(data);
    const decoded = decodeSession(cookie);
    expect(decoded).toEqual(data);
  });

  it('rejects a tampered cookie', () => {
    const data = { phone: '+919876543210', role: 'customer' as const };
    const cookie = encodeSession(data);
    const tampered = cookie.slice(0, -3) + 'XYZ';
    expect(decodeSession(tampered)).toBeNull();
  });

  it('rejects garbage', () => {
    expect(decodeSession('garbage')).toBeNull();
    expect(decodeSession('')).toBeNull();
  });
});
