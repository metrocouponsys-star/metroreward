import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api.ts';
import { S } from '../../strings.ts';
import {
  PerforatedTicket,
  StampImpression,
  MerchantStampIcon,
  StampIconId,
  StatusMark,
} from '../../components/svg/Icons.tsx';

interface Program {
  id: string;
  stampsRequired: number;
  rewardText: string;
  cooldownMinutes: number;
  maxStampsPerDay: number;
  requireApproval: boolean;
  scratchEnabled: boolean;
  scratchEveryNVisits: number;
  prizeExpiryDays: number;
}

interface Prize {
  id?: string;
  title: string;
  weight: number;
  stock: number | null;
  isNoPrize: boolean;
  isActive: boolean;
  percentage?: number;
}

const PALETTES = [
  { name: 'Warm Coral', hex: '#FF6B35' },
  { name: 'Royal Violet', hex: '#4B2E9A' },
  { name: 'Forest Green', hex: '#1F5C3E' },
  { name: 'Deep Ocean', hex: '#1D5F8A' },
  { name: 'Warm Turmeric', hex: '#C07D1E' },
  { name: 'Brick Rust', hex: '#A33B26' },
  { name: 'Slate Charcoal', hex: '#2D3748' },
  { name: 'Plum Berry', hex: '#6B2D5C' },
];

