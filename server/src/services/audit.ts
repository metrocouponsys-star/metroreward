import type { Db } from '../db/client.ts';
import { auditLog } from '../db/schema.ts';

interface AuditEntry {
  actorType: 'customer' | 'shop' | 'admin' | 'system';
  actorId?: string;
  action: string;
  detail?: Record<string, unknown>;
}

export async function writeAudit(db: Db, entry: AuditEntry): Promise<void> {
  try {
    await db.insert(auditLog).values({
      actorType: entry.actorType,
      actorId: entry.actorId,
      action: entry.action,
      detail: entry.detail ?? {},
      createdAt: new Date(),
    });
  } catch (err) {
    // Audit log failure must never break the main flow
    console.error('[audit] failed to write:', err);
  }
}

