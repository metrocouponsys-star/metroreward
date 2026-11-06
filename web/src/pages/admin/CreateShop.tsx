import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api, StampError } from '../../lib/api.ts';
import { S } from '../../strings.ts';

export default function AdminCreateShopPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ slug: '', name: '', ownerPhone: '', lat: '', lng: '' });
  const [error, setError] = useState('');

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      api.post('/admin/shops', {
        slug: form.slug,
        name: form.name,
        ownerPhone: form.ownerPhone,
        ...(form.lat ? { lat: parseFloat(form.lat) } : {}),
        ...(form.lng ? { lng: parseFloat(form.lng) } : {}),
      }),
    onSuccess: () => navigate('/admin'),
    onError: (err) => setError(err instanceof StampError ? err.message : S.genericError),
  });

  function set(k: keyof typeof form, v: string) { setForm((f) => ({ ...f, [k]: v })); }

  return (
    <div className="page">
      <nav className="topbar">
        <button className="btn-ghost" onClick={() => navigate(-1)}>← Back</button>
        <span className="topbar-title">{S.createShop}</span>
        <span style={{ width: 48 }} />
      </nav>

      <div className="content" style={{ padding: '2rem 0' }}>
        <div className="sheet">
          <form
            onSubmit={(e) => { e.preventDefault(); setError(''); mutate(); }}
            style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
          >
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{S.shopSlug}</span>
              <input className="input" value={form.slug} onChange={(e) => set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} placeholder="chai-wala" required />
              <span style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>URL: /s/{form.slug}</span>
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{S.shopName}</span>
              <input className="input" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Chai Wala" required />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{S.ownerPhone}</span>
              <input className="input" type="tel" value={form.ownerPhone} onChange={(e) => set('ownerPhone', e.target.value)} placeholder="+91 98765 43210" required />
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{S.latitude}</span>
                <input className="input" type="number" step="any" value={form.lat} onChange={(e) => set('lat', e.target.value)} placeholder="18.9388" />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{S.longitude}</span>
                <input className="input" type="number" step="any" value={form.lng} onChange={(e) => set('lng', e.target.value)} placeholder="72.8354" />
              </label>
            </div>

            {error && <div className="error-msg">{error}</div>}

            <button className="btn-primary" type="submit" disabled={isPending}>
              {isPending ? <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : S.createShop}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

