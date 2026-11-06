/** Haversine distance in metres between two (lat, lng) pairs */
export function haversineMeters(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R = 6_371_000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

/** Format a date as a readable IST time string */
export function toISTTime(date: Date): string {
  return date.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/** Add minutes to a Date */
export function addMinutes(date: Date, mins: number): Date {
  return new Date(date.getTime() + mins * 60_000);
}

/** Add days to a Date */
export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86_400_000);
}

/** Current hour in IST (0-23) */
export function currentHourIST(): number {
  const ist = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata', hour: 'numeric', hour12: false });
  return parseInt(ist, 10);
}

/** Format phone: strip country code for display */
export function normalizePhone(phone: string): string {
  phone = phone.replace(/\s+/g, '');
  if (phone.startsWith('+')) return phone;
  if (phone.startsWith('0')) return '+91' + phone.slice(1);
  if (phone.length === 10) return '+91' + phone;
  return phone;
}

