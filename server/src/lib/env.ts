import { z } from 'zod';

const schema = z.object({
  // Optional at startup — DB routes will return 503 if not set
  DATABASE_URL: z.string().min(1).optional().default(''),
  SESSION_SECRET: z.string().min(32).optional().default('dev-session-secret-change-me-in-prod-32ch'),
  OTP_PROVIDER_URL: z.string().url().optional(),
  OTP_PROVIDER_KEY: z.string().optional(),
  OTP_SENDER_ID: z.string().optional(),
  VAPID_PUBLIC_KEY: z.string().optional().default(''),
  VAPID_PRIVATE_KEY: z.string().optional().default(''),
  BASE_URL: z.string().optional().default('http://localhost:3000'),
  ADMIN_PHONES: z.string().default(''),
  CRON_SECRET: z.string().optional().default('dev-cron-secret'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  // Accept string so Hostinger's socket path (e.g. /tmp/sock) doesn't break coerce
  PORT: z.string().optional().default('3000'),
  SITE_ORIGIN: z.string().optional().default(''),
  SMTP_HOST: z.string().optional().default(''),
  SMTP_USER: z.string().optional().default(''),
  SMTP_PASS: z.string().optional().default(''),
  CONTACT_TO: z.string().optional().default(''),
});

function parseEnv() {
  const result = schema.safeParse(process.env);
  if (!result.success) {
    console.error('❌  Invalid environment variables:');
    console.error(result.error.flatten().fieldErrors);
    // Don't exit — log and continue with defaults so health check still works
  }
  return result.success ? result.data : schema.parse({}); // use all-defaults fallback
}

export const env = parseEnv();

/** True when DATABASE_URL is properly configured */
export const dbReady = env.DATABASE_URL.length > 10;

if (!dbReady) {
  console.warn('⚠️  DATABASE_URL is not set. DB-dependent routes will return 503.');
  console.warn('   Set DATABASE_URL in Hostinger → Web App → Environment Variables');
}

/** Resolve PORT: numeric for TCP, or string path for Unix socket */
export function resolvePort(): number | string {
  const p = env.PORT;
  const n = parseInt(p, 10);
  return isNaN(n) ? p : n; // socket path passthrough or numeric
}

export const adminPhones = env.ADMIN_PHONES.split(',')
  .map((p) => p.trim())
  .filter(Boolean);

