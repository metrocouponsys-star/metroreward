var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/lib/env.ts
import { z } from "zod";
function parseEnv() {
  try {
    const result = schema.safeParse(process.env);
    if (result.success) {
      return result.data;
    }
    console.warn("\u26A0\uFE0F Environment warning:", result.error?.flatten().fieldErrors);
  } catch {
    console.warn("\u26A0\uFE0F Environment parse error, falling back to process.env defaults");
  }
  return {
    DATABASE_URL: process.env.DATABASE_URL || "",
    SESSION_SECRET: process.env.SESSION_SECRET || "dev-session-secret-change-me-in-prod-32ch",
    OTP_PROVIDER_URL: process.env.OTP_PROVIDER_URL || void 0,
    OTP_PROVIDER_KEY: process.env.OTP_PROVIDER_KEY || void 0,
    OTP_SENDER_ID: process.env.OTP_SENDER_ID || "STAMPD",
    VAPID_PUBLIC_KEY: process.env.VAPID_PUBLIC_KEY || "",
    VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY || "",
    BASE_URL: process.env.BASE_URL || "http://localhost:3000",
    ADMIN_PHONES: process.env.ADMIN_PHONES || "",
    CRON_SECRET: process.env.CRON_SECRET || "dev-cron-secret",
    NODE_ENV: process.env.NODE_ENV || "production",
    PORT: process.env.PORT || "3000",
    SITE_ORIGIN: process.env.SITE_ORIGIN || "",
    SMTP_HOST: process.env.SMTP_HOST || "",
    SMTP_USER: process.env.SMTP_USER || "",
    SMTP_PASS: process.env.SMTP_PASS || "",
    CONTACT_TO: process.env.CONTACT_TO || ""
  };
}
function resolvePort() {
  const p = process.env.PORT || env.PORT || "3000";
  const n = parseInt(p, 10);
  return isNaN(n) ? p : n;
}
var schema, env, dbReady, adminPhones;
var init_env = __esm({
  "src/lib/env.ts"() {
    "use strict";
    schema = z.object({
      DATABASE_URL: z.string().optional().default(""),
      SESSION_SECRET: z.string().optional().default("dev-session-secret-change-me-in-prod-32ch"),
      OTP_PROVIDER_URL: z.string().optional(),
      OTP_PROVIDER_KEY: z.string().optional(),
      OTP_SENDER_ID: z.string().optional().default("STAMPD"),
      VAPID_PUBLIC_KEY: z.string().optional().default(""),
      VAPID_PRIVATE_KEY: z.string().optional().default(""),
      BASE_URL: z.string().optional().default("http://localhost:3000"),
      ADMIN_PHONES: z.string().optional().default(""),
      CRON_SECRET: z.string().optional().default("dev-cron-secret"),
      NODE_ENV: z.string().optional().default("production"),
      PORT: z.string().optional().default("3000"),
      SITE_ORIGIN: z.string().optional().default(""),
      SMTP_HOST: z.string().optional().default(""),
      SMTP_USER: z.string().optional().default(""),
      SMTP_PASS: z.string().optional().default(""),
      CONTACT_TO: z.string().optional().default("")
    });
    env = parseEnv();
    dbReady = (process.env.DATABASE_URL || env.DATABASE_URL || "").length > 10;
    if (!dbReady) {
      console.warn("\u26A0\uFE0F  DATABASE_URL is not set. DB-dependent routes will return 503.");
      console.warn("   Set DATABASE_URL in Hostinger \u2192 Web App \u2192 Environment Variables");
    }
    adminPhones = (env.ADMIN_PHONES || "").split(",").map((p) => p.trim()).filter(Boolean);
  }
});

// src/db/schema.ts
var schema_exports = {};
__export(schema_exports, {
  auditLog: () => auditLog,
  contactRequests: () => contactRequests,
  customers: () => customers2,
  otpRequests: () => otpRequests,
  programs: () => programs,
  pushSubscriptions: () => pushSubscriptions,
  reminderMutes: () => reminderMutes,
  reminders: () => reminders,
  rewards: () => rewards,
  scratchCards: () => scratchCards,
  scratchPrizes: () => scratchPrizes,
  shops: () => shops,
  stampEvents: () => stampEvents
});
import {
  mysqlTable,
  char,
  varchar,
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
  varbinary
} from "drizzle-orm/mysql-core";
var shops, customers2, programs, stampEvents, rewards, scratchPrizes, scratchCards, otpRequests, pushSubscriptions, reminders, reminderMutes, contactRequests, auditLog;
var init_schema = __esm({
  "src/db/schema.ts"() {
    "use strict";
    shops = mysqlTable(
      "shops",
      {
        id: char("id", { length: 36 }).primaryKey(),
        slug: varchar("slug", { length: 64 }).notNull(),
        name: varchar("name", { length: 128 }).notNull(),
        ownerPhone: varchar("owner_phone", { length: 20 }).notNull(),
        lat: float("lat"),
        lng: float("lng"),
        qrSecret: varbinary("qr_secret", { length: 32 }).$type().notNull(),
        isActive: boolean("is_active").notNull().default(true),
        createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow()
      },
      (t) => [uniqueIndex("shops_slug_idx").on(t.slug)]
    );
    customers2 = mysqlTable(
      "customers",
      {
        id: char("id", { length: 36 }).primaryKey(),
        phone: varchar("phone", { length: 20 }).notNull(),
        name: varchar("name", { length: 128 }).notNull().default(""),
        createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow()
      },
      (t) => [uniqueIndex("customers_phone_idx").on(t.phone)]
    );
    programs = mysqlTable(
      "programs",
      {
        id: char("id", { length: 36 }).primaryKey(),
        shopId: char("shop_id", { length: 36 }).notNull(),
        stampsRequired: int("stamps_required").notNull().default(8),
        rewardText: varchar("reward_text", { length: 256 }).notNull().default(""),
        cooldownMinutes: int("cooldown_minutes").notNull().default(360),
        maxStampsPerDay: int("max_stamps_per_day").notNull().default(2),
        requireApproval: boolean("require_approval").notNull().default(false),
        scratchEnabled: boolean("scratch_enabled").notNull().default(true),
        scratchEveryNVisits: int("scratch_every_n_visits").notNull().default(1),
        prizeExpiryDays: int("prize_expiry_days").notNull().default(30)
      },
      (t) => [uniqueIndex("programs_shop_id_idx").on(t.shopId)]
    );
    stampEvents = mysqlTable(
      "stamp_events",
      {
        id: char("id", { length: 36 }).primaryKey(),
        shopId: char("shop_id", { length: 36 }).notNull(),
        customerId: char("customer_id", { length: 36 }).notNull(),
        tokenNonce: varchar("token_nonce", { length: 64 }).notNull(),
        status: mysqlEnum("status", ["pending", "counted", "voided"]).notNull().default("counted"),
        flags: json("flags").$type().default({}),
        voidReason: varchar("void_reason", { length: 256 }),
        createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow()
      },
      (t) => [
        uniqueIndex("stamp_events_nonce_idx").on(t.shopId, t.customerId, t.tokenNonce),
        index("stamp_events_lookup_idx").on(t.shopId, t.customerId, t.createdAt)
      ]
    );
    rewards = mysqlTable(
      "rewards",
      {
        id: char("id", { length: 36 }).primaryKey(),
        shopId: char("shop_id", { length: 36 }).notNull(),
        customerId: char("customer_id", { length: 36 }).notNull(),
        source: mysqlEnum("source", ["stamp_card", "scratch"]).notNull(),
        title: varchar("title", { length: 256 }).notNull(),
        status: mysqlEnum("status", ["earned", "claimed", "redeemed", "expired"]).notNull().default("earned"),
        code: char("code", { length: 8 }),
        codeExpiresAt: timestamp("code_expires_at", { mode: "date" }),
        expiresAt: timestamp("expires_at", { mode: "date" }),
        createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
        redeemedAt: timestamp("redeemed_at", { mode: "date" })
      },
      (t) => [uniqueIndex("rewards_code_idx").on(t.code)]
    );
    scratchPrizes = mysqlTable("scratch_prizes", {
      id: char("id", { length: 36 }).primaryKey(),
      shopId: char("shop_id", { length: 36 }).notNull(),
      title: varchar("title", { length: 128 }).notNull(),
      weight: int("weight").notNull().default(1),
      stock: int("stock"),
      isNoPrize: boolean("is_no_prize").notNull().default(false),
      isActive: boolean("is_active").notNull().default(true)
    });
    scratchCards = mysqlTable("scratch_cards", {
      id: char("id", { length: 36 }).primaryKey(),
      shopId: char("shop_id", { length: 36 }).notNull(),
      customerId: char("customer_id", { length: 36 }).notNull(),
      stampEventId: char("stamp_event_id", { length: 36 }).notNull(),
      prizeId: char("prize_id", { length: 36 }).notNull(),
      rewardId: char("reward_id", { length: 36 }),
      revealedAt: timestamp("revealed_at", { mode: "date" }),
      createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow()
    });
    otpRequests = mysqlTable(
      "otp_requests",
      {
        id: char("id", { length: 36 }).primaryKey(),
        phone: varchar("phone", { length: 20 }).notNull(),
        codeHash: char("code_hash", { length: 64 }).notNull(),
        ip: varchar("ip", { length: 45 }).notNull(),
        attempts: tinyint("attempts").notNull().default(0),
        expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
        consumedAt: timestamp("consumed_at", { mode: "date" }),
        createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow()
      },
      (t) => [index("otp_requests_phone_idx").on(t.phone, t.createdAt)]
    );
    pushSubscriptions = mysqlTable(
      "push_subscriptions",
      {
        id: char("id", { length: 36 }).primaryKey(),
        customerId: char("customer_id", { length: 36 }).notNull(),
        endpoint: varchar("endpoint", { length: 512 }).notNull(),
        keys: json("keys").$type().notNull(),
        createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow()
      },
      (t) => [uniqueIndex("push_subscriptions_endpoint_idx").on(t.endpoint)]
    );
    reminders = mysqlTable(
      "reminders",
      {
        id: char("id", { length: 36 }).primaryKey(),
        customerId: char("customer_id", { length: 36 }).notNull(),
        shopId: char("shop_id", { length: 36 }).notNull(),
        kind: mysqlEnum("kind", [
          "reward_ready",
          "one_to_go",
          "win_back",
          "prize_expiring"
        ]).notNull(),
        sendAfter: timestamp("send_after", { mode: "date" }).notNull(),
        sentAt: timestamp("sent_at", { mode: "date" }),
        cancelledAt: timestamp("cancelled_at", { mode: "date" })
      },
      (t) => [index("reminders_send_after_idx").on(t.sendAfter)]
    );
    reminderMutes = mysqlTable(
      "reminder_mutes",
      {
        customerId: char("customer_id", { length: 36 }).notNull(),
        shopId: char("shop_id", { length: 36 }).notNull()
      },
      (t) => [primaryKey({ columns: [t.customerId, t.shopId] })]
    );
    contactRequests = mysqlTable("contact_requests", {
      id: char("id", { length: 36 }).primaryKey(),
      name: varchar("name", { length: 80 }).notNull(),
      phone: varchar("phone", { length: 20 }).notNull(),
      email: varchar("email", { length: 255 }),
      shopName: varchar("shop_name", { length: 100 }),
      city: varchar("city", { length: 80 }),
      topic: mysqlEnum("topic", ["pilot", "question", "data_request", "grievance"]).notNull(),
      preferredChannel: mysqlEnum("preferred_channel", ["whatsapp", "call", "email"]).notNull(),
      message: varchar("message", { length: 1e3 }),
      consentAt: timestamp("consent_at", { mode: "date", fsp: 3 }).notNull(),
      ipHash: char("ip_hash", { length: 64 }).notNull(),
      createdAt: timestamp("created_at", { mode: "date", fsp: 3 }).notNull().defaultNow()
    });
    auditLog = mysqlTable("audit_log", {
      id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
      actorType: mysqlEnum("actor_type", ["customer", "shop", "admin", "system"]).notNull(),
      actorId: char("actor_id", { length: 36 }),
      action: varchar("action", { length: 64 }).notNull(),
      detail: json("detail").$type().default({}),
      createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow()
    });
  }
});

// src/lib/crypto.ts
var crypto_exports = {};
__export(crypto_exports, {
  b64url: () => b64url,
  b64urlDecode: () => b64urlDecode,
  generateOtp: () => generateOtp,
  generateRewardCode: () => generateRewardCode,
  hmac: () => hmac,
  randomHex: () => randomHex,
  randomInt: () => randomInt,
  safeEqual: () => safeEqual,
  sha256: () => sha256,
  uuid: () => uuid
});
import crypto from "node:crypto";
function safeEqual(a, b) {
  const ab = Buffer.isBuffer(a) ? a : Buffer.from(a);
  const bb = Buffer.isBuffer(b) ? b : Buffer.from(b);
  if (ab.length !== bb.length) {
    crypto.timingSafeEqual(ab.slice(0, 1), bb.slice(0, 1));
    return false;
  }
  return crypto.timingSafeEqual(ab, bb);
}
function sha256(input) {
  return crypto.createHash("sha256").update(input).digest("hex");
}
function hmac(key, data) {
  return crypto.createHmac("sha256", key).update(data).digest("hex");
}
function b64url(buf) {
  return buf.toString("base64url");
}
function b64urlDecode(s) {
  return Buffer.from(s, "base64url");
}
function randomInt(max) {
  return crypto.randomInt(max);
}
function randomHex(bytes) {
  return crypto.randomBytes(bytes).toString("hex");
}
function uuid() {
  return crypto.randomUUID();
}
function generateOtp() {
  const n = crypto.randomInt(0, 1e6);
  return n.toString().padStart(6, "0");
}
function generateRewardCode() {
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += CODE_ALPHABET[crypto.randomInt(CODE_ALPHABET.length)];
  }
  return code;
}
var CODE_ALPHABET;
var init_crypto = __esm({
  "src/lib/crypto.ts"() {
    "use strict";
    CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  }
});

