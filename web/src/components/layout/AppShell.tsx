import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth.tsx';
import { api } from '../../lib/api.ts';

const T = {
  bg: '#F8FAFC',
  white: '#FFFFFF',
  border: '#E2E8F0',
  text: '#0F172A',
  textMuted: '#64748B',
  textLight: '#94A3B8',
  orange: '#FF6B35',
  orangeLight: '#FFF4EF',
  orangeDark: '#E85A28',
  teal: '#00D4AA',
  tealLight: '#E0FFF6',
  amber: '#F59E0B',
  amberLight: '#FEF3C7',
  shadow: '0 1px 3px rgba(15,23,42,0.04), 0 4px 12px rgba(15,23,42,0.03)',
  shadowMd: '0 4px 16px rgba(15,23,42,0.08)',
};

interface ShopSummary {
  shopId?: string;
  shopName?: string;
  shopSlug?: string;
}

interface ShopItem {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
}

const SHOP_NAV_ITEMS = [
  { to: '/shop', icon: 'dashboard', label: 'Dashboard', group: 'Core' },
  { to: '/shop/scan', icon: 'qr_code_scanner', label: 'Scan Customer', group: 'Core' },
  { to: '/shop/customers', icon: 'group', label: 'Members', group: 'Core' },
  { to: '/shop/redeem', icon: 'redeem', label: 'Redeem Reward', group: 'Manage' },
  { to: '/shop/program', icon: 'palette', label: 'Card Studio', group: 'Manage' },
  { to: '/shop/qr', icon: 'qr_code_2', label: 'Counter QR', group: 'Manage' },
  { to: '/shop/print-qr', icon: 'print', label: 'Print Standee', group: 'Manage' },
  { to: '/shop/feed', icon: 'history', label: 'Khata Ledger', group: 'Tools' },
];

