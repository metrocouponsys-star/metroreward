import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api.ts';
import { useAuth } from '../../hooks/useAuth.tsx';
import { S } from '../../strings.ts';
import { toISTDateTime } from '../../lib/format.ts';
import styles from './Dashboard.module.css';

interface Summary {
  stampsToday: number;
  redeemedToday: number;
  scratchWinsToday: number;
}

interface FeedEvent {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  status: 'pending' | 'counted' | 'voided';
  createdAt: string;
}

export default function ShopDashboardPage() {
  const { user, logout } = useAuth();

  const { data: summary } = useQuery({
    queryKey: ['shop-summary'],
    queryFn: () => api.get<Summary>('/shop/summary'),
    refetchInterval: 10_000,
  });

  const { data: feed } = useQuery({
    queryKey: ['shop-feed'],
    queryFn: () => api.get<{ events: FeedEvent[] }>('/shop/feed'),
    refetchInterval: 10_000,
  });

  return (
    <div className="page">
      <nav className="topbar">
        <span className="topbar-title">{S.appName}</span>
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          <Link to="/shop/qr" className="btn-ghost" style={{ padding: '0.5rem 0.75rem' }}>QR</Link>
          <Link to="/shop/redeem" className="btn-ghost" style={{ padding: '0.5rem 0.75rem' }}>Redeem</Link>
          <button className="btn-ghost" onClick={logout} style={{ padding: '0.5rem 0.75rem' }}>{S.signOut}</button>
        </div>
      </nav>

      <div className="content" style={{ padding: '1.5rem 0' }}>
        {/* Summary — cashbook style: one plain text row */}
        <div className={styles.summaryRow}>
          <span>
            <strong className="tabular">{summary?.stampsToday ?? 0}</strong> stamps today
          </span>
          <span className={styles.dot} />
          <span>
            <strong className="tabular">{summary?.redeemedToday ?? 0}</strong> redeemed
          </span>
          <span className={styles.dot} />
          <span>
            <strong className="tabular">{summary?.scratchWinsToday ?? 0}</strong> prizes won
          </span>
        </div>

        {/* Nav links */}
        <div className={styles.navLinks}>
          <Link to="/shop/scan" className={styles.navLink} style={{ background: 'var(--violet-light)', borderColor: 'var(--violet)', color: 'var(--violet)', fontWeight: 600 }}>📷 Scan Customer</Link>
          <Link to="/shop/print-qr" className={styles.navLink}>🖨️ Print Sign</Link>
          <Link to="/shop/feed" className={styles.navLink}>Feed</Link>
          <Link to="/shop/customers" className={styles.navLink}>Customers</Link>
          <Link to="/shop/program" className={styles.navLink}>Program</Link>
        </div>

        <div className="divider" />

        {/* Live feed */}
        <h2 className={styles.sectionHead}>Live activity</h2>

        {!feed?.events.length && (
          <div className="empty-state"><p>{S.noActivity}</p></div>
        )}

        <div className={styles.ledger}>
          {feed?.events.slice(0, 20).map((ev) => (
            <div key={ev.id} className={styles.ledgerRow}>
              <div className={styles.ledgerTime}>{toISTDateTime(ev.createdAt)}</div>
              <div className={styles.ledgerCustomer}>
                <span className={styles.name}>{ev.customerName || 'Customer'}</span>
                <span className={styles.phone}>{ev.customerPhone}</span>
              </div>
              <div className={styles.ledgerStatus} data-status={ev.status}>
                {ev.status}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

