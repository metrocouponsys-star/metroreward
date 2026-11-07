import React from 'react';

// ─── A. Brand Mark Seal ────────────────────────────────────────────────────────
export function BrandSeal({ size = 48, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Stamp Brand Seal"
    >
      {/* Slightly wobbly outer ring */}
      <circle
        cx="32"
        cy="32"
        r="28"
        stroke="var(--stamp-violet, #4B2E9A)"
        strokeWidth="2.5"
        strokeDasharray="180"
        strokeLinecap="round"
      />
      <circle cx="32" cy="32" r="23" stroke="var(--stamp-violet, #4B2E9A)" strokeWidth="1" strokeDasharray="3 3" />
      {/* Central punch hole circle */}
      <circle cx="32" cy="32" r="14" fill="var(--stamp-tint, #E9E4F5)" />
      {/* Central check mark inside punch hole */}
      <path
        d="M26 32.5L30 36.5L38 27.5"
        stroke="var(--stamp-violet, #4B2E9A)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ─── B. Stamp Impressions (6 Shapes with speckle/rough edge) ───────────────────
export function StampImpression({
  shape = 'scalloped',
  color = 'var(--stamp-violet, #4B2E9A)',
  size = 56,
  rotation = 0,
  children,
}: {
  shape?: 'round' | 'scalloped' | 'rotated_square' | 'ticket_notch' | 'ring_star' | 'ring_tick';
  color?: string;
  size?: number;
  rotation?: number;
  children?: React.ReactNode;
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        transform: `rotate(${rotation}deg)`,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        transition: 'transform 0.25s cubic-bezier(0.2, 0.9, 0.3, 1.15)',
      }}
    >
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" style={{ position: 'absolute', inset: 0 }}>
        {shape === 'round' && (
          <circle cx="32" cy="32" r="28" stroke={color} strokeWidth="2.5" strokeDasharray="50 1 40 1" />
        )}
        {shape === 'scalloped' && (
          <path
            d="M32 4C35 8 39 8 43 6C47 8 50 11 53 14C56 18 59 19 60 23C61 27 62 31 60 35C62 39 61 43 58 46C55 49 54 53 50 55C46 57 43 60 39 60C35 60 31 62 27 60C23 60 19 58 16 55C13 52 9 51 7 47C5 43 4 39 6 35C4 31 5 27 7 23C9 19 12 18 15 14C18 10 21 8 25 6C29 8 31 4 32 4Z"
            stroke={color}
            strokeWidth="2.2"
            fill="none"
          />
        )}
        {shape === 'rotated_square' && (
          <rect
            x="14"
            y="14"
            width="36"
            height="36"
            rx="4"
            transform="rotate(45 32 32)"
            stroke={color}
            strokeWidth="2.5"
          />
        )}
        {shape === 'ticket_notch' && (
          <path
            d="M6 16C12 16 16 12 16 6H48C48 12 52 16 58 16V48C52 48 48 52 48 58H16C16 52 12 48 6 48V16Z"
            stroke={color}
            strokeWidth="2.5"
          />
        )}
        {shape === 'ring_star' && (
          <>
            <circle cx="32" cy="32" r="28" stroke={color} strokeWidth="2" strokeDasharray="4 2" />
            <circle cx="32" cy="32" r="22" stroke={color} strokeWidth="1" />
          </>
        )}
        {shape === 'ring_tick' && (
          <>
            <circle cx="32" cy="32" r="28" stroke={color} strokeWidth="2.5" />
            <path d="M22 33L29 40L42 24" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </>
        )}
      </svg>
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </div>
  );
}

// ─── C. 12 Curated Merchant Stamp Icons (48x48 Grid, Empty vs Filled) ─────────
export type StampIconId =
  | 'chai'
  | 'coffee'
  | 'croissant'
  | 'scissors'
  | 'comb'
  | 'dumbbell'
  | 'burger'
  | 'pizza'
  | 'icecream'
  | 'bubbletea'
  | 'bag'
  | 'star';

