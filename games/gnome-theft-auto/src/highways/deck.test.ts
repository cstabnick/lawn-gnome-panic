import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { installFakeDom } from '../testing/fakeDom';
import { aboveGround, groundAt, heightAt, terrainProbe } from '../terrain';
import { deckCeilingAbove, deckContactsAt, deckSamples, deckSurfaceBelow, pushOutOfDecks, skywayDefs } from './deck';
import { ROAD_KEEP, roadDistance, skywayBents, skywayColliders } from './colliders';
import { SKYWAY } from './skyways';

const v3 = (x: number, y: number, z: number) => ({ x, y, z });

/** The highest viaduct sample of the Turfton Skyway (a point with room underneath). */
function highPoint() {
  const s = deckSamples('turfton-skyway').filter((p) => !p.solid);
  return s.reduce((a, b) => (b.y - b.land > a.y - a.land ? b : a));
}

describe('skyway decks', () => {
  it('ramp feet meet the land and the decks are long', () => {
    for (const def of skywayDefs()) {
      const s = deckSamples(def.id);
      expect(s.length).toBeGreaterThan(5);
      expect(Math.abs(s[0].y - s[0].land)).toBeLessThan(0.05);
      if (!def.openEnd) expect(Math.abs(s[s.length - 1].y - s[s.length - 1].land)).toBeLessThan(0.05);
    }
  });

  it('solid stretches lie on axis-aligned legs', () => {
    for (const def of skywayDefs()) {
      for (const s of deckSamples(def.id)) {
        if (!s.solid) continue;
        expect(Math.min(Math.abs(s.dirX), Math.abs(s.dirZ))).toBeLessThan(1e-6);
      }
    }
  });

  it('groundAt picks the deck from above and the land from below', () => {
    const p = highPoint();
    expect(groundAt(p.x, p.z, p.y + 0.3)).toBeCloseTo(p.y, 6);
    expect(groundAt(p.x, p.z)).toBeCloseTo(p.y, 6);
    expect(groundAt(p.x, p.z, p.land + 0.5)).toBeCloseTo(heightAt(p.x, p.z), 6);
    expect(aboveGround(p.x, p.y + 2, p.z)).toBeCloseTo(2, 6);
    expect(deckSurfaceBelow(p.x, p.z, p.land + 1)).toBeNull();
    expect(deckContactsAt(p.x, p.z).length).toBe(1);
  });

  it('the wheel probe lands on the deck from above and passes under it from below', () => {
    const p = highPoint();
    const top = terrainProbe().cast(v3(p.x, p.y + 1, p.z), v3(0, -1, 0), 5);
    expect(top).not.toBeNull();
    expect(top!.point.y).toBeCloseTo(p.y, 3);
    const under = terrainProbe().cast(v3(p.x, p.land + 1, p.z), v3(0, -1, 0), 5);
    expect(under).not.toBeNull();
    expect(under!.point.y).toBeCloseTo(heightAt(p.x, p.z), 3);
  });

  it('a camera under the viaduct gets a ceiling', () => {
    const p = highPoint();
    expect(deckCeilingAbove(p.x, p.z, p.land + 1)).toBeCloseTo(p.y - SKYWAY.slab, 6);
    expect(deckCeilingAbove(p.x, p.z, p.y + 1)).toBeNull();
  });

  it('rails keep a car on the deck; a ground car drives under the viaduct but not into an embankment', () => {
    const p = highPoint();
    const half = 11 / 2;
    // On the deck, pressed into the right rail.
    const rx = p.x + p.dirZ * (half - 0.2), rz = p.z - p.dirX * (half - 0.2);
    const onDeck = pushOutOfDecks(rx, rz, 1.2, p.y);
    expect(onDeck.hit).toBe(true);
    expect(Math.hypot(onDeck.x - p.x, onDeck.z - p.z)).toBeCloseTo(half - 1.2, 3);
    // Under the viaduct: free.
    expect(pushOutOfDecks(p.x, p.z, 1.2, p.land).hit).toBe(false);
    // Beside a solid stretch: pushed out.
    const solid = deckSamples('turfton-skyway').find((s) => s.solid && s.y - s.land > 2)!;
    const sx = solid.x + solid.dirZ * (half + 0.5), sz = solid.z - solid.dirX * (half + 0.5);
    const beside = pushOutOfDecks(sx, sz, 1.2, solid.land);
    expect(beside.hit).toBe(true);
    expect(Math.hypot(beside.x - solid.x, beside.z - solid.z)).toBeCloseTo(half + 1.2, 3);
  });

  it('no column stands on a road, and every viaduct has bents', () => {
    const bents = skywayBents();
    expect(bents.filter((b) => b.skyway === 'turfton-skyway').length).toBeGreaterThan(6);
    for (const b of bents) for (const c of b.columns) expect(roadDistance(c.x, c.z)).toBeGreaterThanOrEqual(ROAD_KEEP);
  });

  it('the world leaves room for the skyways (nothing inside an embankment or poking into a viaduct)', async () => {
    installFakeDom();
    const { buildWorld } = await import('../world');
    const world = buildWorld(new THREE.Scene(), undefined as unknown as THREE.WebGLRenderer);
    const ours = new Set(skywayColliders());
    const bad: string[] = [];
    for (const def of skywayDefs()) {
      for (const s of deckSamples(def.id, 2)) {
        const reach = def.width / 2 + 1.5;
        for (const b of world.boxes) {
          if (ours.has(b)) continue;
          const dx = Math.max(b.minX - s.x, 0, s.x - b.maxX);
          const dz = Math.max(b.minZ - s.z, 0, s.z - b.maxZ);
          if (Math.hypot(dx, dz) > reach) continue;
          const limit = s.solid ? s.land + 0.3 : s.y - SKYWAY.slab - 0.3;
          if (b.h > limit) bad.push(`${def.id} @(${s.x.toFixed(0)},${s.z.toFixed(0)}) box h ${b.h.toFixed(1)} [${b.minX.toFixed(0)}..${b.maxX.toFixed(0)}, ${b.minZ.toFixed(0)}..${b.maxZ.toFixed(0)}]`);
        }
      }
    }
    // The ground in front of each ramp foot is open (no hedge or wall across the way on or off).
    for (const def of skywayDefs()) {
      const s = deckSamples(def.id);
      const feet = def.openEnd ? [{ p: s[0], sign: -1 }] : [{ p: s[0], sign: -1 }, { p: s[s.length - 1], sign: 1 }];
      for (const { p, sign } of feet) {
        for (let d = 1; d <= 12; d += 1) {
          for (let a = -def.width / 2 + 1; a <= def.width / 2 - 1; a += 1) {
            const x = p.x + sign * p.dirX * d + p.dirZ * a;
            const z = p.z + sign * p.dirZ * d - p.dirX * a;
            for (const b of world.boxes) {
              if (x > b.minX && x < b.maxX && z > b.minZ && z < b.maxZ && b.h > heightAt(x, z) + 0.3) {
                bad.push(`${def.id} foot blocked @(${x.toFixed(0)},${z.toFixed(0)}) box h ${b.h.toFixed(1)}`);
              }
            }
          }
        }
      }
    }
    expect([...new Set(bad)]).toEqual([]);
  }, 60000);
});
