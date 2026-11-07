import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import QRCode from 'qrcode';
import * as Dialog from '@radix-ui/react-dialog';
import { api } from '../../lib/api.ts';
import {
  StampImpression,
  MerchantStampIcon,
  StatusMark,
  StampIconId,
} from '../../components/svg/Icons.tsx';

interface CardDetailData {
  shop: { id: string; name: string; slug: string };
  program: {
    stampsRequired: number;
    rewardText: string;
    cooldownMinutes: number;
    scratchEnabled: boolean;
  };
  balance: number;
  cardsIssued: number;
  totalStampsEver: number;
  recentStamps: Array<{
    id: string;
    status: 'counted' | 'pending' | 'voided';
    createdAt: string;
  }>;
}

export default function CardDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [showQrModal, setShowQrModal] = useState(false);

  const { data, isLoading, error } = useQuery<CardDetailData>({
    queryKey: ['card-detail', slug],
    queryFn: () => api.get<CardDetailData>(`/cards/${slug}`),
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ maxWidth: 480, margin: '60px auto', padding: '24px', textAlign: 'center', background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: '#DC2626' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>
            error_outline
          </span>
        </div>
        <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 6px' }}>Card Not Found</h2>
        <p style={{ color: '#64748B', fontSize: '13px', margin: '0 0 16px' }}>
          Could not find an active loyalty membership for this merchant.
        </p>
        <Link
          to="/"
          style={{
            display: 'inline-block',
            padding: '10px 20px',
            borderRadius: '10px',
            background: '#FF6B35',
            color: '#FFFFFF',
            fontWeight: 700,
            fontSize: '13px',
            textDecoration: 'none',
          }}
        >
          Back to My Passes
        </Link>
      </div>
    );
  }

  const { shop, program, balance, cardsIssued, totalStampsEver, recentStamps } = data;
  const stampsRequired = program.stampsRequired || 8;
  const remaining = Math.max(0, stampsRequired - balance);
  const pct = Math.min(100, Math.round((balance / stampsRequired) * 100));

  // Determine icon & gradient theme from slug
  let iconId: StampIconId = 'chai';
  let gradient = 'linear-gradient(135deg, #FF6B35 0%, #E85A28 60%, #C2410C 100%)';
  let accentColor = '#FF6B35';

  if (shop.slug.includes('cut') || shop.slug.includes('salon')) {
    iconId = 'scissors';
    gradient = 'linear-gradient(135deg, #4B2E9A 0%, #6D28D9 60%, #312E81 100%)';
    accentColor = '#4B2E9A';
  } else if (shop.slug.includes('bake') || shop.slug.includes('cafe')) {
    iconId = 'croissant';
    gradient = 'linear-gradient(135deg, #1F5C3E 0%, #059669 60%, #064E3B 100%)';
    accentColor = '#1F5C3E';
  } else if (shop.slug.includes('fit') || shop.slug.includes('gym')) {
    iconId = 'dumbbell';
    gradient = 'linear-gradient(135deg, #1D5F8A 0%, #0284C7 60%, #0C4A6E 100%)';
    accentColor = '#1D5F8A';
  }

  return (
    <div
      style={{
        maxWidth: 580,
        margin: '0 auto',
        minHeight: '100vh',
        background: '#F8FAFC',
        paddingBottom: '90px',
        fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
      }}
    >
      {/* ── 1. Top Navigation Bar ── */}
      <nav
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
        }}
      >
        <button
          onClick={() => navigate('/')}
          style={{
            background: 'none',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            color: '#0F172A',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
            arrow_back
          </span>
          My Passes
        </button>

        <span
          style={{
            fontSize: '11px',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            padding: '2px 8px',
            borderRadius: '6px',
            background: '#E6F5EE',
            color: '#1F8A5B',
          }}
        >
          Verified Partner
        </span>
      </nav>

      <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* ── 2. Hero 3D / Glossy Digital Loyalty Pass (Swiggy One style) ── */}
        <div
          style={{
            background: gradient,
            borderRadius: '24px',
            padding: '24px',
            color: '#FFFFFF',
            boxShadow: '0 12px 32px rgba(15,23,42,0.15)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Holographic light reflection */}
          <div
            style={{
              position: 'absolute',
              top: '-60px',
              right: '-60px',
              width: '200px',
              height: '200px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255,255,255,0.25) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />

          {/* Card Top Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.9 }}>
                OFFICIAL DIGITAL PASS
              </div>
              <h1 style={{ fontSize: '22px', fontWeight: 800, margin: '2px 0 0', textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                {shop.name}
              </h1>
              <p style={{ fontSize: '12px', margin: '2px 0 0', opacity: 0.85 }}>
                {program.rewardText || 'Collect stamps for an exclusive reward'}
              </p>
            </div>

            {/* Chip & NFC Waves Replica */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '32px', height: '26px', borderRadius: '6px', background: '#F59E0B', border: '1px solid #D97706', opacity: 0.9 }} />
              <span className="material-symbols-outlined" style={{ fontSize: '24px', opacity: 0.9 }}>
                contactless
              </span>
            </div>
          </div>

          {/* Stamp Counter & Motivational Progress Text */}
          <div style={{ background: 'rgba(0,0,0,0.12)', borderRadius: '16px', padding: '14px 16px', marginBottom: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div>
                <span style={{ fontSize: '24px', fontWeight: 800 }} className="tabular">
                  {balance}
                </span>
                <span style={{ fontSize: '14px', opacity: 0.8 }}> of {stampsRequired} Stamps</span>
              </div>
              <span style={{ fontSize: '12px', fontWeight: 700, background: 'rgba(255,255,255,0.2)', padding: '3px 10px', borderRadius: '999px' }}>
                {pct}% Complete
              </span>
            </div>

            {/* Progress Track */}
            <div style={{ height: '8px', background: 'rgba(255,255,255,0.2)', borderRadius: '999px', overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: '#FFFFFF', borderRadius: '999px', transition: 'width 0.4s ease' }} />
            </div>

            <div style={{ fontSize: '12px', marginTop: '8px', opacity: 0.95 }}>
              {remaining === 0 ? '🎉 Grand Reward Unlocked! Claim at counter.' : `✨ Only ${remaining} more visit${remaining === 1 ? '' : 's'} to unlock reward!`}
            </div>
          </div>

          {/* Card Footer: Member Number & Tap QR Action */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
            <div style={{ fontFamily: 'monospace', letterSpacing: '0.08em', opacity: 0.85 }}>
              MEMBER #{shop.slug.slice(0, 4).toUpperCase()}-{(totalStampsEver + 100).toString()}
            </div>
            <button
              onClick={() => setShowQrModal(true)}
              style={{
                background: '#FFFFFF',
                color: '#0F172A',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                qr_code_2
              </span>
              Show QR
            </button>
          </div>
        </div>

        {/* ── 3. Interactive Stamp Grid ── */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: '20px',
            border: '1px solid #E2E8F0',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: '#0F172A' }}>
              Stamp Card Grid
            </h3>
            <span style={{ fontSize: '12px', color: '#64748B' }}>
              {balance} stamped · {remaining} remaining
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${stampsRequired <= 6 ? stampsRequired : stampsRequired <= 10 ? 5 : 4}, 1fr)`,
              gap: '10px',
            }}
          >
            {Array.from({ length: stampsRequired }).map((_, i) => {
              const isStamped = i < balance;
              return (
                <div
                  key={i}
                  style={{
                    aspectRatio: '1/1',
                    borderRadius: '14px',
                    border: isStamped ? `2px solid ${accentColor}` : '2px dashed #CBD5E1',
                    background: isStamped ? `${accentColor}12` : '#F8FAFC',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {isStamped ? (
                    <StampImpression shape="scalloped" size={44} color={accentColor} rotation={(i % 3) * 3 - 3}>
                      <MerchantStampIcon icon={iconId} filled size={22} color={accentColor} />
                    </StampImpression>
                  ) : (
                    <div style={{ textAlign: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#94A3B8' }} className="tabular">
                        {i + 1}
                      </span>
                    </div>
                  )}

                  {/* Grand milestone badge on last slot */}
                  {i === stampsRequired - 1 && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '-8px',
                        right: '-8px',
                        background: '#F59E0B',
                        color: '#FFFFFF',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        fontWeight: 800,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                      }}
                      title="Grand Completion Reward"
                    >
                      ★
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Reward Ready Banner */}
          {cardsIssued > 0 && (
            <div
              style={{
                marginTop: '16px',
                padding: '12px 16px',
                background: '#E6F5EE',
                border: '1px solid #1F8A5B',
                borderRadius: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <strong style={{ fontSize: '13.5px', color: '#1F8A5B' }}>
                  🎉 {cardsIssued} Reward Ready to Claim!
                </strong>
                <div style={{ fontSize: '11.5px', color: '#166534', marginTop: '1px' }}>
                  {program.rewardText}
                </div>
              </div>
              <Link
                to="/rewards"
                style={{
                  background: '#1F8A5B',
                  color: '#FFFFFF',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                Claim Now →
              </Link>
            </div>
          )}
        </div>

        {/* ── 4. Swiggy-Style Active Rewards & Offers Shelf ── */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: '20px',
            border: '1px solid #E2E8F0',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: '#0F172A' }}>
              Active Offers & Perks
            </h3>
            <Link to="/rewards" style={{ fontSize: '12px', fontWeight: 700, color: accentColor, textDecoration: 'none' }}>
              My Rewards ({cardsIssued}) →
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Offer 1 */}
            <div
              style={{
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                padding: '12px 14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#F8FAFC',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#FFF4EF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FF6B35' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                    workspace_premium
                  </span>
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A' }}>
                    {program.rewardText || 'Free Artisanal Item'}
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#64748B' }}>
                    Unlocks at {stampsRequired} stamps · {remaining === 0 ? 'Ready!' : `${remaining} visits left`}
                  </div>
                </div>
              </div>

              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '3px 8px',
                  borderRadius: '6px',
                  background: remaining === 0 ? '#E6F5EE' : '#F1F5F9',
                  color: remaining === 0 ? '#1F8A5B' : '#64748B',
                }}
              >
                {remaining === 0 ? 'UNLOCKED' : `${pct}%`}
              </span>
            </div>

            {/* Offer 2 */}
            <div
              style={{
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                padding: '12px 14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#F8FAFC',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#B45309' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                    stars
                  </span>
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A' }}>
                    Instant Scratch Card
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#64748B' }}>
                    Awarded with every counter visit scan
                  </div>
                </div>
              </div>

              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '3px 8px',
                  borderRadius: '6px',
                  background: '#FEF3C7',
                  color: '#B45309',
                }}
              >
                SCRATCH & WIN
              </span>
            </div>
          </div>
        </div>

        {/* ── 5. Khata Visit History Ledger ── */}
        <section
          style={{
            background: '#FFFFFF',
            borderRadius: '20px',
            border: '1px solid #E2E8F0',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: '#0F172A' }}>
                Visit History Ledger
              </h3>
              <p style={{ fontSize: '12px', color: '#64748B', margin: '2px 0 0' }}>
                Scoped strictly to {shop.name}
              </p>
            </div>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A' }}>
              {recentStamps.length} visits recorded
            </span>
          </div>

          {recentStamps.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: '#64748B', fontSize: '13px' }}>
              No recorded visits yet. Scan the store QR standee to collect your first stamp!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {recentStamps.map((stamp, idx) => (
                <div
                  key={stamp.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 0',
                    borderBottom: idx < recentStamps.length - 1 ? '1px solid #F1F5F9' : 'none',
                    fontSize: '13px',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, color: '#0F172A' }}>
                      Counter Visit #{recentStamps.length - idx}
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '1px' }}>
                      {new Date(stamp.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                  <StatusMark status={stamp.status} />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ── 6. Floating Bottom Action Dock (Swiggy style) ── */}
      <div
        style={{
          position: 'fixed',
          bottom: '16px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'calc(100% - 32px)',
          maxWidth: '540px',
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
        <div>
          <div style={{ fontSize: '13px', fontWeight: 800 }}>Present Pass</div>
          <div style={{ fontSize: '11px', color: '#94A3B8' }}>Cashier scans to stamp visit</div>
        </div>

        <button
          onClick={() => setShowQrModal(true)}
          style={{
            background: accentColor,
            color: '#FFFFFF',
            border: 'none',
            padding: '8px 18px',
            borderRadius: '10px',
            fontWeight: 800,
            fontSize: '13px',
            cursor: 'pointer',
            boxShadow: `0 2px 10px ${accentColor}40`,
          }}
        >
          📱 Open QR
        </button>
      </div>

      {/* Customer QR Modal */}
      <CustomerQrModal open={showQrModal} onOpenChange={setShowQrModal} shopSlug={shop.slug} />
    </div>
  );
}

function CustomerQrModal({
  open,
  onOpenChange,
  shopSlug,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shopSlug: string;
}) {
  const [qrSvg, setQrSvg] = useState('');
  const [countdown, setCountdown] = useState(25);

  const { data: qrData, refetch } = useQuery<{ ok: boolean; token: string; name: string; phone: string }>({
    queryKey: ['customer-qr', shopSlug],
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
            Cashier scans this code with their staff camera to add your stamp.
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
