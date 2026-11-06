/**
 * Production entry file for Hostinger Node.js Web App.
 * Automatically starts the Fastify server.
 */
import 'dotenv/config';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Starting Stamp server on Node.js', process.version);
console.log('📍 Process cwd:', process.cwd());
console.log('📍 Process PORT:', process.env.PORT);
console.log('📍 Database URL configured:', Boolean(process.env.DATABASE_URL));

const compiledServer = join(__dirname, 'server', 'dist', 'index.js');
const sourceServer = join(__dirname, 'server', 'src', 'index.ts');

try {
  if (existsSync(compiledServer)) {
    console.log('📦 Loading compiled production server:', compiledServer);
    await import(pathToFileURL(compiledServer).href);
  } else {
    console.log('⚡ Loading via tsx runtime:', sourceServer);
    await import('tsx');
    await import(pathToFileURL(sourceServer).href);
  }
} catch (err) {
  console.error('❌ Fatal error during application startup:', err);
  process.exit(1);
}
