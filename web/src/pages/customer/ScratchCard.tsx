import { useRef, useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api.ts';
import { S } from '../../strings.ts';
import styles from './ScratchCard.module.css';

interface ScratchResult {
  id: string;
  revealed: boolean;
  revealedAt?: string;
  prize?: { title: string; isNoPrize: boolean } | null;
  rewardId?: string;
  createdAt: string;
}

const SCRATCH_THRESHOLD = 0.55;

export default function ScratchCardPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scratched, setScratched] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const isDrawing = useRef(false);
  const hasVibrated = useRef(false);

  const { data, isLoading } = useQuery({
    queryKey: ['scratch', id],
    queryFn: () => api.get<ScratchResult>(`/scratch/${id}`),
  });

  const { mutateAsync: reveal } = useMutation({
    mutationFn: () => api.post<{ prize: { title: string; isNoPrize: boolean } | null; rewardId?: string }>(`/scratch/${id}/reveal`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['scratch', id] }),
  });

  // Set up foil canvas
  useEffect(() => {
    if (!canvasRef.current || data?.revealed) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    const W = canvas.width = canvas.offsetWidth;
    const H = canvas.height = canvas.offsetHeight;

    // Draw gold foil with noise texture
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, '#C8A84B');
    grad.addColorStop(0.3, '#E8C86A');
    grad.addColorStop(0.6, '#B8962E');
    grad.addColorStop(1, '#D4AA50');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Noise texture
    const imageData = ctx.getImageData(0, 0, W, H);
    for (let i = 0; i < imageData.data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 30;
      imageData.data[i] = Math.min(255, Math.max(0, imageData.data[i]! + noise));
      imageData.data[i + 1] = Math.min(255, Math.max(0, imageData.data[i + 1]! + noise));
      imageData.data[i + 2] = Math.min(255, Math.max(0, imageData.data[i + 2]! + noise));
    }
    ctx.putImageData(imageData, 0, 0);

    // Add "Scratch here" text
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '600 1rem Figtree, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Scratch to reveal', W / 2, H / 2);
  }, [data?.revealed]);

  function scratch(x: number, y: number) {
    if (!canvasRef.current || revealed) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    const rect = canvas.getBoundingClientRect();
    const cx = (x - rect.left) * (canvas.width / rect.width);
    const cy = (y - rect.top) * (canvas.height / rect.height);

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(cx, cy, 28, 0, Math.PI * 2);
    ctx.fill();

    // Calculate scratched %
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let transparent = 0;
    for (let i = 3; i < imgData.data.length; i += 4) {
      if (imgData.data[i]! < 128) transparent++;
    }
    const pct = transparent / (canvas.width * canvas.height);
    setScratched(pct);

    if (pct > 0.1 && !hasVibrated.current) {
      navigator.vibrate?.(10);
      hasVibrated.current = true;
    }
  }

  // Auto-reveal when threshold reached
  useEffect(() => {
    if (scratched >= SCRATCH_THRESHOLD && !revealed) {
      handleReveal();
    }
  }, [scratched]);

  async function handleReveal() {
    if (revealed) return;
    setRevealed(true);
    // Clear canvas
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d')!;
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    await reveal();
  }

  const onMouseDown = useCallback((e: React.MouseEvent) => { isDrawing.current = true; scratch(e.clientX, e.clientY); }, [revealed]);
  const onMouseMove = useCallback((e: React.MouseEvent) => { if (isDrawing.current) scratch(e.clientX, e.clientY); }, [revealed]);
  const onMouseUp = useCallback(() => { isDrawing.current = false; }, []);
  const onTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const t = e.touches[0]!;
    scratch(t.clientX, t.clientY);
  }, [revealed]);

  if (isLoading) {
    return <div className="loading-center"><div className="spinner" /></div>;
  }

  const finalData = data;
  const prize = finalData?.prize;
  const isWin = prize && !prize.isNoPrize;
  const alreadyRevealed = finalData?.revealed;

  return (
    <div className={styles.root}>
      <div className={styles.card}>
        {/* Serial number */}
        <div className={styles.serial}>
          #{id?.slice(-8).toUpperCase()}
        </div>

        <h2 className={styles.heading}>Your scratch card</h2>

        {/* Prize area (behind foil) */}
        <div className={styles.prizeArea}>
          {(revealed || alreadyRevealed) && (
            <div className={styles.prize} data-win={isWin}>
              {isWin ? (
                <>
                  <div className={styles.prizeTrophy} aria-hidden>🏆</div>
                  <div className={styles.prizeTitle}>{S.youWon}</div>
                  <div className={styles.prizeValue}>{prize!.title}</div>
                </>
              ) : (
                <>
                  <div className={styles.noTrophy} aria-hidden>😔</div>
                  <div className={styles.prizeTitle}>{S.betterLuck}</div>
                </>
              )}
            </div>
          )}

          {!alreadyRevealed && (
            <canvas
              ref={canvasRef}
              className={styles.foil}
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onTouchMove={onTouchMove}
              onTouchStart={(e) => { const t = e.touches[0]!; scratch(t.clientX, t.clientY); }}
              style={{ touchAction: 'none' }}
              aria-label={S.scratchToReveal}
            />
          )}
        </div>

        {!alreadyRevealed && !revealed && (
          <button className="btn-outline" onClick={handleReveal}>
            {S.revealButton}
          </button>
        )}

        {(revealed || alreadyRevealed) && (
          <>
            {isWin && finalData?.rewardId && (
              <button className="btn-primary" onClick={() => navigate('/rewards')}>
                Claim your prize →
              </button>
            )}
            <button className="btn-ghost" onClick={() => navigate('/')}>
              Back to cards
            </button>
          </>
        )}
      </div>
    </div>
  );
}

