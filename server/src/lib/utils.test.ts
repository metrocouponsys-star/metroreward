import { describe, it, expect } from 'vitest';
import { haversineMeters, normalizePhone, addMinutes, addDays } from '../lib/utils.ts';

describe('haversineMeters', () => {
  it('returns 0 for the same point', () => {
    expect(haversineMeters(19.076, 72.877, 19.076, 72.877)).toBeCloseTo(0, 0);
  });

  it('calculates a known distance correctly', () => {
    // Mumbai CST to Gateway of India: ~1.3 km
    const d = haversineMeters(18.9398, 72.8355, 18.9220, 72.8347);
    expect(d).toBeGreaterThan(1500);
    expect(d).toBeLessThan(2500);
  });

  it('flags distance > 150m', () => {
    // Two points ~500m apart
    const d = haversineMeters(19.0760, 72.8777, 19.0800, 72.8777);
    expect(d).toBeGreaterThan(150);
  });
});

describe('normalizePhone', () => {
  it('adds +91 to 10-digit number', () => {
    expect(normalizePhone('9876543210')).toBe('+919876543210');
  });

  it('handles leading zero', () => {
    expect(normalizePhone('09876543210')).toBe('+919876543210');
  });

  it('passes through already-prefixed phone', () => {
    expect(normalizePhone('+919876543210')).toBe('+919876543210');
  });

  it('strips spaces', () => {
    expect(normalizePhone('98765 43210')).toBe('+919876543210');
  });
});

describe('addMinutes', () => {
  it('adds minutes correctly', () => {
    const now = new Date('2024-01-01T00:00:00Z');
    const later = addMinutes(now, 30);
    expect(later.getTime() - now.getTime()).toBe(30 * 60_000);
  });
});

describe('addDays', () => {
  it('adds days correctly', () => {
    const now = new Date('2024-01-01T00:00:00Z');
    const later = addDays(now, 7);
    expect(later.getTime() - now.getTime()).toBe(7 * 86_400_000);
  });
});

