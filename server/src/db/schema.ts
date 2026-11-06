import {
  mysqlTable,
  char,
  varchar,
  text,
  tinyint,
  int,
  bigint,
  float,
  boolean,
  timestamp,
  mysqlEnum,
  uniqueIndex,
  index,
  json,
  primaryKey,
  varbinary,
} from 'drizzle-orm/mysql-core';

// ─── shops ────────────────────────────────────────────────────────────────────
export const shops = mysqlTable(
  'shops',
  {
    id: char('id', { length: 36 }).primaryKey(),
    slug: varchar('slug', { length: 64 }).notNull(),
    name: varchar('name', { length: 128 }).notNull(),
    ownerPhone: varchar('owner_phone', { length: 20 }).notNull(),
    lat: float('lat'),
    lng: float('lng'),
    qrSecret: varbinary('qr_secret', { length: 32 }).$type<Buffer>().notNull(),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('shops_slug_idx').on(t.slug)],
);

// ─── customers ────────────────────────────────────────────────────────────────
export const customers = mysqlTable(
  'customers',
  {
    id: char('id', { length: 36 }).primaryKey(),
    phone: varchar('phone', { length: 20 }).notNull(),
    name: varchar('name', { length: 128 }).notNull().default(''),
    createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('customers_phone_idx').on(t.phone)],
);

// ─── programs ─────────────────────────────────────────────────────────────────
export const programs = mysqlTable(
  'programs',
  {
    id: char('id', { length: 36 }).primaryKey(),
    shopId: char('shop_id', { length: 36 }).notNull(),
    stampsRequired: int('stamps_required').notNull().default(8),
    rewardText: varchar('reward_text', { length: 256 }).notNull().default(''),
    cooldownMinutes: int('cooldown_minutes').notNull().default(360),
    maxStampsPerDay: int('max_stamps_per_day').notNull().default(2),
    requireApproval: boolean('require_approval').notNull().default(false),
    scratchEnabled: boolean('scratch_enabled').notNull().default(true),
    scratchEveryNVisits: int('scratch_every_n_visits').notNull().default(1),
    prizeExpiryDays: int('prize_expiry_days').notNull().default(30),
  },
  (t) => [uniqueIndex('programs_shop_id_idx').on(t.shopId)],
);

// ─── stamp_events ─────────────────────────────────────────────────────────────
export const stampEvents = mysqlTable(
  'stamp_events',
  {
    id: char('id', { length: 36 }).primaryKey(),
    shopId: char('shop_id', { length: 36 }).notNull(),
    customerId: char('customer_id', { length: 36 }).notNull(),
    tokenNonce: varchar('token_nonce', { length: 64 }).notNull(),
    status: mysqlEnum('status', ['pending', 'counted', 'voided'])
      .notNull()
      .default('counted'),
    flags: json('flags').$type<Record<string, unknown>>().default({}),
    voidReason: varchar('void_reason', { length: 256 }),
    createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('stamp_events_nonce_idx').on(t.shopId, t.customerId, t.tokenNonce),
    index('stamp_events_lookup_idx').on(t.shopId, t.customerId, t.createdAt),
  ],
);

// ─── rewards ──────────────────────────────────────────────────────────────────
export const rewards = mysqlTable(
  'rewards',
  {
    id: char('id', { length: 36 }).primaryKey(),
    shopId: char('shop_id', { length: 36 }).notNull(),
    customerId: char('customer_id', { length: 36 }).notNull(),
    source: mysqlEnum('source', ['stamp_card', 'scratch']).notNull(),
    title: varchar('title', { length: 256 }).notNull(),
    status: mysqlEnum('status', ['earned', 'claimed', 'redeemed', 'expired'])
      .notNull()
      .default('earned'),
    code: char('code', { length: 8 }),
    codeExpiresAt: timestamp('code_expires_at', { mode: 'date' }),
    expiresAt: timestamp('expires_at', { mode: 'date' }),
    createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
    redeemedAt: timestamp('redeemed_at', { mode: 'date' }),
  },
  (t) => [uniqueIndex('rewards_code_idx').on(t.code)],
);

// ─── scratch_prizes ───────────────────────────────────────────────────────────
export const scratchPrizes = mysqlTable('scratch_prizes', {
  id: char('id', { length: 36 }).primaryKey(),
  shopId: char('shop_id', { length: 36 }).notNull(),
  title: varchar('title', { length: 128 }).notNull(),
  weight: int('weight').notNull().default(1),
  stock: int('stock'),
  isNoPrize: boolean('is_no_prize').notNull().default(false),
  isActive: boolean('is_active').notNull().default(true),
});

