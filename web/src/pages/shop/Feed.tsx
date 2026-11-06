import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api.ts';
import { toISTDateTime } from '../../lib/format.ts';
import { S } from '../../strings.ts';
import styles from './Feed.module.css';

interface FeedEvent {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  status: 'pending' | 'counted' | 'voided';
  flags: Record<string, unknown>;
  voidReason?: string;
  createdAt: string;
}

export default function ShopFeedPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['shop-feed-full'],
    queryFn: () => api.get<{ events: FeedEvent[] }>('/shop/feed'),
    refetchInterval: 10_000,
  });

  const { mutate: approve } = useMutation({
    mutationFn: (id: string) => api.post(`/shop/stamps/${id}/approve`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shop-feed-full'] }),
  });

  const { mutate: voidStamp } = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.post(`/shop/stamps/${id}/void`, { reason }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shop-feed-full'] }),
  });

  return (
    <div className="page">
      <nav className="topbar">
        <button className="btn-ghost" onClick={() => navigate(-1)}>← Back</button>
        <span className="topbar-title">{S.feedTitle}</span>
        <span style={{ width: 48 }} />
      </nav>

      <div className="content" style={{ padding: '1rem 0' }}>
        {isLoading && <div className="loading-center"><div className="spinner" /></div>}

        {!isLoading && !data?.events.length && (
          <div className="empty-state"><p>{S.noActivity}</p></div>
        )}

        <div className={styles.list}>
          {data?.events.map((ev) => (
            <div key={ev.id} className={styles.row}>
              <div className={styles.time}>{toISTDateTime(ev.createdAt)}</div>
              <div className={styles.customer}>
                <div className={styles.name}>{ev.customerName || 'Customer'}</div>
                <div className={styles.phone}>{ev.customerPhone}</div>
                {Boolean(ev.flags?.location_mismatch) && (
                  <div className={styles.flag} role="alert">Location mismatch ({String(ev.flags.distance_meters)}m)</div>
                )}
              </div>
              <div className={styles.actions}>
                <span className={styles.badge} data-status={ev.status}>{ev.status}</span>
                {ev.status === 'pending' && (
                  <button className={`btn-outline ${styles.approveBtn}`} onClick={() => approve(ev.id)}>
                    {S.approve}
                  </button>
                )}
                {ev.status === 'counted' && (
                  <button
                    className="btn-danger"
                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                    onClick={() => {
                      const reason = window.prompt('Reason for voiding?');
                      if (reason !== null) voidStamp({ id: ev.id, reason: reason || 'No reason' });
                    }}
                  >
                    {S.void}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

