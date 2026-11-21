/// <reference types="node" />
// Every game on the landing page must have a way in from Club Gnome: a GAME_LINKS entry that some map spot opens.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { GAME_LINKS, MAP_IDS } from './config';
import { MAPS } from './maps';

const GAMES_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
/** Listed games that Club Gnome itself is, or that are not a place to go (the town is the hub). */
const EXEMPT = new Set(['club-gnome']);

function listedGames(): string[] {
  return readdirSync(GAMES_DIR).filter((g) => {
    const pkg = join(GAMES_DIR, g, 'package.json');
    if (!existsSync(pkg)) return false;
    const lawn = JSON.parse(readFileSync(pkg, 'utf8')).lawn ?? {};
    return !lawn.partyOnly && !lawn.hidden && !lawn.unlisted && !EXEMPT.has(g);
  });
}

describe('Club Gnome surfaces every listed game', () => {
  const opened = new Set<string>();
  for (const id of MAP_IDS) for (const s of MAPS[id].spots) opened.add(GAME_LINKS[s.game].game);
  opened.add(GAME_LINKS.creator.game);
  for (const g of listedGames()) {
    it(g, () => {
      expect(opened.has(g), `no map spot opens ${g}`).toBe(true);
    });
  }
});
