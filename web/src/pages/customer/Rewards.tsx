import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { api, StampError } from '../../lib/api.ts';
import { formatCountdown, secondsUntil, toISTDateTime } from '../../lib/format.ts';
import { S } from '../../strings.ts';
import styles from './Rewards.module.css';
import { useEffect, useRef } from 'react';

interface Reward {
  id: string;
  shopId: string;
  shopName: string;
  shopSlug: string;
  source: 'stamp_card' | 'scratch';
  title: string;
  status: 'earned' | 'claimed' | 'redeemed' | 'expired';
  code?: string;
  codeExpiresAt?: string;
  expiresAt?: string;
  createdAt: string;
}

export default function RewardsPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['rewards'],
    queryFn: () => api.get<{ rewards: Reward[] }>('/rewards'),
  });

  const { mutateAsync: claimReward, isPending } = useMutation({
    mutationFn: (id: string) =>
      api.post<{ code: string; codeExpiresAt: string; title: string }>(`/rewards/${id}/claim`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rewards'] }),
  });

  const active = data?.rewards.filter((r) => r.status !== 'redeemed' && r.status !== 'expired') ?? [];
  const past = data?.rewards.filter((r) => r.status === 'redeemed' || r.status === 'expired') ?? [];

  return (
    <div className="page">
      <nav className="topbar">
        <button className="btn-ghost" onClick={() => navigate(-1)}>← Back</button>
        <span className="topbar-title">{S.yourRewards}</span>
        <span style={{ width: 48 }} />
      </nav>

      <div className="content" style={{ padding: '1.5rem 0' }}>
        {isLoading && <div className="loading-center"><div className="spinner" /></div>}

        {!isLoading && active.length === 0 && past.length === 0 && (
          <div className="empty-state">
            <p style={{ fontWeight: 600 }}>No rewards yet</p>
            <p>{S.noRewards}</p>
          </div>
        )}

        {active.length > 0 && (
          <section>
            {active.map((r) => (
              <RewardCard key={r.id} reward={r} onClaim={claimReward} loading={isPending} />
            ))}
          </section>
        )}

        {past.length > 0 && (
          <section style={{ marginTop: '2rem' }}>
            <h2 style={{ fontSize: '0.875rem', color: 'var(--ink-muted)', marginBottom: '0.75rem' }}>Past</h2>
            {past.map((r) => (
              <div key={r.id} className={styles.pastItem}>
                <div>
                  <div style={{ fontWeight: 600 }}>{r.title}</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)' }}>{r.shopName} · {toISTDateTime(r.createdAt)}</div>
                </div>
                <span className={styles.badge} data-status={r.status}>{r.status}</span>
              </div>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}

function RewardCard({
  reward, onClaim, loading,
}: { reward: Reward; onClaim: (id: string) => Promise<{ code: string; codeExpiresAt: string; title: string }>; loading: boolean }) {
  const [claimed, setClaimed] = useState(reward.status === 'claimed');
  const [code, setCode] = useState(reward.code ?? '');
  const [expiresAt, setExpiresAt] = useState(reward.codeExpiresAt ?? '');
  const [countdown, setCountdown] = useState(() => reward.codeExpiresAt ? secondsUntil(reward.codeExpiresAt) : 0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (claimed && expiresAt) {
      intervalRef.current = setInterval(() => {
        setCountdown(secondsUntil(expiresAt));
      }, 1000);
      return () => clearInterval(intervalRef.current!);
    }
  }, [claimed, expiresAt]);

  async function handleClaim() {
    setError('');
    try {
      const res = await onClaim(reward.id);
      setCode(res.code);
      setExpiresAt(res.codeExpiresAt);
      setCountdown(secondsUntil(res.codeExpiresAt));
      setClaimed(true);
    } catch (err) {
      setError(err instanceof StampError ? err.message : S.genericError);
    }
  }

  return (
    <div className={styles.rewardCard}>
      <div className={styles.rewardHeader}>
        <div>
          <div className={styles.rewardTitle}>{reward.title}</div>
          <div className={styles.rewardMeta}>{reward.shopName}</div>
        </div>
        <span
          className={styles.sourceBadge}
          data-source={reward.source}
        >
          {reward.source === 'scratch' ? '🎰 Prize' : '🎫 Stamp reward'}
        </span>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {!claimed ? (
        <button className="btn-primary" onClick={handleClaim} disabled={loading}>
          {S.claimReward}
        </button>
      ) : (
        <div className={styles.codeBlock}>
          <p className={styles.codeLabel}>{S.showCode}</p>
          <div className={styles.code} aria-live="polite">{code}</div>
          {countdown > 0 ? (
            <p className={styles.codeTimer}>
              {S.codeExpiresIn} {formatCountdown(countdown)}
            </p>
          ) : (
            <p className={styles.codeExpired}>Code expired. Claim again.</p>
          )}
        </div>
      )}

      {reward.expiresAt && (
        <p className={styles.expiryNote}>
          Reward expires {toISTDateTime(reward.expiresAt)}
        </p>
      )}
    </div>
  );
}

