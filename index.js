/**
 * Production entry file for Hostinger Node.js Web App.
 * Automatically loads TypeScript support via tsx and starts the Fastify server.
 */
import 'dotenv/config';
import 'tsx';

console.log('🚀 Starting Stamp server on Node.js', process.version);
console.log('📍 Environment PORT:', process.env.PORT);

try {
  await import('./server/src/index.ts');
} catch (err) {
  console.error('❌ Fatal error during application startup:', err);
  process.exit(1);
}
