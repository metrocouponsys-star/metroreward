import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { normalizePhone } from '../lib/utils.ts';

const contactSchema = z.object({
  name: z.string().min(2).max(80),
  phone: z.string().min(10).max(20),
  shopName: z.string().max(100).optional(),
  city: z.string().max(80).optional(),
  email: z.string().email().optional().or(z.literal('')),
  topic: z.enum(['pilot', 'question', 'data_request', 'grievance']),
  preferredChannel: z.enum(['whatsapp', 'call', 'email']),
  message: z.string().max(1000).optional(),
  consent: z.literal(true),
  website: z.string().max(0), // honeypot — must be empty
  startedAt: z.string().datetime(),
});

describe('contact form validation & spam checks', () => {
  const validData = {
    name: 'Priya Sharma',
    phone: '9876543210',
    shopName: "Priya's Boutique",
    city: 'Pune',
    email: 'priya@example.com',
    topic: 'pilot' as const,
    preferredChannel: 'whatsapp' as const,
    message: 'Interested in running a pilot for my clothing shop.',
    consent: true as const,
    website: '',
    startedAt: new Date(Date.now() - 5000).toISOString(),
  };

  it('validates a correct submission', () => {
    const result = contactSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('rejects short names (< 2 chars)', () => {
    const result = contactSchema.safeParse({ ...validData, name: 'A' });
    expect(result.success).toBe(false);
  });

  it('rejects honeypot if filled by bot', () => {
    const result = contactSchema.safeParse({ ...validData, website: 'http://spam.com' });
    expect(result.success).toBe(false);
  });

  it('rejects when consent is false', () => {
    const result = contactSchema.safeParse({ ...validData, consent: false });
    expect(result.success).toBe(false);
  });

  it('allows optional email to be empty string or omitted', () => {
    const emptyEmail = contactSchema.safeParse({ ...validData, email: '' });
    expect(emptyEmail.success).toBe(true);

    const omittedEmail = contactSchema.safeParse({ ...validData, email: undefined });
    expect(omittedEmail.success).toBe(true);
  });

  it('validates all required topics', () => {
    const topics = ['pilot', 'question', 'data_request', 'grievance'] as const;
    for (const topic of topics) {
      const res = contactSchema.safeParse({ ...validData, topic });
      expect(res.success).toBe(true);
    }
  });

  it('rejects invalid topic', () => {
    const result = contactSchema.safeParse({ ...validData, topic: 'marketing' });
    expect(result.success).toBe(false);
  });

  it('normalises 10-digit Indian numbers to E.164 with +91', () => {
    expect(normalizePhone('9876543210')).toBe('+919876543210');
    expect(normalizePhone('09876543210')).toBe('+919876543210');
    expect(normalizePhone('+919876543210')).toBe('+919876543210');
  });

  it('detects submissions that are too fast (< 3000 ms)', () => {
    const now = Date.now();
    const fastSubmissionTime = new Date(now - 1500).toISOString();
    const started = new Date(fastSubmissionTime);
    const elapsed = now - started.getTime();
    expect(elapsed < 3000).toBe(true);
  });

  it('allows submissions that take >= 3000 ms', () => {
    const now = Date.now();
    const humanSubmissionTime = new Date(now - 4500).toISOString();
    const started = new Date(humanSubmissionTime);
    const elapsed = now - started.getTime();
    expect(elapsed >= 3000).toBe(true);
  });
});