export function MerchantStampIcon({
  icon,
  filled = false,
  size = 32,
  color = 'var(--stamp-violet, #4B2E9A)',
}: {
  icon: StampIconId;
  filled?: boolean;
  size?: number;
  color?: string;
}) {
  const stroke = color;
  const fill = filled ? color : 'none';
  const strokeWidth = 2;
  const strokeDasharray = filled ? undefined : '3 2';

  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      {icon === 'chai' && (
        // Traditional Indian Kulhad Chai Cup with rising steam
        <g stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <path
            d="M12 16H36L32 40H16L12 16Z"
            fill={fill}
            strokeDasharray={strokeDasharray}
          />
          <path d="M10 16H38" />
          <path d="M19 11C19 9 20 7 21 5" />
          <path d="M25 12C25 10 26 8 27 6" />
          <path d="M31 11C31 9 32 7 33 5" />
        </g>
      )}

      {icon === 'coffee' && (
        // Coffee Mug with handle & steam
        <g stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 14H32V32C32 36 28 40 24 40H18C14 40 10 36 10 32V14Z" fill={fill} strokeDasharray={strokeDasharray} />
          <path d="M32 18H36C38.2 18 40 19.8 40 22V24C40 26.2 38.2 28 36 28H32" />
          <path d="M18 10C18 8 19 6 20 5" />
          <path d="M24 10C24 8 25 6 26 5" />
        </g>
      )}

      {icon === 'croissant' && (
        // Bakery Croissant
        <g stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <path
            d="M8 26C6 24 6 18 12 14C18 10 30 10 36 14C42 18 42 24 40 26C36 30 30 34 24 34C18 34 12 30 8 26Z"
            fill={fill}
            strokeDasharray={strokeDasharray}
          />
          <path d="M16 16C18 20 20 28 22 34" />
          <path d="M32 16C30 20 28 28 26 34" />
        </g>
      )}

      {icon === 'scissors' && (
        // Salon Hairdressing Scissors
        <g stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="14" cy="34" r="6" fill={fill} strokeDasharray={strokeDasharray} />
          <circle cx="34" cy="34" r="6" fill={fill} strokeDasharray={strokeDasharray} />
          <path d="M18 30L34 10" />
          <path d="M30 30L14 10" />
        </g>
      )}

      {icon === 'comb' && (
        // Barber / Stylist Comb
        <g stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <rect x="8" y="16" width="32" height="8" rx="2" fill={fill} strokeDasharray={strokeDasharray} />
          <path d="M12 24V34" />
          <path d="M16 24V34" />
          <path d="M20 24V34" />
          <path d="M24 24V34" />
          <path d="M28 24V34" />
          <path d="M32 24V34" />
          <path d="M36 24V34" />
        </g>
      )}

      {icon === 'dumbbell' && (
        // Fitness / Gym Dumbbell
        <g stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <rect x="6" y="16" width="6" height="16" rx="2" fill={fill} strokeDasharray={strokeDasharray} />
          <rect x="36" y="16" width="6" height="16" rx="2" fill={fill} strokeDasharray={strokeDasharray} />
          <path d="M12 24H36" strokeWidth={3} />
          <line x1="12" y1="20" x2="12" y2="28" />
          <line x1="36" y1="20" x2="36" y2="28" />
        </g>
      )}

      {icon === 'burger' && (
        // Restaurant / Cafe Burger
        <g stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 20C10 13 16 10 24 10C32 10 38 13 38 20H10Z" fill={fill} strokeDasharray={strokeDasharray} />
          <rect x="8" y="24" width="32" height="4" rx="2" fill={fill} />
          <path d="M10 32C10 36 16 38 24 38C32 38 38 36 38 32H10Z" fill={fill} strokeDasharray={strokeDasharray} />
        </g>
      )}

      {icon === 'pizza' && (
        // Pizza Slice
        <g stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 12C18 10 30 10 38 12L24 40L10 12Z" fill={fill} strokeDasharray={strokeDasharray} />
          <circle cx="24" cy="20" r="2.5" fill={stroke} />
          <circle cx="18" cy="24" r="2" fill={stroke} />
          <circle cx="28" cy="27" r="2" fill={stroke} />
        </g>
      )}

      {icon === 'icecream' && (
        // Dessert / Ice Cream Cone
        <g stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 22L24 40L32 22" strokeDasharray={strokeDasharray} />
          <circle cx="24" cy="16" r="10" fill={fill} strokeDasharray={strokeDasharray} />
          <path d="M14 22C16 24 19 24 21 22C23 24 26 24 28 22C30 24 32 23 34 22" />
        </g>
      )}

      {icon === 'bubbletea' && (
        // Boba / Bubble Tea
        <g stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 16L17 38C17 40 20 42 24 42C28 42 31 40 31 38L34 16H14Z" fill={fill} strokeDasharray={strokeDasharray} />
          <line x1="28" y1="6" x2="22" y2="24" strokeWidth={3} />
          <circle cx="21" cy="34" r="2" fill={stroke} />
          <circle cx="26" cy="36" r="2" fill={stroke} />
          <circle cx="24" cy="30" r="2" fill={stroke} />
        </g>
      )}

      {icon === 'bag' && (
        // Boutique / Kirana Shopping Bag
        <g stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <rect x="10" y="16" width="28" height="24" rx="3" fill={fill} strokeDasharray={strokeDasharray} />
          <path d="M17 16V12C17 8 20 6 24 6C28 6 31 8 31 12V16" />
        </g>
      )}

      {icon === 'star' && (
        // Classic 5-Point Loyalty Star
        <g stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <polygon
            points="24,6 29,18 42,19 32,28 35,41 24,34 13,41 16,28 6,19 19,18"
            fill={fill}
            strokeDasharray={strokeDasharray}
          />
        </g>
      )}
    </svg>
  );
}

