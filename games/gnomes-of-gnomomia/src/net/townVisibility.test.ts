// Two gnomes in one town always see each other: a town is smaller than the MMO view radius (remote players and their
// companions are dropped beyond WORLD.remoteViewRadius in mmo.ts updateMmo) and than the name-plate range
// (WORLD.plateRadius, used by ui/online.ts for remote plates and by companions.ts for bubbles). So the companions that
// stroll a town (companions.ts 'stroll') are drawn, with names, for every other player standing in that town.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { WORLD } from '../config';
import { TOWNS, townWaypoints } from '../towns';

describe('town visibility', () => {
  it('has towns', () => {
    expect(TOWNS.length).toBeGreaterThan(0);
  });

  for (const town of TOWNS) {
    it(`${town.id}: any two gnomes inside it are drawn and named for each other`, () => {
      expect(2 * town.r).toBeLessThan(WORLD.remoteViewRadius);
      expect(2 * town.r).toBeLessThan(WORLD.plateRadius);
    });

    it(`${town.id}: every pair of stroll waypoints is within the view radius`, () => {
      const wps = townWaypoints(town);
      expect(wps.length).toBeGreaterThan(0);
      for (const a of wps) {
        for (const b of wps) {
          expect(Math.hypot(a.x - b.x, a.z - b.z)).toBeLessThanOrEqual(WORLD.remoteViewRadius);
        }
      }
    });
  }

  // companions.ts pulls in THREE, @lawn/gnome and the live terrain, too heavy for this fast test, so check the relay
  // in the source text instead: the MMO pose loop sends companionPoses() in its 'comp' message.
  it('mmo.ts relays companionPoses to other players', () => {
    const src = readFileSync(fileURLToPath(new URL('./mmo.ts', import.meta.url)), 'utf8');
    expect(src).toMatch(/import\s*\{[^}]*\bcompanionPoses\b[^}]*\}\s*from\s*'\.\.\/companions'/);
    expect(src).toMatch(/k:\s*'comp'[^}]*companionPoses\(\)/);
  });
});