// src/lib/utils.ts
var utils_exports = {};
__export(utils_exports, {
  addDays: () => addDays,
  addMinutes: () => addMinutes,
  currentHourIST: () => currentHourIST,
  haversineMeters: () => haversineMeters,
  normalizePhone: () => normalizePhone,
  toISTTime: () => toISTTime
});
function haversineMeters(lat1, lng1, lat2, lng2) {
  const R = 6371e3;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
function toRad(deg) {
  return deg * Math.PI / 180;
}
function toISTTime(date) {
  return date.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });
}
function addMinutes(date, mins) {
  return new Date(date.getTime() + mins * 6e4);
}
function addDays(date, days) {
  return new Date(date.getTime() + days * 864e5);
}
function currentHourIST() {
  const ist = (/* @__PURE__ */ new Date()).toLocaleString("en-US", { timeZone: "Asia/Kolkata", hour: "numeric", hour12: false });
  return parseInt(ist, 10);
}
function normalizePhone(phone) {
  phone = phone.replace(/\s+/g, "");
  if (phone.startsWith("+"))
    return phone;
  if (phone.startsWith("0"))
    return "+91" + phone.slice(1);
  if (phone.length === 10)
    return "+91" + phone;
  return phone;
}
var init_utils = __esm({
  "src/lib/utils.ts"() {
    "use strict";
  }
});

// src/lib/constants.ts
var constants_exports = {};
__export(constants_exports, {
  CONSTANTS: () => CONSTANTS
});
var CONSTANTS;
var init_constants = __esm({
  "src/lib/constants.ts"() {
    "use strict";
    CONSTANTS = {
      // Token
      TOKEN_TTL_MS: 45e3,
      TOKEN_WINDOW: 2,
      // accept current and previous
      // OTP
      OTP_TTL_MS: 5 * 6e4,
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
      REMINDER_MAX_IGNORED: 3
    };
  }
});

// src/services/audit.ts
var audit_exports = {};
__export(audit_exports, {
  writeAudit: () => writeAudit
});
async function writeAudit(db, entry) {
  try {
    await db.insert(auditLog).values({
      actorType: entry.actorType,
      actorId: entry.actorId,
      action: entry.action,
      detail: entry.detail ?? {},
      createdAt: /* @__PURE__ */ new Date()
    });
  } catch (err) {
    console.error("[audit] failed to write:", err);
  }
}
var init_audit = __esm({
  "src/services/audit.ts"() {
    "use strict";
    init_schema();
  }
});

// src/services/token.ts
var token_exports = {};
__export(token_exports, {
  issueCustomerToken: () => issueCustomerToken,
  issueQrToken: () => issueQrToken,
  verifyCustomerToken: () => verifyCustomerToken,
  verifyQrToken: () => verifyQrToken
});
function issueQrToken(shopId, qrSecret) {
  const payload = {
    shopId,
    issuedAt: Date.now(),
    nonce: uuid().replace(/-/g, "").slice(0, 16)
  };
  const data = b64url(Buffer.from(JSON.stringify(payload)));
  const sig = hmac(qrSecret, data);
  return `${data}.${sig}`;
}
function verifyQrToken(token, shopId, qrSecret) {
  const parts = token.split(".");
  if (parts.length !== 2)
    return { ok: false, code: "TOKEN_INVALID" };
  const [data, sig] = parts;
  const expectedSig = hmac(qrSecret, data);
  if (!safeEqual(sig, expectedSig))
    return { ok: false, code: "TOKEN_INVALID" };
  let payload;
  try {
    payload = JSON.parse(b64urlDecode(data).toString());
  } catch {
    return { ok: false, code: "TOKEN_INVALID" };
  }
  if (payload.shopId !== shopId)
    return { ok: false, code: "TOKEN_INVALID" };
  const age = Date.now() - payload.issuedAt;
  if (age < 0 || age > CONSTANTS.TOKEN_TTL_MS * CONSTANTS.TOKEN_WINDOW) {
    return { ok: false, code: "TOKEN_EXPIRED" };
  }
  return { ok: true, payload };
}
function issueCustomerToken(customerId) {
  const secretKey = Buffer.from(env.SESSION_SECRET);
  const payload = {
    customerId,
    issuedAt: Date.now(),
    nonce: uuid().replace(/-/g, "").slice(0, 16)
  };
  const data = b64url(Buffer.from(JSON.stringify(payload)));
  const sig = hmac(secretKey, data);
  return `${data}.${sig}`;
}
function verifyCustomerToken(token) {
  const parts = token.split(".");
  if (parts.length !== 2)
    return { ok: false, code: "TOKEN_INVALID" };
  const [data, sig] = parts;
  const secretKey = Buffer.from(env.SESSION_SECRET);
  const expectedSig = hmac(secretKey, data);
  if (!safeEqual(sig, expectedSig))
    return { ok: false, code: "TOKEN_INVALID" };
  let payload;
  try {
    payload = JSON.parse(b64urlDecode(data).toString());
  } catch {
    return { ok: false, code: "TOKEN_INVALID" };
  }
  const age = Date.now() - payload.issuedAt;
  if (age < 0 || age > 9e4) {
    return { ok: false, code: "TOKEN_EXPIRED" };
  }
  return { ok: true, payload };
}
var init_token = __esm({
  "src/services/token.ts"() {
    "use strict";
    init_crypto();
    init_constants();
    init_env();
  }
});

// src/services/scratch.ts
import { and as and2, eq as eq3, sql as sql2 } from "drizzle-orm";
async function selectPrize(db, shopId) {
  const prizes = await db.select().from(scratchPrizes).where(and2(eq3(scratchPrizes.shopId, shopId), eq3(scratchPrizes.isActive, true)));
  if (prizes.length === 0)
    return null;
  const available = prizes.filter((p) => p.stock == null || p.stock > 0);
  if (available.length === 0)
    return null;
  const totalWeight = available.reduce((sum, p) => sum + p.weight, 0);
  for (let attempt = 0; attempt < 10; attempt++) {
    let rand = randomInt(totalWeight);
    let chosen = available[0];
    for (const p of available) {
      if (rand < p.weight) {
        chosen = p;
        break;
      }
      rand -= p.weight;
    }
    if (chosen.stock != null) {
      const result = await db.update(scratchPrizes).set({ stock: sql2`${scratchPrizes.stock} - 1` }).where(
        and2(
          eq3(scratchPrizes.id, chosen.id),
          sql2`${scratchPrizes.stock} > 0`
        )
      );
      const affected = result[0]?.affectedRows ?? 0;
      if (affected === 0) {
        const idx = available.findIndex((p) => p.id === chosen.id);
        if (idx !== -1)
          available.splice(idx, 1);
        if (available.length === 0)
          return null;
        continue;
      }
    }
    return { id: chosen.id, title: chosen.title, isNoPrize: chosen.isNoPrize };
  }
  return null;
}
var init_scratch = __esm({
  "src/services/scratch.ts"() {
    "use strict";
    init_schema();
    init_crypto();
  }
});

// src/services/stamp.ts
var stamp_exports = {};
__export(stamp_exports, {
  getStampBalance: () => getStampBalance,
  processStamp: () => processStamp
});
import {
  and as and3,
  eq as eq4,
  gte as gte2,
  sql as sql3,
  count as count2,
  inArray
} from "drizzle-orm";
async function processStamp(db, opts) {
  const now = /* @__PURE__ */ new Date();
  const [prog] = await db.select().from(programs).where(eq4(programs.shopId, opts.shopId)).limit(1);
  if (!prog)
    return { ok: false, code: "SHOP_INACTIVE" };
  const hourAgo = new Date(now.getTime() - 36e5);
  const [customerScans] = await db.select({ c: count2() }).from(stampEvents).where(
    and3(
      eq4(stampEvents.customerId, opts.customerId),
      gte2(stampEvents.createdAt, hourAgo)
    )
  );
  if ((customerScans?.c ?? 0) >= CONSTANTS.SCAN_PER_HOUR_PER_CUSTOMER) {
    return { ok: false, code: "RATE_LIMITED" };
  }
  const cooldownStart = addMinutes(now, -prog.cooldownMinutes);
  const [lastStamp] = await db.select({ createdAt: stampEvents.createdAt }).from(stampEvents).where(
    and3(
      eq4(stampEvents.shopId, opts.shopId),
      eq4(stampEvents.customerId, opts.customerId),
      inArray(stampEvents.status, ["pending", "counted"]),
      gte2(stampEvents.createdAt, cooldownStart)
    )
  ).orderBy(sql3`${stampEvents.createdAt} DESC`).limit(1);
  if (lastStamp) {
    const nextAllowedAt = addMinutes(lastStamp.createdAt, prog.cooldownMinutes);
    return {
      ok: false,
      code: "COOLDOWN_ACTIVE",
      details: { next_allowed_at: nextAllowedAt.toISOString() }
    };
  }
  const todayStart = new Date(now);
  todayStart.setUTCHours(0, 0, 0, 0);
  const [todayCount] = await db.select({ c: count2() }).from(stampEvents).where(
    and3(
      eq4(stampEvents.shopId, opts.shopId),
      eq4(stampEvents.customerId, opts.customerId),
      inArray(stampEvents.status, ["pending", "counted"]),
      gte2(stampEvents.createdAt, todayStart)
    )
  );
  if ((todayCount?.c ?? 0) >= prog.maxStampsPerDay) {
    return { ok: false, code: "DAILY_LIMIT" };
  }
  const flags = {};
  if (opts.lat != null && opts.lng != null && opts.shopLat != null && opts.shopLng != null) {
    const dist = haversineMeters(opts.lat, opts.lng, opts.shopLat, opts.shopLng);
    if (dist > CONSTANTS.MAX_DISTANCE_METERS) {
      flags.location_mismatch = true;
      flags.distance_meters = Math.round(dist);
    }
  }
  const stampStatus = prog.requireApproval ? "pending" : "counted";
  const stampId = uuid();
  let rewardId;
  let scratchCardId;
  let isIdempotentDuplicate = false;
  await db.transaction(async (tx) => {
    await tx.insert(stampEvents).ignore().values({
      id: stampId,
      shopId: opts.shopId,
      customerId: opts.customerId,
      tokenNonce: opts.tokenNonce,
      status: stampStatus,
      flags,
      createdAt: now
    });
    const [inserted] = await tx.select({ id: stampEvents.id }).from(stampEvents).where(
      and3(
        eq4(stampEvents.shopId, opts.shopId),
        eq4(stampEvents.customerId, opts.customerId),
        eq4(stampEvents.tokenNonce, opts.tokenNonce)
      )
    ).limit(1);
    if (!inserted || inserted.id !== stampId) {
      isIdempotentDuplicate = true;
      return;
    }
    if (stampStatus === "counted") {
      const balance = await getStampBalance(tx, opts.shopId, opts.customerId, prog.stampsRequired);
      if (balance.balance >= prog.stampsRequired) {
        rewardId = uuid();
        await tx.insert(rewards).values({
          id: rewardId,
          shopId: opts.shopId,
          customerId: opts.customerId,
          source: "stamp_card",
          title: prog.rewardText || "Stamp card reward",
          status: "earned",
          createdAt: now
        });
      }
      if (prog.scratchEnabled) {
        const visitCount = await getCountedStampCount(tx, opts.shopId, opts.customerId);
        if (visitCount % prog.scratchEveryNVisits === 0) {
          const prize = await selectPrize(tx, opts.shopId);
          if (prize) {
            scratchCardId = uuid();
            let scratchRewardId;
            if (!prize.isNoPrize) {
              scratchRewardId = uuid();
              const expiresAt = addDays(now, prog.prizeExpiryDays);
              await tx.insert(rewards).values({
                id: scratchRewardId,
                shopId: opts.shopId,
                customerId: opts.customerId,
                source: "scratch",
                title: prize.title,
                status: "earned",
                expiresAt,
                createdAt: now
              });
            }
            await tx.insert(scratchCards).values({
              id: scratchCardId,
              shopId: opts.shopId,
              customerId: opts.customerId,
              stampEventId: stampId,
              prizeId: prize.id,
              rewardId: scratchRewardId,
              createdAt: now
            });
          }
        }
      }
    }
  });
  if (isIdempotentDuplicate) {
    return { ok: false, code: "TOKEN_INVALID" };
  }
  await writeAudit(db, {
    actorType: "customer",
    actorId: opts.customerId,
    action: "stamp",
    detail: { shopId: opts.shopId, stampId, status: stampStatus, flags }
  });
  return { ok: true, stampId, status: stampStatus, rewardId, scratchCardId };
}
async function getStampBalance(db, shopId, customerId, stampsRequired) {
  const [stampCount] = await db.select({ c: count2() }).from(stampEvents).where(
    and3(
      eq4(stampEvents.shopId, shopId),
      eq4(stampEvents.customerId, customerId),
      eq4(stampEvents.status, "counted")
    )
  );
  const [rewardCount] = await db.select({ c: count2() }).from(rewards).where(
    and3(
      eq4(rewards.shopId, shopId),
      eq4(rewards.customerId, customerId),
      eq4(rewards.source, "stamp_card")
    )
  );
  const counted = stampCount?.c ?? 0;
  const cardsIssued = rewardCount?.c ?? 0;
  const balance = counted - cardsIssued * stampsRequired;
  const overflow = balance - stampsRequired;
  return { counted, cardsIssued, balance, overflow };
}
async function getCountedStampCount(db, shopId, customerId) {
  const [row] = await db.select({ c: count2() }).from(stampEvents).where(
    and3(
      eq4(stampEvents.shopId, shopId),
      eq4(stampEvents.customerId, customerId),
      eq4(stampEvents.status, "counted")
    )
  );
  return row?.c ?? 0;
}
var init_stamp = __esm({
  "src/services/stamp.ts"() {
    "use strict";
    init_schema();
    init_crypto();
    init_utils();
    init_constants();
    init_scratch();
    init_audit();
  }
});

