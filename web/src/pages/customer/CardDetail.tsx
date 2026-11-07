import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import QRCode from 'qrcode';
import * as Dialog from '@radix-ui/react-dialog';
import { api } from '../../lib/api.ts';
import { S } from '../../strings.ts';
import {
  PerforatedTicket,
  StampImpression,
  MerchantStampIcon,
  StatusMark,
  TallyMarks,
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
  const [lang, setLang] = useState<'en' | 'hi' | 'mr'>('en');

  const { data, isLoading, error } = useQuery<CardDetailData>({
    queryKey: ['card-detail', slug],
    queryFn: () => api.get<CardDetailData>(`/cards/${slug}`),
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="page" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="page" style={{ maxWidth: 540, margin: '2rem auto', padding: '1rem', textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚠️</div>
        <h2>Card Not Found</h2>
        <p style={{ color: 'var(--ink-muted)', marginTop: '0.5rem' }}>
          Could not load the loyalty card for this merchant.
        </p>
        <Link to="/" className="btn-primary" style={{ display: 'inline-block', marginTop: '1.25rem' }}>
          Back to My Cards
        </Link>
      </div>
    );
  }

  const { shop, program, balance, cardsIssued, totalStampsEver, recentStamps } = data;
  const stampsRequired = program.stampsRequired || 8;
  const cols = stampsRequired <= 6 ? stampsRequired : stampsRequired <= 10 ? 5 : 4;

  // Infer icon from shop slug
  let iconId: StampIconId = 'chai';
  if (shop.slug.includes('cut') || shop.slug.includes('salon')) iconId = 'scissors';
  else if (shop.slug.includes('bake') || shop.slug.includes('cafe')) iconId = 'croissant';
  else if (shop.slug.includes('gym') || shop.slug.includes('fit')) iconId = 'dumbbell';
  else if (shop.slug.includes('burger')) iconId = 'burger';
  else if (shop.slug.includes('pizza')) iconId = 'pizza';

  return (
    <div className="page" style={{ maxWidth: 560, margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Top Bar */}
      <nav className="topbar">
        <button className="btn-ghost" onClick={() => navigate('/')} style={{ padding: '0.4rem 0.6rem' }}>
          ← My Cards
        </button>
        <span className="topbar-title">{shop.name}</span>
        {/* Vernacular Language Selector */}
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value as any)}
          style={{
            background: 'none',
            border: '1px solid var(--hairline)',
            borderRadius: '6px',
            fontSize: '0.75rem',
            padding: '0.2rem 0.4rem',
            cursor: 'pointer',
          }}
        >
          <option value="en">EN</option>
          <option value="hi">हिन्दी</option>
          <option value="mr">मराठी</option>
        </select>
      </nav>

      <div className="content" style={{ padding: '1.25rem 0', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Tactile Perforated Ticket Card */}
        <PerforatedTicket
          accentColor="#FF6B35"
          stubContent={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)' }}>Progress: </span>
                <strong style={{ fontSize: '1rem', color: '#0F172A' }} className="tabular">
                  {balance} of {stampsRequired}
                </strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', marginLeft: '4px' }}>
                  ({Math.max(0, stampsRequired - balance)} more to reward)
                </span>
              </div>
              <StatusMark status={balance >= stampsRequired ? 'redeemed' : 'counted'} />
            </div>
          }
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
            <div>
              <span style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#FF6B35', fontWeight: 800 }}>
                OFFICIAL STAMP PASS
              </span>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0.125rem 0' }}>
                {shop.name}
              </h2>
              <p style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)', margin: 0 }}>
                {program.rewardText || 'Collect stamps for a special reward'}
              </p>
            </div>
            <MerchantStampIcon icon={iconId} filled size={36} color="#FF6B35" />
          </div>

          {/* Stamp Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${cols}, 1fr)`,
              gap: '0.75rem',
              padding: '0.75rem 0',
            }}
          >
            {Array.from({ length: stampsRequired }).map((_, i) => {
              const isFilled = i < balance;
              return (
                <div
                  key={i}
                  style={{
                    aspectRatio: '1/1',
                    borderRadius: '12px',
                    border: isFilled ? '2px solid #FF6B35' : '2px dashed var(--hairline)',
                    background: isFilled ? '#FFF4EF' : '#F8FAFC',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                  }}
                >
                  {isFilled ? (
                    <StampImpression shape="scalloped" size={44} color="#FF6B35" rotation={(i % 3) * 2 - 2}>
                      <MerchantStampIcon icon={iconId} filled size={20} color="#FF6B35" />
                    </StampImpression>
                  ) : (
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8' }} className="tabular">
                      {i + 1}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Reward Status Banner */}
          {cardsIssued > 0 && (
            <div
              style={{
                marginTop: '1rem',
                padding: '0.75rem 1rem',
                background: '#E6F5EE',
                border: '1px solid #1F8A5B',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <strong style={{ color: '#1F8A5B', fontSize: '0.875rem' }}>
                  🎉 {cardsIssued} Reward{cardsIssued > 1 ? 's' : ''} Ready!
                </strong>
                <div style={{ fontSize: '0.75rem', color: '#1F8A5B', opacity: 0.9 }}>
                  Claim your reward anytime at the counter.
                </div>
              </div>
              <Link
                to="/rewards"
                className="btn-primary"
                style={{
                  background: '#1F8A5B',
                  borderColor: '#1F8A5B',
                  fontSize: '0.75rem',
                  padding: '0.35rem 0.75rem',
                  width: 'auto',
                }}
              >
                Claim Now →
              </Link>
            </div>
          )}
        </PerforatedTicket>

        {/* Counter Action Quick Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <button
            className="btn-outline"
            onClick={() => setShowQrModal(true)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem' }}
          >
            <span>📱 Show My QR</span>
          </button>
          <Link
            to="/rewards"
            className="btn-primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.75rem',
              textDecoration: 'none',
              width: 'auto',
            }}
          >
            <span>🎁 My Rewards ({cardsIssued})</span>
          </Link>
        </div>

        {/* Khata Ledger (Visit History) */}
        <section
          style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid var(--hairline)',
            padding: '1.25rem',
            boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>
                Khata Ledger (Visit History)
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', margin: '0.2rem 0 0 0' }}>
                Strictly scoped to {shop.name}
              </p>
            </div>
            {totalStampsEver > 0 && <TallyMarks count={Math.min(totalStampsEver, 15)} color="#FF6B35" />}
          </div>

          {recentStamps.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--ink-muted)', fontSize: '0.875rem' }}>
              No recorded visits yet. Scan the counter QR to get your first stamp!
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
                    padding: '0.625rem 0',
                    borderBottom: idx < recentStamps.length - 1 ? '1px dashed var(--hairline)' : 'none',
                    fontSize: '0.8125rem',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, color: '#0F172A' }}>
                      Counter Visit #{recentStamps.length - idx}
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--ink-muted)', marginTop: '0.125rem' }}>
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

      {/* Rotating Personal Customer QR Modal */}
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
            background: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(3px)',
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
            borderRadius: '16px',
            border: '1px solid var(--hairline)',
            boxShadow: '0 16px 36px rgba(0,0,0,0.15)',
            width: '90%',
            maxWidth: '360px',
            padding: '1.5rem',
            zIndex: 101,
            textAlign: 'center',
          }}
        >
          <Dialog.Title style={{ fontSize: '1.125rem', fontWeight: 800, margin: 0 }}>
            Show to Counter Staff
          </Dialog.Title>
          <Dialog.Description style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)', marginTop: '0.25rem' }}>
            Staff scans this to record your visit.
          </Dialog.Description>

          <div
            style={{
              margin: '1.25rem auto',
              width: '200px',
              height: '200px',
              background: '#FFFFFF',
              padding: '8px',
              borderRadius: '12px',
              border: '1px solid var(--hairline)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            dangerouslySetInnerHTML={{ __html: qrSvg }}
          />

          <div style={{ fontSize: '0.75rem', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <span>Auto-refreshes in</span>
            <strong className="tabular" style={{ color: '#FF6B35' }}>
              {countdown}s
            </strong>
          </div>

          <button
            className="btn-outline"
            onClick={() => onOpenChange(false)}
            style={{ width: '100%', marginTop: '1.25rem', padding: '0.5rem' }}
          >
            Done
          </button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
