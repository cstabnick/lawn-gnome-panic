import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: {
    port: 5175,
    proxy: {
      '/ws': {
        target: 'ws://localhost:8788',
        ws: true,
      },
    },
  },
});
