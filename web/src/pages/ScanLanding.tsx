import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { api, StampError } from '../lib/api.ts';
import { useAuth } from '../hooks/useAuth.tsx';
import { S } from '../strings.ts';
import styles from './ScanLanding.module.css';

type ScanState = 'scanning' | 'success' | 'error' | 'unauthenticated';

export default function ScanLandingPage() {
  const { slug } = useParams<{ slug: string }>();
  const [params] = useSearchParams();
  const token = params.get('t') ?? '';
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [state, setState] = useState<ScanState>('scanning');
  const [errorMsg, setErrorMsg] = useState('');
  const [result, setResult] = useState<{
    shopName: string;
    status: string;
    rewardId?: string;
    scratchCardId?: string;
    stampId?: string;
  } | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      // Redirect to sign-in, then come back
      navigate(`/sign-in?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`, { replace: true });
      return;
    }

    async function doScan() {
      try {
        const lat = await getUserLat();
        const lng = await getUserLng();
        const res = await api.post<{
          shopName: string;
          status: string;
          rewardId?: string;
          scratchCardId?: string;
          stampId: string;
        }>('/scan', { slug, token, ...(lat != null ? { lat, lng } : {}) });

        setResult(res);
        setState('success');

        // Navigate to success page
        setTimeout(() => {
          if (res.scratchCardId) {
            navigate(`/scratch/${res.scratchCardId}`, { replace: true });
          } else {
            navigate('/stamp-success', {
              replace: true,
              state: {
                shopName: res.shopName,
                status: res.status,
                rewardId: res.rewardId,
                slug,
              },
            });
          }
        }, 800);
      } catch (err) {
        if (err instanceof StampError) {
          setErrorMsg(errorMessage(err.code));
        } else {
          setErrorMsg(S.genericError);
        }
        setState('error');
      }
    }

    doScan();
  }, [authLoading, user, slug, token]);

  if (authLoading || state === 'scanning') {
    return (
      <div className={styles.root}>
        <div className={styles.spinner}>
          <div className="spinner" style={{ width: 48, height: 48, borderWidth: 4 }} />
          <p>Adding your stamp…</p>
        </div>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className={styles.root}>
        <div className={styles.errorCard}>
          <div className={styles.errorIcon} aria-hidden>⚠</div>
          <p className={styles.errorText}>{errorMsg}</p>
          <button className="btn-primary" onClick={() => navigate('/')}>Go home</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <div className={styles.successCard}>
        <div className={styles.successIcon} aria-hidden>✓</div>
        <p>{S.stampAdded}</p>
      </div>
    </div>
  );
}

function errorMessage(code: string): string {
  switch (code) {
    case 'TOKEN_EXPIRED': return S.qrExpired;
    case 'TOKEN_INVALID': return S.qrInvalid;
    case 'COOLDOWN_ACTIVE': return 'You already stamped here recently. Try again later.';
    case 'DAILY_LIMIT': return S.dailyLimit;
    case 'SHOP_INACTIVE': return 'This shop is not active right now.';
    default: return S.genericError;
  }
}

async function getUserLat(): Promise<number | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(pos.coords.latitude),
      () => resolve(null),
      { timeout: 3000 },
    );
  });
}

async function getUserLng(): Promise<number | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(pos.coords.longitude),
      () => resolve(null),
      { timeout: 3000 },
    );
  });
}

