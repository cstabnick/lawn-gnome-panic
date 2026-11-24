import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { installFakeDom } from '../testing/fakeDom';
import { aboveGround, groundAt, heightAt, terrainProbe } from '../terrain';
import { deckCeilingAbove, deckContactsAt, deckSamples, deckSurfaceBelow, pushOutOfDecks, railGaps, skywayDefs } from './deck';
import { PAVEMENT_KEEP, ROAD_KEEP, followedStreet, roadDistance, skywayBents, skywayColliders } from './colliders';
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
      if (!def.points[0].on) expect(Math.abs(s[0].y - s[0].land)).toBeLessThan(0.05);
      if (!def.openEnd && !def.points[def.points.length - 1].on) expect(Math.abs(s[s.length - 1].y - s[s.length - 1].land)).toBeLessThan(0.05);
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

  it('a junction has no rail: a car crosses from the Skyway onto the beltway; the rails hold elsewhere', () => {
    const y = groundAt(255, -60);
    // On the Skyway at the junction, pressed toward the north rail where the beltway leaves: not pushed back.
    expect(pushOutOfDecks(255, -64.8, 1.2, y).hit).toBe(false);
    expect(groundAt(255, -70, y + 0.3)).toBeCloseTo(y, 1);
    // 40 m further west the same spot has its rail.
    expect(pushOutOfDecks(215, -64.8, 1.2, groundAt(215, -60)).hit).toBe(true);
    expect(railGaps('turfton-skyway').filter((g) => g.kind === 'junction').length).toBeGreaterThanOrEqual(3);
  });

  it('a crack opens the rail: nothing holds a body there, and the drop lands on clear ground', () => {
    for (const def of skywayDefs()) {
      for (const c of def.cracks ?? []) {
        const s = deckSamples(def.id, 1).reduce((a, b) => (Math.abs(b.along - c.along) < Math.abs(a.along - c.along) ? b : a));
        expect(s.solid).toBe(false);
        const half = def.width / 2;
        const x = s.x + c.side * s.dirZ * (half - 0.8), z = s.z - c.side * s.dirX * (half - 0.8);
        expect(pushOutOfDecks(x, z, 1.2, s.y).hit).toBe(false);
        // Landing: 3 m past the edge, clear of roads and columns.
        const lx = s.x + c.side * s.dirZ * (half + 3), lz = s.z - c.side * s.dirX * (half + 3);
        expect(roadDistance(lx, lz)).toBeGreaterThan(6);
        for (const b of skywayBents()) for (const col of b.columns) expect(Math.hypot(col.x - lx, col.z - lz)).toBeGreaterThan(c.length / 2 + 1.5);
      }
    }
  });

  it('no column stands on a road, and every viaduct has bents', () => {
    const bents = skywayBents();
    expect(bents.filter((b) => b.skyway === 'turfton-skyway').length).toBeGreaterThan(6);
    for (const b of bents) {
      // Above a city street the columns stand on its pavements; every other road keeps ROAD_KEEP.
      const street = followedStreet(b);
      for (const c of b.columns) {
        expect(roadDistance(c.x, c.z, street)).toBeGreaterThanOrEqual(ROAD_KEEP);
        if (street) expect(Math.abs((street.axis === 'z' ? c.z : c.x) - street.line)).toBeGreaterThanOrEqual(PAVEMENT_KEEP);
      }
    }
    // Every road deck's viaduct has bents (the city stretch too).
    for (const id of ['beltway-north', 'beltway-south']) expect(bents.filter((b) => b.skyway === id).length).toBeGreaterThan(2);
    expect(bents.filter((b) => b.skyway === 'turfton-skyway' && Math.abs(b.x) < 180).length).toBeGreaterThanOrEqual(5);
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
      const feet = [{ p: s[0], sign: -1, on: def.points[0].on }, { p: s[s.length - 1], sign: 1, on: def.openEnd ? 'open' : def.points[def.points.length - 1].on }]
        .filter((f) => !f.on);
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
    // Under each crack the drop is clear: nothing in world.boxes stands in the landing strip.
    for (const def of skywayDefs()) {
      for (const c of def.cracks ?? []) {
        for (let a = c.along - c.length / 2; a <= c.along + c.length / 2; a += 1) {
          const s = deckSamples(def.id, 1).reduce((p, q) => (Math.abs(q.along - a) < Math.abs(p.along - a) ? q : p));
          for (let out = 1; out <= 8; out += 1) {
            const x = s.x + c.side * s.dirZ * (def.width / 2 + out), z = s.z - c.side * s.dirX * (def.width / 2 + out);
            for (const b of world.boxes) {
              if (x > b.minX && x < b.maxX && z > b.minZ && z < b.maxZ && b.h > heightAt(x, z) + 0.3) bad.push();
            }
          }
        }
      }
    }
    // Under each crack the drop is clear: nothing in world.boxes stands in the landing strip.
    for (const def of skywayDefs()) {
      for (const c of def.cracks ?? []) {
        for (let a = c.along - c.length / 2; a <= c.along + c.length / 2; a += 1) {
          const s = deckSamples(def.id, 1).reduce((p, q) => (Math.abs(q.along - a) < Math.abs(p.along - a) ? q : p));
          for (let out = 1; out <= 8; out += 1) {
            const x = s.x + c.side * s.dirZ * (def.width / 2 + out), z = s.z - c.side * s.dirX * (def.width / 2 + out);
            for (const b of world.boxes) {
              if (x > b.minX && x < b.maxX && z > b.minZ && z < b.maxZ && b.h > heightAt(x, z) + 0.3) {
                bad.push(`${def.id} crack landing blocked @(${x.toFixed(0)},${z.toFixed(0)})`);
              }
            }
          }
        }
      }
    }
    expect([...new Set(bad)]).toEqual([]);
  }, 60000);
});

