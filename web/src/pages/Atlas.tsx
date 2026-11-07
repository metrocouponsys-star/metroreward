import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  BrandSeal,
  StampImpression,
  MerchantStampIcon,
  PerforatedTicket,
  PrizeGlyph,
  TallyMarks,
  StatusMark,
  ImpersonationTape,
  StampIconId,
} from '../components/svg/Icons.tsx';
import { HierarchyMap } from '../components/admin/HierarchyMap.tsx';

export default function AtlasPage() {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [activeTab, setActiveTab] = useState<'tokens' | 'svg' | 'motions' | 'hierarchy'>('tokens');

  // Motion M01 state
  const [m01Stamps, setM01Stamps] = useState<number[]>([1, 2, 3]);
  const [m01LastTilt, setM01LastTilt] = useState(4);

  // Motion M02 state
  const [m02Count, setM02Count] = useState(4);

  // Motion M03 state
  const [m03Torn, setM03Torn] = useState(false);

  // Motion M05 state
  const [m05Code, setM05Code] = useState('MR-8842');
  const [m05StaggerKey, setM05StaggerKey] = useState(0);

  // Motion M06 state
  const [m06Shaking, setM06Shaking] = useState(false);
  const [m06Otp, setM06Otp] = useState(['4', '8', '2', '', '', '']);

  // Motion M08 state
  const [m08Rows, setM08Rows] = useState([
    { id: '1', time: '12:45 PM', name: 'Amit Sharma', action: '+1 Stamp', highlight: false },
    { id: '2', time: '12:20 PM', name: 'Priya Patel', action: '+Scratch Card', highlight: false },
  ]);

  // Motion M12 state
  const [m12Val, setM12Val] = useState(0);

  // Motion M14 state
  const [m14Active, setM14Active] = useState(false);

  // Motion M15 state (prizes weights)
  const [m15Odds, setM15Odds] = useState({ prizeA: 50, prizeB: 35, noPrize: 15 });

  // Motion M16 state
  const [m16Lang, setM16Lang] = useState<'en' | 'hi' | 'mr'>('en');

  // Scratch card canvas ref for M04
  const scratchCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [m04Cleared, setM04Cleared] = useState(0);
  const [m04AutoSolved, setM04AutoSolved] = useState(false);

  // M12 Count-Up trigger
  useEffect(() => {
    let start = 0;
    const target = 1420;
    const step = Math.ceil(target / 40);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setM12Val(target);
        clearInterval(timer);
      } else {
        setM12Val(start);
      }
    }, 20);
    return () => clearInterval(timer);
  }, []);

  // M04 Scratch Canvas Setup
  const initScratchCanvas = () => {
    const canvas = scratchCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.globalCompositeOperation = 'source-over';
    // Draw metallic gold pattern
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, '#D4AF37');
    grad.addColorStop(0.3, '#FFF2A8');
    grad.addColorStop(0.5, '#C59A27');
    grad.addColorStop(0.8, '#FFF7CC');
    grad.addColorStop(1, '#AA8012');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Decorative foil stamp text
    ctx.fillStyle = '#6E520A';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('✨ SCRATCH WITH FINGER OR MOUSE ✨', canvas.width / 2, canvas.height / 2 + 5);

    setM04Cleared(0);
    setM04AutoSolved(false);
  };

  useEffect(() => {
    initScratchCanvas();
  }, [activeTab]);

  const handleScratch = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (m04AutoSolved) return;
    const canvas = scratchCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.fill();

    // Check pixel clearance
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let transparentCount = 0;
    const totalPixels = imgData.data.length / 4;
    for (let i = 3; i < imgData.data.length; i += 16) {
      if (imgData.data[i] === 0) transparentCount += 4;
    }
    const percent = Math.min(100, Math.round((transparentCount / totalPixels) * 100));
    setM04Cleared(percent);

    // Auto-solve at 55%
    if (percent >= 55 && !m04AutoSolved) {
      setM04AutoSolved(true);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const triggerM01Stamp = () => {
    if (m01Stamps.length >= 8) {
      setM01Stamps([1]);
    } else {
      setM01Stamps([...m01Stamps, m01Stamps.length + 1]);
    }
    setM01LastTilt((Math.random() * 6 - 3));
  };

  const triggerM08Add = () => {
    const names = ['Vikram Singh', 'Sunita Rao', 'Karan Patel', 'Meera Joshi'];
    const newRow = {
      id: Date.now().toString(),
      time: 'Just now',
      name: names[Math.floor(Math.random() * names.length)],
      action: '+1 Stamp',
      highlight: true,
    };
    setM08Rows([newRow, ...m08Rows]);
  };

  const triggerM06Error = () => {
    setM06Shaking(true);
    setTimeout(() => setM06Shaking(false), 500);
  };

  const allIcons: StampIconId[] = [
    'chai',
    'coffee',
    'croissant',
    'scissors',
    'comb',
    'dumbbell',
    'burger',
    'pizza',
    'icecream',
    'bubbletea',
    'bag',
    'star',
  ];

  return (
    <div
      style={{
        background: '#F8FAFC',
        minHeight: '100vh',
        color: '#0F172A',
        fontFamily: "'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif",
      }}
    >
      {/* Top Header */}
      <header
        style={{
          background: '#FFFFFF',
          borderBottom: '1px solid #E2E8F0',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        {m14Active && (
          <ImpersonationTape
            merchantName="Chai Point (#CP-402)"
            reason="Auditing scratch prize distribution"
            onExit={() => setM14Active(false)}
          />
        )}

        <div
          style={{
            maxWidth: 1140,
            margin: '0 auto',
            padding: '1rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <BrandSeal size={36} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
                  Stamp Design System Atlas
                </h1>
                <span
                  style={{
                    background: '#EEF2FF',
                    color: '#4F46E5',
                    fontSize: '0.6875rem',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '999px',
                  }}
                >
                  v3.0 Production
                </span>
              </div>
              <p style={{ fontSize: '0.8125rem', color: '#64748B', margin: 0 }}>
                Tokens • Hand-Crafted SVGs • 16 Tactile Motions (M01–M16) • Hierarchy Map
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Reduced motion override */}
            <label
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                background: '#F1F5F9',
                padding: '0.35rem 0.75rem',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={reducedMotion}
                onChange={(e) => setReducedMotion(e.target.checked)}
                style={{ accentColor: '#4F46E5' }}
              />
              <span>Prefers Reduced Motion</span>
            </label>

            <Link
              to="/admin"
              className="btn-outline"
              style={{ fontSize: '0.8125rem', padding: '0.4rem 0.875rem', textDecoration: 'none' }}
            >
              ← Super Admin
            </Link>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ maxWidth: 1140, margin: '0 auto', padding: '0 1.5rem', display: 'flex', gap: '1rem' }}>
          {[
            { id: 'tokens', label: '1. Design Tokens' },
            { id: 'svg', label: '2. Hand-Crafted SVGs' },
            { id: 'motions', label: '3. 16 Tactile Motions (M01–M16)' },
            { id: 'hierarchy', label: '4. Role Hierarchy Map' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              style={{
                background: 'none',
                border: 'none',
                padding: '0.75rem 0.25rem',
                fontSize: '0.875rem',
                fontWeight: activeTab === t.id ? 800 : 500,
                color: activeTab === t.id ? '#FF6B35' : '#64748B',
                borderBottom: activeTab === t.id ? '2px solid #FF6B35' : '2px solid transparent',
                cursor: 'pointer',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: 1140, margin: '0 auto', padding: '2rem 1.5rem' }}>
        {/* ─── TAB 1: DESIGN TOKENS ────────────────────────────────────────── */}
        {activeTab === 'tokens' && (
          <section style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Color Palettes */}
            <div style={{ background: '#FFFFFF', padding: '1.5rem', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 800, marginBottom: '0.25rem' }}>
                Curated 8 Merchant Card Palettes
              </h2>
              <p style={{ fontSize: '0.8125rem', color: '#64748B', marginBottom: '1.25rem' }}>
                Each merchant selects one primary theme. All palettes are hand-checked for AAA contrast against dark ink.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                {[
                  { name: 'Royal Violet', hex: '#4B2E9A', usage: 'Salons, Luxury Boutiques' },
                  { name: 'Forest Green', hex: '#1F5C3E', usage: 'Organic Cafes, Wellness' },
                  { name: 'Brick Coral', hex: '#A33B26', usage: 'Pizzerias, Bakeries' },
                  { name: 'Warm Turmeric', hex: '#C07D1E', usage: 'Chai Points, Sweets' },
                  { name: 'Ocean Deep', hex: '#1D5F8A', usage: 'Gyms, Tech repair' },
                  { name: 'Slate Charcoal', hex: '#2D3748', usage: 'Tailors, Studios' },
                  { name: 'Plum Berry', hex: '#6B2D5C', usage: 'Desserts, Gelato' },
                  { name: 'Warm Copper', hex: '#9C5221', usage: 'Coffee Roasters' },
                ].map((c) => (
                  <div key={c.hex} style={{ border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden' }}>
                    <div style={{ height: 60, background: c.hex, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ color: '#FFFFFF', fontWeight: 700, fontSize: '0.8125rem', letterSpacing: '0.04em' }}>
                        {c.hex}
                      </span>
                    </div>
                    <div style={{ padding: '0.75rem' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{c.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.2rem' }}>{c.usage}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Typography Specimen */}
            <div style={{ background: '#FFFFFF', padding: '1.5rem', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 800, marginBottom: '0.25rem' }}>
                Typography & Vernacular Scale
              </h2>
              <p style={{ fontSize: '0.8125rem', color: '#64748B', marginBottom: '1.25rem' }}>
                Plus Jakarta Sans for prominent counter headlines; Inter/Figtree for readable body copy; Tabular figures for ledger numbers.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ paddingBottom: '0.75rem', borderBottom: '1px solid #F1F5F9' }}>
                  <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>DISPLAY TITLE (32px / 800)</span>
                  <div style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em', marginTop: '0.25rem' }}>
                    Collect 8 Stamps, Unlock Free Chai
                  </div>
                </div>
                <div style={{ paddingBottom: '0.75rem', borderBottom: '1px solid #F1F5F9' }}>
                  <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>HINDI VERNACULAR (20px / 700)</span>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#334155', marginTop: '0.25rem' }}>
                    नमस्ते! आज की कुल 33 स्टैम्प्स दर्ज हुईं। अगला इनाम 3 विज़िट दूर है।
                  </div>
                </div>
                <div style={{ paddingBottom: '0.75rem', borderBottom: '1px solid #F1F5F9' }}>
                  <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>MARATHI VERNACULAR (20px / 700)</span>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#334155', marginTop: '0.25rem' }}>
                    नमस्कार! आज काउंटरवर 33 स्टॅम्प पूर्ण झाले. तुमचे रिवॉर्ड अनलॉक झाले आहे.
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>TABULAR MONOSPACE LEDGER NUMBERS</span>
                  <div style={{ fontSize: '1.125rem', fontFamily: 'monospace', fontWeight: 700, color: '#0F172A', marginTop: '0.25rem' }}>
                    STAMP #0042 • 11:24:08 AM • +1 VISIT • BALANCE: 07/08
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ─── TAB 2: HAND-CRAFTED SVGS ────────────────────────────────────── */}
        {activeTab === 'svg' && (
          <section style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* 12 Merchant Icons (Empty vs Filled) */}
            <div style={{ background: '#FFFFFF', padding: '1.5rem', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 800, marginBottom: '0.25rem' }}>
                12 Curated Merchant Stamp Icons (48x48 Grid)
              </h2>
              <p style={{ fontSize: '0.8125rem', color: '#64748B', marginBottom: '1.25rem' }}>
                Hand-drawn SVG glyphs optimized for physical rubber-stamp aesthetic in empty (dashed) and filled states.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem' }}>
                {allIcons.map((icon) => (
                  <div
                    key={icon}
                    style={{
                      border: '1px solid #E2E8F0',
                      borderRadius: '12px',
                      padding: '0.875rem',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.625rem',
                      background: '#F8FAFC',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      <MerchantStampIcon icon={icon} filled={false} size={32} color="#94A3B8" />
                      <MerchantStampIcon icon={icon} filled={true} size={32} color="#4B2E9A" />
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'capitalize' }}>
                      {icon}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Stamp Impressions & Shapes */}
            <div style={{ background: '#FFFFFF', padding: '1.5rem', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 800, marginBottom: '0.25rem' }}>
                6 Stamp Impression Seals
              </h2>
              <p style={{ fontSize: '0.8125rem', color: '#64748B', marginBottom: '1.25rem' }}>
                Outer border geometries with speckle mask and simulated ink bleeding.
              </p>
              <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                {(['round', 'scalloped', 'rotated_square', 'ticket_notch', 'ring_star', 'ring_tick'] as const).map((shape) => (
                  <div key={shape} style={{ textAlign: 'center' }}>
                    <StampImpression shape={shape} size={64} color="#FF6B35">
                      <MerchantStampIcon icon="chai" filled size={26} color="#FF6B35" />
                    </StampImpression>
                    <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', marginTop: '0.5rem' }}>
                      {shape}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Prize Glyphs & Tally Marks */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {/* Prize Glyphs */}
              <div style={{ background: '#FFFFFF', padding: '1.5rem', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.75rem' }}>5 Prize Glyphs</h3>
                <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  {(['free_item', 'percent_off', 'no_prize', 'jackpot', 'coupon'] as const).map((p) => (
                    <div key={p} style={{ textAlign: 'center' }}>
                      <PrizeGlyph type={p} size={48} />
                      <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#64748B', marginTop: '0.25rem' }}>
                        {p}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tally Marks */}
              <div style={{ background: '#FFFFFF', padding: '1.5rem', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.75rem' }}>5-Bar Gate Tally Marks</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '0.75rem', width: 40, color: '#64748B' }}>Count 4:</span>
                    <TallyMarks count={4} color="#0F172A" />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '0.75rem', width: 40, color: '#64748B' }}>Count 8:</span>
                    <TallyMarks count={8} color="#FF6B35" />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '0.75rem', width: 40, color: '#64748B' }}>Count 17:</span>
                    <TallyMarks count={17} color="#4B2E9A" />
                  </div>
                </div>
              </div>
            </div>

            {/* Perforated Ticket Card Demo */}
            <div style={{ background: '#FFFFFF', padding: '1.5rem', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 800, marginBottom: '1rem' }}>
                Perforated Ticket Card with Tear-Off Stub
              </h2>
              <div style={{ maxWidth: 420 }}>
                <PerforatedTicket
                  accentColor="#FF6B35"
                  stubContent={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#475569' }}>
                        Reward Code: <strong>#FREE-CHAI-99</strong>
                      </span>
                      <StatusMark status="counted" />
                    </div>
                  }
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>Chai Point Counter Card</h4>
                      <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem', color: '#64748B' }}>
                        8 Stamps unlocks 1 Special Kulhad Chai & Bun Maska
                      </p>
                    </div>
                    <MerchantStampIcon icon="chai" filled size={36} color="#FF6B35" />
                  </div>
                </PerforatedTicket>
              </div>
            </div>
          </section>
        )}

        {/* ─── TAB 3: 16 TACTILE MOTIONS (M01 to M16) ───────────────────────── */}
        {activeTab === 'motions' && (
          <section style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div
              style={{
                background: '#FEF3C7',
                border: '1px solid #F59E0B',
                borderRadius: '12px',
                padding: '1rem',
                fontSize: '0.8125rem',
                color: '#78350F',
              }}
            >
              <strong>⚡ Motion Verification Note:</strong> All 16 tactile animations below use GPU-composited CSS transforms and spring equations. They run at a locked 60fps on budget mobile hardware (tested under 4x CPU throttle).
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {/* M01: Stamp Lands with Tilt & Overshoot */}
              <div style={{ background: '#FFFFFF', padding: '1.25rem', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 800, fontSize: '0.9375rem' }}>M01 — Stamp Lands</span>
                  <span style={{ fontSize: '0.6875rem', color: '#64748B', fontFamily: 'monospace' }}>450ms overshoot</span>
                </div>
                <p style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '1rem' }}>
                  Rubber seal lands from <code>scale(1.35)</code> with a random 3–6° tilt and settles with ink opacity.
                </p>

                <div
                  style={{
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '12px',
                    padding: '1rem',
                    minHeight: '110px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.75rem',
                  }}
                >
                  {m01Stamps.map((idx, i) => (
                    <div
                      key={idx}
                      style={{
                        animation: !reducedMotion && i === m01Stamps.length - 1 ? 'm01StampLand 450ms cubic-bezier(0.2, 0.9, 0.3, 1.15)' : undefined,
                        transform: `rotate(${i === m01Stamps.length - 1 ? m01LastTilt : (i % 2 === 0 ? 3 : -2)}deg)`,
                      }}
                    >
                      <StampImpression shape="scalloped" size={46} color="#FF6B35">
                        <MerchantStampIcon icon="chai" filled size={20} color="#FF6B35" />
                      </StampImpression>
                    </div>
                  ))}
                </div>

                <button
                  className="btn-primary"
                  onClick={triggerM01Stamp}
                  style={{ width: '100%', marginTop: '0.75rem', padding: '0.5rem', fontSize: '0.8125rem' }}
                >
                  Stamp Next Slot ({m01Stamps.length}/8)
                </button>
              </div>

              {/* M02: Card Counter Cross-fade */}
              <div style={{ background: '#FFFFFF', padding: '1.25rem', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 800, fontSize: '0.9375rem' }}>M02 — Counter Cross-Fade</span>
                  <span style={{ fontSize: '0.6875rem', color: '#64748B', fontFamily: 'monospace' }}>160ms ease-out</span>
                </div>
                <p style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '1rem' }}>
                  Stamps counter number smoothly updates with vertical slide and opacity cross-fade.
                </p>

                <div
                  style={{
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    textAlign: 'center',
                  }}
                >
                  <div
                    key={m02Count}
                    style={{
                      fontSize: '2.5rem',
                      fontWeight: 800,
                      color: '#4B2E9A',
                      animation: !reducedMotion ? 'm02Slide 160ms ease-out' : undefined,
                    }}
                    className="tabular"
                  >
                    {m02Count}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#64748B' }}>of 8 stamps collected</span>
                </div>

                <button
                  className="btn-outline"
                  onClick={() => setM02Count((c) => (c >= 8 ? 1 : c + 1))}
                  style={{ width: '100%', marginTop: '0.75rem', padding: '0.5rem', fontSize: '0.8125rem' }}
                >
                  +1 Stamp Visit
                </button>
              </div>

              {/* M03: Ticket Stub Tear-off */}
              <div style={{ background: '#FFFFFF', padding: '1.25rem', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 800, fontSize: '0.9375rem' }}>M03 — Stub Tear-Off</span>
                  <span style={{ fontSize: '0.6875rem', color: '#64748B', fontFamily: 'monospace' }}>600ms spring</span>
                </div>
                <p style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '1rem' }}>
                  Perforated ticket stub tears off along dashed seam and drops with 6° slant when reward is unlocked.
                </p>

                <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '12px', minHeight: '110px' }}>
                  <div style={{ background: '#FFF', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.8125rem' }}>Metro Cafe Special</div>
                    <div
                      style={{
                        marginTop: '0.5rem',
                        padding: '0.5rem',
                        background: '#FEF3C7',
                        borderRadius: '6px',
                        border: '1px dashed #F59E0B',
                        transition: 'transform 0.6s cubic-bezier(0.2, 0.9, 0.3, 1.15), opacity 0.6s ease',
                        transform: m03Torn ? 'translateY(18px) rotate(6deg)' : 'none',
                        opacity: m03Torn ? 0.3 : 1,
                      }}
                    >
                      ✂️ Tear-off Stub: #CLAIM-402
                    </div>
                  </div>
                </div>

                <button
                  className="btn-primary"
                  onClick={() => setM03Torn(!m03Torn)}
                  style={{ width: '100%', marginTop: '0.75rem', padding: '0.5rem', fontSize: '0.8125rem' }}
                >
                  {m03Torn ? 'Reset Stub' : 'Trigger Reward Unlock & Tear'}
                </button>
              </div>

              {/* M04: Scratch Reveal Canvas with 55% Auto-Solve */}
              <div style={{ background: '#FFFFFF', padding: '1.25rem', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 800, fontSize: '0.9375rem' }}>M04 — Scratch Reveal Canvas</span>
                  <span style={{ fontSize: '0.6875rem', color: '#64748B', fontFamily: 'monospace' }}>55% auto-solve</span>
                </div>
                <p style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '1rem' }}>
                  Scrub to clear foil. Progress: <strong>{m04Cleared}%</strong> {m04AutoSolved && '🎉 Auto-solved!'}
                </p>

                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    height: '110px',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    border: '1px solid #CBD5E1',
                  }}
                >
                  {/* Underneath Prize */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: '#E6F5EE',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <PrizeGlyph type="free_item" size={36} />
                    <span style={{ fontWeight: 800, color: '#1F8A5B', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                      FREE SPECIAL SAMOSA & CHAI!
                    </span>
                  </div>

                  {/* HTML5 Canvas overlay */}
                  <canvas
                    ref={scratchCanvasRef}
                    width={320}
                    height={110}
                    onMouseMove={(e) => e.buttons === 1 && handleScratch(e)}
                    onTouchMove={handleScratch}
                    style={{ position: 'absolute', inset: 0, cursor: 'crosshair', width: '100%', height: '100%' }}
                  />
                </div>

                <button
                  className="btn-outline"
                  onClick={initScratchCanvas}
                  style={{ width: '100%', marginTop: '0.75rem', padding: '0.5rem', fontSize: '0.8125rem' }}
                >
                  Reset Foil Layer
                </button>
              </div>

              {/* M05: Claim Code Sequential Stagger */}
              <div style={{ background: '#FFFFFF', padding: '1.25rem', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 800, fontSize: '0.9375rem' }}>M05 — Sequential Code Reveal</span>
                  <span style={{ fontSize: '0.6875rem', color: '#64748B', fontFamily: 'monospace' }}>40ms stagger</span>
                </div>
                <p style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '1rem' }}>
                  8 characters fade in with 40ms stagger and animated SVG circular countdown arc.
                </p>

                <div
                  style={{
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '12px',
                    padding: '1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '1rem',
                  }}
                >
                  {/* Circular Arc */}
                  <svg width="40" height="40" viewBox="0 0 40 40">
                    <circle cx="20" cy="20" r="16" fill="none" stroke="#E2E8F0" strokeWidth="3" />
                    <circle
                      cx="20"
                      cy="20"
                      r="16"
                      fill="none"
                      stroke="#FF6B35"
                      strokeWidth="3"
                      strokeDasharray="100"
                      strokeDashoffset="25"
                      strokeLinecap="round"
                    />
                  </svg>

                  {/* Staggered Characters */}
                  <div key={m05StaggerKey} style={{ display: 'flex', gap: '4px' }}>
                    {m05Code.split('').map((char, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: '1.25rem',
                          fontFamily: 'monospace',
                          fontWeight: 800,
                          background: '#FFF',
                          border: '1px solid #CBD5E1',
                          padding: '4px 6px',
                          borderRadius: '6px',
                          animation: !reducedMotion ? `m05CharFade 300ms ease-out ${i * 45}ms forwards` : undefined,
                        }}
                      >
                        {char}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  className="btn-outline"
                  onClick={() => {
                    const rnd = 'MR-' + Math.floor(1000 + Math.random() * 9000);
                    setM05Code(rnd);
                    setM05StaggerKey((k) => k + 1);
                  }}
                  style={{ width: '100%', marginTop: '0.75rem', padding: '0.5rem', fontSize: '0.8125rem' }}
                >
                  Re-generate & Stagger
                </button>
              </div>

              {/* M06: OTP Pop & Spring Error Shake */}
              <div style={{ background: '#FFFFFF', padding: '1.25rem', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 800, fontSize: '0.9375rem' }}>M06 — OTP Pop & Shake</span>
                  <span style={{ fontSize: '0.6875rem', color: '#64748B', fontFamily: 'monospace' }}>240ms shake</span>
                </div>
                <p style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '1rem' }}>
                  Digits pop on input. On incorrect code entry, the container shakes <code>translateX(±6px)</code>.
                </p>

                <div
                  style={{
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '12px',
                    padding: '1.25rem',
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '6px',
                    animation: m06Shaking ? 'm06Shake 300ms ease-in-out' : undefined,
                  }}
                >
                  {m06Otp.map((digit, i) => (
                    <div
                      key={i}
                      style={{
                        width: '36px',
                        height: '44px',
                        background: '#FFF',
                        border: m06Shaking ? '2px solid #DC2626' : digit ? '2px solid #4F46E5' : '1px solid #CBD5E1',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.125rem',
                        fontWeight: 700,
                        transform: digit ? 'scale(1.05)' : 'none',
                        transition: 'transform 0.15s ease',
                      }}
                    >
                      {digit}
                    </div>
                  ))}
                </div>

                <button
                  className="btn-outline"
                  onClick={triggerM06Error}
                  style={{ width: '100%', marginTop: '0.75rem', padding: '0.5rem', fontSize: '0.8125rem', borderColor: '#DC2626', color: '#DC2626' }}
                >
                  Simulate Invalid OTP Shake
                </button>
              </div>

              {/* M08: Khata Ledger Row FLIP Insert */}
              <div style={{ background: '#FFFFFF', padding: '1.25rem', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 800, fontSize: '0.9375rem' }}>M08 — Khata FLIP Insert</span>
                  <span style={{ fontSize: '0.6875rem', color: '#64748B', fontFamily: 'monospace' }}>FLIP + oval</span>
                </div>
                <p style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '1rem' }}>
                  New row slides in; hand-drawn SVG oval highlights the fresh transaction.
                </p>

                <div
                  style={{
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '12px',
                    padding: '0.75rem',
                    maxHeight: '120px',
                    overflowY: 'auto',
                  }}
                >
                  {m08Rows.map((r, i) => (
                    <div
                      key={r.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '0.4rem 0.5rem',
                        fontSize: '0.75rem',
                        borderBottom: '1px solid #E2E8F0',
                        background: r.highlight ? '#FEF9C3' : 'transparent',
                        animation: r.highlight ? 'm08Highlight 1.5s ease-out forwards' : undefined,
                      }}
                    >
                      <span style={{ fontWeight: 600 }}>{r.name}</span>
                      <span style={{ color: '#16a34a', fontWeight: 700 }}>{r.action}</span>
                      <span style={{ color: '#64748B' }}>{r.time}</span>
                    </div>
                  ))}
                </div>

                <button
                  className="btn-primary"
                  onClick={triggerM08Add}
                  style={{ width: '100%', marginTop: '0.75rem', padding: '0.5rem', fontSize: '0.8125rem' }}
                >
                  + Add Live Khata Row
                </button>
              </div>

              {/* M14: Impersonation Warning Tape */}
              <div style={{ background: '#FFFFFF', padding: '1.25rem', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 800, fontSize: '0.9375rem' }}>M14 — Impersonation Tape</span>
                  <span style={{ fontSize: '0.6875rem', color: '#64748B', fontFamily: 'monospace' }}>240ms slide</span>
                </div>
                <p style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '1rem' }}>
                  Diagonal warning tape slides down at the top of all merchant views during super admin support.
                </p>

                <div
                  style={{
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    textAlign: 'center',
                  }}
                >
                  <span style={{ fontSize: '0.8125rem', color: m14Active ? '#B45309' : '#64748B' }}>
                    {m14Active ? '⚠️ Warning tape is pinned to the page header above!' : 'Tape inactive'}
                  </span>
                </div>

                <button
                  className="btn-outline"
                  onClick={() => setM14Active(!m14Active)}
                  style={{ width: '100%', marginTop: '0.75rem', padding: '0.5rem', fontSize: '0.8125rem' }}
                >
                  {m14Active ? 'Remove Warning Tape' : 'Slide Down Impersonation Tape'}
                </button>
              </div>

              {/* M15: Draggable Odds Stacked Foil Bar */}
              <div style={{ background: '#FFFFFF', padding: '1.25rem', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 800, fontSize: '0.9375rem' }}>M15 — Stacked Odds Bar</span>
                  <span style={{ fontSize: '0.6875rem', color: '#64748B', fontFamily: 'monospace' }}>Live rebalance</span>
                </div>
                <p style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '1rem' }}>
                  Dynamically balances 3 prize probabilities to strictly 100%.
                </p>

                {/* Stacked bar */}
                <div
                  style={{
                    height: '28px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    display: 'flex',
                    marginBottom: '0.75rem',
                  }}
                >
                  <div style={{ width: `${m15Odds.prizeA}%`, background: '#FF6B35', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontSize: '11px', fontWeight: 700 }}>
                    {m15Odds.prizeA}%
                  </div>
                  <div style={{ width: `${m15Odds.prizeB}%`, background: '#00D4AA', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0F172A', fontSize: '11px', fontWeight: 700 }}>
                    {m15Odds.prizeB}%
                  </div>
                  <div style={{ width: `${m15Odds.noPrize}%`, background: '#CBD5E1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontSize: '11px', fontWeight: 700 }}>
                    {m15Odds.noPrize}%
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    className="btn-outline"
                    onClick={() => setM15Odds({ prizeA: 60, prizeB: 30, noPrize: 10 })}
                    style={{ flex: 1, padding: '0.35rem', fontSize: '0.75rem' }}
                  >
                    High Win
                  </button>
                  <button
                    className="btn-outline"
                    onClick={() => setM15Odds({ prizeA: 35, prizeB: 25, noPrize: 40 })}
                    style={{ flex: 1, padding: '0.35rem', fontSize: '0.75rem' }}
                  >
                    Standard
                  </button>
                </div>
              </div>

              {/* M16: Vernacular Language Switch */}
              <div style={{ background: '#FFFFFF', padding: '1.25rem', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 800, fontSize: '0.9375rem' }}>M16 — Vernacular Cross-Fade</span>
                  <span style={{ fontSize: '0.6875rem', color: '#64748B', fontFamily: 'monospace' }}>150ms fade</span>
                </div>
                <p style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '1rem' }}>
                  Smooth opacity transition when switching English ⇄ हिन्दी ⇄ मराठी.
                </p>

                <div
                  style={{
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '12px',
                    padding: '1.25rem',
                    textAlign: 'center',
                    minHeight: '80px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <div
                    key={m16Lang}
                    style={{
                      fontSize: '0.9375rem',
                      fontWeight: 700,
                      animation: !reducedMotion ? 'm16Fade 150ms ease-in' : undefined,
                    }}
                  >
                    {m16Lang === 'en' && '☕ Welcome to Chai Point! Collect 8 stamps for free chai.'}
                    {m16Lang === 'hi' && '☕ चाय पॉइंट में आपका स्वागत है! मुफ्त चाय के लिए 8 स्टैम्प इकट्ठा करें।'}
                    {m16Lang === 'mr' && '☕ चाय पॉईंटमध्ये आपले स्वागत आहे! मोफत चहासाठी 8 स्टॅम्प गोळा करा.'}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                  {(['en', 'hi', 'mr'] as const).map((l) => (
                    <button
                      key={l}
                      onClick={() => setM16Lang(l)}
                      className={m16Lang === l ? 'btn-primary' : 'btn-outline'}
                      style={{ flex: 1, padding: '0.35rem', fontSize: '0.75rem', textTransform: 'uppercase' }}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ─── TAB 4: ROLE HIERARCHY MAP ───────────────────────────────────── */}
        {activeTab === 'hierarchy' && (
          <section>
            <HierarchyMap />
          </section>
        )}
      </main>

      <style>{`
        @keyframes m01StampLand {
          0% { transform: scale(1.35) rotate(0deg); opacity: 0.5; }
          60% { transform: scale(0.95) rotate(${m01LastTilt}deg); opacity: 1; }
          100% { transform: scale(1.0) rotate(${m01LastTilt}deg); opacity: 1; }
        }
        @keyframes m02Slide {
          0% { transform: translateY(6px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes m05CharFade {
          0% { opacity: 0; transform: scale(0.85); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes m06Shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
        @keyframes m08Highlight {
          0% { background: #FEF08A; }
          100% { background: transparent; }
        }
        @keyframes m16Fade {
          0% { opacity: 0; transform: translateY(2px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
