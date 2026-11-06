import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { randomBytes } from 'node:crypto';
import { env, dbReady } from '../lib/env.ts';
import * as schema from './schema.ts';

let _pool: mysql.Pool | null = null;
let _tablesEnsured = false;

const TABLE_DEFINITIONS = [
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

export async function ensureTables(pool: mysql.Pool) {
  if (_tablesEnsured || !dbReady) return;
  _tablesEnsured = true;
  try {
    for (const sql of TABLE_DEFINITIONS) {
      await pool.query(sql);
    }
    console.log('✅ MySQL schema verified: All 13 tables ready.');
    await ensureSeed(pool);
  } catch (err) {
    console.error('⚠️ Failed to ensure MySQL tables:', err);
    _tablesEnsured = false;
  }
}

async function ensureSeed(pool: mysql.Pool) {
  try {
    const [rows] = await pool.query('SELECT COUNT(*) as cnt FROM `shops`');
    const count = (rows as any)?.[0]?.cnt ?? 0;
    if (count === 0) {
      console.log('🌱 Seeding initial demo merchants for multi-merchant management...');
      const secret1 = randomBytes(32);
      const secret2 = randomBytes(32);

      const shop1Id = '01a10000-0000-0000-0000-000000000001';
      const prog1Id = '01a10000-0000-0000-0000-000000000002';
      await pool.query(
        'INSERT INTO `shops` (`id`, `slug`, `name`, `owner_phone`, `lat`, `lng`, `qr_secret`, `is_active`) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [shop1Id, 'metro-cafe', 'Metro Cafe & Bakery', '+919029999614', 19.0760, 72.8777, secret1, 1],
      );
      await pool.query(
        'INSERT INTO `programs` (`id`, `shop_id`, `stamps_required`, `reward_text`, `cooldown_minutes`, `max_stamps_per_day`, `scratch_enabled`, `scratch_every_n_visits`, `prize_expiry_days`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [prog1Id, shop1Id, 6, 'Free Artisanal Beverage or Croissant', 60, 2, 1, 1, 30],
      );
      await pool.query(
        'INSERT INTO `scratch_prizes` (`id`, `shop_id`, `title`, `weight`, `stock`, `is_no_prize`, `is_active`) VALUES (?, ?, ?, ?, ?, ?, ?)',
        ['01a10000-0000-0000-0000-000000000003', shop1Id, '15% Off Total Bill', 50, null, 0, 1],
      );
      await pool.query(
        'INSERT INTO `scratch_prizes` (`id`, `shop_id`, `title`, `weight`, `stock`, `is_no_prize`, `is_active`) VALUES (?, ?, ?, ?, ?, ?, ?)',
        ['01a10000-0000-0000-0000-000000000004', shop1Id, 'Free Cookie on ₹200+ Order', 30, 50, 0, 1],
      );
      await pool.query(
        'INSERT INTO `scratch_prizes` (`id`, `shop_id`, `title`, `weight`, `stock`, `is_no_prize`, `is_active`) VALUES (?, ?, ?, ?, ?, ?, ?)',
        ['01a10000-0000-0000-0000-000000000005', shop1Id, 'Better luck next visit!', 20, null, 1, 1],
      );

      const shop2Id = '01a10000-0000-0000-0000-000000000010';
      const prog2Id = '01a10000-0000-0000-0000-000000000011';
      await pool.query(
        'INSERT INTO `shops` (`id`, `slug`, `name`, `owner_phone`, `lat`, `lng`, `qr_secret`, `is_active`) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [shop2Id, 'urban-salon', 'Urban Cuts & Spa', '+919820099999', 19.1136, 72.8697, secret2, 1],
      );
      await pool.query(
        'INSERT INTO `programs` (`id`, `shop_id`, `stamps_required`, `reward_text`, `cooldown_minutes`, `max_stamps_per_day`, `scratch_enabled`, `scratch_every_n_visits`, `prize_expiry_days`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [prog2Id, shop2Id, 5, 'Free Express Hair Wash & Blow Dry', 120, 1, 1, 1, 45],
      );
      await pool.query(
        'INSERT INTO `scratch_prizes` (`id`, `shop_id`, `title`, `weight`, `stock`, `is_no_prize`, `is_active`) VALUES (?, ?, ?, ?, ?, ?, ?)',
        ['01a10000-0000-0000-0000-000000000012', shop2Id, '₹100 Off Any Hair Styling', 40, null, 0, 1],
      );
      await pool.query(
        'INSERT INTO `scratch_prizes` (`id`, `shop_id`, `title`, `weight`, `stock`, `is_no_prize`, `is_active`) VALUES (?, ?, ?, ?, ?, ?, ?)',
        ['01a10000-0000-0000-0000-000000000013', shop2Id, 'Free Beard Trim with Haircut', 30, null, 0, 1],
      );
      await pool.query(
        'INSERT INTO `scratch_prizes` (`id`, `shop_id`, `title`, `weight`, `stock`, `is_no_prize`, `is_active`) VALUES (?, ?, ?, ?, ?, ?, ?)',
        ['01a10000-0000-0000-0000-000000000014', shop2Id, 'Thank you for visiting!', 30, null, 1, 1],
      );

      console.log('✅ Demo merchants seeded successfully: "Metro Cafe & Bakery" & "Urban Cuts & Spa"');
    }
  } catch (err) {
    console.error('⚠️ Note on seeding demo shops:', err);
  }
}

export function getPool(): mysql.Pool {
  if (!_pool) {
    const uri = (dbReady && env.DATABASE_URL) ? env.DATABASE_URL : 'mysql://localhost:3306/dummy';
    _pool = mysql.createPool({
      uri,
      timezone: 'Z',
      waitForConnections: true,
      connectionLimit: 10,
      multipleStatements: false,
    });
    if (dbReady) {
      ensureTables(_pool).catch(console.error);
    }
  }
  return _pool;
}

export function getDb() {
  return drizzle(getPool(), { schema, mode: 'default' });
}

export type Db = ReturnType<typeof getDb>;

