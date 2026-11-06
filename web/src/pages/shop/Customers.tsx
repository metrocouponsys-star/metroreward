import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api.ts';
import { toISTDateTime } from '../../lib/format.ts';
import { S } from '../../strings.ts';
import styles from './Customers.module.css';

interface CustomerRow {
  customerId: string;
  customerName: string;
  customerPhone: string;
  lastVisit: string;
  totalStamps: number;
}

export default function ShopCustomersPage() {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['shop-customers'],
    queryFn: () => api.get<{ customers: CustomerRow[] }>('/shop/customers'),
  });

  return (
    <div className="page">
      <nav className="topbar">
        <button className="btn-ghost" onClick={() => navigate(-1)}>← Back</button>
        <span className="topbar-title">{S.customersTitle}</span>
        <a
          href="/api/shop/customers/export.csv"
          download
          className="btn-outline"
          style={{ minHeight: '34px', padding: '0.25rem 0.75rem', fontSize: '0.8125rem' }}
        >
          ⬇ Export CSV
        </a>
      </nav>

      <div className="content" style={{ padding: '1.5rem 0' }}>
        {isLoading && <div className="loading-center"><div className="spinner" /></div>}

        {!isLoading && !data?.customers.length && (
          <div className="empty-state"><p>{S.noCustomers}</p></div>
        )}

        <div className={styles.list}>
          {data?.customers.map((c) => (
            <div key={c.customerId} className={styles.row}>
              <div className={styles.info}>
                <div className={styles.name}>{c.customerName || 'Customer'}</div>
                <div className={styles.phone}>{c.customerPhone}</div>
              </div>
              <div className={styles.meta}>
                <div className="tabular">{c.totalStamps} stamps</div>
                <div className={styles.lastVisit}>{toISTDateTime(c.lastVisit)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

