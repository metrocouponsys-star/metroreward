import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  site: 'https://stamp.example.com', // [[FILL: real domain]]
  build: {
    assets: '_assets',
  },
  vite: {
    css: {
      modules: {
        localsConvention: 'camelCase',
      },
    },
  },
});

