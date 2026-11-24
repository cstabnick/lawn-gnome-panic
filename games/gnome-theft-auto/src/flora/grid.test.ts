import { describe, expect, it } from 'vitest';
import { createPlantStore, nearestPlant, queryCircle } from './grid';
import { seedOf } from './harvest';
import type { PlantSeed } from './types';

// Deterministic LCG (no Math.random): returns a function giving numbers in [0, 1).
function lcg(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const IDS = ['flower-bed', 'fern-clump', 'barrel-cactus', 'boxwood-ball'] as const;

function makeSeeds(count: number, span: number, seed: number): PlantSeed[] {
  const rnd = lcg(seed);
  const out: PlantSeed[] = [];
  let i = 0;
  while (out.length < count) {
    const id = IDS[i % IDS.length];
    i++;
    const x = rnd() * span, z = rnd() * span;
    const s = seedOf({ id, x, y: 0, z, yaw: 0, scale: 1 });
    if (s) out.push(s);
  }
  return out;
}

function bruteForce(s: ReturnType<typeof createPlantStore>, x: number, z: number, r: number): number[] {
  const hits: number[] = [];
  for (let j = 0; j < s.count; j++) {
    const dx = s.cx[j] - x, dz = s.cz[j] - z;
    const rr = r + s.r[j];
    if (dx * dx + dz * dz < rr * rr) hits.push(j);
  }
  return hits;
}

describe('plant grid', () => {
  it('matches a brute-force overlap check for random circles', () => {
    const seeds = makeSeeds(400, 300, 12345);
    expect(seeds.length).toBe(400);
    const store = createPlantStore(seeds);
    expect(store.count).toBe(400);

    const rnd = lcg(999);
    const out = new Int32Array(400);
    for (let q = 0; q < 200; q++) {
      const x = -20 + rnd() * 340;
      const z = -20 + rnd() * 340;
      const r = rnd() * 15;
      const n = queryCircle(store, x, z, r, out);
      const got = Array.from(out.subarray(0, n)).sort((a, b) => a - b);
      const want = bruteForce(store, x, z, r);
      expect(got).toEqual(want);
    }
  });

  it('respects the out capacity', () => {
    const seeds = makeSeeds(400, 300, 12345);
    const store = createPlantStore(seeds);
    const big = new Int32Array(400);
    // A circle covering the whole grid hits everything.
    const all = queryCircle(store, 150, 150, 500, big);
    expect(all).toBe(400);

    const small = new Int32Array(2);
    expect(queryCircle(store, 150, 150, 500, small)).toBe(2);
  });

  it('returns 0 for an empty store', () => {
    const store = createPlantStore([]);
    const out = new Int32Array(8);
    expect(store.count).toBe(0);
    expect(queryCircle(store, 0, 0, 10, out)).toBe(0);
    expect(nearestPlant(store, 0, 0, 10)).toBe(-1);
  });

  it('returns 0 for a query far outside the grid', () => {
    const seeds = makeSeeds(50, 100, 7);
    const store = createPlantStore(seeds);
    const out = new Int32Array(50);
    expect(queryCircle(store, 5000, 5000, 3, out)).toBe(0);
    expect(queryCircle(store, -5000, -5000, 3, out)).toBe(0);
    expect(nearestPlant(store, 5000, 5000, 10)).toBe(-1);
  });

  it('finds the nearest plant within maxR and -1 past it', () => {
    const seeds = makeSeeds(120, 200, 31);
    const store = createPlantStore(seeds);
    const rnd = lcg(5);
    for (let q = 0; q < 100; q++) {
      const x = rnd() * 200, z = rnd() * 200;
      const maxR = 1 + rnd() * 20;
      let best = -1, bestD = Infinity;
      for (let j = 0; j < store.count; j++) {
        const dx = store.cx[j] - x, dz = store.cz[j] - z;
        const d = dx * dx + dz * dz;
        if (d <= maxR * maxR && d < bestD) { bestD = d; best = j; }
      }
      expect(nearestPlant(store, x, z, maxR)).toBe(best);
    }
    // Past maxR: a point far from every plant.
    expect(nearestPlant(store, 1000, 1000, 5)).toBe(-1);
  });

  it('stores every plant STANDING with the grid fields set', () => {
    const seeds = makeSeeds(30, 60, 3);
    const store = createPlantStore(seeds, 4);
    expect(store.state.every((v) => v === 0)).toBe(true);
    expect(store.activeAt.every((v) => v === -1)).toBe(true);
    expect(store.activeCount).toBe(0);
    expect(store.cell).toBe(4);
    expect(store.cellStart.length).toBe(store.nx * store.nz + 1);
    expect(store.cellItems.length).toBe(30);
  });
});