// ─── D. Ticket Card with Semicircle Notches & Perforation ───────────────────────
export function PerforatedTicket({
  children,
  stubContent,
  accentColor = '#4B2E9A',
  className = '',
}: {
  children: React.ReactNode;
  stubContent?: React.ReactNode;
  accentColor?: string;
  className?: string;
}) {
  return (
    <div
      className={className}
      style={{
        position: 'relative',
        background: '#FFFFFF',
        borderRadius: '12px',
        border: '1px solid var(--hairline, #D9DBD5)',
        boxShadow: '0 4px 16px rgba(16, 24, 32, 0.06)',
        overflow: 'hidden',
      }}
    >
      {/* Top accent color bar */}
      <div style={{ height: '6px', background: accentColor, width: '100%' }} />

      {/* Main Ticket Area */}
      <div style={{ padding: '1.25rem 1.5rem' }}>{children}</div>

      {/* Perforation Line with Left and Right Semicircle Cutouts */}
      {stubContent && (
        <div style={{ position: 'relative', padding: '0 0.5rem' }}>
          {/* Left Cutout */}
          <div
            style={{
              position: 'absolute',
              left: '-12px',
              top: '-10px',
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: 'var(--page, #F2F3F0)',
              borderRight: '1px solid var(--hairline, #D9DBD5)',
              zIndex: 2,
            }}
          />
          {/* Dashed line */}
          <div
            style={{
              borderTop: '2px dashed var(--hairline, #D9DBD5)',
              margin: '0 10px',
              height: '1px',
            }}
          />
          {/* Right Cutout */}
          <div
            style={{
              position: 'absolute',
              right: '-12px',
              top: '-10px',
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: 'var(--page, #F2F3F0)',
              borderLeft: '1px solid var(--hairline, #D9DBD5)',
              zIndex: 2,
            }}
          />
          {/* Stub Content */}
          <div style={{ padding: '1rem 1rem' }}>{stubContent}</div>
        </div>
      )}
    </div>
  );
}

// ─── G. 5 Prize Glyphs ────────────────────────────────────────────────────────
export function PrizeGlyph({
  type,
  size = 48,
}: {
  type: 'free_item' | 'percent_off' | 'no_prize' | 'jackpot' | 'coupon';
  size?: number;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      {type === 'free_item' && (
        // Gift box
        <g stroke="#1F8A5B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="8" y="18" width="32" height="22" rx="3" fill="#E6F5EE" />
          <path d="M6 18H42V12C42 10.5 40.5 9 39 9H9C7.5 9 6 10.5 6 12V18Z" fill="#1F8A5B" />
          <line x1="24" y1="9" x2="24" y2="40" stroke="#FFFFFF" strokeWidth="3" />
        </g>
      )}

      {type === 'percent_off' && (
        // Percent discount badge
        <g stroke="#FF6B35" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="24" cy="24" r="18" fill="#FFF4EF" />
          <line x1="16" y1="32" x2="32" y2="16" />
          <circle cx="18" cy="18" r="3" fill="#FF6B35" />
          <circle cx="30" cy="30" r="3" fill="#FF6B35" />
        </g>
      )}

      {type === 'no_prize' && (
        // Gentle soft cloud (warm, respectful, never mocking)
        <g stroke="#8A95A3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path
            d="M14 30C10.7 30 8 27.3 8 24C8 21 10.2 18.5 13.1 18.1C14.3 13.5 18.4 10 23.5 10C29.4 10 34.3 14.6 34.9 20.4C37.8 20.9 40 23.4 40 26.5C40 29.5 37.5 32 34.5 32H14"
            fill="#F1F5F9"
          />
        </g>
      )}

      {type === 'jackpot' && (
        // Jackpot Starburst
        <g stroke="#B8962E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path
            d="M24 4L28 16L40 12L34 24L44 30L32 32L34 44L24 36L14 44L16 32L4 30L14 24L8 12L20 16L24 4Z"
            fill="#FEF3C7"
          />
          <circle cx="24" cy="24" r="5" fill="#B8962E" />
        </g>
      )}

      {type === 'coupon' && (
        // Coupon ticket voucher
        <g stroke="#4B2E9A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="6" y="14" width="36" height="20" rx="3" fill="#E9E4F5" />
          <line x1="18" y1="14" x2="18" y2="34" strokeDasharray="3 3" />
          <circle cx="6" cy="24" r="3" fill="#FFFFFF" />
          <circle cx="42" cy="24" r="3" fill="#FFFFFF" />
        </g>
      )}
    </svg>
  );
}

