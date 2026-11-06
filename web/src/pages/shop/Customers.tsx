import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../lib/api.ts';
import { toISTDateTime } from '../../lib/format.ts';
import { S } from '../../strings.ts';

interface CustomerRow {
  customerId: string;
  customerName: string;
  customerPhone: string;
  lastVisit: string;
  totalStamps: number;
}

export default function ShopCustomersPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['shop-customers'],
    queryFn: () => api.get<{ customers: CustomerRow[] }>('/shop/customers'),
  });

  const customers = data?.customers || [];

  const filtered = useMemo(() => {
    if (!search.trim()) return customers;
    const q = search.toLowerCase();
    return customers.filter(
      (c) =>
        (c.customerName && c.customerName.toLowerCase().includes(q)) ||
        c.customerPhone.includes(q),
    );
  }, [customers, search]);

  return (
    <div className="page" style={{ maxWidth: 1040, margin: '0 auto', paddingBottom: '3rem' }}>
      <nav className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button className="btn-ghost" onClick={() => navigate('/shop')} style={{ padding: '0.375rem 0.5rem' }}>
            ← Back
          </button>
          <span className="topbar-title">Members Directory ({customers.length})</span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <a
            href="/api/shop/customers/export.csv"
            download
            className="btn-outline"
            style={{ padding: '0.375rem 0.75rem', fontSize: '0.8125rem', gap: '4px' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>download</span>
            Export CSV
          </a>
        </div>
      </nav>

      <div className="content" style={{ padding: '1.25rem 0' }}>
        {/* Search Bar */}
        <div style={{ marginBottom: '1.25rem' }}>
          <input
            type="search"
            className="input"
            placeholder="Search member by name or mobile number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', fontSize: '0.875rem' }}
          />
        </div>

        {isLoading && (
          <div className="loading-center">
            <div className="spinner" />
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="empty-state sheet" style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: '12px', background: 'var(--orange-light)', color: 'var(--orange)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>group</span>
            </div>
            <p style={{ fontWeight: 800, fontSize: '1.125rem', marginBottom: '0.25rem' }}>{S.noCustomers}</p>
            <p style={{ fontSize: '0.875rem', color: 'var(--ink-muted)', marginBottom: '1.25rem' }}>
              Customers who scan your counter QR or get stamped by staff automatically appear here.
            </p>
            <Link to="/shop/scan" className="btn-primary" style={{ width: 'auto', display: 'inline-block' }}>
              📷 Scan a Customer Now
            </Link>
          </div>
        )}

        {/* Member Cards Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filtered.map((c) => {
            const initials = (c.customerName || c.customerPhone || 'C').slice(0, 2).toUpperCase();
            return (
              <div
                key={c.customerId}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid var(--hairline)',
                  borderRadius: '14px',
                  padding: '1rem 1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: 'var(--shadow-sm)',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '12px',
                      background: 'var(--orange-light)',
                      color: 'var(--orange)',
                      fontWeight: 800,
                      fontSize: '15px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {initials}
                  </div>
                  <div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--ink)' }}>
                      {c.customerName || 'Loyal Member'}
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)' }}>
                      {c.customerPhone}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--orange-dark)' }} className="tabular">
                      {c.totalStamps} stamps
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--ink-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                      Last visit: {toISTDateTime(c.lastVisit)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
