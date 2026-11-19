// Tests do not need the dev-server plugin (which pulls @lawn/level into Vite's config loader): only the game alias.
import { defineConfig } from 'vitest/config';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: { alias: { '@gnomomia': resolve(here, '../../games/gnomes-of-gnomomia/src'), '@club': resolve(here, '../../games/club-gnome/src'), '@front': resolve(here, '../../games/gnome-front/src'), '@golf': resolve(here, '../../games/gnome-golf/src') } },
});
