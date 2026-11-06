import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../lib/api.ts';
import { S } from '../../strings.ts';

interface PublicShop {
  id: string;
  name: string;
  slug: string;
  lat: number | null;
  lng: number | null;
  stampsRequired: number | null;
  rewardText: string | null;
}

export default function ExplorePage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['public-shops'],
    queryFn: () => api.get<{ shops: PublicShop[] }>('/shops/public'),
  });

  const filtered = (data?.shops || []).filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.rewardText && s.rewardText.toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <div className="page">
      <nav className="topbar">
        <button className="btn-ghost" onClick={() => navigate(-1)}>← Back</button>
        <span className="topbar-title">Discover Shops</span>
        <span style={{ width: 48 }} />
      </nav>

      <div className="content" style={{ padding: '1.5rem 0' }}>
        <p style={{ color: 'var(--ink-muted)', fontSize: '0.9375rem', marginBottom: '1rem' }}>
          Find neighbourhood shops offering digital stamp cards and scratch card prizes.
        </p>

        <input
          className="input"
          type="search"
          placeholder="Search shops or rewards..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ marginBottom: '1.25rem' }}
        />

        {isLoading && (
          <div className="loading-center">
            <div className="spinner" />
          </div>
        )}

        {error && (
          <div className="error-msg" role="alert">{S.genericError}</div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="empty-state">
            <p style={{ fontWeight: 600 }}>No shops found</p>
            <p>Try searching for a different shop name or category.</p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {filtered.map((shop) => (
            <article
              key={shop.id}
              className="sheet"
              style={{
                cursor: 'pointer',
                border: '1px solid var(--hairline)',
                padding: '1.25rem',
              }}
              onClick={() => navigate(`/cards/${shop.slug}`)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h2 style={{ fontSize: '1.125rem', color: 'var(--ink)' }}>{shop.name}</h2>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)', marginTop: '0.125rem' }}>
                    /{shop.slug}
                  </p>
                </div>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    padding: '0.25rem 0.5rem',
                    borderRadius: '100px',
                    background: 'var(--violet-light)',
                    color: 'var(--violet)',
                  }}
                >
                  {shop.stampsRequired || 8} stamps
                </span>
              </div>

              {shop.rewardText && (
                <div
                  style={{
                    marginTop: '0.75rem',
                    fontSize: '0.875rem',
                    color: 'var(--success)',
                    fontWeight: 500,
                  }}
                >
                  🎁 Reward: {shop.rewardText}
                </div>
              )}
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

