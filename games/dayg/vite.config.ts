/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
export default defineConfig({
  base: './',
  server: { port: 5206 },
  worker: { format: 'es' },
  test: { passWithNoTests: true },
});