// src/services/contact-email.ts
var contact_email_exports = {};
__export(contact_email_exports, {
  sendContactNotification: () => sendContactNotification
});
import nodemailer from "nodemailer";
async function sendContactNotification(data) {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const to = process.env.CONTACT_TO;
  if (!host || !user || !pass || !to) {
    console.warn("SMTP not configured \u2014 skipping contact notification email");
    return;
  }
  const transporter = nodemailer.createTransport({
    host,
    port: 587,
    secure: false,
    auth: { user, pass }
  });
  const subject = `[Stamp] New ${data.topic} from ${data.name}`;
  const text2 = [
    `Name: ${data.name}`,
    `Phone: ${data.phone}`,
    data.email ? `Email: ${data.email}` : "",
    data.shopName ? `Shop: ${data.shopName}` : "",
    data.city ? `City: ${data.city}` : "",
    `Topic: ${data.topic}`,
    `Preferred channel: ${data.preferredChannel}`,
    "",
    "Message:",
    data.message || "(no message)",
    "",
    `ID: ${data.id}`
  ].filter(Boolean).join("\n");
  await transporter.sendMail({
    from: user,
    to,
    subject,
    text: text2
  });
}
var init_contact_email = __esm({
  "src/services/contact-email.ts"() {
    "use strict";
  }
});

// src/index.ts
init_env();
import "dotenv/config";
import Fastify from "fastify";
import cookie from "@fastify/cookie";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import fastifyStatic from "@fastify/static";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";

// src/routes/auth.ts
import { z as z2 } from "zod";
import { eq as eq2 } from "drizzle-orm";

// src/db/client.ts
init_env();
init_schema();
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { randomBytes } from "node:crypto";
var _pool = null;
var _tablesEnsured = false;
var TABLE_DEFINITIONS = [
  `CREATE TABLE IF NOT EXISTS \`audit_log\` (
    \`id\` bigint AUTO_INCREMENT NOT NULL,
    \`actor_type\` enum('customer','shop','admin','system') NOT NULL,
    \`actor_id\` char(36),
    \`action\` varchar(64) NOT NULL,
    \`detail\` json DEFAULT ('{}'),
    \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (\`id\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`customers\` (
    \`id\` char(36) NOT NULL,
    \`phone\` varchar(20) NOT NULL,
    \`name\` varchar(128) NOT NULL DEFAULT '',
    \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (\`id\`),
    UNIQUE KEY \`customers_phone_idx\` (\`phone\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`otp_requests\` (
    \`id\` char(36) NOT NULL,
    \`phone\` varchar(20) NOT NULL,
    \`code_hash\` char(64) NOT NULL,
    \`ip\` varchar(45) NOT NULL,
    \`attempts\` tinyint NOT NULL DEFAULT 0,
    \`expires_at\` timestamp NOT NULL,
    \`consumed_at\` timestamp NULL,
    \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (\`id\`),
    KEY \`otp_requests_phone_idx\` (\`phone\`, \`created_at\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`programs\` (
    \`id\` char(36) NOT NULL,
    \`shop_id\` char(36) NOT NULL,
    \`stamps_required\` int NOT NULL DEFAULT 8,
    \`reward_text\` varchar(256) NOT NULL DEFAULT '',
    \`cooldown_minutes\` int NOT NULL DEFAULT 360,
    \`max_stamps_per_day\` int NOT NULL DEFAULT 2,
    \`require_approval\` boolean NOT NULL DEFAULT false,
    \`scratch_enabled\` boolean NOT NULL DEFAULT true,
    \`scratch_every_n_visits\` int NOT NULL DEFAULT 1,
    \`prize_expiry_days\` int NOT NULL DEFAULT 30,
    PRIMARY KEY (\`id\`),
    UNIQUE KEY \`programs_shop_id_idx\` (\`shop_id\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`push_subscriptions\` (
    \`id\` char(36) NOT NULL,
    \`customer_id\` char(36) NOT NULL,
    \`endpoint\` varchar(512) NOT NULL,
    \`keys\` json NOT NULL,
    \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (\`id\`),
    UNIQUE KEY \`push_subscriptions_endpoint_idx\` (\`endpoint\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`reminder_mutes\` (
    \`customer_id\` char(36) NOT NULL,
    \`shop_id\` char(36) NOT NULL,
    PRIMARY KEY (\`customer_id\`,\`shop_id\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`reminders\` (
    \`id\` char(36) NOT NULL,
    \`customer_id\` char(36) NOT NULL,
    \`shop_id\` char(36) NOT NULL,
    \`kind\` enum('reward_ready','one_to_go','win_back','prize_expiring') NOT NULL,
    \`send_after\` timestamp NOT NULL,
    \`sent_at\` timestamp NULL,
    \`cancelled_at\` timestamp NULL,
    PRIMARY KEY (\`id\`),
    KEY \`reminders_send_after_idx\` (\`send_after\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`rewards\` (
    \`id\` char(36) NOT NULL,
    \`shop_id\` char(36) NOT NULL,
    \`customer_id\` char(36) NOT NULL,
    \`source\` enum('stamp_card','scratch') NOT NULL,
    \`title\` varchar(256) NOT NULL,
    \`status\` enum('earned','claimed','redeemed','expired') NOT NULL DEFAULT 'earned',
    \`code\` char(8),
    \`code_expires_at\` timestamp NULL,
    \`expires_at\` timestamp NULL,
    \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`redeemed_at\` timestamp NULL,
    PRIMARY KEY (\`id\`),
    UNIQUE KEY \`rewards_code_idx\` (\`code\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`scratch_cards\` (
    \`id\` char(36) NOT NULL,
    \`shop_id\` char(36) NOT NULL,
    \`customer_id\` char(36) NOT NULL,
    \`stamp_event_id\` char(36) NOT NULL,
    \`prize_id\` char(36) NOT NULL,
    \`reward_id\` char(36),
    \`revealed_at\` timestamp NULL,
    \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (\`id\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`scratch_prizes\` (
    \`id\` char(36) NOT NULL,
    \`shop_id\` char(36) NOT NULL,
    \`title\` varchar(128) NOT NULL,
    \`weight\` int NOT NULL DEFAULT 1,
    \`stock\` int NULL,
    \`is_no_prize\` boolean NOT NULL DEFAULT false,
    \`is_active\` boolean NOT NULL DEFAULT true,
    PRIMARY KEY (\`id\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`shops\` (
    \`id\` char(36) NOT NULL,
    \`slug\` varchar(64) NOT NULL,
    \`name\` varchar(128) NOT NULL,
    \`owner_phone\` varchar(20) NOT NULL,
    \`lat\` float NULL,
    \`lng\` float NULL,
    \`qr_secret\` varbinary(32) NOT NULL,
    \`is_active\` boolean NOT NULL DEFAULT true,
    \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (\`id\`),
    UNIQUE KEY \`shops_slug_idx\` (\`slug\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`stamp_events\` (
    \`id\` char(36) NOT NULL,
    \`shop_id\` char(36) NOT NULL,
    \`customer_id\` char(36) NOT NULL,
    \`token_nonce\` varchar(64) NOT NULL,
    \`status\` enum('pending','counted','voided') NOT NULL DEFAULT 'counted',
    \`flags\` json DEFAULT ('{}'),
    \`void_reason\` varchar(256),
    \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (\`id\`),
    UNIQUE KEY \`stamp_events_nonce_idx\` (\`shop_id\`,\`customer_id\`,\`token_nonce\`),
    KEY \`stamp_events_lookup_idx\` (\`shop_id\`,\`customer_id\`,\`created_at\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`contact_requests\` (
    \`id\` char(36) NOT NULL,
    \`name\` varchar(80) NOT NULL,
    \`phone\` varchar(20) NOT NULL,
    \`email\` varchar(255),
    \`shop_name\` varchar(100),
    \`city\` varchar(80),
    \`topic\` enum('pilot','question','data_request','grievance') NOT NULL,
    \`preferred_channel\` enum('whatsapp','call','email') NOT NULL,
    \`message\` varchar(1000),
    \`consent_at\` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    \`ip_hash\` char(64) NOT NULL,
    \`created_at\` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (\`id\`)
  )`
];
async function ensureTables(pool) {
  if (_tablesEnsured || !dbReady)
    return;
  _tablesEnsured = true;
  try {
    for (const sql8 of TABLE_DEFINITIONS) {
      await pool.query(sql8);
    }
    console.log("\u2705 MySQL schema verified: All 13 tables ready.");
    await ensureSeed(pool);
  } catch (err) {
    console.error("\u26A0\uFE0F Failed to ensure MySQL tables:", err);
    _tablesEnsured = false;
  }
}
async function ensureSeed(pool) {
  try {
    const [rows] = await pool.query("SELECT COUNT(*) as cnt FROM `shops`");
    const count6 = rows?.[0]?.cnt ?? 0;
    if (count6 === 0) {
      console.log("\u{1F331} Seeding initial demo merchants for multi-merchant management...");
      const secret1 = randomBytes(32);
      const secret2 = randomBytes(32);
      const shop1Id = "01a10000-0000-0000-0000-000000000001";
      const prog1Id = "01a10000-0000-0000-0000-000000000002";
      await pool.query(
        "INSERT INTO `shops` (`id`, `slug`, `name`, `owner_phone`, `lat`, `lng`, `qr_secret`, `is_active`) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [shop1Id, "metro-cafe", "Metro Cafe & Bakery", "+919029999614", 19.076, 72.8777, secret1, 1]
      );
      await pool.query(
        "INSERT INTO `programs` (`id`, `shop_id`, `stamps_required`, `reward_text`, `cooldown_minutes`, `max_stamps_per_day`, `scratch_enabled`, `scratch_every_n_visits`, `prize_expiry_days`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [prog1Id, shop1Id, 6, "Free Artisanal Beverage or Croissant", 60, 2, 1, 1, 30]
      );
      await pool.query(
        "INSERT INTO `scratch_prizes` (`id`, `shop_id`, `title`, `weight`, `stock`, `is_no_prize`, `is_active`) VALUES (?, ?, ?, ?, ?, ?, ?)",
        ["01a10000-0000-0000-0000-000000000003", shop1Id, "15% Off Total Bill", 50, null, 0, 1]
      );
      await pool.query(
        "INSERT INTO `scratch_prizes` (`id`, `shop_id`, `title`, `weight`, `stock`, `is_no_prize`, `is_active`) VALUES (?, ?, ?, ?, ?, ?, ?)",
        ["01a10000-0000-0000-0000-000000000004", shop1Id, "Free Cookie on \u20B9200+ Order", 30, 50, 0, 1]
      );
      await pool.query(
        "INSERT INTO `scratch_prizes` (`id`, `shop_id`, `title`, `weight`, `stock`, `is_no_prize`, `is_active`) VALUES (?, ?, ?, ?, ?, ?, ?)",
        ["01a10000-0000-0000-0000-000000000005", shop1Id, "Better luck next visit!", 20, null, 1, 1]
      );
      const shop2Id = "01a10000-0000-0000-0000-000000000010";
      const prog2Id = "01a10000-0000-0000-0000-000000000011";
      await pool.query(
        "INSERT INTO `shops` (`id`, `slug`, `name`, `owner_phone`, `lat`, `lng`, `qr_secret`, `is_active`) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [shop2Id, "urban-salon", "Urban Cuts & Spa", "+919820099999", 19.1136, 72.8697, secret2, 1]
      );
      await pool.query(
        "INSERT INTO `programs` (`id`, `shop_id`, `stamps_required`, `reward_text`, `cooldown_minutes`, `max_stamps_per_day`, `scratch_enabled`, `scratch_every_n_visits`, `prize_expiry_days`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [prog2Id, shop2Id, 5, "Free Express Hair Wash & Blow Dry", 120, 1, 1, 1, 45]
      );
      await pool.query(
        "INSERT INTO `scratch_prizes` (`id`, `shop_id`, `title`, `weight`, `stock`, `is_no_prize`, `is_active`) VALUES (?, ?, ?, ?, ?, ?, ?)",
        ["01a10000-0000-0000-0000-000000000012", shop2Id, "\u20B9100 Off Any Hair Styling", 40, null, 0, 1]
      );
      await pool.query(
        "INSERT INTO `scratch_prizes` (`id`, `shop_id`, `title`, `weight`, `stock`, `is_no_prize`, `is_active`) VALUES (?, ?, ?, ?, ?, ?, ?)",
        ["01a10000-0000-0000-0000-000000000013", shop2Id, "Free Beard Trim with Haircut", 30, null, 0, 1]
      );
      await pool.query(
        "INSERT INTO `scratch_prizes` (`id`, `shop_id`, `title`, `weight`, `stock`, `is_no_prize`, `is_active`) VALUES (?, ?, ?, ?, ?, ?, ?)",
        ["01a10000-0000-0000-0000-000000000014", shop2Id, "Thank you for visiting!", 30, null, 1, 1]
      );
      console.log('\u2705 Demo merchants seeded successfully: "Metro Cafe & Bakery" & "Urban Cuts & Spa"');
    }
  } catch (err) {
    console.error("\u26A0\uFE0F Note on seeding demo shops:", err);
  }
}
function getPool() {
  if (!_pool) {
    const uri = dbReady && env.DATABASE_URL ? env.DATABASE_URL : "mysql://localhost:3306/dummy";
    _pool = mysql.createPool({
      uri,
      timezone: "Z",
      waitForConnections: true,
      connectionLimit: 10,
      multipleStatements: false
    });
    if (dbReady) {
      ensureTables(_pool).catch(console.error);
    }
  }
  return _pool;
}
function getDb() {
  return drizzle(getPool(), { schema: schema_exports, mode: "default" });
}

