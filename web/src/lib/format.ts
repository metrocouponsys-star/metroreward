/** Format a UTC ISO date string to IST time */
export function toIST(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function toISTDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/** Remaining seconds from now until a future ISO string */
export function secondsUntil(isoString: string): number {
  return Math.max(0, Math.floor((new Date(isoString).getTime() - Date.now()) / 1000));
}

/** Format seconds as mm:ss */
export function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Normalize Indian phone for display */
export function displayPhone(phone: string): string {
  if (phone.startsWith('+91')) return phone.slice(3).replace(/(\d{5})(\d{5})/, '$1 $2');
  return phone;
}

/** Check if device supports PWA install on iOS */
export function isIOS(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

/** Check if running in standalone (installed PWA) mode */
export function isStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as { standalone?: boolean }).standalone === true;
}

