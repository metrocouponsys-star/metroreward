import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api, StampError } from '../../lib/api.ts';
import { S } from '../../strings.ts';

interface ScanResult {
  ok: boolean;
  customerName: string;
  customerPhone: string;
  stampId: string;
  status: string;
  rewardId?: string;
  scratchCardId?: string;
}

export default function ShopScanCustomerPage() {
  const [tokenInput, setTokenInput] = useState('');
  const [lastResult, setLastResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: (token: string) =>
      api.post<ScanResult>('/shop/scan-customer', { token }),
    onSuccess: (data) => {
      setLastResult(data);
      setTokenInput('');
      qc.invalidateQueries({ queryKey: ['shop-summary'] });
      qc.invalidateQueries({ queryKey: ['shop-feed'] });
      qc.invalidateQueries({ queryKey: ['shop-customers'] });
    },
    onError: (err) => {
      setError(err instanceof StampError ? err.message : S.genericError);
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLastResult(null);
    if (!tokenInput.trim()) return;
    mutate(tokenInput.trim());
  }

  return (
    <div className="page">
      <nav className="topbar">
        <button className="btn-ghost" onClick={() => navigate(-1)}>← Back</button>
        <span className="topbar-title">Staff Stamp Scanner</span>
        <span style={{ width: 48 }} />
      </nav>

      <div className="content" style={{ padding: '1.5rem 0' }}>
        <div className="sheet">
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>Scan Customer QR</h2>
          <p style={{ color: 'var(--ink-muted)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
            Customer displays "My Stamp QR" on their phone. Paste the token or scan it below to add a stamp.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Customer QR Token</span>
              <textarea
                className="input"
                rows={3}
                placeholder="Paste customer token from scanner..."
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                style={{ fontSize: '0.875rem', fontFamily: 'monospace' }}
                autoFocus
              />
            </label>

            {error && <div className="error-msg" role="alert">{error}</div>}

            <button
              className="btn-primary"
              type="submit"
              disabled={isPending || !tokenInput.trim()}
            >
              {isPending
                ? <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
                : '✓ Add Stamp to Customer'}
            </button>
          </form>

          {lastResult && (
            <div className="success-msg" style={{ marginTop: '1.25rem', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ fontWeight: 700, fontSize: '1rem' }}>
                🎉 Stamp Added for {lastResult.customerName}!
              </div>
              <div style={{ fontSize: '0.8125rem' }}>
                Phone: {lastResult.customerPhone}
              </div>
              {lastResult.rewardId && (
                <div style={{ color: 'var(--violet)', fontWeight: 600 }}>
                  🎫 Customer earned a reward on this stamp!
                </div>
              )}
              {lastResult.scratchCardId && (
                <div style={{ color: 'var(--gold)', fontWeight: 600 }}>
                  🎰 Scratch card issued to customer!
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

