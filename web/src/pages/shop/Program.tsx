import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api.ts';
import { S } from '../../strings.ts';

interface Program {
  id: string;
  stampsRequired: number;
  rewardText: string;
  cooldownMinutes: number;
  maxStampsPerDay: number;
  requireApproval: boolean;
  scratchEnabled: boolean;
  scratchEveryNVisits: number;
  prizeExpiryDays: number;
}

interface Prize {
  id?: string;
  title: string;
  weight: number;
  stock: number | null;
  isNoPrize: boolean;
  isActive: boolean;
  percentage?: number;
}

export default function ShopProgramPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const { data: progData } = useQuery({
    queryKey: ['shop-program'],
    queryFn: () => api.get<{ program: Program | null }>('/shop/program'),
  });

  const { data: prizesData } = useQuery({
    queryKey: ['shop-prizes'],
    queryFn: () => api.get<{ prizes: Prize[] }>('/shop/scratch-prizes'),
  });

  const [form, setForm] = useState<Partial<Program>>({});
  const prog = progData?.program;

  function field<K extends keyof Program>(key: K): Program[K] {
    return (form[key] ?? prog?.[key]) as Program[K];
  }

  function set<K extends keyof Program>(key: K, val: Program[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  const { mutate: saveProgram, isPending } = useMutation({
    mutationFn: () => {
      const data = {
        stampsRequired: field('stampsRequired') ?? 8,
        rewardText: field('rewardText') ?? '',
        cooldownMinutes: field('cooldownMinutes') ?? 360,
        maxStampsPerDay: field('maxStampsPerDay') ?? 2,
        requireApproval: field('requireApproval') ?? false,
        scratchEnabled: field('scratchEnabled') ?? true,
        scratchEveryNVisits: field('scratchEveryNVisits') ?? 1,
        prizeExpiryDays: field('prizeExpiryDays') ?? 30,
      };
      return api.put('/shop/program', data);
    },
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      qc.invalidateQueries({ queryKey: ['shop-program'] });
    },
    onError: () => setError('Could not save. Try again.'),
  });

  const prizes = prizesData?.prizes ?? [];
  const totalWeight = prizes.reduce((s, p) => s + (p.isActive ? p.weight : 0), 0);

  return (
    <div className="page">
      <nav className="topbar">
        <button className="btn-ghost" onClick={() => navigate(-1)}>← Back</button>
        <span className="topbar-title">{S.programSettings}</span>
        <span style={{ width: 48 }} />
      </nav>

      <div className="content" style={{ padding: '1.5rem 0', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Program fields */}
        <div className="sheet">
          <h2 style={{ marginBottom: '1.25rem' }}>Stamp program</h2>
          <form
            onSubmit={(e) => { e.preventDefault(); saveProgram(); }}
            style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
          >
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Stamps required for a reward</span>
              <input
                className="input"
                type="number" min={2} max={30}
                value={field('stampsRequired') ?? 8}
                onChange={(e) => set('stampsRequired', parseInt(e.target.value))}
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Reward description</span>
              <input
                className="input"
                type="text"
                placeholder="e.g. Free coffee"
                value={field('rewardText') ?? ''}
                onChange={(e) => set('rewardText', e.target.value)}
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Cooldown between stamps (hours)</span>
              <input
                className="input"
                type="number" min={1} max={24}
                value={Math.round((field('cooldownMinutes') ?? 360) / 60)}
                onChange={(e) => set('cooldownMinutes', parseInt(e.target.value) * 60)}
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Max stamps per day</span>
              <input
                className="input"
                type="number" min={1} max={10}
                value={field('maxStampsPerDay') ?? 2}
                onChange={(e) => set('maxStampsPerDay', parseInt(e.target.value))}
              />
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minHeight: 'var(--tap-min)' }}>
              <input
                type="checkbox"
                checked={field('requireApproval') ?? false}
                onChange={(e) => set('requireApproval', e.target.checked)}
                style={{ width: 20, height: 20, accentColor: 'var(--violet)' }}
              />
              <span style={{ fontSize: '0.9375rem' }}>Require approval for each stamp</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minHeight: 'var(--tap-min)' }}>
              <input
                type="checkbox"
                checked={field('scratchEnabled') ?? true}
                onChange={(e) => set('scratchEnabled', e.target.checked)}
                style={{ width: 20, height: 20, accentColor: 'var(--violet)' }}
              />
              <span style={{ fontSize: '0.9375rem' }}>Enable scratch cards</span>
            </label>

            {error && <div className="error-msg">{error}</div>}
            {saved && <div className="success-msg">✓ Saved</div>}

            <button className="btn-primary" type="submit" disabled={isPending}>
              {isPending ? <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : S.save}
            </button>
          </form>
        </div>

        {/* Prize table */}
        <div className="sheet">
          <h2 style={{ marginBottom: '0.5rem' }}>{S.scratchPrizes}</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--ink-muted)', marginBottom: '1rem' }}>
            Weights determine the chance of winning each prize.
          </p>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--hairline)' }}>
                  <th style={{ textAlign: 'left', padding: '0.5rem 0', fontWeight: 500 }}>Prize</th>
                  <th style={{ textAlign: 'right', padding: '0.5rem 0.5rem', fontWeight: 500 }}>Weight</th>
                  <th style={{ textAlign: 'right', padding: '0.5rem 0', fontWeight: 500 }}>Chance</th>
                </tr>
              </thead>
              <tbody>
                {prizes.map((p) => (
                  <tr key={p.id ?? p.title} style={{ borderBottom: '1px solid var(--hairline)' }}>
                    <td style={{ padding: '0.625rem 0' }}>
                      <div style={{ fontWeight: p.isNoPrize ? 400 : 500 }}>
                        {p.isNoPrize ? '— No prize' : p.title}
                      </div>
                      {p.stock != null && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>
                          {p.stock} in stock
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign: 'right', padding: '0.625rem 0.5rem', fontVariantNumeric: 'tabular-nums' }}>
                      {p.weight}
                    </td>
                    <td style={{ textAlign: 'right', padding: '0.625rem 0', fontVariantNumeric: 'tabular-nums', color: p.isActive ? 'var(--ink)' : 'var(--ink-muted)' }}>
                      {totalWeight > 0 && p.isActive ? `${((p.weight / totalWeight) * 100).toFixed(1)}%` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)', marginTop: '0.75rem' }}>
            To add or edit prizes, contact your admin.
          </p>
        </div>
      </div>
    </div>
  );
}

