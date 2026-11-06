import { describe, it, expect } from 'vitest';
import { isQuietHourIST } from './reminder.ts';
import { CONSTANTS } from '../lib/constants.ts';

describe('reminder rules', () => {
  it('correctly identifies quiet hours in IST (21:00 to 09:00 IST)', () => {
    // Quiet hours
    expect(isQuietHourIST(21)).toBe(true);
    expect(isQuietHourIST(22)).toBe(true);
    expect(isQuietHourIST(23)).toBe(true);
    expect(isQuietHourIST(0)).toBe(true);
    expect(isQuietHourIST(5)).toBe(true);
    expect(isQuietHourIST(8)).toBe(true);

    // Active hours
    expect(isQuietHourIST(9)).toBe(false);
    expect(isQuietHourIST(10)).toBe(false);
    expect(isQuietHourIST(14)).toBe(false);
    expect(isQuietHourIST(20)).toBe(false);
  });

  it('constants match requirements', () => {
    expect(CONSTANTS.REMINDER_MIN_INTERVAL_DAYS).toBe(3);
    expect(CONSTANTS.REMINDER_MAX_IGNORED).toBe(3);
    expect(CONSTANTS.QUIET_START_HOUR_IST).toBe(21);
    expect(CONSTANTS.QUIET_END_HOUR_IST).toBe(9);
  });
});

