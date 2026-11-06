/** All user-facing strings in one file — replace values only when translating */
export const S = {
  // Errors
  TOKEN_INVALID: 'That QR code is not valid. Ask the shop to show it again.',
  TOKEN_EXPIRED: 'That QR expired. Ask the shop to show it again.',
  SHOP_INACTIVE: 'This shop is not active right now.',
  COOLDOWN_ACTIVE: 'Your next stamp unlocks at {time}.',
  DAILY_LIMIT: 'You have reached your daily stamp limit for this shop.',
  RATE_LIMITED: 'Too many requests. Wait a moment and try again.',
  OTP_INVALID: 'That code is incorrect. Try again.',
  OTP_LOCKED: 'Too many wrong attempts. Try again in 15 minutes.',
  OTP_RATE_LIMIT: 'Too many OTP requests. Try again later.',
  OTP_RESEND_TOO_SOON: 'Wait 60 seconds before requesting a new code.',
  CODE_NOT_FOUND: 'Code not found.',
  CODE_USED_OR_EXPIRED: 'Code already used or expired.',
  NOT_AUTHENTICATED: 'Sign in to continue.',
  FORBIDDEN: 'You do not have permission to do that.',
  VALIDATION: 'Check your input and try again.',
  SCRATCH_ALREADY_REVEALED: 'This card has already been revealed.',
  SCRATCH_NOT_FOUND: 'Scratch card not found.',
  REWARD_NOT_FOUND: 'Reward not found.',
  SHOP_NOT_FOUND: 'Shop not found.',
  INTERNAL: 'Something went wrong. Try again.',

  // Success / info
  STAMP_ADDED: 'Stamp added!',
  STAMP_PENDING: 'Stamp sent for approval.',
  REWARD_EARNED: 'You have earned a reward!',
  SCRATCH_WIN: 'You won: {prize}!',
  SCRATCH_NO_PRIZE: 'Better luck next time.',
  REWARD_CLAIMED: 'Show this code to the shop.',
  REWARD_REDEEMED: 'Reward redeemed successfully.',

  // Reminders
  REMINDER_REWARD_READY: 'Your reward is waiting at {shop}. Claim it!',
  REMINDER_ONE_TO_GO: 'One more stamp and you get a reward at {shop}.',
  REMINDER_WIN_BACK: 'It has been a while. Come back to {shop} for a stamp.',
  REMINDER_PRIZE_EXPIRING: 'Your prize at {shop} expires in 3 days.',
};

export type ErrorCode = keyof typeof S;

