import { describe, expect, it } from 'vitest';
import { baitById, RODS, BAITS } from './tackle';
import { pickFish, type PickCtx } from './pick';
import { FISH_SPECIES } from './species';
import { createFishingState, stepFishing } from './sim';
import type { FishingState, SimEnv, SimInput } from './types';

const ICE_IDS = ['fish-pail-perch', 'fish-woolly-minnow', 'fish-lantern-burbot', 'fish-frostjaw-char'];
const MOON_JIG = baitById('moon-jig')!;

/** A seeded LCG in [0, 1). */
function seeded(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

function ctx(water: PickCtx['water'], region: PickCtx['region'], time: PickCtx['time'] = 'Noon'): PickCtx {
  return { water, region, time, weather: 'snow', bait: MOON_JIG, rodTier: 3, spot: null };
}

/** Which species bite in a context over many draws. */
function biters(c: PickCtx): Set<string> {
  const rnd = seeded(11);
  const seen = new Set<string>();
  for (let i = 0; i < 3000; i++) {
    const f = pickFish(c, rnd);
    if (f) seen.add(f.id);
  }
  return seen;
}

describe('ice species', () => {
  it('has the four ice species with ids matching their prefabs', () => {
    const ice = FISH_SPECIES.filter((f) => f.waters.includes('ice')).map((f) => f.id).sort();
    expect(ice).toEqual([...ICE_IDS].sort());
    for (const f of FISH_SPECIES.filter((x) => x.waters.includes('ice'))) expect(f.prefab).toBe(f.id);
  });

  it('only the ice species bite on ice in north-highlands', () => {
    const seen = biters(ctx('ice', 'north-highlands'));
    expect(seen.size).toBeGreaterThan(0);
    for (const id of seen) expect(ICE_IDS).toContain(id);
  });

  it('no ice species bite in a loch', () => {
    const seen = biters(ctx('loch', 'loch-moss'));
    for (const id of ICE_IDS) expect(seen.has(id)).toBe(false);
  });

  it('nobody bites on ice in turfton', () => {
    expect(biters(ctx('ice', 'turfton')).size).toBe(0);
  });
});

function makeEnv(snap?: SimEnv['snap']): SimEnv {
  return {
    rod: RODS[0],
    bait: BAITS[0],
    origin: { x: 0, y: 1.4, z: 0, yaw: 0 },
    water: () => 0,
    biteDelay: () => 2,
    pick: () => null,
    rnd: seeded(7),
    snap,
  };
}

/** Release a charged cast from the given state. */
function release(s: FishingState, env: SimEnv): string | null {
  s.phase = 'charge';
  s.t = 0;
  s.charge = 0.5;
  const inp: SimInput = { hold: false, pressed: false, released: true };
  return stepFishing(s, inp, env, 1 / 60);
}

describe('ice hole casting', () => {
  it('drops straight into a hole in reach, at its surface', () => {
    const s = createFishingState();
    const env = makeEnv(() => ({ x: 5, z: 5, surface: 2.9 }));
    expect(release(s, env)).toBe('cast');
    expect(s.phase).toBe('flight');
    expect(s.toX).toBe(5);
    expect(s.toZ).toBe(5);
    expect(s.surface).toBe(2.9);
  });

  it('without a hole the cast goes out along the water as before', () => {
    const s = createFishingState();
    const env = makeEnv();
    expect(release(s, env)).toBe('cast');
    expect(s.toX).toBe(0);
    expect(s.toZ).toBeGreaterThan(1.5);
  });
});
