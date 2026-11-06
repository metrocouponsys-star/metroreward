import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api.ts';
import { useAuth } from '../../hooks/useAuth.tsx';
import { S } from '../../strings.ts';

interface AdminStats {
  totalShops: number;
  activeShops: number;
  totalCustomers: number;
  stampsToday: number;
  redeemedToday: number;
}

interface ShopItem {
  id: string;
  slug: string;
  name: string;
  ownerPhone: string;
  isActive: boolean;
  createdAt: string;
  memberCount: number;
  totalStamps: number;
  program: {
    stampsRequired: number;
    rewardText: string;
    scratchEnabled: boolean;
  } | null;
}

type TabType = 'all' | 'active' | 'suspended';

export default function AdminShopsPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [search, setSearch] = useState('');

  // 1. Platform-wide Stats
  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ['admin-stats'],
    queryFn: () => api.get<AdminStats>('/admin/stats'),
    refetchInterval: 15_000,
  });

  // 2. All Merchants with metrics
  const { data: shopsData, isLoading: shopsLoading } = useQuery<{ shops: ShopItem[] }>({
    queryKey: ['admin-shops'],
    queryFn: () => api.get<{ shops: ShopItem[] }>('/admin/shops'),
    refetchInterval: 15_000,
  });

  // 3. Deactivate Mutation
  const { mutate: deactivate } = useMutation({
    mutationFn: (id: string) => api.post(`/admin/shops/${id}/deactivate`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-shops'] });
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });

  // 4. Activate Mutation
  const { mutate: activate } = useMutation({
    mutationFn: (id: string) => api.post(`/admin/shops/${id}/activate`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-shops'] });
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });

  // 5. Impersonate / Open Merchant Dashboard
  const { mutate: openDashboard, isPending: openingDashboard } = useMutation({
    mutationFn: (shopId: string) => api.post(`/admin/impersonate/${shopId}`),
    onSuccess: () => {
      qc.invalidateQueries();
      navigate('/shop');
    },
  });

  const shops = shopsData?.shops || [];

  // Filtered merchants
  const filteredShops = useMemo(() => {
    return shops.filter((s) => {
      if (activeTab === 'active' && !s.isActive) return false;
      if (activeTab === 'suspended' && s.isActive) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = s.name.toLowerCase().includes(q);
        const matchSlug = s.slug.toLowerCase().includes(q);
        const matchPhone = s.ownerPhone.includes(q);
        if (!matchName && !matchSlug && !matchPhone) return false;
      }
      return true;
    });
  }, [shops, activeTab, search]);

  const activeCount = shops.filter((s) => s.isActive).length;
  const suspendedCount = shops.filter((s) => !s.isActive).length;

  return (
    <div className="page" style={{ maxWidth: 960, margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Top Bar */}
      <nav className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <span className="topbar-title">Super Admin Portal</span>
          <span
            style={{
              background: 'var(--ink)',
              color: 'var(--paper)',
              fontSize: '0.6875rem',
              fontWeight: 700,
              padding: '0.125rem 0.5rem',
              borderRadius: '999px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            Universal Access
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Link
            to="/admin/create-shop"
            className="btn-primary"
            style={{ width: 'auto', padding: '0.45rem 0.875rem', fontSize: '0.8125rem' }}
          >
            + Onboard Shop
          </Link>
          <button className="btn-ghost" onClick={logout} style={{ padding: '0.45rem 0.75rem', fontSize: '0.8125rem' }}>
            {S.signOut}
          </button>
        </div>
      </nav>

      <div className="content" style={{ padding: '1.25rem 0' }}>
        {/* Screen 3.1 — Platform KPI Stat Cards */}
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '0.875rem',
            marginBottom: '1.5rem',
          }}
        >
          {/* Total Merchants */}
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--hairline)',
              borderRadius: '12px',
              padding: '1rem',
            }}
          >
            <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Total Merchants
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.25rem' }} className="tabular">
              {statsLoading ? '—' : stats?.totalShops ?? 0}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', marginTop: '0.25rem' }}>
              <span style={{ color: 'var(--success, #16a34a)', fontWeight: 600 }}>{stats?.activeShops ?? 0} active</span>
              {stats && stats.totalShops - stats.activeShops > 0 && (
                <span> · {stats.totalShops - stats.activeShops} suspended</span>
              )}
            </div>
          </div>

          {/* Platform Customers */}
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--hairline)',
              borderRadius: '12px',
              padding: '1rem',
            }}
          >
            <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Platform Members
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.25rem' }} className="tabular">
              {statsLoading ? '—' : stats?.totalCustomers ?? 0}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', marginTop: '0.25rem' }}>
              Across all merchants
            </div>
          </div>

          {/* Stamps Today */}
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--hairline)',
              borderRadius: '12px',
              padding: '1rem',
            }}
          >
            <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Stamps Today
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.25rem' }} className="tabular">
              {statsLoading ? '—' : stats?.stampsToday ?? 0}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', marginTop: '0.25rem' }}>
              Issued by all counters
            </div>
          </div>

          {/* Redemptions Today */}
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--hairline)',
              borderRadius: '12px',
              padding: '1rem',
            }}
          >
            <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Rewards Redeemed
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.25rem' }} className="tabular">
              {statsLoading ? '—' : stats?.redeemedToday ?? 0}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', marginTop: '0.25rem' }}>
              Redeemed today
            </div>
          </div>
        </section>

        {/* Quick Nav Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>
            Merchants ({shops.length})
          </h2>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link to="/admin/flags" className="btn-outline" style={{ width: 'auto', padding: '0.375rem 0.75rem', fontSize: '0.8125rem' }}>
              🚩 Flagged Activity
            </Link>
          </div>
        </div>

        {/* Search & Tabs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <input
            type="search"
            className="input"
            placeholder="Search by merchant name, slug (/s/...), or phone number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', fontSize: '0.875rem' }}
          />

          <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--hairline)', paddingBottom: '0.5rem' }}>
            <button
              onClick={() => setActiveTab('all')}
              style={{
                background: activeTab === 'all' ? 'var(--ink)' : 'transparent',
                color: activeTab === 'all' ? 'var(--paper)' : 'var(--ink-muted)',
                border: 'none',
                borderRadius: '6px',
                padding: '0.25rem 0.625rem',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              All ({shops.length})
            </button>
            <button
              onClick={() => setActiveTab('active')}
              style={{
                background: activeTab === 'active' ? 'var(--ink)' : 'transparent',
                color: activeTab === 'active' ? 'var(--paper)' : 'var(--ink-muted)',
                border: 'none',
                borderRadius: '6px',
                padding: '0.25rem 0.625rem',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Active ({activeCount})
            </button>
            <button
              onClick={() => setActiveTab('suspended')}
              style={{
                background: activeTab === 'suspended' ? 'var(--ink)' : 'transparent',
                color: activeTab === 'suspended' ? 'var(--paper)' : 'var(--ink-muted)',
                border: 'none',
                borderRadius: '6px',
                padding: '0.25rem 0.625rem',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Suspended ({suspendedCount})
            </button>
          </div>
        </div>

        {/* Loading Spinner */}
        {shopsLoading && (
          <div className="loading-center">
            <div className="spinner" />
          </div>
        )}

        {/* Empty State */}
        {!shopsLoading && filteredShops.length === 0 && (
          <div className="empty-state" style={{ padding: '2.5rem 1rem', textAlign: 'center' }}>
            <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>No merchants found.</p>
            <p style={{ fontSize: '0.875rem', color: 'var(--ink-muted)', marginBottom: '1rem' }}>
              {search ? 'Try clearing your search query.' : 'Onboard your first merchant account now.'}
            </p>
            <Link to="/admin/create-shop" className="btn-primary" style={{ width: 'auto', display: 'inline-block' }}>
              + Onboard Merchant
            </Link>
          </div>
        )}

        {/* Merchants Cards List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {filteredShops.map((s) => (
            <div
              key={s.id}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--hairline)',
                borderRadius: '12px',
                padding: '1rem 1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                opacity: s.isActive ? 1 : 0.7,
              }}
            >
              {/* Row 1: Name, status, link */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '1.0625rem', fontWeight: 700 }}>{s.name}</span>
                    <span
                      style={{
                        background: s.isActive ? '#DCFCE7' : '#FEE2E2',
                        color: s.isActive ? '#15803D' : '#B91C1C',
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                        padding: '0.125rem 0.5rem',
                        borderRadius: '999px',
                        textTransform: 'uppercase',
                      }}
                    >
                      {s.isActive ? 'Active' : 'Suspended'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)', marginTop: '0.125rem' }}>
                    <span>Phone: {s.ownerPhone}</span>
                    <span style={{ margin: '0 0.375rem' }}>•</span>
                    <a
                      href={`/s/${s.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: 'var(--ink)', textDecoration: 'underline' }}
                    >
                      /s/{s.slug} ↗
                    </a>
                  </div>
                </div>

                {/* Metric Pills */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      background: 'var(--paper)',
                      border: '1px solid var(--hairline)',
                      borderRadius: '6px',
                      padding: '0.25rem 0.5rem',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                    }}
                  >
                    👤 {s.memberCount} members
                  </span>
                  <span
                    style={{
                      background: 'var(--paper)',
                      border: '1px solid var(--hairline)',
                      borderRadius: '6px',
                      padding: '0.25rem 0.5rem',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                    }}
                  >
                    🎟️ {s.totalStamps} stamps
                  </span>
                </div>
              </div>

              {/* Row 2: Program rules */}
              {s.program && (
                <div
                  style={{
                    background: 'var(--paper)',
                    borderRadius: '8px',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.8125rem',
                    color: 'var(--ink)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <span style={{ fontWeight: 600, color: 'var(--ink-muted)' }}>Loyalty Program:</span>
                  <span>
                    <strong>{s.program.stampsRequired} stamps</strong> → {s.program.rewardText || 'Stamp reward'}
                  </span>
                  {s.program.scratchEnabled && (
                    <span style={{ color: '#F97316', fontWeight: 600, fontSize: '0.75rem' }}>
                      (Scratch cards on)
                    </span>
                  )}
                </div>
              )}

              {/* Row 3: Action Buttons */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                  paddingTop: '0.25rem',
                  borderTop: '1px solid var(--hairline)',
                }}
              >
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {/* Primary CTA: Open Merchant Dashboard */}
                  <button
                    className="btn-primary"
                    disabled={openingDashboard}
                    style={{
                      width: 'auto',
                      padding: '0.375rem 0.875rem',
                      fontSize: '0.8125rem',
                      fontWeight: 700,
                    }}
                    onClick={() => openDashboard(s.id)}
                  >
                    {openingDashboard ? 'Opening…' : '👁️ Open Merchant Dashboard'}
                  </button>

                  <button
                    className="btn-outline"
                    style={{
                      width: 'auto',
                      padding: '0.375rem 0.75rem',
                      fontSize: '0.8125rem',
                    }}
                    onClick={() => {
                      openDashboard(s.id);
                      setTimeout(() => navigate('/shop/customers'), 100);
                    }}
                  >
                    View Members
                  </button>

                  <button
                    className="btn-outline"
                    style={{
                      width: 'auto',
                      padding: '0.375rem 0.75rem',
                      fontSize: '0.8125rem',
                    }}
                    onClick={() => {
                      openDashboard(s.id);
                      setTimeout(() => navigate('/shop/print-qr'), 100);
                    }}
                  >
                    🖨️ Counter Poster
                  </button>
                </div>

                {/* Status Toggle */}
                <div>
                  {s.isActive ? (
                    <button
                      className="btn-danger"
                      style={{ padding: '0.3125rem 0.625rem', fontSize: '0.75rem' }}
                      onClick={() => {
                        if (window.confirm(`Suspend ${s.name}? Customers won't be able to scan or redeem while suspended.`)) {
                          deactivate(s.id);
                        }
                      }}
                    >
                      Suspend Merchant
                    </button>
                  ) : (
                    <button
                      className="btn-primary"
                      style={{ padding: '0.3125rem 0.625rem', fontSize: '0.75rem', background: '#15803D' }}
                      onClick={() => activate(s.id)}
                    >
                      Reactivate
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
