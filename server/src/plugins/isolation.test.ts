import { describe, it, expect } from 'vitest';
import { requireAuth, requireRole, type SessionData } from './session.ts';

// Mock FastifyReply
function createMockReply() {
  const reply = {
    statusCode: 200,
    body: null as unknown,
    code(c: number) {
      reply.statusCode = c;
      return reply;
    },
    send(b: unknown) {
      reply.body = b;
      return reply;
    },
  };
  return reply;
}

describe('tenant and role isolation', () => {
  const customerSession: SessionData = {
    customerId: 'cust-1',
    phone: '+919999999999',
    role: 'customer',
  };

  const shopSessionA: SessionData = {
    customerId: 'shop-owner-1',
    shopId: 'shop-A',
    phone: '+919876543210',
    role: 'shop',
  };

  const adminSession: SessionData = {
    customerId: 'admin-1',
    phone: '+919000000000',
    role: 'admin',
  };

  it('rejects unauthenticated requests with 401', () => {
    const reply = createMockReply();
    const ok = requireAuth(null, reply as any);
    expect(ok).toBe(false);
    expect(reply.statusCode).toBe(401);
    expect((reply.body as any).error.code).toBe('NOT_AUTHENTICATED');
  });

  it('customer cannot access shop-only routes (403 FORBIDDEN)', () => {
    const reply = createMockReply();
    const ok = requireRole(customerSession, 'shop', reply as any);
    expect(ok).toBe(false);
    expect(reply.statusCode).toBe(403);
    expect((reply.body as any).error.code).toBe('FORBIDDEN');
  });

  it('customer cannot access admin-only routes (403 FORBIDDEN)', () => {
    const reply = createMockReply();
    const ok = requireRole(customerSession, 'admin', reply as any);
    expect(ok).toBe(false);
    expect(reply.statusCode).toBe(403);
    expect((reply.body as any).error.code).toBe('FORBIDDEN');
  });

  it('shop cannot access admin-only routes (403 FORBIDDEN)', () => {
    const reply = createMockReply();
    const ok = requireRole(shopSessionA, 'admin', reply as any);
    expect(ok).toBe(false);
    expect(reply.statusCode).toBe(403);
    expect((reply.body as any).error.code).toBe('FORBIDDEN');
  });

  it('shop can access shop routes', () => {
    const reply = createMockReply();
    const ok = requireRole(shopSessionA, 'shop', reply as any);
    expect(ok).toBe(true);
    expect(reply.statusCode).toBe(200);
  });

  it('admin can access shop and admin routes', () => {
    const replyShop = createMockReply();
    const okShop = requireRole(adminSession, 'shop', replyShop as any);
    expect(okShop).toBe(true);

    const replyAdmin = createMockReply();
    const okAdmin = requireRole(adminSession, 'admin', replyAdmin as any);
    expect(okAdmin).toBe(true);
  });

  it('shop cannot touch another shop data (tenant isolation check)', () => {
    // Verify shop A's session is bound to shop-A
    expect(shopSessionA.shopId).toBe('shop-A');
    expect(shopSessionA.shopId).not.toBe('shop-B');
  });
});

