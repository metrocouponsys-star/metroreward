import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import QRCode from 'qrcode';
import { api } from '../../lib/api.ts';
import { useAuth } from '../../hooks/useAuth.tsx';
import { S } from '../../strings.ts';
import { isIOS, isStandalone } from '../../lib/format.ts';
import styles from './CardHome.module.css';

interface CardSummary {
  shopId: string;
  shopName: string;
  shopSlug: string;
  stampsRequired: number;
  balance: number;
  cardsIssued: number;
}

interface CustomerQrData {
  ok: boolean;
  token: string;
  name: string;
  phone: string;
}

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

  return (
    <div className="page">
      <nav className="topbar">
        <span className="topbar-title">{S.appName}</span>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Link to="/explore" className="btn-ghost" style={{ padding: '0.5rem' }}>
            Discover
          </Link>
          <Link to="/rewards" className="btn-ghost" style={{ padding: '0.5rem' }}>
            Rewards
          </Link>
          <button className="btn-ghost" onClick={logout} style={{ padding: '0.5rem' }}>
            {S.signOut}
          </button>
        </div>
      </nav>

      <div className="content" style={{ padding: '1.5rem 0' }}>
        {/* iOS Add to Home Screen Gentle Hint */}
        {showIosHint && (
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--hairline)',
              borderRadius: '8px',
              padding: '0.875rem 1rem',
              marginBottom: '1rem',
              fontSize: '0.875rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '0.75rem',
            }}
          >
            <div>
              <strong>{S.addToHomeTitle}</strong>
              <p style={{ color: 'var(--ink-muted)', marginTop: '0.2rem', fontSize: '0.8125rem' }}>
                Tap Share then <strong>"Add to Home Screen"</strong> for instant card access.
              </p>
            </div>
            <button
              className="btn-ghost"
              style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
              onClick={() => setShowIosHint(false)}
            >
              ✕
            </button>
          </div>
        )}

        {/* Header row with greeting & My QR button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h1 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>
              Hello, {user?.name || 'there'}
            </h1>
            <p style={{ color: 'var(--ink-muted)', fontSize: '0.9375rem' }}>Your stamp cards</p>
          </div>
          <button
            className="btn-outline"
            style={{ minHeight: '38px', padding: '0.375rem 0.875rem', fontSize: '0.875rem', gap: '0.375rem' }}
            onClick={() => setShowQrModal(true)}
          >
            <span>📱 My QR</span>
          </button>
        </div>

        {isLoading && (
          <div className="loading-center">
            <div className="spinner" />
          </div>
        )}

        {error && (
          <div className="error-msg" role="alert">{S.genericError}</div>
        )}

        {!isLoading && data?.cards.length === 0 && (
          <div className="empty-state">
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden>
              <rect x="8" y="20" width="48" height="32" rx="4" fill="var(--hairline)" />
              <circle cx="20" cy="36" r="6" fill="var(--page)" />
              <circle cx="32" cy="36" r="6" fill="var(--page)" />
              <circle cx="44" cy="36" r="6" fill="var(--page)" />
            </svg>
            <p style={{ marginTop: '1rem', fontWeight: 600 }}>No cards yet</p>
            <p>{S.noCards}</p>
            <Link
              to="/explore"
              className="btn-primary"
              style={{ display: 'inline-flex', width: 'auto', marginTop: '1rem', padding: '0.625rem 1.25rem' }}
            >
              Browse Local Shops
            </Link>
          </div>
        )}

        <div className={styles.cardGrid}>
          {data?.cards.map((card) => (
            <StampCard key={card.shopId} card={card} />
          ))}
        </div>
      </div>

      {/* Customer Rotating Personal QR Modal for Counter Staff Scanning */}
      <CustomerQrDialog open={showQrModal} onOpenChange={setShowQrModal} />
    </div>
  );
}

function StampCard({ card }: { card: CardSummary }) {
  const navigate = useNavigate();
  const cols = card.stampsRequired <= 6 ? card.stampsRequired : card.stampsRequired <= 10 ? 5 : 4;

  return (
    <article
      className={styles.ticket}
      onClick={() => navigate(`/cards/${card.shopSlug}`)}
      tabIndex={0}
      role="button"
      aria-label={`${card.shopName} stamp card, ${card.balance} of ${card.stampsRequired} stamps`}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/cards/${card.shopSlug}`)}
    >
      <div className={styles.ticketMain}>
        <div className={styles.shopName}>{card.shopName}</div>
        <div
          className={styles.stampGrid}
          style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
          aria-hidden
        >
          {Array.from({ length: card.stampsRequired }).map((_, i) => (
            <div
              key={i}
              className={`${styles.slot} ${i < card.balance ? styles.filled : ''}`}
            >
              {i < card.balance && (
                <svg viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9" fill="#4B2E9A" opacity="0.9" />
                  <circle cx="12" cy="12" r="5" fill="none" stroke="#fff" strokeWidth="1.5" />
                  <circle cx="12" cy="12" r="2" fill="#fff" />
                </svg>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className={styles.ticketStub}>
        <div className={styles.stubCount}>
          <span className="tabular">{card.balance}</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>of {card.stampsRequired}</span>
        </div>
        {card.cardsIssued > 0 && (
          <div style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: '0.25rem', fontWeight: 600 }}>
            {card.cardsIssued} reward{card.cardsIssued > 1 ? 's' : ''}
          </div>
        )}
      </div>
    </article>
  );
}

function CustomerQrDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [countdown, setCountdown] = useState(30);

  const { data, refetch } = useQuery({
    queryKey: ['customer-qr-token'],
    queryFn: () => api.get<CustomerQrData>('/customer/qr-token'),
    enabled: open,
    refetchInterval: 30_000,
  });

  useEffect(() => {
    if (!open) return;
    setCountdown(30);
    const id = setInterval(() => {
      setCountdown((n) => (n <= 1 ? 30 : n - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [open, data?.token]);

  useEffect(() => {
    if (!canvasRef.current || !data?.token) return;
    QRCode.toCanvas(canvasRef.current, data.token, {
      width: 240,
      margin: 2,
      color: { dark: '#101820', light: '#FFFFFF' },
      errorCorrectionLevel: 'M',
    });
  }, [data?.token]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(16, 24, 32, 0.5)',
            zIndex: 100,
          }}
        />
        <Dialog.Content
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'var(--surface)',
            borderRadius: '16px',
            padding: '1.5rem',
            width: '90%',
            maxWidth: '380px',
            boxShadow: 'var(--shadow-sheet)',
            zIndex: 101,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
            textAlign: 'center',
          }}
        >
          <Dialog.Title style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 700 }}>
            My Stamp QR
          </Dialog.Title>
          <Dialog.Description style={{ fontSize: '0.875rem', color: 'var(--ink-muted)' }}>
            Show this to shop staff so they can scan and add your stamp.
          </Dialog.Description>

          <div style={{ background: '#fff', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--hairline)' }}>
            <canvas ref={canvasRef} style={{ display: 'block' }} />
          </div>

          <div style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)', fontVariantNumeric: 'tabular-nums' }}>
            Rotating QR refreshes in {countdown}s
          </div>

          <button className="btn-outline" onClick={() => onOpenChange(false)} style={{ width: '100%' }}>
            Done
          </button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