const ADMIN_NAV_ITEMS = [
  { to: '/admin', icon: 'storefront', label: 'All Merchants', group: 'Platform' },
  { to: '/admin/flags', icon: 'flag', label: 'Security & Flags', group: 'Platform' },
  { to: '/__atlas', icon: 'palette', label: 'Design Atlas', group: 'Tools' },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const qc = useQueryClient();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile drawer on route navigation
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Keyboard shortcut Ctrl+K / Cmd+K to jump to scan or admin
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        navigate(user?.role === 'admin' && location.pathname.startsWith('/admin') ? '/admin' : '/shop/scan');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate, user, location.pathname]);

  const isViewingShop = location.pathname.startsWith('/shop');
  const isAdmin = user?.role === 'admin';

  const { data: summary } = useQuery<ShopSummary>({
    queryKey: ['shop-summary'],
    staleTime: 10_000,
    enabled: isViewingShop,
  });

  const { data: allShopsData } = useQuery<{ shops: ShopItem[] }>({
    queryKey: ['admin-shops-dropdown'],
    queryFn: () => api.get<{ shops: ShopItem[] }>('/admin/shops'),
    enabled: isAdmin,
    staleTime: 30_000,
  });

  const { mutate: switchShop } = useMutation({
    mutationFn: (shopId: string) => api.post(`/admin/impersonate/${shopId}`),
    onSuccess: () => {
      qc.invalidateQueries();
    },
  });

  const { mutate: exitImpersonation } = useMutation({
    mutationFn: () => api.post('/admin/exit-impersonate'),
    onSuccess: () => {
      qc.invalidateQueries();
      navigate('/admin');
    },
  });

  const navItems = isAdmin && !isViewingShop ? ADMIN_NAV_ITEMS : SHOP_NAV_ITEMS;

  // Group nav items by section
  const groupedNav = navItems.reduce<Record<string, typeof navItems>>((acc, item) => {
    const g = item.group;
    if (!acc[g]) acc[g] = [];
    acc[g].push(item);
    return acc;
  }, {});

  const currentShopName = summary?.shopName || 'Merchant Portal';
  const initials = (user?.name || user?.phone || 'U').slice(0, 2).toUpperCase();

  return (
    <div style={{ display: 'flex', minHeight: '100dvh', background: T.bg, fontFamily: '"Plus Jakarta Sans", "Inter", system-ui, sans-serif' }}>
      {/* ── 1. Desktop Sidebar (240px Fixed) ── */}
      <aside
        style={{
          width: '240px',
          flexShrink: 0,
          background: T.white,
          borderRight: `1px solid ${T.border}`,
          display: 'none',
          flexDirection: 'column',
          position: 'fixed',
          top: 0,
          bottom: 0,
          left: 0,
          zIndex: 40,
        }}
        className="app-sidebar-desktop"
      >
        {/* Brand Header */}
        <div style={{ padding: '16px 18px 14px', borderBottom: `1px solid ${T.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: T.orangeLight,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: T.orange,
                fontWeight: 800,
                fontSize: '18px',
                flexShrink: 0,
                border: '1px solid rgba(255,107,53,0.15)',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '22px', fontVariationSettings: "'FILL' 1" }}>
                {isAdmin && !isViewingShop ? 'admin_panel_settings' : 'loyalty'}
              </span>
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 800,
                  color: T.text,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {isAdmin && !isViewingShop ? 'Stamp Universal' : currentShopName}
              </div>
              <div style={{ fontSize: '11px', color: T.textLight, marginTop: '2px', fontWeight: 600 }}>
                {isAdmin ? (isViewingShop ? 'Admin Impersonation' : 'Super Admin Platform') : 'Merchant Counter'}
              </div>
            </div>
          </div>
        </div>

        {/* Impersonation Merchant Switcher (When Super Admin is viewing /shop) */}
        {isAdmin && isViewingShop && (
          <div
            style={{
              padding: '10px 14px',
              background: '#FEF3C7',
              borderBottom: '1px solid #F59E0B',
              fontSize: '12px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontWeight: 800, color: '#92400E', fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                SWITCH MERCHANT
              </span>
              <button
                onClick={() => exitImpersonation()}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#92400E',
                  fontWeight: 700,
                  fontSize: '11px',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Exit ↗
              </button>
            </div>
            <select
              value={summary?.shopId || ''}
              onChange={(e) => {
                if (e.target.value) switchShop(e.target.value);
              }}
              style={{
                width: '100%',
                padding: '4px 6px',
                borderRadius: '6px',
                border: '1px solid #D97706',
                background: '#FFFFFF',
                fontSize: '12px',
                color: '#78350F',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {allShopsData?.shops.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {!s.isActive ? '(Inactive)' : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Navigation Links Grouped */}
        <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
          {Object.entries(groupedNav).map(([group, items]) => (
            <div key={group} style={{ marginBottom: '16px' }}>
              <div
                style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  color: T.textLight,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  padding: '0 12px',
                  marginBottom: '6px',
                }}
              >
                {group}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/shop' || item.to === '/admin'}
                    style={({ isActive }) => ({
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 12px',
                      borderRadius: '10px',
                      fontSize: '13px',
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? T.orangeDark : T.textMuted,
                      background: isActive ? T.orangeLight : 'transparent',
                      textDecoration: 'none',
                      transition: 'all 0.15s ease',
                    })}
                  >
                    {({ isActive }) => (
                      <>
                        <span
                          className="material-symbols-outlined"
                          style={{
                            fontSize: '20px',
                            color: isActive ? T.orange : T.textMuted,
                            fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0",
                          }}
                        >
                          {item.icon}
                        </span>
                        <span style={{ flex: 1 }}>{item.label}</span>
                        {item.to === '/shop/scan' && (
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 800,
                              background: isActive ? T.orange : '#F1F5F9',
                              color: isActive ? '#FFFFFF' : '#64748B',
                              padding: '2px 6px',
                              borderRadius: '6px',
                            }}
                          >
                            SCAN
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}

          {/* Quick Search Shortcut Ctrl+K */}
          <button
            onClick={() => navigate(isAdmin && !isViewingShop ? '/admin' : '/shop/scan')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              borderRadius: '10px',
              border: `1px dashed ${T.border}`,
              background: 'transparent',
              color: T.textLight,
              fontSize: '12px',
              cursor: 'pointer',
              marginTop: '4px',
              transition: 'border-color 0.15s',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
              search
            </span>
            <span style={{ flex: 1, textAlign: 'left' }}>Quick Search</span>
            <kbd
              style={{
                fontSize: '10px',
                background: '#F1F5F9',
                padding: '2px 5px',
                borderRadius: '4px',
                border: '1px solid #E2E8F0',
                fontFamily: 'monospace',
              }}
            >
              ⌘K
            </kbd>
          </button>
        </nav>

        {/* User Card Footer */}
        <div style={{ padding: '12px 14px', borderTop: `1px solid ${T.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: T.orangeLight,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 800,
                color: T.orange,
                flexShrink: 0,
              }}
            >
              {initials}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: T.text,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {user?.name || user?.phone || 'User'}
              </div>
              <div style={{ fontSize: '11px', color: T.textLight, textTransform: 'capitalize' }}>
                {isAdmin ? 'Super Admin' : 'Shop Merchant'}
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              logout();
              navigate('/sign-in');
            }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '6px 10px',
              borderRadius: '8px',
              border: `1px solid ${T.border}`,
              background: '#FFFFFF',
              color: T.textMuted,
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#FEF2F2';
              e.currentTarget.style.color = '#EF4444';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = '#FFFFFF';
              e.currentTarget.style.color = T.textMuted;
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
              logout
            </span>
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── 2. Main Content Wrapper (Margin Left on Desktop) ── */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }} className="app-main-content-wrapper">
        {/* Top Header Bar */}
        <header
          style={{
            background: T.white,
            borderBottom: `1px solid ${T.border}`,
            padding: '10px 24px',
            position: 'sticky',
            top: 0,
            zIndex: 30,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          }}
        >
          {/* Breadcrumb / Location */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: T.textLight, fontWeight: 500 }}>
              {isAdmin && !isViewingShop ? 'Platform Governance' : currentShopName}
            </span>
            <span style={{ color: T.textLight }}>/</span>
            <span style={{ fontSize: '13px', color: T.text, fontWeight: 700 }}>
              {navItems.find((n) => location.pathname === n.to)?.label || 'Overview'}
            </span>
          </div>

          {/* Quick Actions in Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {isAdmin && !isViewingShop && (
              <Link
                to="/__atlas"
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#4F46E5',
                  background: '#EEF2FF',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  textDecoration: 'none',
                }}
              >
                🎨 Design Atlas
              </Link>
            )}

            {isViewingShop && (
              <Link
                to="/shop/scan"
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#FFFFFF',
                  background: T.orange,
                  padding: '6px 12px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  boxShadow: '0 2px 6px rgba(255,107,53,0.25)',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                  qr_code_scanner
                </span>
                Scan Customer
              </Link>
            )}

            {isAdmin && isViewingShop && (
              <button
                onClick={() => exitImpersonation()}
                style={{
                  background: '#92400E',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '5px 10px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Exit Impersonation ↗
              </button>
            )}
          </div>
        </header>

        {/* Impersonation Diagonal Tape (M14) */}
        {isAdmin && isViewingShop && (
          <div
            style={{
              background: '#FEF3C7',
              borderBottom: '2px solid #F59E0B',
              padding: '8px 24px',
              fontSize: '12px',
              color: '#78350F',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  background: '#F59E0B',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '10px',
                  padding: '1px 6px',
                  borderRadius: '4px',
                }}
              >
                SUPER ADMIN
              </span>
              <span>
                Acting as: <strong>{currentShopName}</strong> (Tenant Data Isolation Active • Audit Logged)
              </span>
            </div>
            <button
              onClick={() => exitImpersonation()}
              style={{
                background: 'none',
                border: 'none',
                color: '#92400E',
                fontWeight: 700,
                fontSize: '11px',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Exit to Admin Portal
            </button>
          </div>
        )}

        {/* Main Content Area */}
        <main style={{ flex: 1, padding: '24px' }} className="app-main-content">
          {children}
        </main>
      </div>

      {/* ── 3. Mobile Header & Bottom Navigation Bar ── */}
      <header
        style={{
          display: 'none',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '54px',
          background: 'rgba(255,255,255,0.96)',
          backdropFilter: 'blur(16px)',
          borderBottom: `1px solid ${T.border}`,
          zIndex: 50,
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
        }}
        className="app-mobile-header"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: T.orangeLight,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: T.orange,
              fontWeight: 800,
              fontSize: '14px',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              loyalty
            </span>
          </div>
          <span style={{ fontSize: '14px', fontWeight: 800, color: T.text }}>
            {isAdmin && !isViewingShop ? 'Stamp Admin' : currentShopName}
          </span>
        </div>

        <button
          onClick={() => {
            logout();
            navigate('/sign-in');
          }}
          style={{
            background: 'none',
            border: 'none',
            color: T.textMuted,
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Sign Out
        </button>
      </header>

      {/* Mobile Bottom Navigation (Swiggy / Metrocard style) */}
      <nav
        style={{
          display: 'none',
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'rgba(255,255,255,0.98)',
          backdropFilter: 'blur(16px)',
          borderTop: `1px solid ${T.border}`,
          padding: '6px 8px',
          paddingBottom: 'calc(6px + env(safe-area-inset-bottom, 0px))',
          justifyContent: 'space-around',
          alignItems: 'center',
          zIndex: 50,
          boxShadow: '0 -4px 16px rgba(15,23,42,0.06)',
        }}
        className="app-mobile-bottom-bar"
      >
        <NavLink
          to={isViewingShop ? '/shop' : '/admin'}
          style={({ isActive }) => ({
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
            color: isActive ? T.orange : T.textMuted,
            fontSize: '10px',
            fontWeight: isActive ? 700 : 500,
            textDecoration: 'none',
            flex: 1,
          })}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
            {isViewingShop ? 'dashboard' : 'storefront'}
          </span>
          {isViewingShop ? 'Dashboard' : 'Merchants'}
        </NavLink>

        {isViewingShop && (
          <NavLink
            to="/shop/scan"
            style={({ isActive }) => ({
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px',
              color: isActive ? T.orange : T.textMuted,
              fontSize: '10px',
              fontWeight: isActive ? 700 : 500,
              textDecoration: 'none',
              flex: 1,
            })}
          >
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: T.orange,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                marginTop: '-14px',
                boxShadow: '0 4px 12px rgba(255,107,53,0.35)',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>
                qr_code_scanner
              </span>
            </div>
            Scan
          </NavLink>
        )}

        <NavLink
          to={isViewingShop ? '/shop/customers' : '/admin/flags'}
          style={({ isActive }) => ({
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
            color: isActive ? T.orange : T.textMuted,
            fontSize: '10px',
            fontWeight: isActive ? 700 : 500,
            textDecoration: 'none',
            flex: 1,
          })}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
            {isViewingShop ? 'group' : 'flag'}
          </span>
          {isViewingShop ? 'Members' : 'Flags'}
        </NavLink>

        {isViewingShop && (
          <NavLink
            to="/shop/program"
            style={({ isActive }) => ({
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px',
              color: isActive ? T.orange : T.textMuted,
              fontSize: '10px',
              fontWeight: isActive ? 700 : 500,
              textDecoration: 'none',
              flex: 1,
            })}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              palette
            </span>
            Studio
          </NavLink>
        )}
      </nav>

      {/* Responsive layout styles */}
      <style>{`
        @media (min-width: 900px) {
          .app-sidebar-desktop {
            display: flex !important;
          }
          .app-main-content-wrapper {
            margin-left: 240px !important;
          }
          .app-mobile-header {
            display: none !important;
          }
          .app-mobile-bottom-bar {
            display: none !important;
          }
        }
        @media (max-width: 899px) {
          .app-mobile-header {
            display: flex !important;
          }
          .app-mobile-bottom-bar {
            display: flex !important;
          }
          .app-main-content {
            padding-top: 64px !important;
            padding-bottom: 74px !important;
          }
        }
      `}</style>
    </div>
  );
}
