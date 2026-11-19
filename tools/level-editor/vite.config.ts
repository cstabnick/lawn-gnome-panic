// The level editor is a local tool: its dev server also writes level files back into the game's source.
// It imports the game's own terrain code through the @gnomomia alias, so what you edit is what the game runs.
import { defineConfig } from 'vite';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { levelApi } from './server/api';

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, '../..');
const gameSrc = resolve(repo, 'games/gnomes-of-gnomomia/src');

export default defineConfig({
  resolve: { alias: { '@gnomomia': gameSrc } },
  server: {
    port: 5393,
    // The page saves into the game's level files itself; reloading on top of that would throw away the editor's state.
    watch: { ignored: ['**/games/gnomes-of-gnomomia/src/data/levels/**'] },
    fs: { allow: [repo] },
  },
  plugins: [levelApi({ repo, levelsDir: resolve(gameSrc, 'data/levels') })],
});