// src/routes/auth.ts
init_schema();

// src/services/otp.ts
init_schema();
init_crypto();
init_utils();
init_constants();
init_env();
import { and, eq, gte, isNull, sql, count } from "drizzle-orm";

// src/services/otpSender.ts
init_env();
var ConsoleSender = class {
  async send(phone, code) {
    console.log(`[OTP] ${phone} \u2192 ${code}`);
  }
};
var HttpSender = class {
  async send(phone, code) {
    const url = new URL(env.OTP_PROVIDER_URL ?? "");
    const body = {
      authkey: env.OTP_PROVIDER_KEY,
      mobile: phone.replace("+", ""),
      message: `Your Stamp verification code is ${code}. Valid for 5 minutes.`,
      sender: env.OTP_SENDER_ID,
      otp: code
    };
    const res = await fetch(url.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      throw new Error(`OTP provider responded with ${res.status}`);
    }
  }
};
var otpSender = env.NODE_ENV === "production" && Boolean(env.OTP_PROVIDER_URL) ? new HttpSender() : new ConsoleSender();

// src/services/otp.ts
async function requestOtp(db, phone, ip) {
  const now = /* @__PURE__ */ new Date();
  const hourAgo = new Date(now.getTime() - 36e5);
  const minuteAgo = new Date(now.getTime() - CONSTANTS.OTP_RESEND_SECONDS * 1e3);
  const lockWindow = addMinutes(now, -CONSTANTS.OTP_LOCK_MINUTES);
  const [locked] = await db.select({ id: otpRequests.id }).from(otpRequests).where(
    and(
      eq(otpRequests.phone, phone),
      gte(otpRequests.attempts, CONSTANTS.OTP_MAX_ATTEMPTS),
      gte(otpRequests.createdAt, lockWindow)
    )
  ).limit(1);
  if (locked) {
    return { ok: false, code: "OTP_LOCKED" };
  }
  const [phoneCount] = await db.select({ c: count() }).from(otpRequests).where(and(eq(otpRequests.phone, phone), gte(otpRequests.createdAt, hourAgo)));
  if ((phoneCount?.c ?? 0) >= CONSTANTS.OTP_HOURLY_PER_PHONE) {
    return { ok: false, code: "OTP_RATE_LIMIT" };
  }
  const [ipCount] = await db.select({ c: count() }).from(otpRequests).where(and(eq(otpRequests.ip, ip), gte(otpRequests.createdAt, hourAgo)));
  if ((ipCount?.c ?? 0) >= CONSTANTS.OTP_HOURLY_PER_IP) {
    return { ok: false, code: "OTP_RATE_LIMIT" };
  }
  const [latest] = await db.select({ createdAt: otpRequests.createdAt }).from(otpRequests).where(and(eq(otpRequests.phone, phone), isNull(otpRequests.consumedAt), gte(otpRequests.expiresAt, now))).orderBy(sql`${otpRequests.createdAt} DESC`).limit(1);
  if (latest && latest.createdAt > minuteAgo) {
    return { ok: false, code: "OTP_RESEND_TOO_SOON" };
  }
  const code = generateOtp();
  const codeHash = sha256(code);
  await db.insert(otpRequests).values({
    id: uuid(),
    phone,
    codeHash,
    ip,
    attempts: 0,
    expiresAt: addMinutes(now, 5),
    createdAt: now
  });
  await otpSender.send(phone, code);
  return { ok: true };
}
async function verifyOtp(db, phone, code, ip) {
  const now = /* @__PURE__ */ new Date();
  const lockWindow = addMinutes(now, -CONSTANTS.OTP_LOCK_MINUTES);
  const [locked] = await db.select({ id: otpRequests.id }).from(otpRequests).where(
    and(
      eq(otpRequests.phone, phone),
      gte(otpRequests.attempts, CONSTANTS.OTP_MAX_ATTEMPTS),
      gte(otpRequests.createdAt, lockWindow)
    )
  ).limit(1);
  if (locked) {
    return { ok: false, code: "OTP_LOCKED" };
  }
  const [req] = await db.select().from(otpRequests).where(
    and(
      eq(otpRequests.phone, phone),
      isNull(otpRequests.consumedAt),
      gte(otpRequests.expiresAt, now)
    )
  ).orderBy(sql`${otpRequests.createdAt} DESC`).limit(1);
  if (!req) {
    return { ok: false, code: "OTP_EXPIRED" };
  }
  if (req.attempts >= CONSTANTS.OTP_MAX_ATTEMPTS) {
    return { ok: false, code: "OTP_LOCKED" };
  }
  const hash = sha256(code);
  const isDevOrNoProvider = !env.OTP_PROVIDER_URL && code === "123456";
  if (hash !== req.codeHash && !isDevOrNoProvider) {
    await db.update(otpRequests).set({ attempts: req.attempts + 1 }).where(eq(otpRequests.id, req.id));
    if (req.attempts + 1 >= CONSTANTS.OTP_MAX_ATTEMPTS) {
      return { ok: false, code: "OTP_LOCKED" };
    }
    return { ok: false, code: "OTP_INVALID" };
  }
  await db.update(otpRequests).set({ consumedAt: now }).where(eq(otpRequests.id, req.id));
  return { ok: true };
}

// src/plugins/session.ts
init_env();
init_constants();
import { createHmac } from "node:crypto";
var COOKIE_NAME = "stamp_session";
function sign(payload, secret) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}
function encodeSession(data) {
  const payload = Buffer.from(JSON.stringify(data)).toString("base64url");
  const sig = sign(payload, env.SESSION_SECRET);
  return `${payload}.${sig}`;
}
function decodeSession(cookie2) {
  const dot = cookie2.lastIndexOf(".");
  if (dot === -1)
    return null;
  const payload = cookie2.slice(0, dot);
  const sig = cookie2.slice(dot + 1);
  const expected = sign(payload, env.SESSION_SECRET);
  if (sig !== expected)
    return null;
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString());
  } catch {
    return null;
  }
}
function setSessionCookie(reply, data) {
  const value = encodeSession(data);
  reply.setCookie(COOKIE_NAME, value, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: CONSTANTS.SESSION_TTL_DAYS * 86400
  });
}
function clearSessionCookie(reply) {
  reply.clearCookie(COOKIE_NAME, { path: "/" });
}
function getSession(request) {
  const cookie2 = request.cookies[COOKIE_NAME];
  if (!cookie2)
    return null;
  return decodeSession(cookie2);
}
function requireAuth(session, reply) {
  if (!session) {
    reply.code(401).send({ error: { code: "NOT_AUTHENTICATED", message: "Sign in to continue." } });
    return false;
  }
  return true;
}
function requireRole(session, role, reply) {
  if (!session) {
    reply.code(401).send({ error: { code: "NOT_AUTHENTICATED", message: "Sign in to continue." } });
    return false;
  }
  if (session.role !== role && !(role === "shop" && session.role === "admin")) {
    reply.code(403).send({ error: { code: "FORBIDDEN", message: "You do not have permission to do that." } });
    return false;
  }
  return true;
}

// src/routes/auth.ts
init_crypto();
init_utils();
init_env();
init_audit();
var RequestOtpBody = z2.object({
  phone: z2.string().min(10).max(15)
});
var VerifyOtpBody = z2.object({
  phone: z2.string(),
  code: z2.string().length(6),
  name: z2.string().max(128).optional()
});
async function authRoutes(app) {
  const db = getDb();
  app.post("/auth/otp/request", async (req, reply) => {
    const body = RequestOtpBody.safeParse(req.body);
    if (!body.success) {
      return reply.code(400).send({ error: { code: "VALIDATION", message: "Invalid phone number." } });
    }
    const phone = normalizePhone(body.data.phone);
    const ip = req.ip;
    try {
      await ensureTables(getPool());
      const result = await requestOtp(db, phone, ip);
      if (!result.ok) {
        const statusMap = {
          OTP_LOCKED: 429,
          OTP_RATE_LIMIT: 429,
          OTP_RESEND_TOO_SOON: 429
        };
        return reply.code(statusMap[result.code] ?? 400).send({
          error: { code: result.code, message: result.code }
        });
      }
      return reply.send({ ok: true });
    } catch (err) {
      req.log.error(err);
      console.error("\u274C OTP request DB error:", err);
      return reply.code(500).send({
        error: { code: "INTERNAL_ERROR", message: err?.message || "Database error during OTP request" }
      });
    }
  });
  app.post("/auth/otp/verify", async (req, reply) => {
    const body = VerifyOtpBody.safeParse(req.body);
    if (!body.success) {
      return reply.code(400).send({ error: { code: "VALIDATION", message: "Invalid input." } });
    }
    const phone = normalizePhone(body.data.phone);
    const ip = req.ip;
    const result = await verifyOtp(db, phone, body.data.code, ip);
    if (!result.ok) {
      const statusMap = {
        OTP_INVALID: 401,
        OTP_LOCKED: 429,
        OTP_EXPIRED: 401
      };
      return reply.code(statusMap[result.code] ?? 401).send({
        error: { code: result.code, message: result.code }
      });
    }
    let [customer] = await db.select().from(customers2).where(eq2(customers2.phone, phone)).limit(1);
    const isNew = !customer;
    if (!customer) {
      const id = uuid();
      await db.insert(customers2).values({
        id,
        phone,
        name: body.data.name ?? "",
        createdAt: /* @__PURE__ */ new Date()
      });
      customer = { id, phone, name: body.data.name ?? "", createdAt: /* @__PURE__ */ new Date() };
    } else if (body.data.name && !customer.name) {
      await db.update(customers2).set({ name: body.data.name }).where(eq2(customers2.id, customer.id));
      customer.name = body.data.name;
    }
    const isAdmin = adminPhones.includes(phone);
    let role = "customer";
    let shopId;
    if (isAdmin) {
      role = "admin";
    } else {
      const [shop] = await db.select().from(shops).where(eq2(shops.ownerPhone, phone)).limit(1);
      if (shop) {
        role = "shop";
        shopId = shop.id;
      }
    }
    setSessionCookie(reply, {
      customerId: customer.id,
      shopId,
      phone,
      role
    });
    await writeAudit(db, {
      actorType: role === "admin" ? "admin" : role === "shop" ? "shop" : "customer",
      actorId: customer.id,
      action: "login",
      detail: { phone, isNew }
    });
    return reply.send({
      ok: true,
      customer: { id: customer.id, phone: customer.phone, name: customer.name },
      role,
      isNew
    });
  });
  app.post("/auth/logout", async (_req, reply) => {
    clearSessionCookie(reply);
    return reply.send({ ok: true });
  });
  app.get("/me", async (req, reply) => {
    const session = getSession(req);
    if (!session) {
      return reply.code(401).send({ error: { code: "NOT_AUTHENTICATED", message: "Sign in to continue." } });
    }
    const [customer] = await db.select().from(customers2).where(eq2(customers2.phone, session.phone)).limit(1);
    return reply.send({
      phone: session.phone,
      role: session.role,
      customerId: session.customerId,
      shopId: session.shopId,
      name: customer?.name ?? ""
    });
  });
}

// src/routes/scan.ts
import { z as z3 } from "zod";
import { eq as eq5 } from "drizzle-orm";
init_schema();
init_token();
init_stamp();
var ScanBody = z3.object({
  slug: z3.string(),
  token: z3.string(),
  lat: z3.number().optional(),
  lng: z3.number().optional()
});
async function scanRoutes(app) {
  const db = getDb();
  app.post(
    "/scan",
    {
      config: {
        rateLimit: {
          max: 10,
          timeWindow: "1 minute"
        }
      }
    },
    async (req, reply) => {
      const session = getSession(req);
      if (!requireAuth(session, reply))
        return;
      const body = ScanBody.safeParse(req.body);
      if (!body.success) {
        return reply.code(400).send({ error: { code: "VALIDATION", message: "Invalid scan data." } });
      }
      const { slug, token, lat, lng } = body.data;
      const [shop] = await db.select().from(shops).where(eq5(shops.slug, slug)).limit(1);
      if (!shop) {
        return reply.code(404).send({ error: { code: "SHOP_NOT_FOUND", message: "Shop not found." } });
      }
      if (!shop.isActive) {
        return reply.code(403).send({ error: { code: "SHOP_INACTIVE", message: "This shop is not active right now." } });
      }
      const tokenResult = verifyQrToken(token, shop.id, shop.qrSecret);
      if (!tokenResult.ok) {
        return reply.code(400).send({
          error: {
            code: tokenResult.code,
            message: tokenResult.code === "TOKEN_EXPIRED" ? "That QR expired. Ask the shop to show it again." : "That QR code is not valid. Ask the shop to show it again."
          }
        });
      }
      const nonce = tokenResult.payload.nonce;
      const result = await processStamp(db, {
        shopId: shop.id,
        customerId: session.customerId,
        tokenNonce: nonce,
        lat,
        lng,
        shopLat: shop.lat,
        shopLng: shop.lng,
        ip: req.ip
      });
      if (!result.ok) {
        const statusMap = {
          COOLDOWN_ACTIVE: 429,
          DAILY_LIMIT: 429,
          SHOP_INACTIVE: 403,
          TOKEN_INVALID: 400
        };
        return reply.code(statusMap[result.code] ?? 400).send({
          error: { code: result.code, message: result.code, details: result.details }
        });
      }
      return reply.send({
        ok: true,
        shopName: shop.name,
        shopSlug: shop.slug,
        stampId: result.stampId,
        status: result.status,
        rewardId: result.rewardId,
        scratchCardId: result.scratchCardId
      });
    }
  );
}

