import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { api, StampError } from '../../lib/api.ts';
import { useAuth } from '../../hooks/useAuth.tsx';

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
type ViewMode = 'cards' | 'table';

export default function AdminShopsPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [copiedPhoneId, setCopiedPhoneId] = useState<string | null>(null);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editTarget, setEditTarget] = useState<ShopItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ShopItem | null>(null);

  // Add Merchant Form state
  const [addForm, setAddForm] = useState({
    name: '',
    slug: '',
    ownerPhone: '',
    stampsRequired: 8,
    rewardText: '1 Special Beverage or Reward',
    cooldownMinutes: 240,
    maxStampsPerDay: 2,
    scratchEnabled: true,
  });
  const [addError, setAddError] = useState('');

  // Edit Merchant Form state
  const [editForm, setEditForm] = useState({
    name: '',
    slug: '',
    ownerPhone: '',
    stampsRequired: 8,
    rewardText: '',
    cooldownMinutes: 240,
    maxStampsPerDay: 2,
    scratchEnabled: true,
    isActive: true,
  });
  const [editError, setEditError] = useState('');

  // 1. Platform-wide Stats
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery<AdminStats>({
    queryKey: ['admin-stats'],
    queryFn: () => api.get<AdminStats>('/admin/stats'),
    refetchInterval: 15_000,
  });

  // 2. All Merchants
  const { data: shopsData, isLoading: shopsLoading, refetch: refetchShops } = useQuery<{ shops: ShopItem[] }>({
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
        stampsRequired: 8,
        rewardText: '1 Special Beverage or Reward',
        cooldownMinutes: 240,
        maxStampsPerDay: 2,
        scratchEnabled: true,
      });
      setAddError('');
    },
    onError: (err: any) => {
      setAddError(err instanceof StampError ? err.message : 'Failed to create merchant. Check details.');
    },
  });

  // 4. Update Mutation
  const { mutate: updateShop, isPending: updatingShop } = useMutation({
    mutationFn: () => {
      if (!editTarget) throw new Error('No target selected');
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
    },
    onError: (err: any) => {
      setEditError(err instanceof StampError ? err.message : 'Failed to update merchant.');
    },
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

  const filteredShops = useMemo(() => {
    return shops.filter((s) => {
      if (activeTab === 'active' && !s.isActive) return false;
      if (activeTab === 'suspended' && s.isActive) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          s.name.toLowerCase().includes(q) ||
          s.slug.toLowerCase().includes(q) ||
          s.ownerPhone.includes(q)
        );
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
      stampsRequired: s.program?.stampsRequired ?? 8,
      rewardText: s.program?.rewardText ?? '',
      cooldownMinutes: 240,
      maxStampsPerDay: 2,
      scratchEnabled: s.program?.scratchEnabled ?? true,
      isActive: s.isActive,
    });
    setEditError('');
  };

  const copyPhone = (phone: string, id: string) => {
    navigator.clipboard?.writeText(phone);
    setCopiedPhoneId(id);
    setTimeout(() => setCopiedPhoneId(null), 2000);
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* ── 1. Page Header & Quick Actions (Metrocard style) ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '16px',
          borderBottom: '1px solid #E2E8F0',
          paddingBottom: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                background: '#EEF2FF',
                color: '#4F46E5',
                padding: '2px 8px',
                borderRadius: '999px',
              }}
            >
              Admin Platform
            </span>
            <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>
              {shops.length} Merchants Registered
            </span>
          </div>
          <h1
            style={{
              fontSize: '26px',
              fontWeight: 800,
              color: '#0F172A',
              margin: '2px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '28px', color: '#FF6B35' }}>
              storefront
            </span>
            Merchant Directory
          </h1>
          <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>
            Universal governance, strict multi-tenant isolation, counter standees, and audit-logged impersonation.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => {
              refetchShops();
              refetchStats();
            }}
            disabled={shopsLoading}
            title="Refresh Merchant Directory"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              border: '1px solid #E2E8F0',
              background: '#FFFFFF',
              color: '#64748B',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              refresh
            </span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            style={{
              height: '40px',
              padding: '0 18px',
              borderRadius: '10px',
              border: 'none',
              background: '#FF6B35',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(255,107,53,0.3)',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              add_business
            </span>
            Add Merchant
          </button>
        </div>
      </div>

      {/* ── 2. KPI Stat Cards (Metrocard style) ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '14px',
        }}
      >
        {/* Total Merchants */}
        <div
          onClick={() => setActiveTab('all')}
          style={{
            background: '#FFFFFF',
            borderRadius: '14px',
            padding: '16px 18px',
            border: '1px solid #E2E8F0',
            position: 'relative',
            overflow: 'hidden',
            cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(15,23,42,0.03)',
            transition: 'transform 0.15s, box-shadow 0.15s',
          }}
        >
          <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#FF6B35' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Total Merchants
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#FFF4EF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FF6B35' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                storefront
              </span>
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#0F172A', marginTop: '6px' }} className="tabular">
            {statsLoading ? '—' : stats?.totalShops ?? shops.length}
          </div>
          <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '4px' }}>
            <strong style={{ color: '#16a34a' }}>{stats?.activeShops ?? activeCount} active</strong>
            {suspendedCount > 0 && <span> · {suspendedCount} suspended</span>}
          </div>
        </div>

        {/* Active Approved */}
        <div
          onClick={() => setActiveTab('active')}
          style={{
            background: '#FFFFFF',
            borderRadius: '14px',
            padding: '16px 18px',
            border: '1px solid #E2E8F0',
            position: 'relative',
            overflow: 'hidden',
            cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(15,23,42,0.03)',
          }}
        >
          <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#00D4AA' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Active Programs
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#E0FFF6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00D4AA' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                verified
              </span>
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#0F172A', marginTop: '6px' }} className="tabular">
            {statsLoading ? '—' : stats?.activeShops ?? activeCount}
          </div>
          <div style={{ fontSize: '11.5px', color: '#16a34a', marginTop: '4px', fontWeight: 600 }}>
            Operational at counter
          </div>
        </div>

        {/* Platform Customers */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: '14px',
            padding: '16px 18px',
            border: '1px solid #E2E8F0',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(15,23,42,0.03)',
          }}
        >
          <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#4B2E9A' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Enrolled Members
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#E9E4F5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4B2E9A' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                groups
              </span>
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#0F172A', marginTop: '6px' }} className="tabular">
            {statsLoading ? '—' : (stats?.totalCustomers ?? 0).toLocaleString()}
          </div>
          <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '4px' }}>
            Tenant-isolated registers
          </div>
        </div>

        {/* Stamps Today */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: '14px',
            padding: '16px 18px',
            border: '1px solid #E2E8F0',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(15,23,42,0.03)',
          }}
        >
          <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#F59E0B' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Stamps Today
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#B45309' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                check_circle
              </span>
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#0F172A', marginTop: '6px' }} className="tabular">
            {statsLoading ? '—' : stats?.stampsToday ?? 0}
          </div>
          <div style={{ fontSize: '11.5px', color: '#B45309', marginTop: '4px', fontWeight: 600 }}>
            {stats?.redeemedToday ?? 0} redeemed today
          </div>
        </div>
      </div>

      {/* ── 3. Filter Tabs, Search & View Controls ── */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '14px',
          border: '1px solid #E2E8F0',
          padding: '12px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {[
              { id: 'all' as TabType, label: 'All', count: shops.length },
              { id: 'active' as TabType, label: 'Active', count: activeCount },
              { id: 'suspended' as TabType, label: 'Suspended', count: suspendedCount },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '10px',
                  fontSize: '12.5px',
                  fontWeight: activeTab === t.id ? 800 : 600,
                  border: 'none',
                  background: activeTab === t.id ? '#0F172A' : '#F1F5F9',
                  color: activeTab === t.id ? '#FFFFFF' : '#64748B',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>{t.label}</span>
                <span
                  style={{
                    fontSize: '11px',
                    padding: '1px 6px',
                    borderRadius: '999px',
                    background: activeTab === t.id ? 'rgba(255,255,255,0.2)' : '#E2E8F0',
                    color: activeTab === t.id ? '#FFFFFF' : '#475569',
                    fontWeight: 800,
                  }}
                >
                  {t.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Bar & View Mode */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, maxWidth: '480px', minWidth: '240px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <span
                className="material-symbols-outlined"
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '18px',
                  color: '#94A3B8',
                }}
              >
                search
              </span>
              <input
                type="text"
                placeholder="Search merchant, phone, or slug…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 34px',
                  borderRadius: '10px',
                  border: '1px solid #CBD5E1',
                  fontSize: '13px',
                  outline: 'none',
                  background: '#F8FAFC',
                }}
              />
            </div>

            {/* View Mode Toggle */}
            <div style={{ display: 'flex', background: '#F1F5F9', borderRadius: '8px', padding: '2px' }}>
              <button
                onClick={() => setViewMode('cards')}
                title="Card View"
                style={{
                  border: 'none',
                  background: viewMode === 'cards' ? '#FFFFFF' : 'transparent',
                  color: viewMode === 'cards' ? '#0F172A' : '#64748B',
                  padding: '5px 8px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  boxShadow: viewMode === 'cards' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  grid_view
                </span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                title="Table View"
                style={{
                  border: 'none',
                  background: viewMode === 'table' ? '#FFFFFF' : 'transparent',
                  color: viewMode === 'table' ? '#0F172A' : '#64748B',
                  padding: '5px 8px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  boxShadow: viewMode === 'table' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  view_list
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. Merchant Directory (Cards or Table) ── */}
      {shopsLoading && (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <div className="spinner" style={{ margin: '0 auto' }} />
          <p style={{ fontSize: '13px', color: '#64748B', marginTop: '10px' }}>Loading registered merchants…</p>
        </div>
      )}

      {!shopsLoading && filteredShops.length === 0 && (
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            padding: '48px 24px',
            textAlign: 'center',
          }}
        >
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: '#FFF4EF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: '#FF6B35' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>
              storefront
            </span>
          </div>
          <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 4px', color: '#0F172A' }}>
            No merchants found
          </h3>
          <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>
            {search ? 'Try clearing your search query.' : 'Onboard your first merchant to launch the stamp system.'}
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            style={{
              marginTop: '16px',
              padding: '8px 18px',
              borderRadius: '8px',
              border: 'none',
              background: '#FF6B35',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            + Onboard Merchant
          </button>
        </div>
      )}

      {/* Card Grid View */}
      {!shopsLoading && viewMode === 'cards' && filteredShops.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '16px',
          }}
        >
          {filteredShops.map((s) => (
            <div
              key={s.id}
              style={{
                background: '#FFFFFF',
                borderRadius: '16px',
                border: '1px solid #E2E8F0',
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 2px 8px rgba(15,23,42,0.03)',
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
            >
              <div>
                {/* Card Top Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '12px',
                        background: '#FFF4EF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#FF6B35',
                        fontWeight: 800,
                        fontSize: '16px',
                        border: '1px solid rgba(255,107,53,0.15)',
                      }}
                    >
                      {s.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: '#0F172A' }}>
                        {s.name}
                      </h3>
                      <a
                        href={`/s/${s.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontSize: '11.5px', color: '#64748B', textDecoration: 'none', fontFamily: 'monospace' }}
                      >
                        /s/{s.slug} ↗
                      </a>
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: '10.5px',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '6px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      background: s.isActive ? '#E6F5EE' : '#FEE2E2',
                      color: s.isActive ? '#1F8A5B' : '#B91C1C',
                    }}
                  >
                    {s.isActive ? 'Active' : 'Suspended'}
                  </span>
                </div>

                {/* Details */}
                <div style={{ background: '#F8FAFC', borderRadius: '10px', padding: '10px 12px', margin: '10px 0', fontSize: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ color: '#64748B' }}>Owner Phone:</span>
                    <button
                      onClick={() => copyPhone(s.ownerPhone, s.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#0F172A',
                        fontWeight: 700,
                        cursor: 'pointer',
                        padding: 0,
                        fontFamily: 'monospace',
                      }}
                    >
                      {s.ownerPhone} {copiedPhoneId === s.id ? '✓' : '📋'}
                    </button>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ color: '#64748B' }}>Members / Stamps:</span>
                    <strong style={{ color: '#0F172A' }}>
                      {s.memberCount ?? 0} members · {s.totalStamps ?? 0} stamps
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748B' }}>Program Rule:</span>
                    <span style={{ color: '#FF6B35', fontWeight: 700 }}>
                      {s.program?.stampsRequired ?? 8} stamps for reward
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #F1F5F9' }}>
                <button
                  onClick={() => openDashboard(s.id)}
                  disabled={openingDashboard}
                  style={{
                    flex: 1,
                    background: '#FEF3C7',
                    border: '1px solid #F59E0B',
                    color: '#92400E',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                    visibility
                  </span>
                  Impersonate
                </button>

                <button
                  onClick={() => openEdit(s)}
                  title="Edit Merchant"
                  style={{
                    background: '#F1F5F9',
                    border: '1px solid #E2E8F0',
                    color: '#0F172A',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                    edit
                  </span>
                </button>

                <button
                  onClick={() => setDeleteTarget(s)}
                  title="Delete Merchant"
                  style={{
                    background: '#FEF2F2',
                    border: '1px solid #FCA5A5',
                    color: '#DC2626',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                    delete
                  </span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table View */}
      {!shopsLoading && viewMode === 'table' && filteredShops.length > 0 && (
        <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <th style={{ textAlign: 'left', padding: '12px 18px', fontWeight: 700 }}>Merchant</th>
                  <th style={{ textAlign: 'left', padding: '12px 14px', fontWeight: 700 }}>Phone</th>
                  <th style={{ textAlign: 'center', padding: '12px 14px', fontWeight: 700 }}>Members</th>
                  <th style={{ textAlign: 'center', padding: '12px 14px', fontWeight: 700 }}>Stamps</th>
                  <th style={{ textAlign: 'center', padding: '12px 14px', fontWeight: 700 }}>Rule</th>
                  <th style={{ textAlign: 'center', padding: '12px 14px', fontWeight: 700 }}>Status</th>
                  <th style={{ textAlign: 'right', padding: '12px 18px', fontWeight: 700 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredShops.map((s) => (
                  <tr key={s.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '12px 18px' }}>
                      <div style={{ fontWeight: 800, color: '#0F172A' }}>{s.name}</div>
                      <a href={`/s/${s.slug}`} target="_blank" rel="noreferrer" style={{ fontSize: '11px', color: '#64748B', fontFamily: 'monospace' }}>
                        /s/{s.slug} ↗
                      </a>
                    </td>
                    <td style={{ padding: '12px 14px', fontFamily: 'monospace', color: '#334155' }}>
                      {s.ownerPhone}
                    </td>
                    <td style={{ textAlign: 'center', padding: '12px 14px', fontWeight: 700 }} className="tabular">
                      {s.memberCount ?? 0}
                    </td>
                    <td style={{ textAlign: 'center', padding: '12px 14px', fontWeight: 700 }} className="tabular">
                      {s.totalStamps ?? 0}
                    </td>
                    <td style={{ textAlign: 'center', padding: '12px 14px', color: '#FF6B35', fontWeight: 600 }}>
                      {s.program?.stampsRequired ?? 8} stamps
                    </td>
                    <td style={{ textAlign: 'center', padding: '12px 14px' }}>
                      <span
                        style={{
                          fontSize: '10.5px',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: '6px',
                          background: s.isActive ? '#E6F5EE' : '#FEE2E2',
                          color: s.isActive ? '#1F8A5B' : '#B91C1C',
                        }}
                      >
                        {s.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', padding: '12px 18px' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          onClick={() => openDashboard(s.id)}
                          style={{
                            background: '#FEF3C7',
                            border: '1px solid #F59E0B',
                            color: '#92400E',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          Impersonate
                        </button>
                        <button
                          onClick={() => openEdit(s)}
                          style={{
                            background: '#F1F5F9',
                            border: '1px solid #CBD5E1',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteTarget(s)}
                          style={{
                            background: '#FEF2F2',
                            border: '1px solid #FCA5A5',
                            color: '#DC2626',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 5. Add Merchant Modal ── */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '16px', maxWidth: '480px', width: '100%', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>Onboard New Merchant</h2>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748B' }}>
                ✕
              </button>
            </div>

            {addError && <div style={{ background: '#FEE2E2', color: '#DC2626', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', marginBottom: '12px' }}>{addError}</div>}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createShop();
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
            >
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Business Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chai Point Express"
                  value={addForm.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                    setAddForm((f) => ({ ...f, name, slug: f.slug ? f.slug : slug }));
                  }}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>URL Slug</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. chai-point"
                  value={addForm.slug}
                  onChange={(e) => setAddForm((f) => ({ ...f, slug: e.target.value }))}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', fontFamily: 'monospace' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Owner Phone Number</label>
                <input
                  type="tel"
                  required
                  placeholder="+919876543210"
                  value={addForm.ownerPhone}
                  onChange={(e) => setAddForm((f) => ({ ...f, ownerPhone: e.target.value }))}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Stamps Required</label>
                  <input
                    type="number"
                    min={2}
                    max={24}
                    value={addForm.stampsRequired}
                    onChange={(e) => setAddForm((f) => ({ ...f, stampsRequired: parseInt(e.target.value) }))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Cooldown (Hours)</label>
                  <input
                    type="number"
                    min={1}
                    max={24}
                    value={Math.round(addForm.cooldownMinutes / 60)}
                    onChange={(e) => setAddForm((f) => ({ ...f, cooldownMinutes: parseInt(e.target.value) * 60 }))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Reward Description</label>
                <input
                  type="text"
                  placeholder="e.g. Free Artisanal Chai & Samosa"
                  value={addForm.rewardText}
                  onChange={(e) => setAddForm((f) => ({ ...f, rewardText: e.target.value }))}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#64748B', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingShop}
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: '#FF6B35', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}
                >
                  {creatingShop ? 'Creating…' : 'Create Merchant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 6. Edit Merchant Modal ── */}
      {editTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '16px', maxWidth: '480px', width: '100%', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>Edit {editTarget.name}</h2>
              <button onClick={() => setEditTarget(null)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748B' }}>
                ✕
              </button>
            </div>

            {editError && <div style={{ background: '#FEE2E2', color: '#DC2626', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', marginBottom: '12px' }}>{editError}</div>}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateShop();
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
            >
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Business Name</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Owner Phone</label>
                <input
                  type="tel"
                  required
                  value={editForm.ownerPhone}
                  onChange={(e) => setEditForm((f) => ({ ...f, ownerPhone: e.target.value }))}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Stamps Required</label>
                  <input
                    type="number"
                    min={2}
                    max={24}
                    value={editForm.stampsRequired}
                    onChange={(e) => setEditForm((f) => ({ ...f, stampsRequired: parseInt(e.target.value) }))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Status</label>
                  <select
                    value={editForm.isActive ? 'active' : 'suspended'}
                    onChange={(e) => setEditForm((f) => ({ ...f, isActive: e.target.value === 'active' }))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Reward Description</label>
                <input
                  type="text"
                  value={editForm.rewardText}
                  onChange={(e) => setEditForm((f) => ({ ...f, rewardText: e.target.value }))}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setEditTarget(null)}
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#64748B', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingShop}
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: '#FF6B35', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}
                >
                  {updatingShop ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 7. Delete Confirmation Modal ── */}
      {deleteTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '16px', maxWidth: '420px', width: '100%', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: '#DC2626' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '26px' }}>
                warning
              </span>
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 800, textAlign: 'center', margin: '0 0 6px' }}>
              Delete {deleteTarget.name}?
            </h3>
            <p style={{ fontSize: '13px', color: '#64748B', textAlign: 'center', margin: '0 0 16px' }}>
              This will permanently purge this merchant, their stamp program, counter QR standees, scratch prize inventory, and all customer stamp ledger records.
            </p>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setDeleteTarget(null)}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#64748B', fontWeight: 700, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={() => deleteShop(deleteTarget.id)}
                disabled={deletingShop}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: '#DC2626', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}
              >
                {deletingShop ? 'Deleting…' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
