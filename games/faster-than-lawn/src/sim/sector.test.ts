import { describe, it, expect } from 'vitest';
import { generateSector } from './sector';
import type { Beacon } from './types';

// Small seeded PRNG so every seed gives the same map on every run.
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function reachableFromStart(beacons: Beacon[]): Set<number> {
  const seen = new Set<number>([0]);
  const queue: number[] = [0];
  while (queue.length > 0) {
    const id = queue.shift() as number;
    for (const to of beacons[id].links) {
      if (!seen.has(to)) {
        seen.add(to);
        queue.push(to);
      }
    }
  }
  return seen;
}

describe('generateSector', () => {
  for (let seed = 1; seed <= 50; seed++) {
    it(`builds a valid map for seed ${seed}`, () => {
      const { beacons, exitId } = generateSector(mulberry32(seed));

      beacons.forEach((b, i) => expect(b.id).toBe(i));
      expect(beacons[0].kind).toBe('start');
      expect(beacons[0].visited).toBe(true);
      expect(beacons.slice(1).every((b) => !b.visited)).toBe(true);

      const exits = beacons.filter((b) => b.kind === 'exit');
      expect(exits).toHaveLength(1);
      expect(exits[0].id).toBe(exitId);

      for (const b of beacons) {
        expect(new Set(b.links).size).toBe(b.links.length);
        for (const to of b.links) {
          expect(beacons[to].column).toBe(b.column + 1);
        }
      }

      for (const b of beacons.slice(1)) {
        expect(beacons.some((p) => p.links.includes(b.id))).toBe(true);
      }

      expect(reachableFromStart(beacons).has(exitId)).toBe(true);
      expect(beacons.some((b) => b.kind === 'shop')).toBe(true);
    });
  }
});
