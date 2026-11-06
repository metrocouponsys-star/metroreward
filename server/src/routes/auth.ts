import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { getDb } from '../db/client.ts';
import { customers, shops } from '../db/schema.ts';
import { requestOtp, verifyOtp } from '../services/otp.ts';
import {
  setSessionCookie, clearSessionCookie, getSession,
} from '../plugins/session.ts';
import { uuid } from '../lib/crypto.ts';
import { normalizePhone } from '../lib/utils.ts';
import { adminPhones } from '../lib/env.ts';
import { writeAudit } from '../services/audit.ts';

const RequestOtpBody = z.object({
  phone: z.string().min(10).max(15),
});

const VerifyOtpBody = z.object({
  phone: z.string(),
  code: z.string().length(6),
  name: z.string().max(128).optional(),
});

export async function authRoutes(app: FastifyInstance) {
  const db = getDb();

  // POST /api/auth/otp/request
  app.post('/auth/otp/request', async (req, reply) => {
    const body = RequestOtpBody.safeParse(req.body);
    if (!body.success) {
      return reply.code(400).send({ error: { code: 'VALIDATION', message: 'Invalid phone number.' } });
    }

    const phone = normalizePhone(body.data.phone);
    const ip = req.ip;

    const result = await requestOtp(db, phone, ip);
    if (!result.ok) {
      const statusMap: Record<string, number> = {
        OTP_LOCKED: 429,
        OTP_RATE_LIMIT: 429,
        OTP_RESEND_TOO_SOON: 429,
      };
      return reply.code(statusMap[result.code] ?? 400).send({
        error: { code: result.code, message: result.code },
      });
    }

    return reply.send({ ok: true });
  });

  // POST /api/auth/otp/verify
  app.post('/auth/otp/verify', async (req, reply) => {
    const body = VerifyOtpBody.safeParse(req.body);
    if (!body.success) {
      return reply.code(400).send({ error: { code: 'VALIDATION', message: 'Invalid input.' } });
    }

    const phone = normalizePhone(body.data.phone);
    const ip = req.ip;

    const result = await verifyOtp(db, phone, body.data.code, ip);
    if (!result.ok) {
      const statusMap: Record<string, number> = {
        OTP_INVALID: 401,
        OTP_LOCKED: 429,
        OTP_EXPIRED: 401,
      };
      return reply.code(statusMap[result.code] ?? 401).send({
        error: { code: result.code, message: result.code },
      });
    }

    // Find or create customer
    let [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.phone, phone))
      .limit(1);

    const isNew = !customer;

    if (!customer) {
      const id = uuid();
      await db.insert(customers).values({
        id,
        phone,
        name: body.data.name ?? '',
        createdAt: new Date(),
      });
      customer = { id, phone, name: body.data.name ?? '', createdAt: new Date() };
    } else if (body.data.name && !customer.name) {
      await db.update(customers).set({ name: body.data.name }).where(eq(customers.id, customer.id));
      customer.name = body.data.name;
    }

    // Determine role
    const isAdmin = adminPhones.includes(phone);
    let role: 'customer' | 'shop' | 'admin' = 'customer';
    let shopId: string | undefined;

    if (isAdmin) {
      role = 'admin';
    } else {
      const [shop] = await db
        .select()
        .from(shops)
        .where(eq(shops.ownerPhone, phone))
        .limit(1);
      if (shop) {
        role = 'shop';
        shopId = shop.id;
      }
    }

    setSessionCookie(reply, {
      customerId: customer.id,
      shopId,
      phone,
      role,
    });

    await writeAudit(db, {
      actorType: role === 'admin' ? 'admin' : role === 'shop' ? 'shop' : 'customer',
      actorId: customer.id,
      action: 'login',
      detail: { phone, isNew },
    });

    return reply.send({
      ok: true,
      customer: { id: customer.id, phone: customer.phone, name: customer.name },
      role,
      isNew,
    });
  });

  // POST /api/auth/logout
  app.post('/auth/logout', async (_req, reply) => {
    clearSessionCookie(reply);
    return reply.send({ ok: true });
  });

  // GET /api/me
  app.get('/me', async (req, reply) => {
    const session = getSession(req);
    if (!session) {
      return reply.code(401).send({ error: { code: 'NOT_AUTHENTICATED', message: 'Sign in to continue.' } });
    }

    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.phone, session.phone))
      .limit(1);

    return reply.send({
      phone: session.phone,
      role: session.role,
      customerId: session.customerId,
      shopId: session.shopId,
      name: customer?.name ?? '',
    });
  });
}

