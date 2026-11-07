import { useState, useEffect } from 'react';
import { BrandSeal, MerchantStampIcon } from '../svg/Icons.tsx';

export interface HierarchyShop {
  id: string;
  name: string;
  slug: string;
  status: string;
  customerCount?: number;
  stampsCount?: number;
  icon?: string;
  color?: string;
}

interface HierarchyMapProps {
  shops?: HierarchyShop[];
  onSelectShop?: (shop: HierarchyShop) => void;
  onImpersonate?: (shop: HierarchyShop) => void;
}

const DEFAULT_SHOPS: HierarchyShop[] = [
  {
    id: 'demo-1',
    name: 'Chai Point',
    slug: 'chai-point',
    status: 'active',
    customerCount: 142,
    stampsCount: 890,
    icon: 'chai',
    color: '#FF6B35',
  },
  {
    id: 'demo-2',
    name: 'Cuts & Spa Salon',
    slug: 'cuts-salon',
    status: 'active',
    customerCount: 89,
    stampsCount: 412,
    icon: 'scissors',
    color: '#4B2E9A',
  },
  {
    id: 'demo-3',
    name: 'Metro Cafe & Bakery',
    slug: 'metro-cafe',
    status: 'active',
    customerCount: 64,
    stampsCount: 320,
    icon: 'croissant',
    color: '#1F5C3E',
  },
  {
    id: 'demo-4',
    name: 'Urban Fitness Hub',
    slug: 'urban-fitness',
    status: 'active',
    customerCount: 38,
    stampsCount: 195,
    icon: 'dumbbell',
    color: '#1D5F8A',
  },
];