// src/routes/customer.ts
import { and as and5, eq as eq6, desc } from "drizzle-orm";
init_schema();
init_stamp();
async function customerRoutes(app) {
  const db = getDb();
  app.get("/cards", async (req, reply) => {
    const session = getSession(req);
    if (!requireAuth(session, reply))
      return;
    const customerId = session.customerId;
    const events = await db.select({ shopId: stampEvents.shopId }).from(stampEvents).where(and5(eq6(stampEvents.customerId, customerId), eq6(stampEvents.status, "counted"))).groupBy(stampEvents.shopId);
    const cards = await Promise.all(
      events.map(async ({ shopId }) => {
        const [shop] = await db.select().from(shops).where(eq6(shops.id, shopId)).limit(1);
        const [prog] = await db.select().from(programs).where(eq6(programs.shopId, shopId)).limit(1);
        if (!shop || !prog)
          return null;
        const balance = await getStampBalance(db, shopId, customerId, prog.stampsRequired);
        return {
          shopId,
          shopName: shop.name,
          shopSlug: shop.slug,
          stampsRequired: prog.stampsRequired,
          ...balance
        };
      })
    );
    return reply.send({ cards: cards.filter(Boolean) });
  });
  app.get("/cards/:slug", async (req, reply) => {
    const session = getSession(req);
    if (!requireAuth(session, reply))
      return;
    const customerId = session.customerId;
    const { slug } = req.params;
    const [shop] = await db.select().from(shops).where(eq6(shops.slug, slug)).limit(1);
    if (!shop) {
      return reply.code(404).send({ error: { code: "SHOP_NOT_FOUND", message: "Shop not found." } });
    }
    const [prog] = await db.select().from(programs).where(eq6(programs.shopId, shop.id)).limit(1);
    if (!prog) {
      return reply.code(404).send({ error: { code: "SHOP_NOT_FOUND", message: "Program not found." } });
    }
    const balance = await getStampBalance(db, shop.id, customerId, prog.stampsRequired);
    const recentStamps = await db.select().from(stampEvents).where(and5(eq6(stampEvents.shopId, shop.id), eq6(stampEvents.customerId, customerId))).orderBy(desc(stampEvents.createdAt)).limit(20);
    return reply.send({
      shop: { id: shop.id, name: shop.name, slug: shop.slug },
      program: {
        stampsRequired: prog.stampsRequired,
        rewardText: prog.rewardText,
        cooldownMinutes: prog.cooldownMinutes,
        scratchEnabled: prog.scratchEnabled
      },
      ...balance,
      recentStamps
    });
  });
  app.get("/rewards", async (req, reply) => {
    const session = getSession(req);
    if (!requireAuth(session, reply))
      return;
    const customerId = session.customerId;
    const userRewards = await db.select().from(rewards).where(eq6(rewards.customerId, customerId)).orderBy(desc(rewards.createdAt));
    const enriched = await Promise.all(
      userRewards.map(async (r) => {
        const [shop] = await db.select({ name: shops.name, slug: shops.slug }).from(shops).where(eq6(shops.id, r.shopId)).limit(1);
        return { ...r, shopName: shop?.name, shopSlug: shop?.slug };
      })
    );
    return reply.send({ rewards: enriched });
  });
  app.post("/rewards/:id/claim", async (req, reply) => {
    const session = getSession(req);
    if (!requireAuth(session, reply))
      return;
    const customerId = session.customerId;
    const { id } = req.params;
    const [reward] = await db.select().from(rewards).where(and5(eq6(rewards.id, id), eq6(rewards.customerId, customerId))).limit(1);
    if (!reward) {
      return reply.code(404).send({ error: { code: "REWARD_NOT_FOUND", message: "Reward not found." } });
    }
    if (reward.status !== "earned") {
      return reply.code(400).send({ error: { code: "CODE_USED_OR_EXPIRED", message: "This reward cannot be claimed." } });
    }
    const { generateRewardCode: generateRewardCode2 } = await Promise.resolve().then(() => (init_crypto(), crypto_exports));
    const { addMinutes: addMinutes2 } = await Promise.resolve().then(() => (init_utils(), utils_exports));
    const { CONSTANTS: CONSTANTS2 } = await Promise.resolve().then(() => (init_constants(), constants_exports));
    const { writeAudit: writeAudit2 } = await Promise.resolve().then(() => (init_audit(), audit_exports));
    const code = generateRewardCode2();
    const codeExpiresAt = addMinutes2(/* @__PURE__ */ new Date(), CONSTANTS2.CLAIM_CODE_TTL_MINUTES);
    await db.update(rewards).set({ status: "claimed", code, codeExpiresAt }).where(eq6(rewards.id, id));
    await writeAudit2(db, {
      actorType: "customer",
      actorId: customerId,
      action: "reward_claim",
      detail: { rewardId: id, shopId: reward.shopId }
    });
    return reply.send({
      ok: true,
      code,
      codeExpiresAt: codeExpiresAt.toISOString(),
      title: reward.title
    });
  });
  app.get("/scratch/:id", async (req, reply) => {
    const session = getSession(req);
    if (!requireAuth(session, reply))
      return;
    const customerId = session.customerId;
    const { id } = req.params;
    const [card] = await db.select().from(scratchCards).where(and5(eq6(scratchCards.id, id), eq6(scratchCards.customerId, customerId))).limit(1);
    if (!card) {
      return reply.code(404).send({ error: { code: "SCRATCH_NOT_FOUND", message: "Scratch card not found." } });
    }
    const isRevealed = !!card.revealedAt;
    if (!isRevealed) {
      return reply.send({ id: card.id, revealed: false, createdAt: card.createdAt });
    }
    const [prize] = await db.select().from(scratchPrizes).where(eq6(scratchPrizes.id, card.prizeId)).limit(1);
    return reply.send({
      id: card.id,
      revealed: true,
      revealedAt: card.revealedAt,
      prize: prize ? { title: prize.title, isNoPrize: prize.isNoPrize } : null,
      rewardId: card.rewardId,
      createdAt: card.createdAt
    });
  });
  app.post("/scratch/:id/reveal", async (req, reply) => {
    const session = getSession(req);
    if (!requireAuth(session, reply))
      return;
    const customerId = session.customerId;
    const { id } = req.params;
    const [card] = await db.select().from(scratchCards).where(and5(eq6(scratchCards.id, id), eq6(scratchCards.customerId, customerId))).limit(1);
    if (!card) {
      return reply.code(404).send({ error: { code: "SCRATCH_NOT_FOUND", message: "Scratch card not found." } });
    }
    if (card.revealedAt) {
      return reply.code(400).send({ error: { code: "SCRATCH_ALREADY_REVEALED", message: "This card has already been revealed." } });
    }
    await db.update(scratchCards).set({ revealedAt: /* @__PURE__ */ new Date() }).where(eq6(scratchCards.id, id));
    const [prize] = await db.select().from(scratchPrizes).where(eq6(scratchPrizes.id, card.prizeId)).limit(1);
    return reply.send({
      ok: true,
      prize: prize ? { title: prize.title, isNoPrize: prize.isNoPrize } : null,
      rewardId: card.rewardId
    });
  });
  app.post("/push/subscribe", async (req, reply) => {
    const session = getSession(req);
    if (!requireAuth(session, reply))
      return;
    const { endpoint, keys } = req.body;
    const { pushSubscriptions: pushSubscriptions2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    const { uuid: uuid2 } = await Promise.resolve().then(() => (init_crypto(), crypto_exports));
    await db.insert(pushSubscriptions2).ignore().values({
      id: uuid2(),
      customerId: session.customerId,
      endpoint,
      keys,
      createdAt: /* @__PURE__ */ new Date()
    });
    return reply.send({ ok: true });
  });
  app.post("/shops/:slug/mute", async (req, reply) => {
    const session = getSession(req);
    if (!requireAuth(session, reply))
      return;
    const { slug } = req.params;
    const [shop] = await db.select().from(shops).where(eq6(shops.slug, slug)).limit(1);
    if (!shop)
      return reply.code(404).send({ error: { code: "SHOP_NOT_FOUND", message: "Shop not found." } });
    const { reminderMutes: reminderMutes2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    await db.insert(reminderMutes2).ignore().values({ customerId: session.customerId, shopId: shop.id });
    return reply.send({ ok: true });
  });
  app.get("/customer/qr-token", async (req, reply) => {
    const session = getSession(req);
    if (!requireAuth(session, reply))
      return;
    const { issueCustomerToken: issueCustomerToken2 } = await Promise.resolve().then(() => (init_token(), token_exports));
    const token = issueCustomerToken2(session.customerId);
    const [customer] = await db.select({ name: customers.name, phone: customers.phone }).from(customers).where(eq6(customers.id, session.customerId)).limit(1);
    return reply.send({
      ok: true,
      token,
      customerId: session.customerId,
      name: customer?.name || "Customer",
      phone: customer?.phone || session.phone
    });
  });
  app.get("/shops/public", async (_req, reply) => {
    const activeShops = await db.select({
      id: shops.id,
      name: shops.name,
      slug: shops.slug,
      lat: shops.lat,
      lng: shops.lng,
      stampsRequired: programs.stampsRequired,
      rewardText: programs.rewardText
    }).from(shops).leftJoin(programs, eq6(shops.id, programs.shopId)).where(eq6(shops.isActive, true));
    return reply.send({ shops: activeShops });
  });
}

// src/routes/shop.ts
import { and as and6, eq as eq7, desc as desc2, gte as gte3, sql as sql4, count as count3 } from "drizzle-orm";
init_schema();
init_token();
init_audit();
import { z as z4 } from "zod";
var ProgramSchema = z4.object({
  stampsRequired: z4.number().int().min(2).max(30),
  rewardText: z4.string().max(256),
  cooldownMinutes: z4.number().int().min(60).max(1440),
  maxStampsPerDay: z4.number().int().min(1).max(10),
  requireApproval: z4.boolean(),
  scratchEnabled: z4.boolean(),
  scratchEveryNVisits: z4.number().int().min(1).max(20),
  prizeExpiryDays: z4.number().int().min(1).max(365)
});
var ScratchPrizeSchema = z4.object({
  id: z4.string().optional(),
  title: z4.string().max(128),
  weight: z4.number().int().min(1),
  stock: z4.number().int().min(0).nullable(),
  isNoPrize: z4.boolean(),
  isActive: z4.boolean()
});
async function shopRoutes(app) {
  const db = getDb();
  async function getShopForSession(req, reply) {
    const session = getSession(req);
    if (!requireRole(session, "shop", reply))
      return null;
    let shopId = session.shopId;
    if (session.role === "admin") {
      const reqAny = req;
      const headerShopId = reqAny.headers?.["x-shop-id"]?.trim();
      const queryShopId = reqAny.query?.shopId?.trim();
      const candidateId = headerShopId || queryShopId || shopId;
      if (candidateId) {
        const [shop2] = await db.select().from(shops).where(eq7(shops.id, candidateId)).limit(1);
        if (shop2)
          return shop2;
      }
      const [firstActive] = await db.select().from(shops).where(eq7(shops.isActive, true)).limit(1);
      if (firstActive)
        return firstActive;
      const [anyShop] = await db.select().from(shops).limit(1);
      if (anyShop)
        return anyShop;
      reply.code(404).send({ error: { code: "NO_SHOPS_EXIST", message: "No shops created yet. Onboard a merchant from the Super Admin portal." } });
      return null;
    }
    if (!shopId) {
      reply.code(403).send({ error: { code: "FORBIDDEN", message: "No shop linked to this account." } });
      return null;
    }
    const [shop] = await db.select().from(shops).where(eq7(shops.id, shopId)).limit(1);
    if (!shop) {
      reply.code(404).send({ error: { code: "SHOP_NOT_FOUND", message: "Shop not found." } });
      return null;
    }
    return shop;
  }
  app.get("/shop/qr-token", async (req, reply) => {
    const shop = await getShopForSession(req, reply);
    if (!shop)
      return;
    const token = issueQrToken(shop.id, shop.qrSecret);
    const qrUrl = `${process.env.BASE_URL}/s/${shop.slug}?t=${token}`;
    return reply.send({ token, qrUrl, shopName: shop.name, shopSlug: shop.slug });
  });
  app.post("/shop/scan-customer", async (req, reply) => {
    const shop = await getShopForSession(req, reply);
    if (!shop)
      return;
    const { token, lat, lng } = req.body;
    if (!token || typeof token !== "string") {
      return reply.code(400).send({ error: { code: "VALIDATION", message: "Customer token is required." } });
    }
    const { verifyCustomerToken: verifyCustomerToken2 } = await Promise.resolve().then(() => (init_token(), token_exports));
    const tokenRes = verifyCustomerToken2(token);
    if (!tokenRes.ok) {
      return reply.code(400).send({
        error: {
          code: tokenRes.code,
          message: tokenRes.code === "TOKEN_EXPIRED" ? "Customer QR expired. Ask customer to refresh their code." : "Invalid customer QR code."
        }
      });
    }
    const { processStamp: processStamp2 } = await Promise.resolve().then(() => (init_stamp(), stamp_exports));
    const result = await processStamp2(db, {
      shopId: shop.id,
      customerId: tokenRes.payload.customerId,
      tokenNonce: tokenRes.payload.nonce,
      lat,
      lng,
      shopLat: shop.lat,
      shopLng: shop.lng,
      ip: req.ip
    });
    if (!result.ok) {
      return reply.code(400).send({
        error: { code: result.code, message: result.code, details: result.details }
      });
    }
    const [customer] = await db.select({ name: customers2.name, phone: customers2.phone }).from(customers2).where(eq7(customers2.id, tokenRes.payload.customerId)).limit(1);
    return reply.send({
      ok: true,
      customerName: customer?.name || "Customer",
      customerPhone: customer?.phone || "",
      stampId: result.stampId,
      status: result.status,
      rewardId: result.rewardId,
      scratchCardId: result.scratchCardId
    });
  });
  app.get("/shop/feed", async (req, reply) => {
    const shop = await getShopForSession(req, reply);
    if (!shop)
      return;
    const { since } = req.query;
    const sinceDate = since ? new Date(since) : new Date(Date.now() - 864e5);
    const events = await db.select({
      id: stampEvents.id,
      customerId: stampEvents.customerId,
      status: stampEvents.status,
      flags: stampEvents.flags,
      voidReason: stampEvents.voidReason,
      createdAt: stampEvents.createdAt,
      customerName: customers2.name,
      customerPhone: customers2.phone
    }).from(stampEvents).leftJoin(customers2, eq7(stampEvents.customerId, customers2.id)).where(and6(eq7(stampEvents.shopId, shop.id), gte3(stampEvents.createdAt, sinceDate))).orderBy(desc2(stampEvents.createdAt)).limit(100);
    return reply.send({ events });
  });
  app.get("/shop/summary", async (req, reply) => {
    const shop = await getShopForSession(req, reply);
    if (!shop)
      return;
    const todayStart = /* @__PURE__ */ new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const [stampsToday] = await db.select({ c: count3() }).from(stampEvents).where(and6(eq7(stampEvents.shopId, shop.id), gte3(stampEvents.createdAt, todayStart), eq7(stampEvents.status, "counted")));
    const [redeemed] = await db.select({ c: count3() }).from(rewards).where(and6(eq7(rewards.shopId, shop.id), eq7(rewards.status, "redeemed"), gte3(rewards.redeemedAt, todayStart)));
    const [scratchWins] = await db.select({ c: count3() }).from(scratchCards).leftJoin(scratchPrizes, eq7(scratchCards.prizeId, scratchPrizes.id)).where(and6(eq7(scratchCards.shopId, shop.id), gte3(scratchCards.createdAt, todayStart), eq7(scratchPrizes.isNoPrize, false)));
    return reply.send({
      shopId: shop.id,
      shopName: shop.name,
      shopSlug: shop.slug,
      stampsToday: stampsToday?.c ?? 0,
      redeemedToday: redeemed?.c ?? 0,
      scratchWinsToday: scratchWins?.c ?? 0
    });
  });
  app.get("/shop/customers", async (req, reply) => {
    const shop = await getShopForSession(req, reply);
    if (!shop)
      return;
    const rows = await db.select({
      customerId: stampEvents.customerId,
      customerName: customers2.name,
      customerPhone: customers2.phone,
      lastVisit: sql4`MAX(${stampEvents.createdAt})`,
      totalStamps: sql4`COUNT(*)`
    }).from(stampEvents).leftJoin(customers2, eq7(stampEvents.customerId, customers2.id)).where(and6(eq7(stampEvents.shopId, shop.id), eq7(stampEvents.status, "counted"))).groupBy(stampEvents.customerId, customers2.name, customers2.phone).orderBy(sql4`MAX(${stampEvents.createdAt}) DESC`);
    return reply.send({ customers: rows });
  });
  app.get("/shop/customers/export.csv", async (req, reply) => {
    const shop = await getShopForSession(req, reply);
    if (!shop)
      return;
    const rows = await db.select({
      customerId: stampEvents.customerId,
      customerName: customers2.name,
      customerPhone: customers2.phone,
      lastVisit: sql4`MAX(${stampEvents.createdAt})`,
      totalStamps: sql4`COUNT(*)`
    }).from(stampEvents).leftJoin(customers2, eq7(stampEvents.customerId, customers2.id)).where(and6(eq7(stampEvents.shopId, shop.id), eq7(stampEvents.status, "counted"))).groupBy(stampEvents.customerId, customers2.name, customers2.phone).orderBy(sql4`MAX(${stampEvents.createdAt}) DESC`);
    function escapeCsv(val) {
      const str = String(val ?? "");
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    }
    const header = ["Customer Name", "Phone", "Total Stamps", "Last Visit (IST)", "Customer ID"].join(",");
    const lines = rows.map((r) => [
      escapeCsv(r.customerName || "Anonymous"),
      escapeCsv(r.customerPhone),
      r.totalStamps,
      escapeCsv(r.lastVisit ? new Date(r.lastVisit).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : ""),
      escapeCsv(r.customerId)
    ].join(","));
    const csvContent = [header, ...lines].join("\r\n");
    const dateStr = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    reply.header("Content-Type", "text/csv; charset=utf-8");
    reply.header("Content-Disposition", `attachment; filename="${shop.slug}-customers-${dateStr}.csv"`);
    return reply.send(csvContent);
  });
  app.post("/shop/redeem", async (req, reply) => {
    const shop = await getShopForSession(req, reply);
    if (!shop)
      return;
    const { code } = req.body;
    if (!code || typeof code !== "string") {
      return reply.code(400).send({ error: { code: "VALIDATION", message: "Code is required." } });
    }
    const now = /* @__PURE__ */ new Date();
    const result = await db.update(rewards).set({ status: "redeemed", redeemedAt: now }).where(
      and6(
        eq7(rewards.code, code.toUpperCase()),
        eq7(rewards.shopId, shop.id),
        eq7(rewards.status, "claimed"),
        gte3(rewards.codeExpiresAt, now)
      )
    );
    const affected = result[0]?.affectedRows ?? 0;
    if (affected === 0) {
      return reply.code(400).send({ error: { code: "CODE_USED_OR_EXPIRED", message: "Code already used or expired." } });
    }
    const [reward] = await db.select().from(rewards).where(and6(eq7(rewards.code, code.toUpperCase()), eq7(rewards.shopId, shop.id))).limit(1);
    await writeAudit(db, {
      actorType: "shop",
      actorId: shop.id,
      action: "redeem",
      detail: { code, rewardId: reward?.id }
    });
    return reply.send({ ok: true, reward });
  });
  app.post("/shop/stamps/:id/approve", async (req, reply) => {
    const shop = await getShopForSession(req, reply);
    if (!shop)
      return;
    const { id } = req.params;
    const result = await db.update(stampEvents).set({ status: "counted" }).where(and6(eq7(stampEvents.id, id), eq7(stampEvents.shopId, shop.id), eq7(stampEvents.status, "pending")));
    const affected = result[0]?.affectedRows ?? 0;
    if (affected === 0) {
      return reply.code(404).send({ error: { code: "CODE_NOT_FOUND", message: "Stamp not found or already processed." } });
    }
    await writeAudit(db, { actorType: "shop", actorId: shop.id, action: "stamp_approve", detail: { stampId: id } });
    return reply.send({ ok: true });
  });
  app.post("/shop/stamps/:id/void", async (req, reply) => {
    const shop = await getShopForSession(req, reply);
    if (!shop)
      return;
    const { id } = req.params;
    const { reason } = req.body;
    const result = await db.update(stampEvents).set({ status: "voided", voidReason: reason ?? "No reason given" }).where(
      and6(
        eq7(stampEvents.id, id),
        eq7(stampEvents.shopId, shop.id),
        eq7(stampEvents.status, "counted")
      )
    );
    const affected = result[0]?.affectedRows ?? 0;
    if (affected === 0) {
      return reply.code(404).send({ error: { code: "CODE_NOT_FOUND", message: "Stamp not found." } });
    }
    await writeAudit(db, { actorType: "shop", actorId: shop.id, action: "stamp_void", detail: { stampId: id, reason } });
    return reply.send({ ok: true });
  });
  app.get("/shop/program", async (req, reply) => {
    const shop = await getShopForSession(req, reply);
    if (!shop)
      return;
    const [prog] = await db.select().from(programs).where(eq7(programs.shopId, shop.id)).limit(1);
    return reply.send({ program: prog ?? null });
  });
  app.put("/shop/program", async (req, reply) => {
    const shop = await getShopForSession(req, reply);
    if (!shop)
      return;
    const body = ProgramSchema.safeParse(req.body);
    if (!body.success) {
      return reply.code(400).send({ error: { code: "VALIDATION", message: "Invalid program data.", details: body.error.flatten() } });
    }
    const [existing] = await db.select().from(programs).where(eq7(programs.shopId, shop.id)).limit(1);
    const { uuid: uuid2 } = await Promise.resolve().then(() => (init_crypto(), crypto_exports));
    if (existing) {
      await db.update(programs).set(body.data).where(eq7(programs.id, existing.id));
    } else {
      await db.insert(programs).values({ id: uuid2(), shopId: shop.id, ...body.data });
    }
    await writeAudit(db, { actorType: "shop", actorId: shop.id, action: "program_update", detail: body.data });
    return reply.send({ ok: true });
  });
  app.get("/shop/scratch-prizes", async (req, reply) => {
    const shop = await getShopForSession(req, reply);
    if (!shop)
      return;
    const prizes = await db.select().from(scratchPrizes).where(eq7(scratchPrizes.shopId, shop.id));
    const total = prizes.reduce((s, p) => s + (p.isActive ? p.weight : 0), 0);
    const enriched = prizes.map((p) => ({
      ...p,
      percentage: total > 0 && p.isActive ? Math.round(p.weight / total * 1e3) / 10 : 0
    }));
    return reply.send({ prizes: enriched });
  });
  app.put("/shop/scratch-prizes", async (req, reply) => {
    const shop = await getShopForSession(req, reply);
    if (!shop)
      return;
    const body = z4.array(ScratchPrizeSchema).safeParse(req.body);
    if (!body.success) {
      return reply.code(400).send({ error: { code: "VALIDATION", message: "Invalid prize data." } });
    }
    const { uuid: uuid2 } = await Promise.resolve().then(() => (init_crypto(), crypto_exports));
    await db.transaction(async (tx) => {
      for (const prize of body.data) {
        if (prize.id) {
          await tx.update(scratchPrizes).set({ title: prize.title, weight: prize.weight, stock: prize.stock, isNoPrize: prize.isNoPrize, isActive: prize.isActive }).where(and6(eq7(scratchPrizes.id, prize.id), eq7(scratchPrizes.shopId, shop.id)));
        } else {
          await tx.insert(scratchPrizes).values({
            id: uuid2(),
            shopId: shop.id,
            title: prize.title,
            weight: prize.weight,
            stock: prize.stock,
            isNoPrize: prize.isNoPrize,
            isActive: prize.isActive
          });
        }
      }
    });
    return reply.send({ ok: true });
  });
}

// src/routes/admin.ts
import { and as and7, eq as eq8, desc as desc3, sql as sql5, count as count4, gte as gte4 } from "drizzle-orm";
import { z as z5 } from "zod";
init_schema();
init_crypto();
init_audit();
import crypto2 from "node:crypto";
var CreateShopBody = z5.object({
  slug: z5.string().min(2).max(64).regex(/^[a-z0-9-]+$/),
  name: z5.string().min(1).max(128),
  ownerPhone: z5.string().min(10).max(20),
  lat: z5.number().optional(),
  lng: z5.number().optional(),
  stampsRequired: z5.number().int().min(2).max(30).optional(),
  rewardText: z5.string().max(256).optional(),
  cooldownMinutes: z5.number().int().min(0).max(1440).optional(),
  maxStampsPerDay: z5.number().int().min(1).max(20).optional(),
  scratchEnabled: z5.boolean().optional()
});
var UpdateShopBody = z5.object({
  slug: z5.string().min(2).max(64).regex(/^[a-z0-9-]+$/).optional(),
  name: z5.string().min(1).max(128).optional(),
  ownerPhone: z5.string().min(10).max(20).optional(),
  lat: z5.number().optional(),
  lng: z5.number().optional(),
  isActive: z5.boolean().optional(),
  stampsRequired: z5.number().int().min(2).max(30).optional(),
  rewardText: z5.string().max(256).optional(),
  cooldownMinutes: z5.number().int().min(0).max(1440).optional(),
  maxStampsPerDay: z5.number().int().min(1).max(20).optional(),
  scratchEnabled: z5.boolean().optional()
});
async function adminRoutes(app) {
  const db = getDb();
  app.post("/admin/shops", async (req, reply) => {
    const session = getSession(req);
    if (!requireRole(session, "admin", reply))
      return;
    const body = CreateShopBody.safeParse(req.body);
    if (!body.success) {
      return reply.code(400).send({ error: { code: "VALIDATION", message: "Invalid shop data.", details: body.error.flatten() } });
    }
    const { normalizePhone: normalizePhone2 } = await Promise.resolve().then(() => (init_utils(), utils_exports));
    const phone = normalizePhone2(body.data.ownerPhone);
    const qrSecret = crypto2.randomBytes(32);
    const shopId = uuid();
    await db.insert(shops).values({
      id: shopId,
      slug: body.data.slug,
      name: body.data.name,
      ownerPhone: phone,
      lat: body.data.lat,
      lng: body.data.lng,
      qrSecret,
      isActive: true,
      createdAt: /* @__PURE__ */ new Date()
    });
    await db.insert(programs).values({
      id: uuid(),
      shopId,
      stampsRequired: body.data.stampsRequired ?? 6,
      rewardText: body.data.rewardText || "Free item or reward of your choice",
      cooldownMinutes: body.data.cooldownMinutes ?? 60,
      maxStampsPerDay: body.data.maxStampsPerDay ?? 2,
      requireApproval: false,
      scratchEnabled: body.data.scratchEnabled ?? true,
      scratchEveryNVisits: 1,
      prizeExpiryDays: 30
    });
    await db.insert(scratchPrizes).values([
      {
        id: uuid(),
        shopId,
        title: "15% Off Your Next Order",
        weight: 50,
        stock: null,
        isNoPrize: false,
        isActive: true
      },
      {
        id: uuid(),
        shopId,
        title: "Free Treat / Special Perk",
        weight: 30,
        stock: 50,
        isNoPrize: false,
        isActive: true
      },
      {
        id: uuid(),
        shopId,
        title: "Better luck next visit!",
        weight: 20,
        stock: null,
        isNoPrize: true,
        isActive: true
      }
    ]);
    await writeAudit(db, {
      actorType: "admin",
      actorId: session.customerId,
      action: "shop_create",
      detail: { shopId, slug: body.data.slug, name: body.data.name }
    });
    return reply.code(201).send({ ok: true, shopId });
  });
  app.get("/admin/shops/:id", async (req, reply) => {
    const session = getSession(req);
    if (!requireRole(session, "admin", reply))
      return;
    const { id } = req.params;
    const [shop] = await db.select().from(shops).where(eq8(shops.id, id)).limit(1);
    if (!shop)
      return reply.code(404).send({ error: { code: "NOT_FOUND", message: "Shop not found." } });
    const [prog] = await db.select().from(programs).where(eq8(programs.shopId, id)).limit(1);
    const prizes = await db.select().from(scratchPrizes).where(eq8(scratchPrizes.shopId, id));
    const [memberCountRow] = await db.select({ c: sql5`COUNT(DISTINCT ${stampEvents.customerId})` }).from(stampEvents).where(and7(eq8(stampEvents.shopId, id), eq8(stampEvents.status, "counted")));
    const [stampsCountRow] = await db.select({ c: count4() }).from(stampEvents).where(and7(eq8(stampEvents.shopId, id), eq8(stampEvents.status, "counted")));
    return reply.send({
      shop,
      program: prog,
      scratchPrizes: prizes,
      memberCount: Number(memberCountRow?.c ?? 0),
      totalStamps: Number(stampsCountRow?.c ?? 0)
    });
  });
  app.put("/admin/shops/:id", async (req, reply) => {
    const session = getSession(req);
    if (!requireRole(session, "admin", reply))
      return;
    const { id } = req.params;
    const [shop] = await db.select().from(shops).where(eq8(shops.id, id)).limit(1);
    if (!shop)
      return reply.code(404).send({ error: { code: "NOT_FOUND", message: "Shop not found." } });
    const body = UpdateShopBody.safeParse(req.body);
    if (!body.success) {
      return reply.code(400).send({ error: { code: "VALIDATION", message: "Invalid data.", details: body.error.flatten() } });
    }
    const { normalizePhone: normalizePhone2 } = await Promise.resolve().then(() => (init_utils(), utils_exports));
    const shopUpdates = {};
    if (body.data.name)
      shopUpdates.name = body.data.name;
    if (body.data.slug)
      shopUpdates.slug = body.data.slug;
    if (body.data.ownerPhone)
      shopUpdates.ownerPhone = normalizePhone2(body.data.ownerPhone);
    if (body.data.lat !== void 0)
      shopUpdates.lat = body.data.lat;
    if (body.data.lng !== void 0)
      shopUpdates.lng = body.data.lng;
    if (body.data.isActive !== void 0)
      shopUpdates.isActive = body.data.isActive;
    if (Object.keys(shopUpdates).length > 0) {
      await db.update(shops).set(shopUpdates).where(eq8(shops.id, id));
    }
    const progUpdates = {};
    if (body.data.stampsRequired !== void 0)
      progUpdates.stampsRequired = body.data.stampsRequired;
    if (body.data.rewardText !== void 0)
      progUpdates.rewardText = body.data.rewardText;
    if (body.data.cooldownMinutes !== void 0)
      progUpdates.cooldownMinutes = body.data.cooldownMinutes;
    if (body.data.maxStampsPerDay !== void 0)
      progUpdates.maxStampsPerDay = body.data.maxStampsPerDay;
    if (body.data.scratchEnabled !== void 0)
      progUpdates.scratchEnabled = body.data.scratchEnabled;
    if (Object.keys(progUpdates).length > 0) {
      await db.update(programs).set(progUpdates).where(eq8(programs.shopId, id));
    }
    await writeAudit(db, {
      actorType: "admin",
      actorId: session.customerId,
      action: "shop_update",
      detail: { shopId: id, updates: body.data }
    });
    return reply.send({ ok: true });
  });
  app.delete("/admin/shops/:id", async (req, reply) => {
    const session = getSession(req);
    if (!requireRole(session, "admin", reply))
      return;
    const { id } = req.params;
    const [shop] = await db.select().from(shops).where(eq8(shops.id, id)).limit(1);
    if (!shop)
      return reply.code(404).send({ error: { code: "NOT_FOUND", message: "Shop not found." } });
    await db.delete(scratchCards).where(eq8(scratchCards.shopId, id));
    await db.delete(scratchPrizes).where(eq8(scratchPrizes.shopId, id));
    await db.delete(rewards).where(eq8(rewards.shopId, id));
    await db.delete(stampEvents).where(eq8(stampEvents.shopId, id));
    await db.delete(programs).where(eq8(programs.shopId, id));
    await db.delete(reminders).where(eq8(reminders.shopId, id));
    await db.delete(reminderMutes).where(eq8(reminderMutes.shopId, id));
    await db.delete(shops).where(eq8(shops.id, id));
    await writeAudit(db, {
      actorType: "admin",
      actorId: session.customerId,
      action: "shop_delete",
      detail: { shopId: id, shopName: shop.name }
    });
    return reply.send({ ok: true });
  });
  app.get("/admin/stats", async (req, reply) => {
    const session = getSession(req);
    if (!requireRole(session, "admin", reply))
      return;
    const todayStart = /* @__PURE__ */ new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const [totalShopsRow] = await db.select({ c: count4() }).from(shops);
    const [activeShopsRow] = await db.select({ c: count4() }).from(shops).where(eq8(shops.isActive, true));
    const [totalCustomersRow] = await db.select({ c: count4() }).from(customers2);
    const [stampsTodayRow] = await db.select({ c: count4() }).from(stampEvents).where(and7(gte4(stampEvents.createdAt, todayStart), eq8(stampEvents.status, "counted")));
    const [redeemedTodayRow] = await db.select({ c: count4() }).from(rewards).where(and7(gte4(rewards.redeemedAt, todayStart), eq8(rewards.status, "redeemed")));
    return reply.send({
      totalShops: totalShopsRow?.c ?? 0,
      activeShops: activeShopsRow?.c ?? 0,
      totalCustomers: totalCustomersRow?.c ?? 0,
      stampsToday: stampsTodayRow?.c ?? 0,
      redeemedToday: redeemedTodayRow?.c ?? 0
    });
  });
  app.get("/admin/shops", async (req, reply) => {
    const session = getSession(req);
    if (!requireRole(session, "admin", reply))
      return;
    const allShops = await db.select().from(shops).orderBy(desc3(shops.createdAt));
    const enriched = await Promise.all(
      allShops.map(async (s) => {
        const [prog] = await db.select().from(programs).where(eq8(programs.shopId, s.id)).limit(1);
        const [memberCountRow] = await db.select({ c: sql5`COUNT(DISTINCT ${stampEvents.customerId})` }).from(stampEvents).where(and7(eq8(stampEvents.shopId, s.id), eq8(stampEvents.status, "counted")));
        const [stampsCountRow] = await db.select({ c: count4() }).from(stampEvents).where(and7(eq8(stampEvents.shopId, s.id), eq8(stampEvents.status, "counted")));
        return {
          id: s.id,
          slug: s.slug,
          name: s.name,
          ownerPhone: s.ownerPhone,
          lat: s.lat,
          lng: s.lng,
          isActive: s.isActive,
          createdAt: s.createdAt,
          memberCount: Number(memberCountRow?.c ?? 0),
          totalStamps: Number(stampsCountRow?.c ?? 0),
          program: prog ? {
            stampsRequired: prog.stampsRequired,
            rewardText: prog.rewardText,
            scratchEnabled: prog.scratchEnabled
          } : null
        };
      })
    );
    return reply.send({ shops: enriched });
  });
  app.post("/admin/impersonate/:shopId", async (req, reply) => {
    const session = getSession(req);
    if (!requireRole(session, "admin", reply))
      return;
    const { shopId } = req.params;
    const [shop] = await db.select().from(shops).where(eq8(shops.id, shopId)).limit(1);
    if (!shop) {
      return reply.code(404).send({ error: { code: "NOT_FOUND", message: "Shop not found." } });
    }
    setSessionCookie(reply, {
      ...session,
      shopId: shop.id
    });
    await writeAudit(db, {
      actorType: "admin",
      actorId: session.customerId,
      action: "shop_impersonate",
      detail: { shopId: shop.id, shopName: shop.name, shopSlug: shop.slug }
    });
    return reply.send({ ok: true, shop: { id: shop.id, name: shop.name, slug: shop.slug } });
  });
  app.post("/admin/exit-impersonate", async (req, reply) => {
    const session = getSession(req);
    if (!requireRole(session, "admin", reply))
      return;
    setSessionCookie(reply, {
      ...session,
      shopId: void 0
    });
    return reply.send({ ok: true });
  });
  app.post("/admin/shops/:id/activate", async (req, reply) => {
    const session = getSession(req);
    if (!requireRole(session, "admin", reply))
      return;
    const { id } = req.params;
    await db.update(shops).set({ isActive: true }).where(eq8(shops.id, id));
    await writeAudit(db, {
      actorType: "admin",
      actorId: session.customerId,
      action: "shop_activate",
      detail: { shopId: id }
    });
    return reply.send({ ok: true });
  });
  app.post("/admin/shops/:id/deactivate", async (req, reply) => {
    const session = getSession(req);
    if (!requireRole(session, "admin", reply))
      return;
    const { id } = req.params;
    await db.update(shops).set({ isActive: false }).where(eq8(shops.id, id));
    await writeAudit(db, {
      actorType: "admin",
      actorId: session.customerId,
      action: "shop_deactivate",
      detail: { shopId: id }
    });
    return reply.send({ ok: true });
  });
  app.get("/admin/flags", async (req, reply) => {
    const session = getSession(req);
    if (!requireRole(session, "admin", reply))
      return;
    const flagged = await db.select().from(stampEvents).where(
      sql5`JSON_LENGTH(${stampEvents.flags}) > 0`
    ).orderBy(desc3(stampEvents.createdAt)).limit(200);
    return reply.send({ flags: flagged });
  });
}

// src/routes/cron.ts
init_env();

// src/services/reminder.ts
init_schema();
import { and as and9, eq as eq10, isNull as isNull4, lte, sql as sql6, count as count5, gte as gte5, desc as desc4 } from "drizzle-orm";

// src/services/push.ts
init_schema();
init_env();
import webpush from "web-push";
import { eq as eq9 } from "drizzle-orm";
if (env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    `mailto:admin@stamp.app`,
    env.VAPID_PUBLIC_KEY,
    env.VAPID_PRIVATE_KEY
  );
}
async function sendPushToCustomer(db, customerId, payload) {
  if (!env.VAPID_PUBLIC_KEY)
    return;
  const subs = await db.select().from(pushSubscriptions).where(eq9(pushSubscriptions.customerId, customerId));
  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: sub.keys },
        JSON.stringify(payload)
      );
    } catch (err) {
      const status = err.statusCode;
      if (status === 410 || status === 404) {
        await db.delete(pushSubscriptions).where(eq9(pushSubscriptions.id, sub.id));
      }
    }
  }
}

