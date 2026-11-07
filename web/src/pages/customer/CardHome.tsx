import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import QRCode from 'qrcode';
import { api } from '../../lib/api.ts';
import { useAuth } from '../../hooks/useAuth.tsx';
import { S } from '../../strings.ts';
import { isIOS, isStandalone } from '../../lib/format.ts';
import { StampImpression, MerchantStampIcon, StampIconId } from '../../components/svg/Icons.tsx';

interface CardSummary {
  shopId: string;
  shopName: string;
  shopSlug: string;
  stampsRequired: number;
  balance: number;
  cardsIssued: number;
}

const GRADIENTS = [
  'linear-gradient(135deg, #FF6B35 0%, #E85A28 60%, #C2410C 100%)',
  'linear-gradient(135deg, #4B2E9A 0%, #6D28D9 60%, #312E81 100%)',
  'linear-gradient(135deg, #1F5C3E 0%, #059669 60%, #064E3B 100%)',
  'linear-gradient(135deg, #1D5F8A 0%, #0284C7 60%, #0C4A6E 100%)',
];

export default function CardHomePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showQrModal, setShowQrModal] = useState(false);
  const [showIosHint, setShowIosHint] = useState(false);

  useEffect(() => {
    if (isIOS() && !isStandalone()) {
      setShowIosHint(true);
    }
  }, []);

  const { data, isLoading, error } = useQuery({
    queryKey: ['cards'],
    queryFn: () => api.get<{ cards: CardSummary[] }>('/cards'),
  });

  const cards = data?.cards || [];
  const totalRewards = cards.reduce((acc, c) => acc + (c.cardsIssued || 0), 0);

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', minHeight: '100vh', background: '#F8FAFC', paddingBottom: '90px', fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif' }}>
      {/* ── 1. Modern Swiggy-Style Top Navigation ── */}
      <header
        style={{
          background: 'rgba(255,255,255,0.96)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid #E2E8F0',
          padding: '12px 18px',
          position: 'sticky',
          top: 0,
          zIndex: 40,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: '#FFF4EF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FF6B35',
              fontWeight: 800,
              fontSize: '18px',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>
              loyalty
            </span>
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A' }}>
              Stamp Loyalty Pass
            </div>
            <div style={{ fontSize: '11px', color: '#64748B' }}>
              {user?.name || user?.phone || 'Customer'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link
            to="/explore"
            style={{
              fontSize: '12px',
              fontWeight: 700,
              color: '#0F172A',
              background: '#F1F5F9',
              padding: '6px 12px',
              borderRadius: '8px',
              textDecoration: 'none',
            }}
          >
            Browse Shops
          </Link>
          <button
            onClick={logout}
            style={{
              background: 'none',
              border: 'none',
              color: '#64748B',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              padding: '6px 8px',
            }}
          >
            Sign Out
          </button>
        </div>
      </header>

      <div style={{ padding: '16px 18px' }}>
        {/* iOS Add to Home Screen Gentle Hint */}
        {showIosHint && (
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              padding: '12px 14px',
              marginBottom: '16px',
              fontSize: '12.5px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            }}
          >
            <div>
              <strong style={{ color: '#0F172A' }}>{S.addToHomeTitle}</strong>
              <p style={{ color: '#64748B', margin: '2px 0 0', fontSize: '11.5px' }}>
                Tap Share then <strong>"Add to Home Screen"</strong> for instant 1-tap counter access.
              </p>
            </div>
            <button
              onClick={() => setShowIosHint(false)}
              style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '14px', cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Rewards Ready Alert Banner */}
        {totalRewards > 0 && (
          <div
            style={{
              background: 'linear-gradient(135deg, #E6F5EE 0%, #F0FDF4 100%)',
              border: '1px solid #1F8A5B',
              borderRadius: '14px',
              padding: '14px 16px',
              marginBottom: '18px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: '0 2px 8px rgba(31,138,91,0.08)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#1F8A5B', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                  workspace_premium
                </span>
              </div>
              <div>
                <strong style={{ fontSize: '13.5px', color: '#1F8A5B' }}>
                  🎉 {totalRewards} Reward{totalRewards > 1 ? 's' : ''} Ready!
                </strong>
                <div style={{ fontSize: '11.5px', color: '#166534', marginTop: '1px' }}>
                  Show claim code at the counter to redeem.
                </div>
              </div>
            </div>
            <Link
              to="/rewards"
              style={{
                background: '#1F8A5B',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '12px',
                padding: '6px 14px',
                borderRadius: '8px',
                textDecoration: 'none',
              }}
            >
              View Codes →
            </Link>
          </div>
        )}

        {/* Section Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#0F172A' }}>
              My Loyalty Passes
            </h2>
            <p style={{ fontSize: '12px', color: '#64748B', margin: '2px 0 0' }}>
              {cards.length} active merchant membership{cards.length === 1 ? '' : 's'}
            </p>
          </div>
          <button
            onClick={() => setShowQrModal(true)}
            style={{
              background: '#0F172A',
              color: '#FFFFFF',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(15,23,42,0.15)',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
              qr_code_2
            </span>
            My QR
          </button>
        </div>

        {/* Loading Spinner */}
        {isLoading && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div className="spinner" style={{ margin: '0 auto' }} />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && cards.length === 0 && (
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              border: '1px solid #E2E8F0',
              padding: '40px 20px',
              textAlign: 'center',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
            }}
          >
            <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: '#FFF4EF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: '#FF6B35' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>
                loyalty
              </span>
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', margin: '0 0 6px' }}>
              No loyalty passes yet
            </h3>
            <p style={{ fontSize: '13px', color: '#64748B', margin: '0 0 16px', maxWidth: '320px', marginInline: 'auto' }}>
              Visit any partner merchant and scan their counter standee QR to collect your first stamp!
            </p>
            <Link
              to="/explore"
              style={{
                display: 'inline-block',
                background: '#FF6B35',
                color: '#FFFFFF',
                padding: '10px 20px',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '13px',
                textDecoration: 'none',
                boxShadow: '0 4px 12px rgba(255,107,53,0.3)',
              }}
            >
              Explore Local Shops
            </Link>
          </div>
        )}

        {/* ── 2. Swiggy-Style Glossy Digital Loyalty Pass Cards ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {cards.map((card, idx) => {
            const gradient = GRADIENTS[idx % GRADIENTS.length];
            const pct = Math.min(100, Math.round((card.balance / card.stampsRequired) * 100));
            const remaining = Math.max(0, card.stampsRequired - card.balance);

            return (
              <div
                key={card.shopId}
                onClick={() => navigate(`/cards/${card.shopSlug}`)}
                style={{
                  background: gradient,
                  borderRadius: '20px',
                  padding: '20px',
                  color: '#FFFFFF',
                  boxShadow: '0 8px 24px rgba(15,23,42,0.12)',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'transform 0.15s ease',
                }}
              >
                {/* Glossy decorative sheen overlay */}
                <div
                  style={{
                    position: 'absolute',
                    top: '-40px',
                    right: '-40px',
                    width: '160px',
                    height: '160px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)',
                    pointerEvents: 'none',
                  }}
                />

                {/* Card Top Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.9 }}>
                      OFFICIAL MEMBER PASS
                    </span>
                    <h3 style={{ fontSize: '20px', fontWeight: 800, margin: '2px 0 0', textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                      {card.shopName}
                    </h3>
                  </div>

                  {/* Golden NFC Waves Replica */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '22px', opacity: 0.9 }}>
                      contactless
                    </span>
                    <div style={{ width: '28px', height: '22px', borderRadius: '4px', background: '#F59E0B', border: '1px solid #D97706', opacity: 0.85 }} />
                  </div>
                </div>

                {/* Stamp Slots Row */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${card.stampsRequired <= 6 ? card.stampsRequired : 6}, 1fr)`,
                    gap: '6px',
                    marginBottom: '16px',
                  }}
                >
                  {Array.from({ length: Math.min(card.stampsRequired, 6) }).map((_, i) => (
                    <div
                      key={i}
                      style={{
                        aspectRatio: '1/1',
                        borderRadius: '10px',
                        background: i < card.balance ? '#FFFFFF' : 'rgba(255,255,255,0.15)',
                        border: i < card.balance ? 'none' : '1px dashed rgba(255,255,255,0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: i < card.balance ? '#0F172A' : '#FFFFFF',
                        fontWeight: 800,
                        fontSize: '12px',
                        boxShadow: i < card.balance ? '0 2px 6px rgba(0,0,0,0.15)' : 'none',
                      }}
                    >
                      {i < card.balance ? '✓' : i + 1}
                    </div>
                  ))}
                </div>

                {/* Card Bottom Progress Bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 700 }}>
                      {card.balance} of {card.stampsRequired} Stamps Collected
                    </span>
                    <span style={{ opacity: 0.9 }}>
                      {remaining === 0 ? '🎉 Reward Ready!' : `${remaining} more to reward`}
                    </span>
                  </div>

                  {/* Progress track */}
                  <div style={{ height: '6px', background: 'rgba(255,255,255,0.25)', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: '#FFFFFF', borderRadius: '999px', transition: 'width 0.3s ease' }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 3. Floating Bottom Dock (Swiggy Order Tray style) ── */}
      <div
        style={{
          position: 'fixed',
          bottom: '16px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'calc(100% - 32px)',
          maxWidth: '560px',
          background: 'rgba(15,23,42,0.95)',
          backdropFilter: 'blur(16px)',
          borderRadius: '16px',
          padding: '10px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
          zIndex: 50,
          color: '#FFFFFF',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#FF6B35', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              qr_code_2
            </span>
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 800 }}>Counter Pass</div>
            <div style={{ fontSize: '11px', color: '#94A3B8' }}>Show to cashier for stamp</div>
          </div>
        </div>

        <button
          onClick={() => setShowQrModal(true)}
          style={{
            background: '#FF6B35',
            color: '#FFFFFF',
            border: 'none',
            padding: '8px 18px',
            borderRadius: '10px',
            fontWeight: 800,
            fontSize: '13px',
            cursor: 'pointer',
            boxShadow: '0 2px 10px rgba(255,107,53,0.3)',
          }}
        >
          📱 Open QR
        </button>
      </div>

      {/* Customer QR Modal */}
      <CustomerQrDialog open={showQrModal} onOpenChange={setShowQrModal} />
    </div>
  );
}

function CustomerQrDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [qrSvg, setQrSvg] = useState('');
  const [countdown, setCountdown] = useState(25);

  const { data: qrData, refetch } = useQuery<{ ok: boolean; token: string; name: string; phone: string }>({
    queryKey: ['customer-qr-home'],
    queryFn: () => api.get<{ ok: boolean; token: string; name: string; phone: string }>('/customer/qr'),
    enabled: open,
    refetchInterval: 25_000,
  });

  useEffect(() => {
    if (!open) return;
    setCountdown(25);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          refetch();
          return 25;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [open, refetch]);

  useEffect(() => {
    if (qrData?.token) {
      QRCode.toString(
        qrData.token,
        {
          type: 'svg',
          errorCorrectionLevel: 'M',
          margin: 1,
          color: { dark: '#0F172A', light: '#FFFFFF' },
        },
        (err: Error | null, svg: string) => {
          if (!err && svg) setQrSvg(svg);
        },
      );
    }
  }, [qrData?.token]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 100,
          }}
        />
        <Dialog.Content
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: '#FFFFFF',
            borderRadius: '20px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 20px 48px rgba(0,0,0,0.2)',
            width: '90%',
            maxWidth: '360px',
            padding: '24px',
            zIndex: 101,
            textAlign: 'center',
          }}
        >
          <Dialog.Title style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#0F172A' }}>
            Show to Counter Cashier
          </Dialog.Title>
          <Dialog.Description style={{ fontSize: '12.5px', color: '#64748B', marginTop: '4px' }}>
            Staff scans this to stamp your visit and grant scratch cards.
          </Dialog.Description>

          <div
            style={{
              margin: '20px auto 12px',
              width: '210px',
              height: '210px',
              background: '#FFFFFF',
              padding: '10px',
              borderRadius: '16px',
              border: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
            }}
            dangerouslySetInnerHTML={{ __html: qrSvg }}
          />

          <div style={{ fontSize: '12px', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <span>Auto-refreshes in</span>
            <strong className="tabular" style={{ color: '#FF6B35', fontWeight: 800 }}>
              {countdown}s
            </strong>
          </div>

          <button
            onClick={() => onOpenChange(false)}
            style={{
              width: '100%',
              marginTop: '20px',
              padding: '12px',
              borderRadius: '12px',
              border: 'none',
              background: '#0F172A',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Done
          </button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
