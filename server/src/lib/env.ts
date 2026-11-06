import { z } from 'zod';

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  SESSION_SECRET: z.string().min(32),
  OTP_PROVIDER_URL: z.string().url().optional(),
  OTP_PROVIDER_KEY: z.string().optional(),
  OTP_SENDER_ID: z.string().optional(),
  VAPID_PUBLIC_KEY: z.string().optional().default(''),
  VAPID_PRIVATE_KEY: z.string().optional().default(''),
  BASE_URL: z.string().url().default('http://localhost:3000'),
  ADMIN_PHONES: z.string().default(''),
  CRON_SECRET: z.string().min(16).default('dev-cron-secret'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
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
    process.exit(1);
  }
  return result.data;
}

export const env = parseEnv();

export const adminPhones = env.ADMIN_PHONES.split(',')
  .map((p) => p.trim())
  .filter(Boolean);

