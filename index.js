/**
 * Production entry file for Hostinger Node.js Web App.
 * Automatically loads TypeScript support via tsx and starts the Fastify server.
 */
import 'tsx';
await import('./server/src/index.ts');
