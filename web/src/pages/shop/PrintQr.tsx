import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import { api } from '../../lib/api.ts';
import styles from './PrintQr.module.css';

interface ProgramData {
  program: {
    stampsRequired: number;
    rewardText: string;
  } | null;
}

interface ShopData {
  shopName: string;
  shopSlug: string;
}

export default function PrintQrPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const navigate = useNavigate();

  const { data: qrData } = useQuery({
    queryKey: ['shop-qr-static'],
    queryFn: () => api.get<ShopData>('/shop/qr-token'),
  });

  const { data: progData } = useQuery({
    queryKey: ['shop-program'],
    queryFn: () => api.get<ProgramData>('/shop/program'),
  });

  const shopName = qrData?.shopName || 'Our Shop';
  const slug = qrData?.shopSlug || '';
  const registerUrl = `${window.location.origin}/s/${slug}`;
  const stampsRequired = progData?.program?.stampsRequired || 8;
  const rewardText = progData?.program?.rewardText || 'Special Reward';

  useEffect(() => {
    if (!canvasRef.current || !slug) return;
    QRCode.toCanvas(canvasRef.current, registerUrl, {
      width: 320,
      margin: 2,
      color: { dark: '#101820', light: '#FFFFFF' },
      errorCorrectionLevel: 'H',
    });
  }, [registerUrl, slug]);

  return (
    <div className={styles.wrapper}>
      {/* Control bar (hidden during print) */}
      <div className={styles.noPrintBar}>
        <button className="btn-ghost" onClick={() => navigate(-1)}>← Back</button>
        <span style={{ fontWeight: 600 }}>Counter Standee / Table Sign</span>
        <button className="btn-primary" style={{ width: 'auto', padding: '0.5rem 1.25rem' }} onClick={() => window.print()}>
          🖨️ Print Sign
        </button>
      </div>

      {/* Printable Sheet */}
      <div className={styles.printSheet}>
        <div className={styles.borderBox}>
          {/* Logo badge */}
          <div className={styles.badgeRow}>
            <span className={styles.brandBadge}>DIGITAL LOYALTY CARD</span>
          </div>

          <h1 className={styles.shopTitle}>{shopName}</h1>

          <div className={styles.offerBox}>
            <p className={styles.offerSubtitle}>Collect {stampsRequired} stamps and get</p>
            <p className={styles.offerTitle}>✨ {rewardText} ✨</p>
          </div>

          {/* Large High-Res QR code */}
          <div className={styles.qrContainer}>
            <canvas ref={canvasRef} className={styles.qrCanvas} />
          </div>

          <div className={styles.instructions}>
            <p className={styles.callout}>1. Scan with your phone camera</p>
            <p className={styles.subtext}>No app download needed · Instant digital punch card</p>
            <p className={styles.urlHint}>{registerUrl}</p>
          </div>

          <div className={styles.footerStub}>
            <span>STAMP • POWERED BY LOCAL MERCHANTS</span>
          </div>
        </div>
      </div>
    </div>
  );
}

