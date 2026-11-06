/**
 * Production entry file for Hostinger Node.js Web App.
 * Automatically starts the Fastify server.
 */
import 'dotenv/config';
import { existsSync } from 'node:fs';

console.log('🚀 Starting Stamp server on Node.js', process.version);
console.log('📍 Process PORT:', process.env.PORT);

try {
  if (existsSync('./server/dist/index.js')) {
    console.log('📦 Running compiled production server...');
    await import('./server/dist/index.js');
  } else {
    console.log('⚡ Loading via tsx runtime...');
    await import('tsx');
    await import('./server/src/index.ts');
  }
} catch (err) {
  console.error('❌ Fatal error during application startup:', err);
  process.exit(1);
}