// ─── scratch_cards ────────────────────────────────────────────────────────────
export const scratchCards = mysqlTable('scratch_cards', {
  id: char('id', { length: 36 }).primaryKey(),
  shopId: char('shop_id', { length: 36 }).notNull(),
  customerId: char('customer_id', { length: 36 }).notNull(),
  stampEventId: char('stamp_event_id', { length: 36 }).notNull(),
  prizeId: char('prize_id', { length: 36 }).notNull(),
  rewardId: char('reward_id', { length: 36 }),
  revealedAt: timestamp('revealed_at', { mode: 'date' }),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
});

// ─── otp_requests ─────────────────────────────────────────────────────────────
export const otpRequests = mysqlTable(
  'otp_requests',
  {
    id: char('id', { length: 36 }).primaryKey(),
    phone: varchar('phone', { length: 20 }).notNull(),
    codeHash: char('code_hash', { length: 64 }).notNull(),
    ip: varchar('ip', { length: 45 }).notNull(),
    attempts: tinyint('attempts').notNull().default(0),
    expiresAt: timestamp('expires_at', { mode: 'date' }).notNull(),
    consumedAt: timestamp('consumed_at', { mode: 'date' }),
    createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  },
  (t) => [index('otp_requests_phone_idx').on(t.phone, t.createdAt)],
);

// ─── push_subscriptions ───────────────────────────────────────────────────────
export const pushSubscriptions = mysqlTable(
  'push_subscriptions',
  {
    id: char('id', { length: 36 }).primaryKey(),
    customerId: char('customer_id', { length: 36 }).notNull(),
    endpoint: varchar('endpoint', { length: 512 }).notNull(),
    keys: json('keys').$type<{ p256dh: string; auth: string }>().notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('push_subscriptions_endpoint_idx').on(t.endpoint)],
);

// ─── reminders ────────────────────────────────────────────────────────────────
export const reminders = mysqlTable(
  'reminders',
  {
    id: char('id', { length: 36 }).primaryKey(),
    customerId: char('customer_id', { length: 36 }).notNull(),
    shopId: char('shop_id', { length: 36 }).notNull(),
    kind: mysqlEnum('kind', [
      'reward_ready',
      'one_to_go',
      'win_back',
      'prize_expiring',
    ]).notNull(),
    sendAfter: timestamp('send_after', { mode: 'date' }).notNull(),
    sentAt: timestamp('sent_at', { mode: 'date' }),
    cancelledAt: timestamp('cancelled_at', { mode: 'date' }),
  },
  (t) => [index('reminders_send_after_idx').on(t.sendAfter)],
);

// ─── reminder_mutes ───────────────────────────────────────────────────────────
export const reminderMutes = mysqlTable(
  'reminder_mutes',
  {
    customerId: char('customer_id', { length: 36 }).notNull(),
    shopId: char('shop_id', { length: 36 }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.customerId, t.shopId] })],
);

// ─── contact_requests ──────────────────────────────────────────────────────────
export const contactRequests = mysqlTable('contact_requests', {
  id: char('id', { length: 36 }).primaryKey(),
  name: varchar('name', { length: 80 }).notNull(),
  phone: varchar('phone', { length: 20 }).notNull(),
  email: varchar('email', { length: 255 }),
  shopName: varchar('shop_name', { length: 100 }),
  city: varchar('city', { length: 80 }),
  topic: mysqlEnum('topic', ['pilot', 'question', 'data_request', 'grievance']).notNull(),
  preferredChannel: mysqlEnum('preferred_channel', ['whatsapp', 'call', 'email']).notNull(),
  message: varchar('message', { length: 1000 }),
  consentAt: timestamp('consent_at', { mode: 'date', fsp: 3 }).notNull(),
  ipHash: char('ip_hash', { length: 64 }).notNull(),
  createdAt: timestamp('created_at', { mode: 'date', fsp: 3 }).notNull().defaultNow(),
});

// ─── audit_log ────────────────────────────────────────────────────────────────
export const auditLog = mysqlTable('audit_log', {
  id: bigint('id', { mode: 'number' }).autoincrement().primaryKey(),
  actorType: mysqlEnum('actor_type', ['customer', 'shop', 'admin', 'system']).notNull(),
  actorId: char('actor_id', { length: 36 }),
  action: varchar('action', { length: 64 }).notNull(),
  detail: json('detail').$type<Record<string, unknown>>().default({}),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
});

