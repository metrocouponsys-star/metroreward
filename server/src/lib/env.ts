import { z } from 'zod';

const schema = z.object({
  DATABASE_URL: z.string().optional().default(''),
  SESSION_SECRET: z.string().optional().default('dev-session-secret-change-me-in-prod-32ch'),
  OTP_PROVIDER_URL: z.string().optional(),
  OTP_PROVIDER_KEY: z.string().optional(),
  OTP_SENDER_ID: z.string().optional().default('STAMPD'),
  VAPID_PUBLIC_KEY: z.string().optional().default(''),
  VAPID_PRIVATE_KEY: z.string().optional().default(''),
  BASE_URL: z.string().optional().default('http://localhost:3000'),
  ADMIN_PHONES: z.string().optional().default(''),
  CRON_SECRET: z.string().optional().default('dev-cron-secret'),
  NODE_ENV: z.string().optional().default('production'),
  PORT: z.string().optional().default('3000'),
  SITE_ORIGIN: z.string().optional().default(''),
  SMTP_HOST: z.string().optional().default(''),
  SMTP_USER: z.string().optional().default(''),
  SMTP_PASS: z.string().optional().default(''),
  CONTACT_TO: z.string().optional().default(''),
});

function parseEnv() {
  try {
    const result = schema.safeParse(process.env);
    if (result.success) {
      return result.data;
    }
    console.warn('⚠️ Environment warning:', result.error?.flatten().fieldErrors);
  } catch {
    console.warn('⚠️ Environment parse error, falling back to process.env defaults');
  }

  return {
    DATABASE_URL: process.env.DATABASE_URL || '',
    SESSION_SECRET: process.env.SESSION_SECRET || 'dev-session-secret-change-me-in-prod-32ch',
    OTP_PROVIDER_URL: process.env.OTP_PROVIDER_URL || undefined,
    OTP_PROVIDER_KEY: process.env.OTP_PROVIDER_KEY || undefined,
    OTP_SENDER_ID: process.env.OTP_SENDER_ID || 'STAMPD',
    VAPID_PUBLIC_KEY: process.env.VAPID_PUBLIC_KEY || '',
    VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY || '',
    BASE_URL: process.env.BASE_URL || 'http://localhost:3000',
    ADMIN_PHONES: process.env.ADMIN_PHONES || '',
    CRON_SECRET: process.env.CRON_SECRET || 'dev-cron-secret',
    NODE_ENV: process.env.NODE_ENV || 'production',
    PORT: process.env.PORT || '3000',
    SITE_ORIGIN: process.env.SITE_ORIGIN || '',
    SMTP_HOST: process.env.SMTP_HOST || '',
    SMTP_USER: process.env.SMTP_USER || '',
    SMTP_PASS: process.env.SMTP_PASS || '',
    CONTACT_TO: process.env.CONTACT_TO || '',
  };
}

export const env = parseEnv();

/** True when DATABASE_URL is properly configured */
export const dbReady = (process.env.DATABASE_URL || env.DATABASE_URL || '').length > 10;

if (!dbReady) {
  console.warn('⚠️  DATABASE_URL is not set. DB-dependent routes will return 503.');
  console.warn('   Set DATABASE_URL in Hostinger → Web App → Environment Variables');
}

/** Resolve PORT: numeric for TCP, or string path for Unix socket */
export function resolvePort(): number | string {
  const p = process.env.PORT || env.PORT || '3000';
  const n = parseInt(p, 10);
  return isNaN(n) ? p : n; // socket path passthrough or numeric
}

export const adminPhones = (env.ADMIN_PHONES || '')
  .split(',')
  .map((p) => p.trim())
  .filter(Boolean);


