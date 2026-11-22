import { defineConfig } from 'vite';
// Served at /admin/profiler/ on the site (package.json "lawn.path"); relative base so it works at any depth.
export default defineConfig({ base: './', server: { port: 5205, strictPort: true, host: true } });
