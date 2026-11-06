import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { api, StampError } from '../../lib/api.ts';
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

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editTarget, setEditTarget] = useState<ShopItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ShopItem | null>(null);

  // Add Merchant Form state
  const [addForm, setAddForm] = useState({
    name: '',
    slug: '',
    ownerPhone: '',
    stampsRequired: 6,
    rewardText: 'Free artisanal beverage or reward',
    cooldownMinutes: 60,
    maxStampsPerDay: 2,
    scratchEnabled: true,
  });
  const [addError, setAddError] = useState('');

  // Edit Merchant Form state
  const [editForm, setEditForm] = useState({
    name: '',
    slug: '',
    ownerPhone: '',
    stampsRequired: 6,
    rewardText: '',
    cooldownMinutes: 60,
    maxStampsPerDay: 2,
    scratchEnabled: true,
    isActive: true,
  });
  const [editError, setEditError] = useState('');

  // 1. Platform-wide Stats
  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ['admin-stats'],
    queryFn: () => api.get<AdminStats>('/admin/stats'),
    refetchInterval: 15_000,
  });

  // 2. All Merchants
  const { data: shopsData, isLoading: shopsLoading } = useQuery<{ shops: ShopItem[] }>({
    queryKey: ['admin-shops'],
    queryFn: () => api.get<{ shops: ShopItem[] }>('/admin/shops'),
    refetchInterval: 15_000,
  });

  // 3. Create Mutation
  const { mutate: createShop, isPending: creatingShop } = useMutation({
    mutationFn: () =>
      api.post('/admin/shops', {
        name: addForm.name,
        slug: addForm.slug,
        ownerPhone: addForm.ownerPhone,
        stampsRequired: Number(addForm.stampsRequired),
        rewardText: addForm.rewardText,
        cooldownMinutes: Number(addForm.cooldownMinutes),
        maxStampsPerDay: Number(addForm.maxStampsPerDay),
        scratchEnabled: addForm.scratchEnabled,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-shops'] });
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
      setShowAddModal(false);
      setAddForm({
        name: '',
        slug: '',
        ownerPhone: '',
        stampsRequired: 6,
        rewardText: 'Free artisanal beverage or reward',
        cooldownMinutes: 60,
        maxStampsPerDay: 2,
        scratchEnabled: true,
      });
      setAddError('');
    },
    onError: (err) => setAddError(err instanceof StampError ? err.message : S.genericError),
  });

  // 4. Update Mutation
  const { mutate: updateShop, isPending: updatingShop } = useMutation({
    mutationFn: () => {
      if (!editTarget) return Promise.resolve();
      return api.put(`/admin/shops/${editTarget.id}`, {
        name: editForm.name,
        slug: editForm.slug,
        ownerPhone: editForm.ownerPhone,
        stampsRequired: Number(editForm.stampsRequired),
        rewardText: editForm.rewardText,
        cooldownMinutes: Number(editForm.cooldownMinutes),
        maxStampsPerDay: Number(editForm.maxStampsPerDay),
        scratchEnabled: editForm.scratchEnabled,
        isActive: editForm.isActive,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-shops'] });
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
      setEditTarget(null);
      setEditError('');
    },
    onError: (err) => setEditError(err instanceof StampError ? err.message : S.genericError),
  });

  // 5. Delete Mutation
  const { mutate: deleteShop, isPending: deletingShop } = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/shops/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-shops'] });
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
      setDeleteTarget(null);
    },
  });

  // 6. Impersonate Mutation
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

  const openEdit = (s: ShopItem) => {
    setEditTarget(s);
    setEditForm({
      name: s.name,
      slug: s.slug,
      ownerPhone: s.ownerPhone,
      stampsRequired: s.program?.stampsRequired ?? 6,
      rewardText: s.program?.rewardText ?? '',
      cooldownMinutes: 60,
      maxStampsPerDay: 2,
      scratchEnabled: s.program?.scratchEnabled ?? true,
      isActive: s.isActive,
    });
    setEditError('');
  };

  return (
    <div className="page" style={{ maxWidth: 1040, margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Top Bar */}
      <nav className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <span className="topbar-title">Super Admin Portal</span>
          <span
            style={{
              background: '#0F172A',
              color: '#F8FAFC',
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
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary"
            style={{ width: 'auto', padding: '0.45rem 0.875rem', fontSize: '0.8125rem' }}
          >
            + Onboard Merchant
          </button>
          <button className="btn-ghost" onClick={logout} style={{ padding: '0.45rem 0.75rem', fontSize: '0.8125rem' }}>
            {S.signOut}
          </button>
        </div>
      </nav>

      <div className="content" style={{ padding: '1.25rem 0' }}>
        {/* KPI Stat Cards (Screen 3.1) */}
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
            gap: '0.875rem',
            marginBottom: '1.5rem',
          }}
        >
          {/* Total Merchants */}
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--hairline)',
              borderRadius: '16px',
              padding: '1.125rem',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#FF6B35' }} />
            <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Total Merchants
            </div>
            <div style={{ fontSize: '1.875rem', fontWeight: 800, marginTop: '0.25rem' }} className="tabular">
              {statsLoading ? '—' : stats?.totalShops ?? 0}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', marginTop: '0.25rem' }}>
              <strong style={{ color: '#16a34a' }}>{stats?.activeShops ?? 0} active</strong>
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
              borderRadius: '16px',
              padding: '1.125rem',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#00D4AA' }} />
            <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Platform Members
            </div>
            <div style={{ fontSize: '1.875rem', fontWeight: 800, marginTop: '0.25rem' }} className="tabular">
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
              borderRadius: '16px',
              padding: '1.125rem',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#F59E0B' }} />
            <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Stamps Today
            </div>
            <div style={{ fontSize: '1.875rem', fontWeight: 800, marginTop: '0.25rem' }} className="tabular">
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
              borderRadius: '16px',
              padding: '1.125rem',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#8B5CF6' }} />
            <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Rewards Redeemed
            </div>
            <div style={{ fontSize: '1.875rem', fontWeight: 800, marginTop: '0.25rem' }} className="tabular">
              {statsLoading ? '—' : stats?.redeemedToday ?? 0}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', marginTop: '0.25rem' }}>
              Redeemed today
            </div>
          </div>
        </section>

        {/* Section Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
              Merchant Directory ({shops.length})
            </h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)', margin: '0.125rem 0 0' }}>
              Manage shops, edit programs, view members, or impersonate merchant dashboard.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link to="/admin/flags" className="btn-outline" style={{ padding: '0.375rem 0.75rem', fontSize: '0.8125rem' }}>
              🚩 Fraud Flags
            </Link>
          </div>
        </div>

        {/* Search & Tabs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <input
            type="search"
            className="input"
            placeholder="Search merchants by business name, slug (/s/...), or owner phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', fontSize: '0.875rem' }}
          />

          <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--hairline)', paddingBottom: '0.5rem' }}>
            <button
              onClick={() => setActiveTab('all')}
              style={{
                background: activeTab === 'all' ? '#0F172A' : 'transparent',
                color: activeTab === 'all' ? '#FFFFFF' : 'var(--ink-muted)',
                border: 'none',
                borderRadius: '8px',
                padding: '0.3125rem 0.75rem',
                fontSize: '0.8125rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              All ({shops.length})
            </button>
            <button
              onClick={() => setActiveTab('active')}
              style={{
                background: activeTab === 'active' ? '#0F172A' : 'transparent',
                color: activeTab === 'active' ? '#FFFFFF' : 'var(--ink-muted)',
                border: 'none',
                borderRadius: '8px',
                padding: '0.3125rem 0.75rem',
                fontSize: '0.8125rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Active ({activeCount})
            </button>
            <button
              onClick={() => setActiveTab('suspended')}
              style={{
                background: activeTab === 'suspended' ? '#0F172A' : 'transparent',
                color: activeTab === 'suspended' ? '#FFFFFF' : 'var(--ink-muted)',
                border: 'none',
                borderRadius: '8px',
                padding: '0.3125rem 0.75rem',
                fontSize: '0.8125rem',
                fontWeight: 700,
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
          <div className="empty-state sheet" style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: '12px', background: 'var(--orange-light)', color: 'var(--orange)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>storefront</span>
            </div>
            <p style={{ fontWeight: 800, fontSize: '1.125rem', marginBottom: '0.375rem' }}>No merchants found</p>
            <p style={{ fontSize: '0.875rem', color: 'var(--ink-muted)', marginBottom: '1.25rem' }}>
              {search ? 'Try clearing your search filters.' : 'Onboard your first merchant account now.'}
            </p>
            <button onClick={() => setShowAddModal(true)} className="btn-primary" style={{ width: 'auto', display: 'inline-block' }}>
              + Onboard Merchant
            </button>
          </div>
        )}

        {/* Merchants List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredShops.map((s) => (
            <div
              key={s.id}
              style={{
                background: '#FFFFFF',
                border: '1px solid var(--hairline)',
                borderRadius: '16px',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.875rem',
                boxShadow: 'var(--shadow-card)',
                opacity: s.isActive ? 1 : 0.75,
              }}
            >
              {/* Header row: Name, status, link */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--ink)' }}>{s.name}</span>
                    <span
                      style={{
                        background: s.isActive ? '#DCFCE7' : '#FEE2E2',
                        color: s.isActive ? '#15803D' : '#B91C1C',
                        fontSize: '0.6875rem',
                        fontWeight: 800,
                        padding: '0.1875rem 0.625rem',
                        borderRadius: '999px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {s.isActive ? 'Active' : 'Suspended'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span>📱 {s.ownerPhone}</span>
                    <span>•</span>
                    <a
                      href={`/s/${s.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: 'var(--orange-dark)', fontWeight: 600, textDecoration: 'underline' }}
                    >
                      /s/{s.slug} ↗
                    </a>
                  </div>
                </div>

                {/* Metric Badges */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      background: '#F1F5F9',
                      borderRadius: '8px',
                      padding: '0.25rem 0.625rem',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: '#334155',
                    }}
                  >
                    👥 {s.memberCount} members
                  </span>
                  <span
                    style={{
                      background: '#F1F5F9',
                      borderRadius: '8px',
                      padding: '0.25rem 0.625rem',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: '#334155',
                    }}
                  >
                    🎟️ {s.totalStamps} stamps
                  </span>
                </div>
              </div>

              {/* Program Rule Details */}
              {s.program && (
                <div
                  style={{
                    background: '#F8FAFC',
                    borderRadius: '10px',
                    padding: '0.625rem 0.875rem',
                    fontSize: '0.8125rem',
                    color: 'var(--ink)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.625rem',
                    border: '1px solid #E2E8F0',
                  }}
                >
                  <span style={{ fontWeight: 700, color: 'var(--ink-muted)', textTransform: 'uppercase', fontSize: '0.6875rem' }}>
                    Program:
                  </span>
                  <span style={{ fontWeight: 600 }}>
                    <strong>{s.program.stampsRequired} stamps</strong> → {s.program.rewardText || 'Stamp reward'}
                  </span>
                  {s.program.scratchEnabled && (
                    <span style={{ color: 'var(--orange)', fontWeight: 700, fontSize: '0.75rem', background: 'var(--orange-light)', padding: '2px 6px', borderRadius: '4px' }}>
                      Scratch Cards Active
                    </span>
                  )}
                </div>
              )}

              {/* Action Buttons Row */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.625rem',
                  paddingTop: '0.5rem',
                  borderTop: '1px solid var(--hairline)',
                }}
              >
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {/* Primary CTA: Open Merchant Dashboard */}
                  <button
                    className="btn-primary"
                    disabled={openingDashboard}
                    style={{
                      padding: '0.375rem 0.875rem',
                      fontSize: '0.8125rem',
                      fontWeight: 700,
                    }}
                    onClick={() => openDashboard(s.id)}
                  >
                    👁️ Open Dashboard
                  </button>

                  <button
                    className="btn-outline"
                    style={{ padding: '0.375rem 0.75rem', fontSize: '0.8125rem' }}
                    onClick={() => {
                      openDashboard(s.id);
                      setTimeout(() => navigate('/shop/customers'), 100);
                    }}
                  >
                    👥 Members
                  </button>

                  <button
                    className="btn-outline"
                    style={{ padding: '0.375rem 0.75rem', fontSize: '0.8125rem' }}
                    onClick={() => {
                      openDashboard(s.id);
                      setTimeout(() => navigate('/shop/print-qr'), 100);
                    }}
                  >
                    🖨️ Poster
                  </button>

                  {/* Edit Option */}
                  <button
                    className="btn-outline"
                    style={{ padding: '0.375rem 0.75rem', fontSize: '0.8125rem', background: '#F8FAFC' }}
                    onClick={() => openEdit(s)}
                  >
                    ✏️ Edit
                  </button>
                </div>

                {/* Delete & Suspend Option */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    className="btn-danger"
                    style={{ padding: '0.3125rem 0.625rem', fontSize: '0.75rem' }}
                    onClick={() => setDeleteTarget(s)}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── MODAL 1: Onboard / Add Merchant ── */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.55)',
            backdropFilter: 'blur(3px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="sheet"
            style={{
              width: '100%',
              maxWidth: '540px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: 'var(--shadow-lg)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Onboard New Merchant</h3>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ fontSize: '1.25rem', color: 'var(--ink-muted)', cursor: 'pointer', padding: '4px' }}
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setAddError('');
                createShop();
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}
            >
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>
                  Business Name *
                </label>
                <input
                  className="input"
                  required
                  placeholder="e.g. Blue Tokai Coffee Roasters"
                  value={addForm.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    const autoSlug = name
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, '-')
                      .replace(/^-|-$/g, '');
                    setAddForm((f) => ({
                      ...f,
                      name,
                      slug: f.slug === '' || f.slug === autoSlug.slice(0, -1) ? autoSlug : f.slug,
                    }));
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>
                    Shop Slug (URL) *
                  </label>
                  <input
                    className="input"
                    required
                    placeholder="blue-tokai"
                    value={addForm.slug}
                    onChange={(e) =>
                      setAddForm((f) => ({
                        ...f,
                        slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
                      }))
                    }
                  />
                  <span style={{ fontSize: '0.6875rem', color: 'var(--ink-muted)' }}>/s/{addForm.slug || 'slug'}</span>
                </div>

                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>
                    Owner Phone *
                  </label>
                  <input
                    className="input"
                    required
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={addForm.ownerPhone}
                    onChange={(e) => setAddForm((f) => ({ ...f, ownerPhone: e.target.value }))}
                  />
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--hairline)', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--orange-dark)' }}>
                  Loyalty Program Setup
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>
                    Target Stamps Required
                  </label>
                  <input
                    className="input"
                    type="number"
                    min={2}
                    max={30}
                    value={addForm.stampsRequired}
                    onChange={(e) => setAddForm((f) => ({ ...f, stampsRequired: Number(e.target.value) }))}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>
                    Cooldown Between Scans (mins)
                  </label>
                  <input
                    className="input"
                    type="number"
                    min={0}
                    value={addForm.cooldownMinutes}
                    onChange={(e) => setAddForm((f) => ({ ...f, cooldownMinutes: Number(e.target.value) }))}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>
                  Reward Description *
                </label>
                <input
                  className="input"
                  required
                  placeholder="e.g. Free Cappuccino or Artisan Croissant"
                  value={addForm.rewardText}
                  onChange={(e) => setAddForm((f) => ({ ...f, rewardText: e.target.value }))}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                <input
                  type="checkbox"
                  id="add-scratch"
                  checked={addForm.scratchEnabled}
                  onChange={(e) => setAddForm((f) => ({ ...f, scratchEnabled: e.target.checked }))}
                  style={{ width: 16, height: 16 }}
                />
                <label htmlFor="add-scratch" style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                  Enable Scratch Cards with Surprise Prizes on Every Scan
                </label>
              </div>

              {addError && <div className="error-msg">{addError}</div>}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => setShowAddModal(false)}
                  disabled={creatingShop}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={creatingShop}>
                  {creatingShop ? 'Creating Merchant…' : 'Confirm & Onboard'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 2: Edit Merchant ── */}
      {editTarget && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.55)',
            backdropFilter: 'blur(3px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={() => setEditTarget(null)}
        >
          <div
            className="sheet"
            style={{
              width: '100%',
              maxWidth: '540px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: 'var(--shadow-lg)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Edit Merchant Account</h3>
              <button
                onClick={() => setEditTarget(null)}
                style={{ fontSize: '1.25rem', color: 'var(--ink-muted)', cursor: 'pointer', padding: '4px' }}
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setEditError('');
                updateShop();
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}
            >
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>
                  Business Name *
                </label>
                <input
                  className="input"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>
                    Shop Slug (URL) *
                  </label>
                  <input
                    className="input"
                    required
                    value={editForm.slug}
                    onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
                      }))
                    }
                  />
                  <span style={{ fontSize: '0.6875rem', color: 'var(--ink-muted)' }}>/s/{editForm.slug}</span>
                </div>

                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>
                    Owner Phone *
                  </label>
                  <input
                    className="input"
                    required
                    type="tel"
                    value={editForm.ownerPhone}
                    onChange={(e) => setEditForm((f) => ({ ...f, ownerPhone: e.target.value }))}
                  />
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--hairline)', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--orange-dark)' }}>
                  Loyalty Program Rules
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>
                    Target Stamps Required
                  </label>
                  <input
                    className="input"
                    type="number"
                    min={2}
                    max={30}
                    value={editForm.stampsRequired}
                    onChange={(e) => setEditForm((f) => ({ ...f, stampsRequired: Number(e.target.value) }))}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>
                    Cooldown (minutes)
                  </label>
                  <input
                    className="input"
                    type="number"
                    min={0}
                    value={editForm.cooldownMinutes}
                    onChange={(e) => setEditForm((f) => ({ ...f, cooldownMinutes: Number(e.target.value) }))}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>
                  Reward Description *
                </label>
                <input
                  className="input"
                  required
                  value={editForm.rewardText}
                  onChange={(e) => setEditForm((f) => ({ ...f, rewardText: e.target.value }))}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginTop: '0.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    id="edit-scratch"
                    checked={editForm.scratchEnabled}
                    onChange={(e) => setEditForm((f) => ({ ...f, scratchEnabled: e.target.checked }))}
                    style={{ width: 16, height: 16 }}
                  />
                  <label htmlFor="edit-scratch" style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                    Scratch Cards Enabled
                  </label>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    id="edit-active"
                    checked={editForm.isActive}
                    onChange={(e) => setEditForm((f) => ({ ...f, isActive: e.target.checked }))}
                    style={{ width: 16, height: 16 }}
                  />
                  <label htmlFor="edit-active" style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                    Account Active
                  </label>
                </div>
              </div>

              {editError && <div className="error-msg">{editError}</div>}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.75rem' }}>
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => setEditTarget(null)}
                  disabled={updatingShop}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={updatingShop}>
                  {updatingShop ? 'Saving Changes…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 3: Delete Merchant Confirmation ── */}
      {deleteTarget && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.55)',
            backdropFilter: 'blur(3px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={() => setDeleteTarget(null)}
        >
          <div
            className="sheet"
            style={{
              width: '100%',
              maxWidth: '460px',
              boxShadow: 'var(--shadow-lg)',
              border: '1px solid #FECACA',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: '#FEE2E2',
                  color: '#DC2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>
                  delete_forever
                </span>
              </div>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 800, margin: 0, color: '#991B1B' }}>
                  Delete Merchant Account?
                </h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)', margin: 0 }}>
                  This action is permanent and cannot be undone.
                </p>
              </div>
            </div>

            <p style={{ fontSize: '0.875rem', color: 'var(--ink)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
              Are you sure you want to delete <strong>{deleteTarget.name}</strong> (`/s/{deleteTarget.slug}`)? All loyalty programs, stamp cards, prizes, and member associations for this shop will be safely purged.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn-outline"
                onClick={() => setDeleteTarget(null)}
                disabled={deletingShop}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-danger"
                style={{ background: '#DC2626', color: '#FFFFFF', fontWeight: 700 }}
                onClick={() => deleteShop(deleteTarget.id)}
                disabled={deletingShop}
              >
                {deletingShop ? 'Deleting…' : 'Yes, Delete Merchant'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
