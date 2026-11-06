import type { FastifyRequest, FastifyReply } from 'fastify';
import { createHmac } from 'node:crypto';
import { env, adminPhones } from '../lib/env.ts';
import { CONSTANTS } from '../lib/constants.ts';

export interface SessionData {
  customerId?: string;
  shopId?: string;
  phone: string;
  role: 'customer' | 'shop' | 'admin';
}

const COOKIE_NAME = 'stamp_session';

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

export function encodeSession(data: SessionData): string {
  const payload = Buffer.from(JSON.stringify(data)).toString('base64url');
  const sig = sign(payload, env.SESSION_SECRET);
  return `${payload}.${sig}`;
}

export function decodeSession(cookie: string): SessionData | null {
  const dot = cookie.lastIndexOf('.');
  if (dot === -1) return null;
  const payload = cookie.slice(0, dot);
  const sig = cookie.slice(dot + 1);
  const expected = sign(payload, env.SESSION_SECRET);
  if (sig !== expected) return null;
  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString()) as SessionData;
  } catch {
    return null;
  }
}

export function setSessionCookie(reply: FastifyReply, data: SessionData): void {
  const value = encodeSession(data);
  reply.setCookie(COOKIE_NAME, value, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: CONSTANTS.SESSION_TTL_DAYS * 86400,
  });
}

export function clearSessionCookie(reply: FastifyReply): void {
  reply.clearCookie(COOKIE_NAME, { path: '/' });
}

export function getSession(request: FastifyRequest): SessionData | null {
  const cookie = request.cookies[COOKIE_NAME];
  if (!cookie) return null;
  return decodeSession(cookie);
}

export function requireAuth(session: SessionData | null, reply: FastifyReply): session is SessionData {
  if (!session) {
    reply.code(401).send({ error: { code: 'NOT_AUTHENTICATED', message: 'Sign in to continue.' } });
    return false;
  }
  return true;
}

export function requireRole(
  session: SessionData | null,
  role: 'customer' | 'shop' | 'admin',
  reply: FastifyReply,
): session is SessionData {
  if (!session) {
    reply.code(401).send({ error: { code: 'NOT_AUTHENTICATED', message: 'Sign in to continue.' } });
    return false;
  }
  if (session.role !== role && !(role === 'shop' && session.role === 'admin')) {
    reply.code(403).send({ error: { code: 'FORBIDDEN', message: 'You do not have permission to do that.' } });
    return false;
  }
  return true;
}

