import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api.ts';
import { S } from '../../strings.ts';

interface Shop {
  id: string;
  slug: string;
  name: string;
  ownerPhone: string;
  isActive: boolean;
  createdAt: string;
}

export default function AdminShopsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-shops'],
    queryFn: () => api.get<{ shops: Shop[] }>('/admin/shops'),
  });

  const { mutate: deactivate } = useMutation({
    mutationFn: (id: string) => api.post(`/admin/shops/${id}/deactivate`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-shops'] }),
  });

  return (
    <div className="page">
      <nav className="topbar">
        <span className="topbar-title">Admin — {S.shopList}</span>
        <Link to="/admin/create-shop" className="btn-primary" style={{ width: 'auto', padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
          + {S.createShop}
        </Link>
      </nav>

      <div className="content" style={{ padding: '1.5rem 0' }}>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <Link to="/admin/flags" className="btn-outline" style={{ width: 'auto' }}>{S.flaggedActivity}</Link>
        </div>

        {isLoading && <div className="loading-center"><div className="spinner" /></div>}

        <div style={{ borderTop: '1px solid var(--hairline)' }}>
          {data?.shops.map((s) => (
            <div key={s.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '0.875rem 0', borderBottom: '1px solid var(--hairline)', gap: '1rem',
            }}>
              <div>
                <div style={{ fontWeight: 500 }}>{s.name}</div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)' }}>{s.ownerPhone} · /s/{s.slug}</div>
                {!s.isActive && <div style={{ fontSize: '0.75rem', color: 'var(--alert)', marginTop: '0.125rem' }}>Inactive</div>}
              </div>
              {s.isActive && (
                <button
                  className="btn-danger"
                  style={{ padding: '0.375rem 0.75rem', fontSize: '0.8125rem' }}
                  onClick={() => {
                    if (window.confirm(`Deactivate ${s.name}?`)) deactivate(s.id);
                  }}
                >
                  {S.deactivate}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

