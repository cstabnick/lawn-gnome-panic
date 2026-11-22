// The level editor is a local tool: its dev server also writes level files back into the game's source.
// It imports the game's own terrain code through the @gnomomia alias, so what you edit is what the game runs.
import { defineConfig } from 'vite';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { levelApi } from './server/api';

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, '../..');
const gameSrc = resolve(repo, 'games/gnomes-of-gnomomia/src');
const clubSrc = resolve(repo, 'games/club-gnome/src');
const frontSrc = resolve(repo, 'games/gnome-front/src');
const golfSrc = resolve(repo, 'games/gnome-golf/src');
const gnomeokemonSrc = resolve(repo, 'games/gnomeokemon/src');
const snigmsSrc = resolve(repo, 'games/snigms/src');
const gsrSrc = resolve(repo, 'games/gnome-set-radio/src');
const gtaSrc = resolve(repo, 'games/gnome-theft-auto/src');

export default defineConfig({
  resolve: { alias: { '@gnomomia': gameSrc, '@club': clubSrc, '@front': frontSrc, '@golf': golfSrc, '@gnomeokemon': gnomeokemonSrc, '@snigms': snigmsSrc, '@gta': gtaSrc } },
  server: {
    port: 5393,
    // The page saves into the game's level files itself; reloading on top of that would throw away the editor's state.
    watch: { ignored: ['**/games/gnomes-of-gnomomia/src/data/levels/**', '**/games/club-gnome/src/data/levels/**', '**/games/gnome-front/src/data/levels/**', '**/games/gnome-golf/src/data/levels/**', '**/games/gnomeokemon/src/data/levels/**', '**/games/snigms/src/data/levels/**', '**/games/gnome-theft-auto/src/data/levels/**'] },
    fs: { allow: [repo] },
  },
  // LEVEL_EDITOR_LEVELS_DIR redirects saves to another folder (the end-to-end test saves into a throwaway copy).
  // LEVEL_EDITOR_CLUB_LEVELS_DIR and LEVEL_EDITOR_FRONT_LEVELS_DIR do the same for Club Gnome's maps and Gnome Front's arena.
  plugins: [levelApi({
    repo,
    levelsDir: process.env.LEVEL_EDITOR_LEVELS_DIR ? resolve(process.env.LEVEL_EDITOR_LEVELS_DIR) : resolve(gameSrc, 'data/levels'),
    gameDirs: {
      'club-gnome': process.env.LEVEL_EDITOR_CLUB_LEVELS_DIR ? resolve(process.env.LEVEL_EDITOR_CLUB_LEVELS_DIR) : resolve(clubSrc, 'data/levels'),
      'gnome-front': process.env.LEVEL_EDITOR_FRONT_LEVELS_DIR ? resolve(process.env.LEVEL_EDITOR_FRONT_LEVELS_DIR) : resolve(frontSrc, 'data/levels'),
      'gnome-golf': process.env.LEVEL_EDITOR_GOLF_LEVELS_DIR ? resolve(process.env.LEVEL_EDITOR_GOLF_LEVELS_DIR) : resolve(golfSrc, 'data/levels'),
      'gnomeokemon': resolve(gnomeokemonSrc, 'data/levels'),
      // LEVEL_EDITOR_SNIGMS_LEVELS_DIR redirects Snigms's town saves (the tests save into a throwaway copy).
      'snigms': process.env.LEVEL_EDITOR_SNIGMS_LEVELS_DIR ? resolve(process.env.LEVEL_EDITOR_SNIGMS_LEVELS_DIR) : resolve(snigmsSrc, 'data/levels'),
      'gnome-set-radio': resolve(gsrSrc, 'data/levels'),
      // LEVEL_EDITOR_GTA_LEVELS_DIR redirects Gnome Theft Auto's region saves (the end-to-end test saves into a throwaway copy).
      'gnome-theft-auto': process.env.LEVEL_EDITOR_GTA_LEVELS_DIR ? resolve(process.env.LEVEL_EDITOR_GTA_LEVELS_DIR) : resolve(gtaSrc, 'data/levels'),
    },
  })],
});
