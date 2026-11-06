import 'dotenv/config';
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import crypto from 'node:crypto';
import { shops, programs, scratchPrizes, customers } from './schema.ts';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) throw new Error('DATABASE_URL is required');

const conn = await mysql.createConnection({ uri: DATABASE_URL, timezone: 'Z' });
const db = drizzle(conn);

const shopId = crypto.randomUUID();
const programId = crypto.randomUUID();

console.log('Seeding demo shop…');

await db.insert(shops).values({
  id: shopId,
  slug: 'chai-junction',
  name: 'Chai Junction',
  ownerPhone: '+919876543210',
  lat: 19.076,
  lng: 72.8777,
  qrSecret: crypto.randomBytes(32),
  isActive: true,
  createdAt: new Date(),
});

await db.insert(programs).values({
  id: programId,
  shopId,
  stampsRequired: 8,
  rewardText: 'One free chai',
  cooldownMinutes: 360,
  maxStampsPerDay: 2,
  requireApproval: false,
  scratchEnabled: true,
  scratchEveryNVisits: 1,
  prizeExpiryDays: 30,
});

// Create scratch prizes
const prizes = [
  { title: 'Free samosa', weight: 10, stock: 50, isNoPrize: false, isActive: true },
  { title: '10% off next order', weight: 20, stock: null, isNoPrize: false, isActive: true },
  { title: 'Free chai upgrade', weight: 15, stock: 30, isNoPrize: false, isActive: true },
  { title: 'No prize', weight: 55, stock: null, isNoPrize: true, isActive: true },
];

for (const p of prizes) {
  await db.insert(scratchPrizes).values({
    id: crypto.randomUUID(),
    shopId,
    title: p.title,
    weight: p.weight,
    stock: p.stock,
    isNoPrize: p.isNoPrize,
    isActive: p.isActive,
  });
}

// Create a demo customer
const customerId = crypto.randomUUID();
await db.insert(customers).values({
  id: customerId,
  phone: '+919999999999',
  name: 'Demo Customer',
  createdAt: new Date(),
});

console.log('✅  Seed complete.');
console.log(`   Shop: Chai Junction (slug: chai-junction, id: ${shopId})`);
console.log(`   Owner phone: +919876543210`);
console.log(`   Demo customer phone: +919999999999`);
console.log('');
console.log('Set ADMIN_PHONES=+919876543210 in .env to give the owner admin access too.');

await conn.end();

