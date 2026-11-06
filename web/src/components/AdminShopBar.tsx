import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.ts';
import { useAuth } from '../hooks/useAuth.tsx';

interface ShopOption {
  id: string;
  slug: string;
  name: string;
  isActive: boolean;
}

interface SummaryData {
  shopId?: string;
  shopName?: string;
  shopSlug?: string;
}

export function AdminShopBar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  if (user?.role !== 'admin') return null;

  const { data: shopsData } = useQuery({
    queryKey: ['admin-shops-dropdown'],
    queryFn: () => api.get<{ shops: ShopOption[] }>('/admin/shops'),
    staleTime: 60_000,
  });

  const { data: summaryData } = useQuery<SummaryData>({
    queryKey: ['shop-summary'],
    staleTime: 10_000,
  });

  const { mutate: switchShop, isPending } = useMutation({
    mutationFn: (shopId: string) => api.post(`/admin/impersonate/${shopId}`),
    onSuccess: () => {
      qc.invalidateQueries();
    },
  });

  const { mutate: exitAdmin } = useMutation({
    mutationFn: () => api.post('/admin/exit-impersonate'),
    onSuccess: () => {
      qc.invalidateQueries();
      navigate('/admin');
    },
  });

  const currentShopId = summaryData?.shopId;
  const currentShopName = summaryData?.shopName || 'Merchant Dashboard';
  const shops = shopsData?.shops || [];

  return (
    <div
      style={{
        background: '#0F172A',
        color: '#F8FAFC',
        padding: '0.5rem 1rem',
        fontSize: '0.8125rem',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.75rem',
        borderBottom: '1px solid #334155',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
        <span
          style={{
            background: '#F97316',
            color: '#FFFFFF',
            fontWeight: 700,
            fontSize: '0.6875rem',
            padding: '0.125rem 0.5rem',
            borderRadius: '999px',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          Super Admin
        </span>
        <span>
          Viewing as: <strong style={{ color: '#FDBA74' }}>{currentShopName}</strong>
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
        {shops.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <label htmlFor="shop-switcher" style={{ color: '#94A3B8', fontSize: '0.75rem' }}>
              Switch:
            </label>
            <select
              id="shop-switcher"
              value={currentShopId || ''}
              disabled={isPending}
              onChange={(e) => {
                if (e.target.value) switchShop(e.target.value);
              }}
              style={{
                background: '#1E293B',
                color: '#F8FAFC',
                border: '1px solid #475569',
                borderRadius: '6px',
                padding: '0.25rem 0.5rem',
                fontSize: '0.75rem',
                cursor: 'pointer',
              }}
            >
              {shops.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {!s.isActive ? '(Inactive)' : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        <button
          onClick={() => exitAdmin()}
          style={{
            background: 'rgba(255,255,255,0.12)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '6px',
            padding: '0.25rem 0.75rem',
            fontSize: '0.75rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background 0.15s ease',
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
          onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
        >
          ← Back to Admin Portal
        </button>
      </div>
    </div>
  );
}