const ICONS: StampIconId[] = [
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

export default function ShopProgramPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<'studio' | 'odds'>('studio');

  // Studio Styling Customizations
  const [selectedColor, setSelectedColor] = useState('#FF6B35');
  const [selectedIcon, setSelectedIcon] = useState<StampIconId>('chai');

  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // 1. Program Data
  const { data: progData } = useQuery({
    queryKey: ['shop-program'],
    queryFn: () => api.get<{ program: Program | null }>('/shop/program'),
  });

  // 2. Scratch Prizes Data
  const { data: prizesData } = useQuery({
    queryKey: ['shop-prizes'],
    queryFn: () => api.get<{ prizes: Prize[] }>('/shop/scratch-prizes'),
  });

  const [form, setForm] = useState<Partial<Program>>({});
  const prog = progData?.program;

  function field<K extends keyof Program>(key: K): Program[K] {
    return (form[key] ?? prog?.[key]) as Program[K];
  }

  function set<K extends keyof Program>(key: K, val: Program[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  // Save Program Rules
  const { mutate: saveProgram, isPending: savingProgram } = useMutation({
    mutationFn: () => {
      const data = {
        stampsRequired: field('stampsRequired') ?? 8,
        rewardText: field('rewardText') ?? '',
        cooldownMinutes: field('cooldownMinutes') ?? 360,
        maxStampsPerDay: field('maxStampsPerDay') ?? 2,
        requireApproval: field('requireApproval') ?? false,
        scratchEnabled: field('scratchEnabled') ?? true,
        scratchEveryNVisits: field('scratchEveryNVisits') ?? 1,
        prizeExpiryDays: field('prizeExpiryDays') ?? 30,
      };
      return api.put('/shop/program', data);
    },
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      qc.invalidateQueries({ queryKey: ['shop-program'] });
    },
    onError: () => setError('Could not save program settings. Try again.'),
  });

  // Prize List & Local Draft
  const [prizesList, setPrizesList] = useState<Prize[] | null>(null);
  const prizes = prizesList ?? (prizesData?.prizes || []);

  const totalWeight = prizes.reduce((sum, p) => sum + (p.isActive ? p.weight : 0), 0);

  // Save Prizes Mutation
  const { mutate: savePrizes, isPending: savingPrizes } = useMutation({
    mutationFn: (updated: Prize[]) => api.put('/shop/scratch-prizes', updated),
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      qc.invalidateQueries({ queryKey: ['shop-prizes'] });
      setPrizesList(null);
    },
    onError: () => setError('Could not save scratch prizes.'),
  });

  // Simulator state
  const [simResults, setSimResults] = useState<{ [title: string]: number } | null>(null);

  const runSimulation = () => {
    const activePrizes = prizes.filter((p) => p.isActive);
    if (activePrizes.length === 0 || totalWeight <= 0) return;

    const tally: { [title: string]: number } = {};
    activePrizes.forEach((p) => {
      tally[p.isNoPrize ? 'No prize' : p.title] = 0;
    });

    for (let i = 0; i < 100; i++) {
      let roll = Math.floor(Math.random() * totalWeight);
      let cumulative = 0;
      for (const p of activePrizes) {
        cumulative += p.weight;
        if (roll < cumulative) {
          const key = p.isNoPrize ? 'No prize' : p.title;
          tally[key] = (tally[key] || 0) + 1;
          break;
        }
      }
    }
    setSimResults(tally);
  };

  const stampsReq = field('stampsRequired') ?? 8;
  const rewardDesc = field('rewardText') ?? 'Free item or reward';
  const cooldownHours = Math.round((field('cooldownMinutes') ?? 360) / 60);

  return (
    <div className="page" style={{ maxWidth: 1040, margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Top Bar */}
      <nav className="topbar">
        <button className="btn-ghost" onClick={() => navigate(-1)} style={{ padding: '0.4rem 0.6rem' }}>
          ← Back
        </button>
        <span className="topbar-title">Merchant Studio & Program Designer</span>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setActiveTab('studio')}
            className={activeTab === 'studio' ? 'btn-primary' : 'btn-ghost'}
            style={{ fontSize: '0.8125rem', padding: '0.35rem 0.75rem', width: 'auto' }}
          >
            🎨 Card Studio
          </button>
          <button
            onClick={() => setActiveTab('odds')}
            className={activeTab === 'odds' ? 'btn-primary' : 'btn-ghost'}
            style={{ fontSize: '0.8125rem', padding: '0.35rem 0.75rem', width: 'auto' }}
          >
            🎲 Scratch Odds
          </button>
        </div>
      </nav>

      <div className="content" style={{ padding: '1.25rem 0' }}>
        {/* Alerts */}
        {saved && (
          <div
            style={{
              padding: '0.75rem 1rem',
              background: '#E6F5EE',
              border: '1px solid #1F8A5B',
              borderRadius: '8px',
              color: '#1F8A5B',
              fontWeight: 700,
              fontSize: '0.875rem',
              marginBottom: '1rem',
            }}
          >
            ✓ Settings saved and synced to customer passes!
          </div>
        )}
        {error && (
          <div className="error-msg" style={{ marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        {/* ─── TAB 1: CARD STUDIO (M7) ─────────────────────────────────────── */}
        {activeTab === 'studio' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
            {/* Left: Program Controls Form */}
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: '16px',
                border: '1px solid var(--hairline)',
                padding: '1.5rem',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <h2 style={{ fontSize: '1.125rem', fontWeight: 800, marginBottom: '1rem' }}>
                Program Rules & Mechanics
              </h2>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  saveProgram();
                }}
                style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}
              >
                {/* Stamps Required Slider */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Stamps Required per Pass:</span>
                    <strong style={{ color: selectedColor, fontSize: '1rem' }} className="tabular">
                      {stampsReq} Stamps
                    </strong>
                  </div>
                  <input
                    type="range"
                    min={2}
                    max={20}
                    value={stampsReq}
                    onChange={(e) => set('stampsRequired', parseInt(e.target.value))}
                    style={{ width: '100%', accentColor: selectedColor }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', color: '#94A3B8' }}>
                    <span>2 (Quick)</span>
                    <span>8 (Standard)</span>
                    <span>20 (VIP Club)</span>
                  </div>
                </div>

                {/* Reward Description */}
                <div>
                  <label style={{ fontSize: '0.875rem', fontWeight: 600, display: 'block', marginBottom: '0.375rem' }}>
                    Reward Description:
                  </label>
                  <input
                    className="input"
                    type="text"
                    placeholder="e.g. 1 Special Kulhad Chai & Samosa"
                    value={rewardDesc}
                    onChange={(e) => set('rewardText', e.target.value)}
                  />
                </div>

                {/* Stamp Icon Picker */}
                <div>
                  <label style={{ fontSize: '0.875rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
                    Stamp Impression Icon (12 Hand-Drawn SVGs):
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.5rem' }}>
                    {ICONS.map((icon) => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setSelectedIcon(icon)}
                        style={{
                          background: selectedIcon === icon ? `${selectedColor}15` : '#F8FAFC',
                          border: selectedIcon === icon ? `2px solid ${selectedColor}` : '1px solid #E2E8F0',
                          borderRadius: '8px',
                          padding: '0.4rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                        }}
                      >
                        <MerchantStampIcon icon={icon} filled={selectedIcon === icon} size={24} color={selectedColor} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Card Accent Color Picker */}
                <div>
                  <label style={{ fontSize: '0.875rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
                    Card Palette Theme:
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {PALETTES.map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => setSelectedColor(c.hex)}
                        title={c.name}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background: c.hex,
                          border: selectedColor === c.hex ? '3px solid #0F172A' : '2px solid #FFFFFF',
                          boxShadow: selectedColor === c.hex ? '0 0 0 1px #0F172A' : 'none',
                          cursor: 'pointer',
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Cooldown Hours Slider */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Cooldown Between Scans:</span>
                    <strong style={{ color: '#0F172A' }} className="tabular">
                      {cooldownHours} {cooldownHours === 1 ? 'Hour' : 'Hours'}
                    </strong>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={24}
                    value={cooldownHours}
                    onChange={(e) => set('cooldownMinutes', parseInt(e.target.value) * 60)}
                    style={{ width: '100%', accentColor: selectedColor }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', color: '#94A3B8' }}>
                    <span>1 Hour (Fast Cafe)</span>
                    <span>6 Hours</span>
                    <span>24 Hours (1/Day)</span>
                  </div>
                </div>

                {/* Approval & Scratch Toggles */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingTop: '0.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={field('requireApproval') ?? false}
                      onChange={(e) => set('requireApproval', e.target.checked)}
                      style={{ width: 18, height: 18, accentColor: selectedColor }}
                    />
                    <span style={{ fontSize: '0.875rem' }}>Require staff PIN approval for each stamp</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={field('scratchEnabled') ?? true}
                      onChange={(e) => set('scratchEnabled', e.target.checked)}
                      style={{ width: 18, height: 18, accentColor: selectedColor }}
                    />
                    <span style={{ fontSize: '0.875rem' }}>Award instant scratch card with every stamp</span>
                  </label>
                </div>

                <button
                  className="btn-primary"
                  type="submit"
                  disabled={savingProgram}
                  style={{
                    background: selectedColor,
                    borderColor: selectedColor,
                    marginTop: '0.75rem',
                    padding: '0.75rem',
                    fontWeight: 800,
                  }}
                >
                  {savingProgram ? 'Saving Program…' : 'Save & Publish Program'}
                </button>
              </form>
            </div>

            {/* Right: Live Ticket Preview (Spring M09) */}
            <div>
              <div
                style={{
                  background: '#FFFFFF',
                  borderRadius: '16px',
                  border: '1px solid var(--hairline)',
                  padding: '1.5rem',
                  boxShadow: 'var(--shadow-card)',
                  position: 'sticky',
                  top: '80px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>
                    Live Customer Pass Preview
                  </h3>
                  <span style={{ fontSize: '0.6875rem', background: '#F1F5F9', color: '#64748B', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
                    WYSIWYG
                  </span>
                </div>

                <PerforatedTicket
                  accentColor={selectedColor}
                  stubContent={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                        Progress: <strong style={{ color: '#0F172A' }}>3 of {stampsReq} Stamps</strong>
                      </span>
                      <StatusMark status="counted" />
                    </div>
                  }
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div>
                      <span style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: selectedColor, fontWeight: 800 }}>
                        OFFICIAL STAMP PASS
                      </span>
                      <h4 style={{ fontSize: '1.125rem', fontWeight: 800, margin: '0.125rem 0' }}>
                        {progData?.program ? 'Your Store Card' : 'Metro Cafe'}
                      </h4>
                      <p style={{ fontSize: '0.75rem', color: '#64748B', margin: 0 }}>
                        {rewardDesc}
                      </p>
                    </div>
                    <MerchantStampIcon icon={selectedIcon} filled size={32} color={selectedColor} />
                  </div>

                  {/* Stamp slots preview */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: `repeat(${stampsReq <= 6 ? stampsReq : stampsReq <= 10 ? 5 : 4}, 1fr)`,
                      gap: '0.5rem',
                      padding: '0.5rem 0',
                    }}
                  >
                    {Array.from({ length: stampsReq }).map((_, i) => (
                      <div
                        key={i}
                        style={{
                          aspectRatio: '1/1',
                          borderRadius: '8px',
                          border: i < 3 ? `2px solid ${selectedColor}` : '2px dashed #CBD5E1',
                          background: i < 3 ? `${selectedColor}12` : '#F8FAFC',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {i < 3 ? (
                          <StampImpression shape="scalloped" size={32} color={selectedColor}>
                            <MerchantStampIcon icon={selectedIcon} filled size={16} color={selectedColor} />
                          </StampImpression>
                        ) : (
                          <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#94A3B8' }}>
                            {i + 1}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </PerforatedTicket>

                {/* Cooldown pill info */}
                <div
                  style={{
                    marginTop: '1rem',
                    padding: '0.75rem',
                    background: '#F8FAFC',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    fontSize: '0.75rem',
                    color: '#64748B',
                  }}
                >
                  ⏱️ <strong>Cooldown Rule:</strong> Customers must wait <strong>{cooldownHours} hour(s)</strong> between consecutive stamp visits.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 2: SCRATCH ODDS SIMULATOR (M15) ─────────────────────────── */}
        {activeTab === 'odds' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Stacked Odds Bar (M15) */}
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: '16px',
                border: '1px solid var(--hairline)',
                padding: '1.5rem',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <h2 style={{ fontSize: '1.125rem', fontWeight: 800, marginBottom: '0.25rem' }}>
                Probability Distribution & Stacked Bar (M15)
              </h2>
              <p style={{ fontSize: '0.8125rem', color: '#64748B', marginBottom: '1.25rem' }}>
                Total Weight: <strong>{totalWeight}</strong>. Probabilities automatically rebalance to 100%.
              </p>

              {/* Stacked foil bar */}
              <div
                style={{
                  height: '36px',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  display: 'flex',
                  border: '1px solid #CBD5E1',
                  marginBottom: '1.25rem',
                }}
              >
                {prizes
                  .filter((p) => p.isActive)
                  .map((p, idx) => {
                    const pct = totalWeight > 0 ? (p.weight / totalWeight) * 100 : 0;
                    const colors = ['#FF6B35', '#00D4AA', '#4B2E9A', '#F59E0B', '#1F5C3E', '#94A3B8'];
                    const barColor = p.isNoPrize ? '#CBD5E1' : colors[idx % (colors.length - 1)];

                    return (
                      <div
                        key={p.id ?? p.title}
                        style={{
                          width: `${pct}%`,
                          background: barColor,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: p.isNoPrize ? '#475569' : '#FFFFFF',
                          fontSize: '11px',
                          fontWeight: 700,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          padding: '0 4px',
                          transition: 'width 0.25s ease',
                        }}
                        title={`${p.title}: ${pct.toFixed(1)}%`}
                      >
                        {pct >= 8 ? `${pct.toFixed(0)}%` : ''}
                      </div>
                    );
                  })}
              </div>

              {/* Scratch Test Simulator Button */}
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <button
                  className="btn-primary"
                  onClick={runSimulation}
                  style={{ width: 'auto', padding: '0.5rem 1rem', fontSize: '0.8125rem' }}
                >
                  🎲 Run 100 Test Draws (RNG Simulation)
                </button>
                <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                  Simulates 100 customer scratches using the current probability weights.
                </span>
              </div>

              {/* Simulation Result Breakdown */}
              {simResults && (
                <div
                  style={{
                    marginTop: '1.25rem',
                    padding: '1rem',
                    background: '#F8FAFC',
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0',
                  }}
                >
                  <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: 800 }}>
                    100 Test Draws Outcome:
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                    {Object.entries(simResults).map(([title, count]) => (
                      <div
                        key={title}
                        style={{
                          background: '#FFFFFF',
                          padding: '0.625rem 0.875rem',
                          borderRadius: '8px',
                          border: '1px solid #CBD5E1',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{title}</span>
                        <strong style={{ color: '#0F172A', fontSize: '0.9375rem' }} className="tabular">
                          {count} wins ({count}%)
                        </strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Prize Table Management */}
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: '16px',
                border: '1px solid var(--hairline)',
                padding: '1.5rem',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>Prizes & Odds Table</h3>
                <button
                  className="btn-outline"
                  onClick={() => {
                    const newPrize: Prize = {
                      title: 'Free Coffee or Pastry',
                      weight: 10,
                      stock: null,
                      isNoPrize: false,
                      isActive: true,
                    };
                    setPrizesList([...prizes, newPrize]);
                  }}
                  style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                >
                  + Add Prize
                </button>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #E2E8F0', color: '#64748B', fontSize: '0.75rem' }}>
                      <th style={{ textAlign: 'left', padding: '0.625rem 0', fontWeight: 700 }}>Prize Title</th>
                      <th style={{ textAlign: 'center', padding: '0.625rem 0.5rem', fontWeight: 700 }}>Weight</th>
                      <th style={{ textAlign: 'center', padding: '0.625rem 0.5rem', fontWeight: 700 }}>Chance</th>
                      <th style={{ textAlign: 'center', padding: '0.625rem 0.5rem', fontWeight: 700 }}>Stock</th>
                      <th style={{ textAlign: 'center', padding: '0.625rem 0.5rem', fontWeight: 700 }}>Active</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prizes.map((p, idx) => {
                      const pct = totalWeight > 0 && p.isActive ? (p.weight / totalWeight) * 100 : 0;
                      return (
                        <tr key={p.id ?? `${p.title}-${idx}`} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '0.75rem 0' }}>
                            <input
                              className="input"
                              type="text"
                              value={p.title}
                              disabled={p.isNoPrize}
                              onChange={(e) => {
                                const copy = [...prizes];
                                copy[idx] = { ...copy[idx], title: e.target.value };
                                setPrizesList(copy);
                              }}
                              style={{ maxWidth: '240px', padding: '0.35rem 0.5rem', fontSize: '0.8125rem' }}
                            />
                            {p.isNoPrize && (
                              <span style={{ fontSize: '0.6875rem', color: '#64748B', display: 'block', marginTop: '2px' }}>
                                (Default friendly fallback card)
                              </span>
                            )}
                          </td>
                          <td style={{ textAlign: 'center', padding: '0.75rem 0.5rem' }}>
                            <input
                              className="input"
                              type="number"
                              min={1}
                              max={100}
                              value={p.weight}
                              onChange={(e) => {
                                const copy = [...prizes];
                                copy[idx] = { ...copy[idx], weight: parseInt(e.target.value) || 1 };
                                setPrizesList(copy);
                              }}
                              style={{ width: '64px', textAlign: 'center', padding: '0.35rem 0.25rem', fontSize: '0.8125rem' }}
                            />
                          </td>
                          <td style={{ textAlign: 'center', padding: '0.75rem 0.5rem', fontWeight: 700 }} className="tabular">
                            {p.isActive ? `${pct.toFixed(1)}%` : '—'}
                          </td>
                          <td style={{ textAlign: 'center', padding: '0.75rem 0.5rem' }}>
                            <input
                              className="input"
                              type="number"
                              placeholder="∞"
                              value={p.stock ?? ''}
                              onChange={(e) => {
                                const copy = [...prizes];
                                const val = e.target.value === '' ? null : parseInt(e.target.value);
                                copy[idx] = { ...copy[idx], stock: val };
                                setPrizesList(copy);
                              }}
                              style={{ width: '64px', textAlign: 'center', padding: '0.35rem 0.25rem', fontSize: '0.8125rem' }}
                            />
                          </td>
                          <td style={{ textAlign: 'center', padding: '0.75rem 0.5rem' }}>
                            <input
                              type="checkbox"
                              checked={p.isActive}
                              onChange={(e) => {
                                const copy = [...prizes];
                                copy[idx] = { ...copy[idx], isActive: e.target.checked };
                                setPrizesList(copy);
                              }}
                              style={{ width: 18, height: 18, accentColor: '#FF6B35' }}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <button
                className="btn-primary"
                onClick={() => savePrizes(prizes)}
                disabled={savingPrizes}
                style={{ marginTop: '1.25rem', width: 'auto', padding: '0.625rem 1.25rem' }}
              >
                {savingPrizes ? 'Saving Prizes…' : 'Save Scratch Odds'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
