import { defineConfig } from 'vite';
// Port 5199 is on gnome-web's Keycloak redirect URIs and the platform service's default CORS origins.
export default defineConfig({ base: './', server: { port: 5199, strictPort: true, host: true } });