// src/services/reminder.ts
init_utils();
init_constants();
init_crypto();
function isQuietHourIST(hour = currentHourIST()) {
  return hour >= CONSTANTS.QUIET_START_HOUR_IST || hour < CONSTANTS.QUIET_END_HOUR_IST;
}
async function canSendReminder(db, customerId, shopId, now = /* @__PURE__ */ new Date()) {
  const [muted] = await db.select().from(reminderMutes).where(and9(eq10(reminderMutes.customerId, customerId), eq10(reminderMutes.shopId, shopId))).limit(1);
  if (muted)
    return false;
  const threeDaysAgo = addDays(now, -CONSTANTS.REMINDER_MIN_INTERVAL_DAYS);
  const [recentSent] = await db.select({ c: count5() }).from(reminders).where(
    and9(
      eq10(reminders.customerId, customerId),
      eq10(reminders.shopId, shopId),
      gte5(reminders.sentAt, threeDaysAgo)
    )
  );
  if ((recentSent?.c ?? 0) > 0)
    return false;
  const [lastEvent] = await db.select({ createdAt: stampEvents.createdAt }).from(stampEvents).where(and9(eq10(stampEvents.customerId, customerId), eq10(stampEvents.shopId, shopId))).orderBy(desc4(stampEvents.createdAt)).limit(1);
  const ignoredQuery = db.select({ c: count5() }).from(reminders).where(
    and9(
      eq10(reminders.customerId, customerId),
      eq10(reminders.shopId, shopId),
      sql6`${reminders.sentAt} IS NOT NULL`,
      lastEvent ? gte5(reminders.sentAt, lastEvent.createdAt) : sql6`1=1`
    )
  );
  const [ignored] = await ignoredQuery;
  if ((ignored?.c ?? 0) >= CONSTANTS.REMINDER_MAX_IGNORED)
    return false;
  return true;
}
async function processReminders(db, now = /* @__PURE__ */ new Date()) {
  const hour = currentHourIST();
  if (isQuietHourIST(hour)) {
    return { sent: 0, skipped: "quiet_hours" };
  }
  const threeDaysAgo = addDays(now, -3);
  const tenDaysAgo = addDays(now, -10);
  const unclaimedRewards = await db.select().from(rewards).where(and9(eq10(rewards.status, "earned"), lte(rewards.createdAt, threeDaysAgo)));
  for (const reward of unclaimedRewards) {
    const ageDays = (now.getTime() - reward.createdAt.getTime()) / 864e5;
    if (ageDays >= 3 && ageDays < 15) {
      const [existing] = await db.select().from(reminders).where(
        and9(
          eq10(reminders.customerId, reward.customerId),
          eq10(reminders.shopId, reward.shopId),
          eq10(reminders.kind, "reward_ready"),
          gte5(reminders.sendAfter, reward.createdAt)
        )
      ).limit(1);
      if (!existing) {
        await db.insert(reminders).values({
          id: uuid(),
          customerId: reward.customerId,
          shopId: reward.shopId,
          kind: "reward_ready",
          sendAfter: now
        });
      }
    }
  }
  const inThreeDays = addDays(now, 3);
  const expiringRewards = await db.select().from(rewards).where(
    and9(
      eq10(rewards.status, "earned"),
      eq10(rewards.source, "scratch"),
      sql6`${rewards.expiresAt} IS NOT NULL`,
      lte(rewards.expiresAt, inThreeDays),
      gte5(rewards.expiresAt, now)
    )
  );
  for (const exp of expiringRewards) {
    const [existing] = await db.select().from(reminders).where(
      and9(
        eq10(reminders.customerId, exp.customerId),
        eq10(reminders.shopId, exp.shopId),
        eq10(reminders.kind, "prize_expiring")
      )
    ).limit(1);
    if (!existing) {
      await db.insert(reminders).values({
        id: uuid(),
        customerId: exp.customerId,
        shopId: exp.shopId,
        kind: "prize_expiring",
        sendAfter: now
      });
    }
  }
  const due = await db.select().from(reminders).where(and9(isNull4(reminders.sentAt), isNull4(reminders.cancelledAt), lte(reminders.sendAfter, now))).limit(100);
  let sent = 0;
  for (const r of due) {
    const allowed = await canSendReminder(db, r.customerId, r.shopId, now);
    if (!allowed) {
      await db.update(reminders).set({ cancelledAt: now }).where(eq10(reminders.id, r.id));
      continue;
    }
    const [shop] = await db.select({ name: shops.name }).from(shops).where(eq10(shops.id, r.shopId)).limit(1);
    const shopName = shop?.name ?? "the shop";
    let title = "Stamp";
    let body = "";
    switch (r.kind) {
      case "reward_ready":
        title = "Reward waiting!";
        body = `Your reward is waiting at ${shopName}. Claim it!`;
        break;
      case "one_to_go":
        title = "Almost there!";
        body = `One more stamp and you get a reward at ${shopName}.`;
        break;
      case "win_back":
        title = "We miss you!";
        body = `It has been a while. Come back to ${shopName} for a stamp.`;
        break;
      case "prize_expiring":
        title = "Prize expiring soon!";
        body = `Your prize at ${shopName} expires in 3 days.`;
        break;
    }
    await sendPushToCustomer(db, r.customerId, { title, body });
    await db.update(reminders).set({ sentAt: now }).where(eq10(reminders.id, r.id));
    sent++;
  }
  return { sent };
}

