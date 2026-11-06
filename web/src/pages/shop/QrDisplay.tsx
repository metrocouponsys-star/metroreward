import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import QRCode from 'qrcode';
import { api } from '../../lib/api.ts';
import styles from './QrDisplay.module.css';

interface QrToken {
  token: string;
  qrUrl: string;
  shopName: string;
  shopSlug: string;
}

export default function ShopQrPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [online, setOnline] = useState(navigator.onLine);
  const [countdown, setCountdown] = useState(25);

  const { data, refetch } = useQuery({
    queryKey: ['qr-token'],
    queryFn: () => api.get<QrToken>('/shop/qr-token'),
    refetchInterval: 25_000,
    staleTime: 24_000,
  });

  // Keep screen awake
  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null;
    if ('wakeLock' in navigator) {
      (navigator as Navigator & { wakeLock: { request(type: string): Promise<WakeLockSentinel> } })
        .wakeLock.request('screen').then((wl) => { wakeLock = wl; }).catch(() => {});
    }
    return () => { wakeLock?.release(); };
  }, []);

  // Online/offline detection
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  // Countdown bar
  useEffect(() => {
    setCountdown(25);
    const id = setInterval(() => {
      setCountdown((n) => (n <= 1 ? 25 : n - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [data]);

  // Render QR to canvas
  useEffect(() => {
    if (!canvasRef.current || !data?.qrUrl) return;
    QRCode.toCanvas(canvasRef.current, data.qrUrl, {
      width: 300,
      margin: 2,
      color: { dark: '#101820', light: '#FFFFFF' },
      errorCorrectionLevel: 'M',
    });
  }, [data?.qrUrl]);

  return (
    <div className={styles.root}>
      {/* Countdown bar along top */}
      <div
        className={styles.countdown}
        style={{ width: `${(countdown / 25) * 100}%` }}
        aria-hidden
      />

      {!online && (
        <div className={styles.offlineBanner} role="alert">
          Offline — QR has stopped rotating
        </div>
      )}

      <div className={styles.inner}>
        <div className={styles.shopName}>{data?.shopName}</div>

        <div className={styles.qrWrapper} aria-label={`QR code for ${data?.shopName}`}>
          <canvas ref={canvasRef} />
        </div>

        <p className={styles.hint}>Scan to get your stamp</p>
        <p className={styles.timer}>Refreshes in {countdown}s</p>
      </div>
    </div>
  );
}

