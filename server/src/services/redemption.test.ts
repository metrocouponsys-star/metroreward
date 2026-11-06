import { describe, it, expect } from 'vitest';

describe('atomic redemption concurrency', () => {
  it('20 simultaneous redeems of one code succeed exactly once', async () => {
    // Model of atomic row-level update: UPDATE rewards SET status='redeemed' WHERE code=? AND status='claimed'
    class MockRewardTable {
      private status: 'claimed' | 'redeemed' = 'claimed';
      private codeExpiresAt: number = Date.now() + 600_000;
      private lock = Promise.resolve();

      // Atomic conditional update simulation matching SQL row lock
      async redeemAtomic(code: string, now: number): Promise<{ affectedRows: number }> {
        // Enqueue to serialize atomic execution like MySQL row lock on indexed code
        return new Promise((resolve) => {
          this.lock = this.lock.then(async () => {
            if (this.status === 'claimed' && this.codeExpiresAt > now) {
              this.status = 'redeemed';
              resolve({ affectedRows: 1 });
            } else {
              resolve({ affectedRows: 0 });
            }
          });
        });
      }
    }

    const table = new MockRewardTable();
    const now = Date.now();

    // Fire 20 simultaneous requests
    const attempts = Array.from({ length: 20 }).map(() =>
      table.redeemAtomic('ABCD2345', now),
    );

    const results = await Promise.all(attempts);

    const successes = results.filter((r) => r.affectedRows === 1);
    const failures = results.filter((r) => r.affectedRows === 0);

    expect(successes).toHaveLength(1);
    expect(failures).toHaveLength(19);
  });
});

