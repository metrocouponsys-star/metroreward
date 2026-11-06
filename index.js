/**
 * Production entry file for Hostinger Node.js Web App.
 * LiteSpeed (lsnode.js) loads this with require(), so this file
 * and its entire synchronous import graph MUST NOT have top-level await.
 */
import 'dotenv/config';

console.log('🚀 Starting Stamp server on Node.js', process.version);
console.log('📍 Process cwd:', process.cwd());
console.log('📍 Process PORT:', process.env.PORT);

process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('💥 Unhandled Rejection:', reason);
});

// Load the compiled server bundle directly — NO top-level await allowed!
import './server/dist/index.js';

