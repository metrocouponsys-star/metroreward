import { describe, it, expect } from 'vitest';
import { randomInt } from '../lib/crypto.ts';

describe('weighted random draw', () => {
  interface Prize {
    id: string;
    title: string;
    weight: number;
    isNoPrize: boolean;
  }

  function drawPrize(prizes: Prize[]): Prize {
    const totalWeight = prizes.reduce((s, p) => s + p.weight, 0);
    let rand = randomInt(totalWeight);
    for (const p of prizes) {
      if (rand < p.weight) return p;
      rand -= p.weight;
    }
    return prizes[prizes.length - 1]!;
  }

  it('10,000 draws fall within 2 percentage points of expected weights', () => {
    const prizes: Prize[] = [
      { id: '1', title: 'Free samosa', weight: 10, isNoPrize: false },
      { id: '2', title: '10% off', weight: 20, isNoPrize: false },
      { id: '3', title: 'Free upgrade', weight: 15, isNoPrize: false },
      { id: '4', title: 'No prize', weight: 55, isNoPrize: true },
    ];

    const totalWeight = prizes.reduce((s, p) => s + p.weight, 0);
    const counts: Record<string, number> = {};
    for (const p of prizes) counts[p.id] = 0;

    const N = 10_000;
    for (let i = 0; i < N; i++) {
      const winner = drawPrize(prizes);
      counts[winner.id]!++;
    }

    for (const p of prizes) {
      const expectedPct = (p.weight / totalWeight) * 100;
      const actualPct = (counts[p.id]! / N) * 100;
      const diff = Math.abs(actualPct - expectedPct);
      expect(diff).toBeLessThan(2);
    }
  });

  it('handles single prize', () => {
    const prizes: Prize[] = [
      { id: '1', title: 'Only prize', weight: 1, isNoPrize: false },
    ];
    for (let i = 0; i < 100; i++) {
      expect(drawPrize(prizes).id).toBe('1');
    }
  });

  it('heavily skewed distribution still distributes correctly', () => {
    const prizes: Prize[] = [
      { id: 'rare', title: 'Rare', weight: 1, isNoPrize: false },
      { id: 'common', title: 'Common', weight: 99, isNoPrize: true },
    ];
    const counts = { rare: 0, common: 0 };
    const N = 10_000;
    for (let i = 0; i < N; i++) {
      const w = drawPrize(prizes);
      counts[w.id as keyof typeof counts]++;
    }
    const rarePct = (counts.rare / N) * 100;
    expect(rarePct).toBeGreaterThan(0);
    expect(rarePct).toBeLessThan(3);
  });

  it('stock never falls below zero under concurrent scans', async () => {
    // Model of atomic UPDATE scratch_prizes SET stock = stock - 1 WHERE id=? AND stock > 0
    class PrizeInventory {
      public stock = 5; // only 5 available
      private lock = Promise.resolve();

      async decrementAtomic(): Promise<boolean> {
        return new Promise((resolve) => {
          this.lock = this.lock.then(async () => {
            if (this.stock > 0) {
              this.stock -= 1;
              resolve(true); // succeeded
            } else {
              resolve(false); // stock ran out
            }
          });
        });
      }
    }

    const inventory = new PrizeInventory();

    // 50 concurrent scans trying to claim the remaining 5 prizes
    const scans = Array.from({ length: 50 }).map(() => inventory.decrementAtomic());
    const results = await Promise.all(scans);

    const won = results.filter((success) => success === true);
    const lost = results.filter((success) => success === false);

    expect(won).toHaveLength(5);
    expect(lost).toHaveLength(45);
    expect(inventory.stock).toBe(0);
    expect(inventory.stock).toBeGreaterThanOrEqual(0);
  });
});
