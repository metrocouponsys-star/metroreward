import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    env: {
      DATABASE_URL: 'mysql://test:test@localhost:3306/test',
      SESSION_SECRET: 'test-secret-that-is-at-least-32-characters-long-enough',
      BASE_URL: 'http://localhost:3000',
      CRON_SECRET: 'test-cron-secret-1234567890',
      NODE_ENV: 'test',
    },
    coverage: {
      reporter: ['text', 'html'],
    },
  },
});
