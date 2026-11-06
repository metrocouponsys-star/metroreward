export const CONSTANTS = {
  // Token
  TOKEN_TTL_MS: 45_000,
  TOKEN_WINDOW: 2, // accept current and previous

  // OTP
  OTP_TTL_MS: 5 * 60_000,
  OTP_MAX_ATTEMPTS: 5,
  OTP_LOCK_MINUTES: 15,
  OTP_RESEND_SECONDS: 60,
  OTP_HOURLY_PER_PHONE: 5,
  OTP_HOURLY_PER_IP: 20,

  // Stamp
  DEFAULT_COOLDOWN_MINUTES: 360,
  DEFAULT_MAX_STAMPS_PER_DAY: 2,
  DEFAULT_STAMPS_REQUIRED: 8,

  // Rate limits
  SCAN_PER_MINUTE_PER_IP: 10,
  SCAN_PER_HOUR_PER_CUSTOMER: 30,

  // Reward claim code
  CLAIM_CODE_TTL_MINUTES: 10,

  // Location
  MAX_DISTANCE_METERS: 150,

  // Session
  SESSION_TTL_DAYS: 30,

  // Reminder quiet hours (IST = UTC+5:30)
  QUIET_START_HOUR_IST: 21,
  QUIET_END_HOUR_IST: 9,

  // Min days between reminders per customer per shop
  REMINDER_MIN_INTERVAL_DAYS: 3,
  // Max ignored before stopping
  REMINDER_MAX_IGNORED: 3,
} as const;