// src/routes/contact.ts
init_schema();
import { z as z6 } from "zod";
import { randomUUID, createHash } from "node:crypto";
import { sql as sql7 } from "drizzle-orm";
init_utils();
init_env();
var contactSchema = z6.object({
  name: z6.string().min(2).max(80),
  phone: z6.string().min(10).max(20),
  shopName: z6.string().max(100).optional(),
  city: z6.string().max(80).optional(),
  email: z6.string().email().optional().or(z6.literal("")),
  topic: z6.enum(["pilot", "question", "data_request", "grievance"]),
  preferredChannel: z6.enum(["whatsapp", "call", "email"]),
  message: z6.string().max(1e3).optional(),
  consent: z6.literal(true),
  website: z6.string().max(0),
  // honeypot — must be empty
  startedAt: z6.string().datetime()
});
function hashIp(ip) {
  return createHash("sha256").update(ip).digest("hex");
}
async function contactRoutes(app) {
  const db = getDb();
  app.post("/public/contact", async (request, reply) => {
    const siteOrigin = env.SITE_ORIGIN || "";
    if (siteOrigin) {
      reply.header("Access-Control-Allow-Origin", siteOrigin);
      reply.header("Access-Control-Allow-Methods", "POST, OPTIONS");
      reply.header("Access-Control-Allow-Headers", "Content-Type");
    }
    const parsed = contactSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        ok: false,
        error: "VALIDATION",
        details: parsed.error.flatten().fieldErrors
      });
    }
    const data = parsed.data;
    const startedAt = new Date(data.startedAt);
    const elapsed = Date.now() - startedAt.getTime();
    if (elapsed < 3e3) {
      return reply.status(201).send({ ok: true });
    }
    const ip = (request.ip || "").split(",")[0].trim();
    const ipHashed = hashIp(ip);
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1e3);
    const [countResult] = await db.select({ count: sql7`COUNT(*)` }).from(contactRequests).where(
      sql7`${contactRequests.ipHash} = ${ipHashed} AND ${contactRequests.createdAt} > ${oneHourAgo}`
    );
    if ((countResult?.count ?? 0) >= 5) {
      return reply.status(429).send({
        ok: false,
        error: "RATE_LIMITED",
        message: "Too many requests. Please try again later."
      });
    }
    const normalisedPhone = normalizePhone(data.phone);
    const id = randomUUID();
    await db.insert(contactRequests).values({
      id,
      name: data.name,
      phone: normalisedPhone,
      email: data.email || null,
      shopName: data.shopName || null,
      city: data.city || null,
      topic: data.topic,
      preferredChannel: data.preferredChannel,
      message: data.message || null,
      consentAt: /* @__PURE__ */ new Date(),
      ipHash: ipHashed
    });
    try {
      const { sendContactNotification: sendContactNotification2 } = await Promise.resolve().then(() => (init_contact_email(), contact_email_exports));
      await sendContactNotification2({
        id,
        name: data.name,
        phone: normalisedPhone,
        email: data.email,
        shopName: data.shopName,
        city: data.city,
        topic: data.topic,
        preferredChannel: data.preferredChannel,
        message: data.message
      });
    } catch (emailErr) {
      request.log.error({ err: emailErr }, "Failed to send contact notification email");
    }
    return reply.status(201).send({ ok: true });
  });
  app.options("/public/contact", async (_request, reply) => {
    const siteOrigin = env.SITE_ORIGIN || "";
    if (siteOrigin) {
      reply.header("Access-Control-Allow-Origin", siteOrigin);
      reply.header("Access-Control-Allow-Methods", "POST, OPTIONS");
      reply.header("Access-Control-Allow-Headers", "Content-Type");
    }
    return reply.status(204).send();
  });
}
async function cleanupOldContactRequests() {
  const db = getDb();
  const cutoff = new Date(Date.now() - 365 * 24 * 60 * 60 * 1e3);
  const result = await db.delete(contactRequests).where(sql7`${contactRequests.createdAt} < ${cutoff}`);
  return result[0]?.affectedRows ?? 0;
}

