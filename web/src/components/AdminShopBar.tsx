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
        background: '#FEF3C7',
        color: '#78350F',
        padding: '0.625rem 1.25rem',
        fontSize: '0.8125rem',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.75rem',
        borderBottom: '2px solid #F59E0B',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 2px 8px rgba(180, 83, 9, 0.08)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
        <span
          style={{
            background: '#F59E0B',
            color: '#FFFFFF',
            fontWeight: 800,
            fontSize: '0.6875rem',
            padding: '0.15rem 0.5rem',
            borderRadius: '6px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          SUPER ADMIN
        </span>
        <span>
          Acting as: <strong>{currentShopName}</strong>{' '}
          <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>(Tenant-Isolated Session • Audit Logged)</span>
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        {shops.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <label htmlFor="shop-switcher" style={{ color: '#92400E', fontSize: '0.75rem', fontWeight: 600 }}>
              Switch Merchant:
            </label>
            <select
              id="shop-switcher"
              value={currentShopId || ''}
              disabled={isPending}
              onChange={(e) => {
                if (e.target.value) switchShop(e.target.value);
              }}
              style={{
                background: '#FFFFFF',
                color: '#0F172A',
                border: '1px solid #CBD5E1',
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
            background: '#92400E',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '6px',
            padding: '0.3rem 0.875rem',
            fontSize: '0.75rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'opacity 0.15s ease',
          }}
          onMouseOver={(e) => (e.currentTarget.style.opacity = '0.9')}
          onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
        >
          Exit to Control Tower ↗
        </button>
      </div>
    </div>
  );
}

