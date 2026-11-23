import { describe, expect, it, vi } from 'vitest';

// The test runs in node: ambience.ts pulls in bus.ts -> audio.ts, which registers a window key listener at load.
vi.hoisted(() => {
  const g = globalThis as unknown as { window?: unknown };
  if (!g.window) g.window = { addEventListener() {}, removeEventListener() {} };
});

const { bedMix } = await import('./ambience');

describe('bedMix', () => {
  it('tundra is windier than city, city hums, forest rustles', () => {
    const tundra = bedMix('tundra', 0, 0, false, 0, false);
    const city = bedMix('city', 0, 0, false, 0, false);
    const forest = bedMix('forest', 0, 0, false, 0, false);
    expect(tundra.wind).toBeGreaterThan(city.wind);
    expect(city.hum).toBeGreaterThan(0);
    expect(forest.leaves).toBeGreaterThan(0);
    expect(city.leaves).toBe(0);
  });

  it('water rises with the wet fraction', () => {
    const dry = bedMix('parkland', 0, 0, false, 0, false);
    const half = bedMix('parkland', 0, 0, false, 0.5, false);
    const full = bedMix('parkland', 0, 0, false, 1, false);
    expect(half.water).toBeGreaterThan(dry.water);
    expect(full.water).toBeGreaterThan(half.water);
  });

  it('airborne lowers hum and raises wind', () => {
    const ground = bedMix('city', 0, 0, true, 0, false);
    const air = bedMix('city', 0, 0, true, 0, true);
    expect(air.hum).toBeLessThan(ground.hum);
    expect(air.wind).toBeGreaterThan(ground.wind);
  });

  it('night thins the hum and adds insect hiss outside the city', () => {
    expect(bedMix('city', 1, 0, false, 0, false).hum).toBeLessThan(bedMix('city', 0, 0, false, 0, false).hum);
    expect(bedMix('forest', 1, 0, false, 0, false).night).toBeGreaterThan(0);
    expect(bedMix('city', 1, 0, false, 0, false).night).toBe(0);
  });

  it('keeps every value finite and non-negative', () => {
    const biomes = ['city', 'desert', 'forest', 'tundra', 'farmland', 'loch', 'parkland'] as const;
    for (const b of biomes) {
      for (const air of [false, true]) {
        for (const inDistrict of [false, true]) {
          const m = bedMix(b, 1, 40, inDistrict, 1, air);
          for (const v of Object.values(m)) {
            expect(Number.isFinite(v)).toBe(true);
            expect(v).toBeGreaterThanOrEqual(0);
          }
        }
      }
    }
  });
});
