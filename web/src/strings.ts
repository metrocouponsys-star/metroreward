/** All user-facing strings — replace values when translating */
export const S = {
  appName: 'Stamp',

  // Auth
  signIn: 'Sign in',
  signOut: 'Sign out',
  enterPhone: 'Your mobile number',
  phonePlaceholder: '98765 43210',
  sendOtp: 'Send OTP',
  enterOtp: 'Enter 6-digit code',
  verify: 'Verify',
  resendOtp: 'Resend code',
  yourName: 'Your name',
  namePlaceholder: 'What should we call you?',
  continue: 'Continue',
  otpSent: 'OTP sent to',
  otpResendIn: 'Resend in',
  seconds: 's',

  // Stamp
  scanQr: 'Scan the QR at the shop',
  stampAdded: 'Stamp added!',
  stampPending: 'Stamp sent for approval.',
  stampsOf: 'of',
  stampsRequired: 'stamps for a reward',
  nextStampAt: 'Your next stamp unlocks at',

  // Reward
  yourRewards: 'Your rewards',
  claimReward: 'Claim reward',
  showCode: 'Show this code to the shop',
  codeExpiresIn: 'Expires in',
  rewardEarned: 'You have earned a reward!',
  noRewards: 'No rewards yet. Keep stamping!',

  // Scratch
  scratchToReveal: 'Scratch to reveal your prize',
  revealButton: 'Tap to reveal',
  youWon: 'You won',
  betterLuck: 'Better luck next time.',
  scratchWin: 'You won: ',

  // Shop
  shopDashboard: 'Dashboard',
  qrDisplay: 'Show QR',
  redeemCode: 'Redeem a code',
  enterCode: 'Enter reward code',
  redeem: 'Redeem',
  feedTitle: 'Activity',
  customersTitle: 'Customers',
  programSettings: 'Program settings',
  scratchPrizes: 'Scratch prizes',
  stampsToday: 'Stamps today',
  redeemedToday: 'Redeemed today',
  scratchWinsToday: 'Scratch wins today',
  offline: 'Offline',
  qrRefreshing: 'QR refreshes every 25s',
  approve: 'Approve',
  void: 'Void',
  voidReason: 'Reason for voiding',
  save: 'Save',
  saved: 'Saved',
  addPrize: 'Add prize',
  noPrize: 'No prize',
  weight: 'Weight',
  stock: 'Stock (blank = unlimited)',
  percentage: 'Chance',

  // Admin
  createShop: 'Create shop',
  shopList: 'Shops',
  deactivate: 'Deactivate',
  flaggedActivity: 'Flagged activity',
  shopSlug: 'Slug (URL-friendly)',
  shopName: 'Shop name',
  ownerPhone: 'Owner phone',
  latitude: 'Latitude',
  longitude: 'Longitude',

  // Errors
  genericError: 'Something went wrong. Try again.',
  notSignedIn: 'Sign in to continue.',
  qrExpired: 'That QR expired. Ask the shop to show it again.',
  qrInvalid: 'That QR code is not valid. Ask the shop to show it again.',
  cooldownActive: 'Your next stamp unlocks at',
  dailyLimit: 'Daily stamp limit reached for this shop.',
  codeUsed: 'Code already used or expired.',
  otpInvalid: 'That code is incorrect. Try again.',
  otpLocked: 'Too many wrong attempts. Try again in 15 minutes.',

  // Empty states
  noActivity: 'No activity yet.',
  noCustomers: 'No customers yet.',
  noCards: 'Visit a shop and scan their QR to get your first stamp.',

  // Add to home screen
  addToHomeTitle: 'Add Stamp to your home screen',
  addToHomeBody: 'For the best experience, add Stamp to your iPhone home screen from the Share menu.',
  addToHomeDismiss: 'Maybe later',
} as const;

