import crypto from 'node:crypto';

/** Constant-time comparison of two strings or buffers */
export function safeEqual(a: string | Buffer, b: string | Buffer): boolean {
  const ab = Buffer.isBuffer(a) ? a : Buffer.from(a);
  const bb = Buffer.isBuffer(b) ? b : Buffer.from(b);
  if (ab.length !== bb.length) {
    // still run timingSafeEqual on equal-length slice to prevent timing attacks
    crypto.timingSafeEqual(ab.slice(0, 1), bb.slice(0, 1));
    return false;
  }
  return crypto.timingSafeEqual(ab, bb);
}

/** SHA-256 hex digest */
export function sha256(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

/** HMAC-SHA256 hex */
export function hmac(key: Buffer, data: string): string {
  return crypto.createHmac('sha256', key).update(data).digest('hex');
}

/** base64url encode a Buffer */
export function b64url(buf: Buffer): string {
  return buf.toString('base64url');
}

/** base64url decode to Buffer */
export function b64urlDecode(s: string): Buffer {
  return Buffer.from(s, 'base64url');
}

/** Cryptographically secure random integer in [0, max) */
export function randomInt(max: number): number {
  return crypto.randomInt(max);
}

/** Random hex string of given byte length */
export function randomHex(bytes: number): string {
  return crypto.randomBytes(bytes).toString('hex');
}

/** Generate a UUID v4 */
export function uuid(): string {
  return crypto.randomUUID();
}

/** Secure random 6-digit OTP string */
export function generateOtp(): string {
  const n = crypto.randomInt(0, 1_000_000);
  return n.toString().padStart(6, '0');
}

/** Generate a readable reward code (8 chars, no 0/O/1/I) */
const CODE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
export function generateRewardCode(): string {
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += CODE_ALPHABET[crypto.randomInt(CODE_ALPHABET.length)];
  }
  return code;
}