export function HierarchyMap({ shops = [], onSelectShop, onImpersonate }: HierarchyMapProps) {
  const displayShops = shops.length > 0 ? shops.slice(0, 4) : DEFAULT_SHOPS;
  const [selectedShop, setSelectedShop] = useState<HierarchyShop | null>(displayShops[0] ?? null);
  const [pulseCount, setPulseCount] = useState(0);

  // Periodic visual ping for live event flow dot animation
  useEffect(() => {
    const interval = setInterval(() => {
      setPulseCount((c) => c + 1);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const totalCustomers = displayShops.reduce((sum, s) => sum + (s.customerCount ?? 45), 0);
  const totalStamps = displayShops.reduce((sum, s) => sum + (s.stampsCount ?? 210), 0);

  // Layout coordinates for SVG Canvas (viewBox 0 0 920 460)
  const rootX = 460;
  const rootY = 55;

  const colWidth = 920 / (displayShops.length + 1);
  const merchantNodes = displayShops.map((shop, i) => {
    const x = colWidth * (i + 1);
    const y = 205;
    return { ...shop, x, y };
  });

  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: '16px',
        border: '1px solid var(--hairline, #E2E8F0)',
        boxShadow: '0 4px 20px rgba(15, 23, 42, 0.05)',
        padding: '1.5rem',
        marginBottom: '2rem',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Top Banner & Legend */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1rem',
          borderBottom: '1px solid #F1F5F9',
          paddingBottom: '0.875rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--ink, #0F172A)' }}>
              Platform Role Hierarchy & Data Isolation Map
            </span>
            <span
              style={{
                fontSize: '0.6875rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                padding: '2px 8px',
                borderRadius: '12px',
                background: '#E6F5EE',
                color: '#1F8A5B',
                letterSpacing: '0.05em',
              }}
            >
              Strict Isolation Active
            </span>
          </div>
          <p style={{ fontSize: '0.8125rem', color: '#64748B', marginTop: '0.2rem' }}>
            Super Admin governs all merchants. Each merchant maintains isolated counter QRs, scratch odds, and customer registers.
          </p>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: '#64748B' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#00D4AA' }} />
            <span>Live Flow Event</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: 10, height: 10, borderRadius: '3px', background: '#FF6B35' }} />
            <span>Merchant Node</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#94A3B8' }} />
            <span>Isolated Customer</span>
          </div>
        </div>
      </div>

      {/* SVG Interactive Canvas */}
      <div style={{ width: '100%', overflowX: 'auto' }}>
        <svg
          viewBox="0 0 920 460"
          style={{ width: '100%', minWidth: '780px', height: 'auto', display: 'block' }}
          role="img"
          aria-label="Interactive Platform Role Hierarchy Graph"
        >
          <defs>
            {/* Linear gradient for connectors */}
            <linearGradient id="rootBranchGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#CBD5E1" />
              <stop offset="100%" stopColor="#94A3B8" />
            </linearGradient>

            {/* Glowing filter for flow dots */}
            <filter id="flowGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* ─── 1. Bezier Branch Connectors: Super Admin -> Merchants ─────── */}
          {merchantNodes.map((m, idx) => {
            const pathD = `M ${rootX} ${rootY + 28} C ${rootX} ${rootY + 90}, ${m.x} ${m.y - 70}, ${m.x} ${m.y - 32}`;
            const pathId = `branch-path-${idx}`;
            return (
              <g key={`branch-${m.id}`}>
                <path
                  id={pathId}
                  d={pathD}
                  fill="none"
                  stroke="#E2E8F0"
                  strokeWidth="2.5"
                  strokeDasharray="4 3"
                />
                {/* Real-time M13 Flow Dot along bezier branch */}
                <circle r="4" fill="#00D4AA" filter="url(#flowGlow)">
                  <animateMotion
                    path={pathD}
                    dur={`${2.2 + idx * 0.4}s`}
                    repeatCount="indefinite"
                    keyPoints="0;1"
                    keyTimes="0;1"
                  />
                </circle>
              </g>
            );
          })}

          {/* ─── 2. Bezier Branch Connectors: Merchants -> Customers ───────── */}
          {merchantNodes.map((m) => {
            const custLeftX = m.x - 48;
            const custRightX = m.x + 48;
            const custY = 385;
            const pathLeft = `M ${m.x} ${m.y + 32} C ${m.x} ${m.y + 70}, ${custLeftX} ${custY - 50}, ${custLeftX} ${custY - 22}`;
            const pathRight = `M ${m.x} ${m.y + 32} C ${m.x} ${m.y + 70}, ${custRightX} ${custY - 50}, ${custRightX} ${custY - 22}`;

            return (
              <g key={`cust-branch-${m.id}`}>
                {/* Branch Left */}
                <path d={pathLeft} fill="none" stroke="#CBD5E1" strokeWidth="1.8" />
                <circle r="3" fill="#64748B">
                  <animateMotion path={pathLeft} dur="3.5s" repeatCount="indefinite" />
                </circle>

                {/* Branch Right */}
                <path d={pathRight} fill="none" stroke="#CBD5E1" strokeWidth="1.8" />
                <circle r="3" fill="#64748B">
                  <animateMotion path={pathRight} dur="4s" repeatCount="indefinite" />
                </circle>

                {/* Isolated Boundary Box */}
                <rect
                  x={m.x - 78}
                  y={m.y - 38}
                  width="156"
                  height="470"
                  rx="12"
                  fill="none"
                  stroke="#E2E8F0"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                  opacity="0.6"
                />
              </g>
            );
          })}

          {/* ─── 3. Top Node: Super Admin Control Tower ────────────────────── */}
          <g transform={`translate(${rootX}, ${rootY})`}>
            {/* Outer soft shadow */}
            <rect
              x="-160"
              y="-28"
              width="320"
              height="56"
              rx="28"
              fill="#FFFFFF"
              stroke="#0F172A"
              strokeWidth="2"
              filter="drop-shadow(0 4px 12px rgba(15,23,42,0.12))"
            />
            {/* Inner accent ring */}
            <circle cx="-125" cy="0" r="16" fill="#F8FAFC" stroke="#0F172A" strokeWidth="1.5" />
            <text x="-125" y="5" textAnchor="middle" fontSize="16" fill="#0F172A">
              🛡️
            </text>

            <text x="-95" y="-5" fontSize="13" fontWeight="800" fill="#0F172A" letterSpacing="0.06em">
              SUPER ADMIN CONTROL TOWER
            </text>
            <text x="-95" y="14" fontSize="10.5" fill="#64748B" fontWeight="600">
              Universal Platform Governance • {displayShops.length} Merchants Active
            </text>

            <circle cx="132" cy="0" r="5" fill="#00D4AA" />
          </g>

          {/* ─── 4. Merchant Nodes ─────────────────────────────────────────── */}
          {merchantNodes.map((m) => {
            const isSelected = selectedShop?.id === m.id;
            return (
              <g
                key={`node-${m.id}`}
                transform={`translate(${m.x}, ${m.y})`}
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  setSelectedShop(m);
                  if (onSelectShop) onSelectShop(m);
                }}
              >
                {/* Node Box */}
                <rect
                  x="-72"
                  y="-32"
                  width="144"
                  height="64"
                  rx="12"
                  fill="#FFFFFF"
                  stroke={isSelected ? '#FF6B35' : '#CBD5E1'}
                  strokeWidth={isSelected ? '2.5' : '1.5'}
                  filter={isSelected ? 'drop-shadow(0 6px 16px rgba(255,107,53,0.2))' : 'drop-shadow(0 2px 6px rgba(0,0,0,0.04))'}
                />

                {/* Top Merchant colored tab */}
                <rect
                  x="-72"
                  y="-32"
                  width="144"
                  height="6"
                  rx="3"
                  fill={m.color || '#4B2E9A'}
                />

                {/* Merchant Title */}
                <text
                  x="0"
                  y="-4"
                  textAnchor="middle"
                  fontSize="12.5"
                  fontWeight="800"
                  fill="#0F172A"
                >
                  {m.name.length > 15 ? m.name.substring(0, 14) + '…' : m.name}
                </text>

                {/* Stats badge */}
                <rect x="-56" y="8" width="112" height="18" rx="9" fill="#F1F5F9" />
                <text
                  x="0"
                  y="20"
                  textAnchor="middle"
                  fontSize="9.5"
                  fontWeight="700"
                  fill="#475569"
                >
                  {m.customerCount ?? 45} Members • {m.stampsCount ?? 210} Stamps
                </text>
              </g>
            );
          })}

          {/* ─── 5. Customer Nodes (Showing Strict Tenant Isolation) ───────── */}
          {merchantNodes.map((m, mIdx) => {
            const custLeftX = m.x - 48;
            const custRightX = m.x + 48;
            const custY = 385;

            return (
              <g key={`cust-nodes-${m.id}`}>
                {/* Customer 1 under this merchant */}
                <g transform={`translate(${custLeftX}, ${custY})`}>
                  <circle
                    cx="0"
                    cy="0"
                    r="18"
                    fill="#F8FAFC"
                    stroke="#94A3B8"
                    strokeWidth="1.5"
                  />
                  <text x="0" y="4" textAnchor="middle" fontSize="11" fontWeight="700" fill="#334155">
                    C{mIdx * 2 + 1}
                  </text>
                  <text x="0" y="28" textAnchor="middle" fontSize="8" fontWeight="600" fill="#64748B">
                    Only @ {m.name.split(' ')[0]}
                  </text>
                </g>

                {/* Customer 2 under this merchant */}
                <g transform={`translate(${custRightX}, ${custY})`}>
                  <circle
                    cx="0"
                    cy="0"
                    r="18"
                    fill="#F8FAFC"
                    stroke="#94A3B8"
                    strokeWidth="1.5"
                  />
                  <text x="0" y="4" textAnchor="middle" fontSize="11" fontWeight="700" fill="#334155">
                    C{mIdx * 2 + 2}
                  </text>
                  <text x="0" y="28" textAnchor="middle" fontSize="8" fontWeight="600" fill="#64748B">
                    Only @ {m.name.split(' ')[0]}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Selected Merchant Control Pill */}
      {selectedShop && (
        <div
          style={{
            marginTop: '1rem',
            padding: '1rem 1.25rem',
            background: '#F8FAFC',
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '10px',
                background: selectedShop.color ? `${selectedShop.color}18` : '#E0E7FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: selectedShop.color || '#4B2E9A',
                fontWeight: 800,
              }}
            >
              <BrandSeal size={28} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontWeight: 800, fontSize: '0.9375rem', color: '#0F172A' }}>
                  {selectedShop.name}
                </span>
                <span style={{ fontSize: '0.75rem', color: '#64748B', fontFamily: 'monospace' }}>
                  /s/{selectedShop.slug}
                </span>
              </div>
              <div style={{ fontSize: '0.8125rem', color: '#64748B', marginTop: '0.125rem' }}>
                Isolated Customer Register: <strong>{selectedShop.customerCount ?? 45}</strong> customers • Total Stamps: <strong>{selectedShop.stampsCount ?? 210}</strong>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {onImpersonate && (
              <button
                className="btn-outline"
                style={{
                  fontSize: '0.8125rem',
                  padding: '0.4rem 0.875rem',
                  borderColor: '#F59E0B',
                  color: '#B45309',
                  background: '#FEF3C7',
                  fontWeight: 700,
                }}
                onClick={() => onImpersonate(selectedShop)}
              >
                ⚠️ 1-Click Impersonate
              </button>
            )}
            <a
              href={`/s/${selectedShop.slug}`}
              target="_blank"
              rel="noreferrer"
              className="btn-ghost"
              style={{ fontSize: '0.8125rem', padding: '0.4rem 0.75rem' }}
            >
              Preview Counter QR ↗
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

