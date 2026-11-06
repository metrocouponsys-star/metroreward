import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { env, dbReady } from '../lib/env.ts';
import * as schema from './schema.ts';

let _pool: mysql.Pool | null = null;

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
  }
  return _pool;
}

export function getDb() {
  return drizzle(getPool(), { schema, mode: 'default' });
}

export type Db = ReturnType<typeof getDb>;