describe('deck surfaces are continuous', () => {
  it('no step a wheel cannot climb anywhere on a deck (corners and junctions included)', () => {
    const bad: string[] = [];
    for (const def of skywayDefs()) {
      for (const s of deckSamples(def.id, 1)) {
        for (let a = -def.width / 2; a <= def.width / 2; a += 0.5) {
          const x = s.x + s.dirZ * a, z = s.z - s.dirX * a;
          const here = deckSurfaceBelow(x, z, Infinity);
          if (here === null) continue;
          for (const [dx, dz] of [[0.5, 0], [0, 0.5]]) {
            const there = deckSurfaceBelow(x + dx, z + dz, here + SKYWAY.step);
            const top = deckSurfaceBelow(x + dx, z + dz, Infinity);
            // A neighbour on the deck must be reachable within a step (a car would otherwise fall through to the land).
            if (top !== null && Math.abs(top - here) < 2 && (there === null || Math.abs(there - here) > 0.45)) {
              bad.push(`${def.id} @(${x.toFixed(1)},${z.toFixed(1)}) ${here.toFixed(2)} -> ${top.toFixed(2)}`);
            }
          }
        }
      }
    }
    expect(bad.slice(0, 10)).toEqual([]);
  });
});

describe('skyway embankment walls keep off the driving surface', () => {
  // Wall boxes = every skyway collider that is not a bent column (columns come from skywayBents, as skywayColliders adds them).
  function wallBoxes() {
    const half = SKYWAY.columnSize / 2;
    const cols = new Set<string>();
    for (const b of skywayBents()) {
      for (const c of b.columns) cols.add(`${c.x - half},${c.x + half},${c.z - half},${c.z + half}`);
    }
    return skywayColliders().filter((b) => !cols.has(`${b.minX},${b.maxX},${b.minZ},${b.maxZ}`));
  }

  it('no embankment wall stands on a skyway\'s own driving surface', () => {
    const bad: string[] = [];
    for (const box of wallBoxes()) {
      const cx = (box.minX + box.maxX) / 2, cz = (box.minZ + box.maxZ) / 2;
      for (const def of skywayDefs()) {
        for (const s of deckSamples(def.id, 1)) {
          if (!s.solid) continue;
          if (Math.abs(s.y - (box.h - SKYWAY.railHeight)) > 1) continue;
          const d = Math.hypot(cx - s.x, cz - s.z);
          if (d < def.width / 2 - 0.05) bad.push(`${def.id} wall centre (${cx.toFixed(1)},${cz.toFixed(1)}) ${d.toFixed(2)} from (${s.x.toFixed(1)},${s.z.toFixed(1)})`);
        }
      }
    }
    expect([...new Set(bad)].slice(0, 10)).toEqual([]);
  });

  it('no wall box contains the corner landing of the Turfton Skyway west on-ramp', () => {
    for (const box of wallBoxes()) {
      for (const [x, z] of [[-211, -60], [-216, -60]]) {
        const inside = box.minX <= x && x <= box.maxX && box.minZ <= z && z <= box.maxZ;
        expect(inside, `box ${box.minX}..${box.maxX}, ${box.minZ}..${box.maxZ} holds (${x},${z})`).toBe(false);
      }
    }
  });
});
