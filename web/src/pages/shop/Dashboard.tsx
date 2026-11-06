import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api.ts';
import { useAuth } from '../../hooks/useAuth.tsx';
import { S } from '../../strings.ts';
import { toISTDateTime } from '../../lib/format.ts';

interface Summary {
  shopId?: string;
  shopName?: string;
  shopSlug?: string;
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

interface CustomerRow {
  customerId: string;
  customerName: string;
  customerPhone: string;
  lastVisit: string;
  totalStamps: number;
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

export default function ShopDashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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

  const { data: customersData } = useQuery({
    queryKey: ['shop-customers'],
    queryFn: () => api.get<{ customers: CustomerRow[] }>('/shop/customers'),
    staleTime: 30_000,
  });

  const shopName = summary?.shopName || 'Merchant Portal';
  const shopSlug = summary?.shopSlug || '';
  const memberCount = customersData?.customers.length ?? 0;

  return (
    <div className="page" style={{ maxWidth: 1080, margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Top Bar for standalone mobile / quick controls */}
      <nav className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="topbar-title">{shopName}</span>
          {shopSlug && (
            <a
              href={`/s/${shopSlug}`}
              target="_blank"
              rel="noreferrer"
              style={{ fontSize: '0.75rem', color: 'var(--orange-dark)', textDecoration: 'underline' }}
            >
              /s/{shopSlug} ↗
            </a>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Link to="/shop/scan" className="btn-primary" style={{ padding: '0.375rem 0.75rem', fontSize: '0.8125rem' }}>
            📷 Scan Customer
          </Link>
          <button className="btn-ghost" onClick={logout} style={{ padding: '0.375rem 0.625rem', fontSize: '0.8125rem' }}>
            {S.signOut}
          </button>
        </div>
      </nav>

      <div className="content" style={{ padding: '1.25rem 0' }}>
        {/* ── Greeting Banner ── */}
        <section
          style={{
            background: 'linear-gradient(135deg, #FFF7ED 0%, #FFFFFF 60%, #F0FDFA 100%)',
            border: '1px solid #FED7AA',
            borderRadius: '16px',
            padding: '1.25rem 1.5rem',
            marginBottom: '1.5rem',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#C2410C', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {greeting()}, {shopName}
            </div>
            <h1 style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--ink)', margin: '0.25rem 0 0.125rem' }}>
              Counter Dashboard
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--ink-muted)', margin: 0 }}>
              Live customer stamp issuance, rewards redemption, and member loyalty metrics.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Link
              to="/shop/qr"
              className="btn-secondary"
              style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', background: '#00D4AA', color: '#003D32' }}
            >
              🎟️ Display Counter QR
            </Link>
            <Link
              to="/shop/print-qr"
              className="btn-outline"
              style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
            >
              🖨️ Print Counter Poster
            </Link>
          </div>
        </section>

        {/* ── Big CTA: Scan Customer QR (PRD Screen 2.1) ── */}
        <div
          onClick={() => navigate('/shop/scan')}
          style={{
            background: 'linear-gradient(135deg, #FF6B35 0%, #E85A28 100%)',
            color: '#FFFFFF',
            borderRadius: '16px',
            padding: '1.25rem 1.5rem',
            marginBottom: '1.5rem',
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(255, 107, 53, 0.25)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 107, 53, 0.35)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = '';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(255, 107, 53, 0.25)';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '28px', color: '#fff' }}>
                qr_code_scanner
              </span>
            </div>
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>Scan Customer QR Code</div>
              <div style={{ fontSize: '0.8125rem', opacity: 0.9 }}>
                Tap here to open camera and stamp customer card in under 3 seconds
              </div>
            </div>
          </div>
          <span
            style={{
              background: 'rgba(255, 255, 255, 0.25)',
              padding: '0.375rem 0.875rem',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.8125rem',
            }}
          >
            Open Scanner →
          </span>
        </div>

        {/* ── 4 Stat Cards with Color Stripes (PRD 2.1) ── */}
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
            gap: '0.875rem',
            marginBottom: '1.75rem',
          }}
        >
          {/* Stamps Today */}
          <div
            style={{
              background: '#FFFFFF',
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
              Stamps Today
            </div>
            <div style={{ fontSize: '1.875rem', fontWeight: 800, marginTop: '0.25rem', color: 'var(--ink)' }} className="tabular">
              {summary?.stampsToday ?? 0}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', marginTop: '0.25rem' }}>
              Visits recorded today
            </div>
          </div>

          {/* Rewards Redeemed */}
          <div
            style={{
              background: '#FFFFFF',
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
              Rewards Redeemed
            </div>
            <div style={{ fontSize: '1.875rem', fontWeight: 800, marginTop: '0.25rem', color: 'var(--ink)' }} className="tabular">
              {summary?.redeemedToday ?? 0}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', marginTop: '0.25rem' }}>
              Codes claimed at counter
            </div>
          </div>

          {/* Scratch Prizes Won */}
          <div
            style={{
              background: '#FFFFFF',
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
              Prizes Won
            </div>
            <div style={{ fontSize: '1.875rem', fontWeight: 800, marginTop: '0.25rem', color: 'var(--ink)' }} className="tabular">
              {summary?.scratchWinsToday ?? 0}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', marginTop: '0.25rem' }}>
              Scratch cards revealed today
            </div>
          </div>

          {/* Enrolled Members */}
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid var(--hairline)',
              borderRadius: '16px',
              padding: '1.125rem',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#0A1628' }} />
            <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Total Members
            </div>
            <div style={{ fontSize: '1.875rem', fontWeight: 800, marginTop: '0.25rem', color: 'var(--ink)' }} className="tabular">
              {memberCount}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', marginTop: '0.25rem' }}>
              Customers in your directory
            </div>
          </div>
        </section>

        {/* ── Quick Action Grid (6 Tiles) ── */}
        <h2 style={{ fontSize: '1.125rem', fontWeight: 800, marginBottom: '0.75rem', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
          Quick Counter Actions
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: '0.75rem',
            marginBottom: '2rem',
          }}
        >
          <button
            onClick={() => navigate('/shop/scan')}
            style={{
              background: '#FFFFFF',
              border: '1px solid var(--hairline)',
              borderRadius: '14px',
              padding: '16px 12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--orange-light)', color: 'var(--orange)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 24 }}>qr_code_scanner</span>
            </div>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink)' }}>Scan Customer</span>
          </button>

          <button
            onClick={() => navigate('/shop/qr')}
            style={{
              background: '#FFFFFF',
              border: '1px solid var(--hairline)',
              borderRadius: '14px',
              padding: '16px 12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#E0FFF6', color: '#00A885', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 24 }}>qr_code_2</span>
            </div>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink)' }}>Counter QR</span>
          </button>

          <button
            onClick={() => navigate('/shop/customers')}
            style={{
              background: '#FFFFFF',
              border: '1px solid var(--hairline)',
              borderRadius: '14px',
              padding: '16px 12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 24 }}>groups</span>
            </div>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink)' }}>Members ({memberCount})</span>
          </button>

          <button
            onClick={() => navigate('/shop/redeem')}
            style={{
              background: '#FFFFFF',
              border: '1px solid var(--hairline)',
              borderRadius: '14px',
              padding: '16px 12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 24 }}>redeem</span>
            </div>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink)' }}>Redeem Reward</span>
          </button>

          <button
            onClick={() => navigate('/shop/print-qr')}
            style={{
              background: '#FFFFFF',
              border: '1px solid var(--hairline)',
              borderRadius: '14px',
              padding: '16px 12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#F5F3FF', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 24 }}>print</span>
            </div>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink)' }}>Print Poster</span>
          </button>

          <button
            onClick={() => navigate('/shop/program')}
            style={{
              background: '#FFFFFF',
              border: '1px solid var(--hairline)',
              borderRadius: '14px',
              padding: '16px 12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#F1F5F9', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 24 }}>tune</span>
            </div>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink)' }}>Program Rules</span>
          </button>
        </div>

        {/* ── Live Activity Ledger (PRD 2.1) ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 800, margin: 0, fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
            Live Counter Activity
          </h2>
          <Link to="/shop/feed" style={{ fontSize: '0.8125rem', color: 'var(--orange-dark)', fontWeight: 700 }}>
            Full Activity Feed →
          </Link>
        </div>

        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid var(--hairline)',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          {!feed?.events.length ? (
            <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--ink-muted)' }}>
              <p style={{ margin: 0, fontWeight: 600 }}>{S.noActivity}</p>
              <p style={{ fontSize: '0.8125rem', margin: '0.25rem 0 0' }}>
                When customers scan your counter QR, live visits appear here in real time.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {feed.events.slice(0, 10).map((ev, i) => (
                <div
                  key={ev.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.875rem 1.25rem',
                    borderBottom: i < feed.events.length - 1 ? '1px solid var(--hairline)' : 'none',
                    gap: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: 'var(--orange-light)',
                        color: 'var(--orange)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '14px',
                      }}
                    >
                      🎟️
                    </div>
                    <div>
                      <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--ink)' }}>
                        {ev.customerName || 'Loyal Customer'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>
                        {ev.customerPhone}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', textAlign: 'right' }}>
                      {toISTDateTime(ev.createdAt)}
                    </div>
                    <span
                      style={{
                        padding: '0.1875rem 0.5rem',
                        borderRadius: '6px',
                        fontSize: '0.6875rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        background: ev.status === 'counted' ? '#DCFCE7' : ev.status === 'pending' ? '#FEF3C7' : '#FEE2E2',
                        color: ev.status === 'counted' ? '#15803D' : ev.status === 'pending' ? '#B45309' : '#B91C1C',
                      }}
                    >
                      {ev.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