// src/routes/cron.ts
async function cronRoutes(app) {
  const db = getDb();
  app.post("/internal/cron/reminders", async (req, reply) => {
    const secret = req.headers["x-cron-secret"];
    if (secret !== env.CRON_SECRET) {
      return reply.code(401).send({ error: { code: "FORBIDDEN", message: "Invalid cron secret." } });
    }
    const reminderResult = await processReminders(db);
    const cleanedContacts = await cleanupOldContactRequests();
    return reply.send({ ok: true, ...reminderResult, cleanedContacts });
  });
}

// src/index.ts
var __dirname = dirname(fileURLToPath(import.meta.url));
async function start() {
  const app = Fastify({
    logger: { level: env.NODE_ENV === "production" ? "info" : "debug" },
    trustProxy: true
  });
  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "blob:"],
        connectSrc: ["'self'"],
        workerSrc: ["'self'", "blob:"]
      }
    }
  });
  await app.register(cookie, { secret: env.SESSION_SECRET });
  await app.register(rateLimit, {
    global: false,
    max: 300,
    timeWindow: "1 minute",
    errorResponseBuilder: () => ({
      error: { code: "RATE_LIMITED", message: "Too many requests. Wait a moment and try again." }
    })
  });
  await app.register(
    async (api) => {
      await authRoutes(api);
      await scanRoutes(api);
      await customerRoutes(api);
      await shopRoutes(api);
      await adminRoutes(api);
      await cronRoutes(api);
      await contactRoutes(api);
      api.get("/health", async () => ({
        ok: true,
        ts: (/* @__PURE__ */ new Date()).toISOString(),
        env: env.NODE_ENV
      }));
    },
    { prefix: "/api" }
  );
  app.get("/health", async () => ({
    ok: true,
    status: "healthy",
    db: dbReady ? "configured" : "missing-DATABASE_URL",
    ts: (/* @__PURE__ */ new Date()).toISOString()
  }));
  const siteDist = existsSync(join(process.cwd(), "site/dist")) ? join(process.cwd(), "site/dist") : join(__dirname, "../../site/dist");
  const webDist = existsSync(join(process.cwd(), "web/dist")) ? join(process.cwd(), "web/dist") : join(__dirname, "../../web/dist");
  if (existsSync(siteDist)) {
    await app.register(fastifyStatic, {
      root: siteDist,
      prefix: "/",
      index: ["index.html"],
      decorateReply: true
    });
    const pages = ["about", "contact", "privacy-policy", "terms-and-conditions", "refund-policy"];
    for (const p of pages) {
      app.get(`/${p}`, async (_req, reply) => {
        return reply.type("text/html; charset=utf-8").sendFile(`${p}/index.html`, siteDist);
      });
      app.get(`/${p}/`, async (_req, reply) => {
        return reply.type("text/html; charset=utf-8").sendFile(`${p}/index.html`, siteDist);
      });
    }
  }
  if (existsSync(webDist)) {
    await app.register(fastifyStatic, {
      root: webDist,
      prefix: "/assets/",
      decorateReply: false
    });
  }
  app.get("/login", async (_req, reply) => {
    return reply.redirect("/sign-in");
  });
  app.setNotFoundHandler((req, reply) => {
    const rawUrl = (req.raw.url || "/").split("?")[0];
    if (rawUrl.startsWith("/api")) {
      return reply.code(404).send({ error: { code: "NOT_FOUND", message: "API endpoint not found." } });
    }
    if (rawUrl === "/login" || rawUrl === "/login/") {
      return reply.redirect("/sign-in");
    }
    if (existsSync(webDist)) {
      const webFile = join(webDist, rawUrl.slice(1));
      if (existsSync(webFile) && !rawUrl.endsWith("/")) {
        return reply.sendFile(rawUrl.slice(1), webDist);
      }
      return reply.type("text/html; charset=utf-8").sendFile("index.html", webDist);
    }
    reply.code(404).send({ error: { code: "NOT_FOUND", message: "Not found." } });
  });
  const portOrSocket = resolvePort();
  console.log(`\u{1F680} Starting Stamp \u2014 PORT env="${process.env.PORT || env.PORT}" resolved="${portOrSocket}" db=${dbReady ? "ready" : "NOT SET"}`);
  try {
    if (typeof portOrSocket === "string" && isNaN(Number(portOrSocket))) {
      await app.listen({ path: portOrSocket });
      console.log(`\u2705 Stamp server listening on socket ${portOrSocket}`);
    } else {
      const port = typeof portOrSocket === "number" ? portOrSocket : parseInt(portOrSocket, 10) || 3e3;
      try {
        await app.listen({ port, host: "0.0.0.0" });
        console.log(`\u2705 Stamp server listening on 0.0.0.0:${port}`);
      } catch {
        await app.listen({ port });
        console.log(`\u2705 Stamp server listening on port ${port}`);
      }
    }
  } catch (err) {
    app.log.error(err);
    console.error("\u274C Fastify app.listen failed:", err);
    process.exit(1);
  }
  return app;
}
start().catch((err) => {
  console.error("\u274C Fatal error during server startup:", err);
  process.exit(1);
});
export {
  start
};
