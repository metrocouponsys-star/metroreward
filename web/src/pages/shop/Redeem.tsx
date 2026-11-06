import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api, StampError } from '../../lib/api.ts';
import { S } from '../../strings.ts';
import styles from './Redeem.module.css';

export default function ShopRedeemPage() {
  const [code, setCode] = useState('');
  const [success, setSuccess] = useState<{ title: string } | null>(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const { mutate, isPending } = useMutation({
    mutationFn: (code: string) =>
      api.post<{ ok: boolean; reward: { title: string } }>('/shop/redeem', { code }),
    onSuccess: (data) => {
      setSuccess({ title: data.reward?.title ?? 'Reward' });
      setCode('');
    },
    onError: (err) => {
      setError(err instanceof StampError ? err.message : S.genericError);
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess(null);
    if (code.trim().length !== 8) return;
    mutate(code.trim().toUpperCase());
  }

  return (
    <div className="page">
      <nav className="topbar">
        <button className="btn-ghost" onClick={() => navigate(-1)}>← Back</button>
        <span className="topbar-title">{S.redeemCode}</span>
        <span style={{ width: 48 }} />
      </nav>

      <div className="content" style={{ padding: '2rem 0' }}>
        <div className="sheet">
          <h2 style={{ marginBottom: '0.5rem' }}>Enter reward code</h2>
          <p style={{ color: 'var(--ink-muted)', fontSize: '0.9375rem', marginBottom: '1.5rem' }}>
            The customer shows you an 8-character code from their app.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input
              className="input input-otp"
              type="text"
              placeholder="XXXXXXXX"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8))}
              maxLength={8}
              autoFocus
              aria-label={S.enterCode}
            />

            {error && <div className="error-msg" role="alert">{error}</div>}
            {success && (
              <div className="success-msg" role="status">
                ✓ Redeemed: {success.title}
              </div>
            )}

            <button
              className="btn-primary"
              type="submit"
              disabled={isPending || code.length !== 8}
            >
              {isPending
                ? <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
                : S.redeem}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