// ─── J. Tally Marks (5-Bar Gate Tally) ─────────────────────────────────────────
export function TallyMarks({ count = 1, color = 'var(--ink, #101820)' }: { count: number; color?: string }) {
  const fullGates = Math.floor(count / 5);
  const remainder = count % 5;

  return (
    <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
      {Array.from({ length: fullGates }).map((_, i) => (
        <svg key={`gate-${i}`} width="28" height="24" viewBox="0 0 28 24" fill="none">
          <line x1="4" y1="3" x2="4" y2="21" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
          <line x1="10" y1="3" x2="10" y2="21" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
          <line x1="16" y1="3" x2="16" y2="21" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
          <line x1="22" y1="3" x2="22" y2="21" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
          {/* Diagonal 5th stroke */}
          <line x1="2" y1="20" x2="24" y2="4" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      ))}

      {remainder > 0 && (
        <svg width={remainder * 6 + 4} height="24" viewBox={`0 0 ${remainder * 6 + 4} 24`} fill="none">
          {Array.from({ length: remainder }).map((_, idx) => (
            <line
              key={`rem-${idx}`}
              x1={4 + idx * 6}
              y1="3"
              x2={4 + idx * 6}
              y2="21"
              stroke={color}
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          ))}
        </svg>
      )}
    </div>
  );
}

// ─── N. Status Marks (Shape + Text, Never Colour Alone) ───────────────────────
export function StatusMark({
  status,
}: {
  status: 'counted' | 'pending' | 'voided' | 'redeemed' | 'expired';
}) {
  const configs = {
    counted: { label: 'COUNTED', bg: '#E6F5EE', color: '#1F8A5B', icon: '✓' },
    pending: { label: 'PENDING', bg: '#FEF3C7', color: '#B45309', icon: '○' },
    voided: { label: 'VOIDED', bg: '#FEE2E2', color: '#B91C1C', icon: '✕' },
    redeemed: { label: 'REDEEMED', bg: '#E9E4F5', color: '#4B2E9A', icon: '✓✓' },
    expired: { label: 'EXPIRED', bg: '#F1F5F9', color: '#64748B', icon: '⦸' },
  };
  const cfg = configs[status] || configs.counted;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '2px 8px',
        borderRadius: '6px',
        background: cfg.bg,
        color: cfg.color,
        fontSize: '11px',
        fontWeight: 800,
        letterSpacing: '0.04em',
        fontFamily: 'monospace',
      }}
    >
      <span aria-hidden>{cfg.icon}</span>
      <span>{cfg.label}</span>
    </span>
  );
}

// ─── Q. Impersonation Diagonal Warning Tape (M14) ──────────────────────────────
export function ImpersonationTape({
  merchantName,
  reason,
  onExit,
}: {
  merchantName: string;
  reason?: string;
  onExit: () => void;
}) {
  return (
    <div
      style={{
        background: '#FEF3C7',
        borderBottom: '2px solid #F59E0B',
        color: '#78350F',
        padding: '8px 16px',
        fontSize: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <span
          style={{
            background: '#F59E0B',
            color: '#FFFFFF',
            fontWeight: 800,
            fontSize: '10px',
            padding: '2px 6px',
            borderRadius: '4px',
            letterSpacing: '0.05em',
          }}
        >
          SUPER ADMIN
        </span>
        <span>
          Acting as <strong>{merchantName}</strong>
          {reason && <span style={{ opacity: 0.8 }}> — Reason: "{reason}"</span>}
        </span>
      </div>

      <button
        onClick={onExit}
        style={{
          background: '#92400E',
          color: '#FFFFFF',
          border: 'none',
          padding: '4px 10px',
          borderRadius: '6px',
          fontWeight: 700,
          fontSize: '11px',
          cursor: 'pointer',
        }}
      >
        Exit to Control Tower
      </button>
    </div>
  );
}

