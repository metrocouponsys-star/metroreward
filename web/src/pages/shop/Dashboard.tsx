import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api.ts';
import { useAuth } from '../../hooks/useAuth.tsx';
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
  const { user } = useAuth();
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
    <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* ── 1. Greeting & Quick Action Banner (Metrocard style) ── */}
      <section
        style={{
          background: 'linear-gradient(135deg, #FFF7ED 0%, #FFFFFF 50%, #F0FDFA 100%)',
          border: '1px solid #FED7AA',
          borderRadius: '16px',
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          boxShadow: '0 2px 10px rgba(255,107,53,0.04)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#16a34a', display: 'inline-block' }} />
            <span style={{ fontSize: '11.5px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#C2410C' }}>
              Counter Active · Live Desk
            </span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', margin: '2px 0' }}>
            {greeting()}, {shopName}!
          </h1>
          <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>
            Ready to issue stamps, redeem reward coupons, and engage your regulars.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {shopSlug && (
            <a
              href={`/s/${shopSlug}`}
              target="_blank"
              rel="noreferrer"
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: '#64748B',
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                padding: '8px 12px',
                borderRadius: '8px',
                textDecoration: 'none',
              }}
            >
              /s/{shopSlug} ↗
            </a>
          )}
          <Link
            to="/shop/scan"
            style={{
              height: '42px',
              padding: '0 20px',
              borderRadius: '10px',
              border: 'none',
              background: '#FF6B35',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '13.5px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              textDecoration: 'none',
              boxShadow: '0 4px 14px rgba(255,107,53,0.35)',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              qr_code_scanner
            </span>
            Scan Customer QR
          </Link>
        </div>
      </section>

      {/* ── 2. Stat Blocks with Left Color Stripe (Metrocard style) ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '14px',
        }}
      >
        {/* Today's Stamps */}
        <div
          onClick={() => navigate('/shop/feed')}
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
          <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#FF6B35' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Stamps Today
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#FFF4EF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FF6B35' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                loyalty
              </span>
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#0F172A', marginTop: '6px' }} className="tabular">
            {summary?.stampsToday ?? 0}
          </div>
          <div style={{ fontSize: '11.5px', color: '#FF6B35', marginTop: '4px', fontWeight: 600 }}>
            Recorded at counter
          </div>
        </div>

        {/* Regular Members */}
        <div
          onClick={() => navigate('/shop/customers')}
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
              Total Regulars
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#E0FFF6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00D4AA' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                group
              </span>
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#0F172A', marginTop: '6px' }} className="tabular">
            {memberCount}
          </div>
          <div style={{ fontSize: '11.5px', color: '#00D4AA', marginTop: '4px', fontWeight: 600 }}>
            Registered customers
          </div>
        </div>

        {/* Scratch Wins Today */}
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
              Scratch Wins
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#B45309' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                stars
              </span>
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#0F172A', marginTop: '6px' }} className="tabular">
            {summary?.scratchWinsToday ?? 0}
          </div>
          <div style={{ fontSize: '11.5px', color: '#B45309', marginTop: '4px', fontWeight: 600 }}>
            Won by customers today
          </div>
        </div>

        {/* Redeemed Today */}
        <div
          onClick={() => navigate('/shop/redeem')}
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
          <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#6366F1' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Redeemed Today
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366F1' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                redeem
              </span>
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#0F172A', marginTop: '6px' }} className="tabular">
            {summary?.redeemedToday ?? 0}
          </div>
          <div style={{ fontSize: '11.5px', color: '#6366F1', marginTop: '4px', fontWeight: 600 }}>
            Completed rewards
          </div>
        </div>
      </div>

      {/* ── 3. Quick Action Tiles (Metrocard style) ── */}
      <div>
        <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A', marginBottom: '12px' }}>
          Counter Quick Actions
        </h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '12px',
          }}
        >
          {[
            { to: '/shop/scan', icon: 'qr_code_scanner', label: 'Scan Customer QR', color: '#FF6B35', bg: '#FFF4EF' },
            { to: '/shop/redeem', icon: 'redeem', label: 'Redeem Reward Code', color: '#6366F1', bg: '#EEF2FF' },
            { to: '/shop/program', icon: 'palette', label: 'Card Studio & Rules', color: '#00D4AA', bg: '#E0FFF6' },
            { to: '/shop/qr', icon: 'qr_code_2', label: 'Counter Display QR', color: '#F59E0B', bg: '#FEF3C7' },
            { to: '/shop/print-qr', icon: 'print', label: 'Print QR Poster', color: '#0F172A', bg: '#F1F5F9' },
            { to: '/shop/feed', icon: 'history', label: 'Daily Khata Ledger', color: '#10B981', bg: '#ECFDF5' },
          ].map((action) => (
            <Link
              key={action.to}
              to={action.to}
              style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '14px',
                padding: '16px 12px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '10px',
                textDecoration: 'none',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: action.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '22px', color: action.color, fontVariationSettings: "'FILL' 1" }}>
                  {action.icon}
                </span>
              </div>
              <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#0F172A', textAlign: 'center', lineHeight: 1.3 }}>
                {action.label}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* ── 4. Live Counter Activity Feed (Daily Khata) ── */}
      <section
        style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: '#0F172A' }}>
              Live Counter Activity Feed
            </h3>
            <p style={{ fontSize: '12px', color: '#64748B', margin: '2px 0 0' }}>
              Real-time stamp visits, scratch wins, and rewards recorded at your counter
            </p>
          </div>
          <Link to="/shop/feed" style={{ fontSize: '12px', fontWeight: 700, color: '#FF6B35', textDecoration: 'none' }}>
            View Full Khata →
          </Link>
        </div>

        {feed?.events && feed.events.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {feed.events.slice(0, 6).map((ev, idx) => (
              <div
                key={ev.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 0',
                  borderBottom: idx < 5 ? '1px solid #F1F5F9' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: ev.status === 'counted' ? '#E6F5EE' : ev.status === 'pending' ? '#FEF3C7' : '#FEE2E2',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: ev.status === 'counted' ? '#1F8A5B' : ev.status === 'pending' ? '#B45309' : '#B91C1C',
                      fontWeight: 800,
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                      {ev.status === 'counted' ? 'check' : ev.status === 'pending' ? 'schedule' : 'block'}
                    </span>
                  </div>
                  <div>
                    <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0F172A' }}>
                      {ev.customerName || ev.customerPhone || 'Member Visit'}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748B', marginTop: '1px' }}>
                      {toISTDateTime(ev.createdAt)}
                    </div>
                  </div>
                </div>

                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '6px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    background: ev.status === 'counted' ? '#E6F5EE' : ev.status === 'pending' ? '#FEF3C7' : '#FEE2E2',
                    color: ev.status === 'counted' ? '#1F8A5B' : ev.status === 'pending' ? '#B45309' : '#B91C1C',
                  }}
                >
                  {ev.status === 'counted' ? '+1 Stamp' : ev.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '32px 16px', color: '#64748B' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '32px', color: '#CBD5E1', marginBottom: '8px' }}>
              receipt_long
            </span>
            <p style={{ fontSize: '13px', margin: 0 }}>No stamp visits recorded yet today.</p>
            <p style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px' }}>
              Show your counter QR to customers to start recording visits.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
