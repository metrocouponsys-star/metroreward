import 'dotenv/config';
import { drizzle } from 'drizzle-orm/mysql2';
import { migrate } from 'drizzle-orm/mysql2/migrator';
import mysql from 'mysql2/promise';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) throw new Error('DATABASE_URL is required');

const conn = await mysql.createConnection({ uri: DATABASE_URL, timezone: 'Z', multipleStatements: true });
const db = drizzle(conn);

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsFolder = join(__dirname, 'migrations');

console.log('Running migrations from', migrationsFolder, '…');
await migrate(db, { migrationsFolder });
console.log('Migrations complete.');
await conn.end();
