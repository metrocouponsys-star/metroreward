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
  { to: '/shop/qr', icon: 'qr_code_2', label: 'Counter QR', group: 'Manage' },
  { to: '/shop/print-qr', icon: 'print', label: 'Print Poster', group: 'Manage' },
  { to: '/shop/program', icon: 'tune', label: 'Program Rules', group: 'Manage' },
  { to: '/shop/feed', icon: 'history', label: 'Live Activity', group: 'Tools' },
];

const ADMIN_NAV_ITEMS = [
  { to: '/admin', icon: 'storefront', label: 'All Merchants', group: 'Platform' },
  { to: '/admin/create-shop', icon: 'add_business', label: 'Onboard Shop', group: 'Platform' },
  { to: '/admin/flags', icon: 'flag', label: 'Flagged Activity', group: 'Security' },
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

  // Keyboard shortcut Ctrl+K / Cmd+K to jump to scan customer
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

  const { data: summary } = useQuery<ShopSummary>({
    queryKey: ['shop-summary'],
    staleTime: 10_000,
    enabled: location.pathname.startsWith('/shop'),
  });

  const { data: allShopsData } = useQuery<{ shops: ShopItem[] }>({
    queryKey: ['admin-shops-dropdown'],
    queryFn: () => api.get<{ shops: ShopItem[] }>('/admin/shops'),
    enabled: user?.role === 'admin',
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

  const isAdmin = user?.role === 'admin';
  const isViewingShop = location.pathname.startsWith('/shop');
  const navItems = isAdmin && !isViewingShop ? ADMIN_NAV_ITEMS : SHOP_NAV_ITEMS;

  // Group nav items
  const groupedNav = navItems.reduce<Record<string, typeof navItems>>((acc, item) => {
    const g = item.group;
    if (!acc[g]) acc[g] = [];
    acc[g].push(item);
    return acc;
  }, {});

  const currentShopName = summary?.shopName || 'Shop Portal';
  const initials = (user?.name || user?.phone || 'U').slice(0, 2).toUpperCase();

  return (
    <div style={{ display: 'flex', minHeight: '100dvh', background: T.bg, fontFamily: '"Inter", system-ui, sans-serif' }}>
      {/* ── Desktop Sidebar (240px) ── */}
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
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: T.orangeLight,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: T.orange,
                fontWeight: 800,
                fontSize: '18px',
                flexShrink: 0,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>
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
                  fontFamily: '"Plus Jakarta Sans", Inter, sans-serif',
                }}
              >
                {isAdmin && !isViewingShop ? 'Stamp Admin' : currentShopName}
              </div>
              <div style={{ fontSize: '11px', color: T.textLight, marginTop: '2px' }}>
                {isAdmin ? (isViewingShop ? 'Super Admin Mode' : 'Platform Governance') : 'Merchant Counter'}
              </div>
            </div>
          </div>
        </div>

        {/* Super Admin Switcher (When inside /shop) */}
        {isAdmin && isViewingShop && (
          <div
            style={{
              padding: '10px 14px',
              background: '#FFF7ED',
              borderBottom: '1px solid #FED7AA',
              fontSize: '12px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontWeight: 700, color: '#C2410C', fontSize: '11px', textTransform: 'uppercase' }}>
                Switch Shop
              </span>
              <button
                onClick={() => exitImpersonation()}
                style={{ color: '#C2410C', fontWeight: 700, fontSize: '11px', textDecoration: 'underline' }}
              >
                Exit to Admin
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
                border: '1px solid #FDBA74',
                background: '#FFFFFF',
                fontSize: '12px',
                color: T.text,
                fontWeight: 600,
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

        {/* Nav Links */}
        <nav style={{ flex: 1, padding: '14px 10px', overflowY: 'auto' }}>
          {Object.entries(groupedNav).map(([group, items]) => (
            <div key={group} style={{ marginBottom: '16px' }}>
              <div
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  color: T.textLight,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  padding: '0 10px',
                  marginBottom: '4px',
                }}
              >
                {group}
              </div>
              {items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/shop' || item.to === '/admin'}
                  style={{ textDecoration: 'none' }}
                >
                  {({ isActive }) => (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '8px 10px',
                        borderRadius: '10px',
                        marginBottom: '2px',
                        background: isActive ? T.orangeLight : 'transparent',
                        color: isActive ? T.orangeDark : T.textMuted,
                        fontWeight: isActive ? 700 : 500,
                        fontSize: '13px',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) e.currentTarget.style.background = '#F1F5F9';
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: isActive ? T.orange : 'transparent',
                          color: isActive ? '#FFFFFF' : T.textMuted,
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                          {item.icon}
                        </span>
                      </div>
                      <span style={{ flex: 1 }}>{item.label}</span>
                    </div>
                  )}
                </NavLink>
              ))}
            </div>
          ))}

          {/* Jump to Admin Portal Shortcut if Admin is in Shop */}
          {isAdmin && isViewingShop && (
            <div style={{ marginTop: '12px', padding: '0 8px' }}>
              <Link
                to="/admin"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  background: '#F1F5F9',
                  color: T.text,
                  fontSize: '12px',
                  fontWeight: 700,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                  arrow_back
                </span>
                Super Admin Portal
              </Link>
            </div>
          )}

          {/* Quick Scanner Shortcut */}
          <button
            onClick={() => navigate('/shop/scan')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 10px',
              borderRadius: '8px',
              marginTop: '8px',
              background: 'none',
              border: `1px dashed ${T.border}`,
              cursor: 'pointer',
              fontSize: '12px',
              color: T.textLight,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px', color: T.orange }}>
              qr_code_scanner
            </span>
            <span style={{ flex: 1, textAlign: 'left', fontWeight: 600 }}>Quick Scan</span>
            <kbd style={{ fontSize: '10px', background: '#F1F5F9', padding: '2px 5px', borderRadius: '4px' }}>⌘K</kbd>
          </button>
        </nav>

        {/* User Footer */}
        <div style={{ padding: '12px 14px', borderTop: `1px solid ${T.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: T.orangeLight,
                color: T.orange,
                fontWeight: 800,
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
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
                {user?.name || user?.phone}
              </div>
              <div style={{ fontSize: '10px', color: T.textLight, textTransform: 'capitalize' }}>{user?.role}</div>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              style={{
                padding: '6px',
                borderRadius: '6px',
                color: T.textMuted,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#EF4444')}
              onMouseLeave={(e) => (e.currentTarget.style.color = T.textMuted)}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                logout
              </span>
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main Layout (Header + Content + Mobile Bar) ── */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
        }}
        className="app-main-content-wrapper"
      >
        {/* Mobile Top Navbar */}
        <header
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 30,
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(8px)',
            borderBottom: `1px solid ${T.border}`,
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
          className="app-mobile-header"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                padding: '6px',
                borderRadius: '8px',
                color: T.text,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>
                {mobileMenuOpen ? 'close' : 'menu'}
              </span>
            </button>
            <div style={{ fontWeight: 800, fontSize: '15px', color: T.text, fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
              {isAdmin && !isViewingShop ? 'Super Admin' : currentShopName}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={() => navigate('/shop/scan')}
              style={{
                background: T.orange,
                color: '#fff',
                padding: '6px 10px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                qr_code_scanner
              </span>
              Scan
            </button>
          </div>
        </header>

        {/* Mobile Menu Drawer */}
        {mobileMenuOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              top: '52px',
              background: 'rgba(15, 23, 42, 0.4)',
              zIndex: 50,
              backdropFilter: 'blur(2px)',
            }}
            onClick={() => setMobileMenuOpen(false)}
          >
            <div
              style={{
                background: T.white,
                width: '260px',
                height: '100%',
                padding: '16px',
                overflowY: 'auto',
                boxShadow: T.shadow,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ marginBottom: '16px', paddingBottom: '12px', borderBottom: `1px solid ${T.border}` }}>
                <div style={{ fontSize: '14px', fontWeight: 800 }}>{currentShopName}</div>
                <div style={{ fontSize: '12px', color: T.textLight }}>{user?.phone}</div>
              </div>

              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/shop' || item.to === '/admin'}
                  onClick={() => setMobileMenuOpen(false)}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    marginBottom: '4px',
                    background: isActive ? T.orangeLight : 'transparent',
                    color: isActive ? T.orangeDark : T.text,
                    fontWeight: isActive ? 700 : 500,
                    fontSize: '14px',
                    textDecoration: 'none',
                  })}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                    {item.icon}
                  </span>
                  {item.label}
                </NavLink>
              ))}

              <div style={{ marginTop: '20px', paddingTop: '12px', borderTop: `1px solid ${T.border}` }}>
                <button
                  onClick={logout}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 12px',
                    color: '#EF4444',
                    fontWeight: 600,
                    fontSize: '14px',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                    logout
                  </span>
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content Area */}
        <main
          style={{
            flex: 1,
            padding: '24px 20px 80px',
            maxWidth: '1120px',
            width: '100%',
            margin: '0 auto',
          }}
          className="app-main-content"
        >
          {children}
        </main>

        {/* Mobile Bottom Navigation Bar */}
        <nav
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'rgba(255, 255, 255, 0.98)',
            borderTop: `1px solid ${T.border}`,
            padding: '6px 12px',
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            zIndex: 30,
            boxShadow: '0 -2px 10px rgba(0,0,0,0.03)',
          }}
          className="app-mobile-bottom-bar"
        >
          <NavLink
            to={isAdmin && !isViewingShop ? '/admin' : '/shop'}
            end
            style={({ isActive }) => ({
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px',
              color: isActive ? T.orange : T.textMuted,
              fontSize: '10px',
              fontWeight: isActive ? 700 : 500,
              textDecoration: 'none',
              padding: '4px 8px',
            })}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>
              dashboard
            </span>
            Dashboard
          </NavLink>

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
              padding: '4px 8px',
            })}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>
              qr_code_scanner
            </span>
            Scan
          </NavLink>

          <NavLink
            to="/shop/customers"
            style={({ isActive }) => ({
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px',
              color: isActive ? T.orange : T.textMuted,
              fontSize: '10px',
              fontWeight: isActive ? 700 : 500,
              textDecoration: 'none',
              padding: '4px 8px',
            })}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>
              group
            </span>
            Members
          </NavLink>

          <NavLink
            to="/shop/redeem"
            style={({ isActive }) => ({
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px',
              color: isActive ? T.orange : T.textMuted,
              fontSize: '10px',
              fontWeight: isActive ? 700 : 500,
              textDecoration: 'none',
              padding: '4px 8px',
            })}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>
              redeem
            </span>
            Redeem
          </NavLink>
        </nav>
      </div>

      {/* Responsive media query styling */}
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
          .app-main-content {
            padding-bottom: 40px !important;
          }
        }
      `}</style>
    </div>
  );
}

