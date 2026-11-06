import { and, eq, isNull, sql } from 'drizzle-orm';
import type { Db } from '../db/client.ts';
import { scratchPrizes } from '../db/schema.ts';
import { randomInt } from '../lib/crypto.ts';

export type SelectedPrize = {
  id: string;
  title: string;
  isNoPrize: boolean;
};

/** Weighted random prize selection with stock management */
export async function selectPrize(db: Db, shopId: string): Promise<SelectedPrize | null> {
  const prizes = await db
    .select()
    .from(scratchPrizes)
    .where(and(eq(scratchPrizes.shopId, shopId), eq(scratchPrizes.isActive, true)));

  if (prizes.length === 0) return null;

  // Filter out out-of-stock (stock = 0, null means unlimited)
  const available = prizes.filter((p) => p.stock == null || p.stock > 0);
  if (available.length === 0) return null;

  const totalWeight = available.reduce((sum, p) => sum + p.weight, 0);

  for (let attempt = 0; attempt < 10; attempt++) {
    let rand = randomInt(totalWeight);
    let chosen = available[0]!;

    for (const p of available) {
      if (rand < p.weight) {
        chosen = p;
        break;
      }
      rand -= p.weight;
    }

    // If the prize has stock, decrement atomically
    if (chosen.stock != null) {
      const result = await db
        .update(scratchPrizes)
        .set({ stock: sql`${scratchPrizes.stock} - 1` })
        .where(
          and(
            eq(scratchPrizes.id, chosen.id),
            sql`${scratchPrizes.stock} > 0`,
          ),
        );

      const affected = (result[0] as unknown as { affectedRows?: number })?.affectedRows ?? 0;
      if (affected === 0) {
        // Stock ran out between select and update — redraw without this prize
        const idx = available.findIndex((p) => p.id === chosen.id);
        if (idx !== -1) available.splice(idx, 1);
        if (available.length === 0) return null;
        continue;
      }
    }

    return { id: chosen.id, title: chosen.title, isNoPrize: chosen.isNoPrize };
  }

  return null;
}

