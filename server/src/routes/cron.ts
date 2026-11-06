import type { FastifyInstance } from 'fastify';
import { getDb } from '../db/client.ts';
import { env } from '../lib/env.ts';
import { processReminders } from '../services/reminder.ts';
import { cleanupOldContactRequests } from './contact.ts';

export async function cronRoutes(app: FastifyInstance) {
  const db = getDb();

  // POST /api/internal/cron/reminders
  app.post('/internal/cron/reminders', async (req, reply) => {
    const secret = req.headers['x-cron-secret'];
    if (secret !== env.CRON_SECRET) {
      return reply.code(401).send({ error: { code: 'FORBIDDEN', message: 'Invalid cron secret.' } });
    }

    const reminderResult = await processReminders(db);
    const cleanedContacts = await cleanupOldContactRequests();
    return reply.send({ ok: true, ...reminderResult, cleanedContacts });
  });
}
