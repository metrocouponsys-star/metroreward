import { useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api, StampError } from '../lib/api.ts';
import { useAuth } from '../hooks/useAuth.tsx';
import { S } from '../strings.ts';
import styles from './SignIn.module.css';

type Step = 'phone' | 'otp' | 'name';

export default function SignInPage() {
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [isNew, setIsNew] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { refresh } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = params.get('redirect') ?? '/';

  function normalizePhone(raw: string) {
    const digits = raw.replace(/\D/g, '');
    if (digits.length === 10) return '+91' + digits;
    if (digits.length === 12 && digits.startsWith('91')) return '+' + digits;
    return raw;
  }

  function startResendTimer() {
    setResendIn(60);
    timerRef.current = setInterval(() => {
      setResendIn((n) => {
        if (n <= 1) { clearInterval(timerRef.current!); return 0; }
        return n - 1;
      });
    }, 1000);
  }

  async function handlePhone(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/otp/request', { phone: normalizePhone(phone) });
      setStep('otp');
      startResendTimer();
    } catch (err) {
      setError(err instanceof StampError ? err.message : S.genericError);
    } finally {
      setLoading(false);
    }
  }

  async function handleOtp(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post<{ isNew: boolean }>('/auth/otp/verify', {
        phone: normalizePhone(phone),
        code: otp,
      });
      setIsNew(res.isNew);
      if (res.isNew) {
        setStep('name');
      } else {
        await refresh();
        navigate(redirect, { replace: true });
      }
    } catch (err) {
      setError(err instanceof StampError ? err.message : S.genericError);
    } finally {
      setLoading(false);
    }
  }

  async function handleName(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Update name after verify
      await api.post('/auth/otp/verify', {
        phone: normalizePhone(phone),
        code: otp,
        name,
      });
      await refresh();
      navigate(redirect, { replace: true });
    } catch {
      // If OTP expired, re-ask
      setError('Session expired. Please sign in again.');
      setStep('phone');
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    if (resendIn > 0) return;
    setError('');
    try {
      await api.post('/auth/otp/request', { phone: normalizePhone(phone) });
      startResendTimer();
    } catch (err) {
      setError(err instanceof StampError ? err.message : S.genericError);
    }
  }

  return (
    <div className={styles.root}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden>
            <circle cx="20" cy="20" r="20" fill="#4B2E9A" />
            <circle cx="20" cy="20" r="10" fill="none" stroke="#fff" strokeWidth="2.5" />
            <circle cx="20" cy="20" r="3" fill="#fff" />
          </svg>
          <span className={styles.logoName}>{S.appName}</span>
        </div>

        {step === 'phone' && (
          <form onSubmit={handlePhone} noValidate>
            <h1 className={styles.heading}>{S.signIn}</h1>
            <p className={styles.sub}>Enter your mobile number to continue</p>

            <div className={styles.phoneRow}>
              <span className={styles.countryCode}>+91</span>
              <input
                className={`input ${styles.phoneInput}`}
                type="tel"
                inputMode="numeric"
                placeholder={S.phonePlaceholder}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                maxLength={12}
                required
                aria-label={S.enterPhone}
                autoFocus
              />
            </div>

            {error && <div className="error-msg" role="alert">{error}</div>}

            <button className="btn-primary" type="submit" disabled={loading || phone.replace(/\D/g, '').length < 10}>
              {loading ? <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : S.sendOtp}
            </button>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleOtp} noValidate>
            <h1 className={styles.heading}>Enter OTP</h1>
            <p className={styles.sub}>{S.otpSent} +91 {phone.replace(/\D/g, '')}</p>

            <input
              className={`input input-otp`}
              type="text"
              inputMode="numeric"
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
              required
              aria-label={S.enterOtp}
              autoFocus
            />

            {error && <div className="error-msg" role="alert">{error}</div>}

            <button className="btn-primary" type="submit" disabled={loading || otp.length !== 6}>
              {loading ? <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : S.verify}
            </button>

            <button
              type="button"
              className="btn-ghost"
              style={{ width: '100%', marginTop: '0.5rem' }}
              onClick={resend}
              disabled={resendIn > 0}
            >
              {resendIn > 0 ? `${S.otpResendIn} ${resendIn}${S.seconds}` : S.resendOtp}
            </button>

            <button type="button" className="btn-ghost" style={{ width: '100%' }} onClick={() => setStep('phone')}>
              Change number
            </button>
          </form>
        )}

        {step === 'name' && (
          <form onSubmit={handleName} noValidate>
            <h1 className={styles.heading}>What should we call you?</h1>
            <p className={styles.sub}>We will show your name to the shops you visit.</p>

            <input
              className="input"
              type="text"
              placeholder={S.namePlaceholder}
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={128}
              required
              aria-label={S.yourName}
              autoFocus
            />

            {error && <div className="error-msg" role="alert">{error}</div>}

            <button className="btn-primary" type="submit" disabled={loading || name.trim().length < 1}>
              {loading ? <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : S.continue}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

