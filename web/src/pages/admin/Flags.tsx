import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api.ts';
import { toISTDateTime } from '../../lib/format.ts';
import { S } from '../../strings.ts';

interface FlaggedEvent {
  id: string;
  shopId: string;
  customerId: string;
  status: string;
  flags: Record<string, unknown>;
  createdAt: string;
}

export default function AdminFlagsPage() {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-flags'],
    queryFn: () => api.get<{ flags: FlaggedEvent[] }>('/admin/flags'),
  });

  return (
    <div className="page">
      <nav className="topbar">
        <button className="btn-ghost" onClick={() => navigate(-1)}>← Back</button>
        <span className="topbar-title">{S.flaggedActivity}</span>
        <span style={{ width: 48 }} />
      </nav>

      <div className="content" style={{ padding: '1.5rem 0' }}>
        {isLoading && <div className="loading-center"><div className="spinner" /></div>}

        {!isLoading && !data?.flags.length && (
          <div className="empty-state"><p>No flagged activity.</p></div>
        )}

        <div style={{ borderTop: '1px solid var(--hairline)' }}>
          {data?.flags.map((ev) => (
            <div key={ev.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
              padding: '0.875rem 0', borderBottom: '1px solid var(--hairline)', gap: '1rem',
            }}>
              <div>
                <div style={{ fontWeight: 500, fontSize: '0.9375rem' }}>Stamp {ev.id.slice(0, 8)}</div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)', marginTop: '0.125rem' }}>
                  Shop {ev.shopId.slice(0, 8)} · {toISTDateTime(ev.createdAt)}
                </div>
                {Boolean(ev.flags?.location_mismatch) && (
                  <div style={{ fontSize: '0.8125rem', color: 'var(--alert)', marginTop: '0.25rem' }}>
                    Location mismatch — {String(ev.flags.distance_meters ?? '?')}m from shop
                  </div>
                )}
              </div>
              <span style={{
                fontSize: '0.75rem', padding: '0.2rem 0.5rem',
                borderRadius: '100px', background: 'var(--alert-light)', color: 'var(--alert)',
                fontWeight: 500, flexShrink: 0,
              }}>
                flagged
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
