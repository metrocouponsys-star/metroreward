import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api.ts';
import styles from './StampSuccess.module.css';

interface Card {
  shopName: string;
  stampsRequired: number;
  balance: number;
  rewardId?: string;
}

export default function StampSuccessPage() {
  const { state } = useLocation() as {
    state: { shopName: string; status: string; rewardId?: string; slug: string } | null;
  };
  const navigate = useNavigate();

  const { data } = useQuery({
    queryKey: ['card', state?.slug],
    queryFn: () => api.get<{ stampsRequired: number; balance: number; rewardId?: string; shop: { name: string } }>(`/cards/${state?.slug}`),
    enabled: !!state?.slug,
  });

  const stampsRequired = data?.stampsRequired ?? 8;
  const balance = data?.balance ?? 1;

  return (
    <div className={styles.root}>
      <div className={styles.card}>
        <div className={styles.shopName}>{state?.shopName}</div>

        <StampGrid total={stampsRequired} filled={balance} newlyAdded={1} />

        {state?.rewardId ? (
          <div className={styles.rewardBanner}>
            <span>🎉 You have earned a reward!</span>
            <button className="btn-primary" onClick={() => navigate('/rewards')} style={{ marginTop: '0.75rem' }}>
              Claim reward
            </button>
          </div>
        ) : (
          <p className={styles.progress}>
            {balance} of {stampsRequired} stamps
          </p>
        )}

        {state?.status === 'pending' && (
          <p className={styles.pendingNote}>This stamp needs shop approval.</p>
        )}

        <button className="btn-ghost" onClick={() => navigate('/')}>
          Back to cards
        </button>
      </div>
    </div>
  );
}

function StampGrid({ total, filled, newlyAdded }: { total: number; filled: number; newlyAdded: number }) {
  const cols = total <= 6 ? total : total <= 10 ? 5 : 4;

  return (
    <div
      className={styles.stampGrid}
      style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      aria-label={`${filled} of ${total} stamps collected`}
    >
      {Array.from({ length: total }).map((_, i) => {
        const isFilled = i < filled;
        const isNew = isFilled && i >= filled - newlyAdded;
        return (
          <div
            key={i}
            className={`${styles.stampSlot} ${isFilled ? styles.filled : ''} ${isNew ? styles.newStamp : ''}`}
            aria-hidden
          >
            {isFilled && (
              <svg viewBox="0 0 32 32" fill="none" className={styles.stampInk}>
                <circle cx="16" cy="16" r="12" fill="#4B2E9A" opacity="0.9" />
                <circle cx="16" cy="16" r="7" fill="none" stroke="#fff" strokeWidth="2" />
                <circle cx="16" cy="16" r="2.5" fill="#fff" />
              </svg>
            )}
          </div>
        );
      })}
    </div>
  );
}

