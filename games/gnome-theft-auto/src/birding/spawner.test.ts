import { describe, expect, it } from 'vitest';
import { flockSize, pickSpecies, speciesWeight, windAt, wildName } from './spawner';
import { ALWAYS, DAY, NIGHT, WIND_ANY, type BirdSpecies } from './types';

/** A full species with only the spawn-relevant fields varied. */
function fake(id: string, over: Partial<BirdSpecies>): BirdSpecies {
  return {
    id,
    name: id,
    group: 'city',
    rarity: 'common',
    regions: {},
    time: DAY,
    wind: WIND_ANY,
    prefab: 'bird-songbird',
    tint: 0,
    trim: 0,
    scale: 1,
    size: 0.3,
    flight: 'flap',
    speed: 5,
    altitude: 5,
    perches: ['ground'],
    flock: [1, 1],
    shy: 5,
    call: { kind: 'chirp', hz: 3000, slide: 1, notes: 1, note: 0.1, gap: 0.1 },
    callEvery: [5, 10],
    hint: '',
    blurb: '',
    ...over,
  };
}

/** Deterministic LCG in [0, 1). */
function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const common = fake('common-test', { rarity: 'common', regions: { turfton: 3 }, time: DAY });
const mythic = fake('mythic-test', { rarity: 'mythic', regions: { 'loch-moss': 1 }, time: NIGHT, group: 'mythic' });
// A mythic that can also appear in turfton at Noon, to compete with the common one.
const mythicInTurfton = fake('mythic-turfton', { rarity: 'mythic', regions: { turfton: 1 }, time: ALWAYS });

describe('speciesWeight', () => {
  it('is 0 outside the species region or time', () => {
    expect(speciesWeight(mythic, 'turfton', 'Neon Night', 'breezy')).toBe(0);
    expect(speciesWeight(mythic, 'loch-moss', 'Noon', 'breezy')).toBe(0);
    expect(speciesWeight(common, 'loch-moss', 'Noon', 'breezy')).toBe(0);
    expect(speciesWeight(common, 'turfton', 'Neon Night', 'breezy')).toBe(0);
    expect(speciesWeight(mythic, 'loch-moss', 'Neon Night', 'breezy')).toBeGreaterThan(0);
  });
});

describe('pickSpecies', () => {
  it('returns null when every weight is 0', () => {
    expect(pickSpecies([common, mythic], 'frostbite-fells', 'Noon', 'calm', seeded(1))).toBeNull();
    expect(pickSpecies([], 'turfton', 'Noon', 'calm', seeded(1))).toBeNull();
  });

  it('favours the common species when both can appear', () => {
    const rnd = seeded(42);
    const birds = [common, mythicInTurfton];
    let commonWins = 0;
    for (let i = 0; i < 2000; i++) {
      const s = pickSpecies(birds, 'turfton', 'Noon', 'breezy', rnd);
      if (s === common) commonWins++;
    }
    expect(commonWins).toBeGreaterThan(1500);
  });

  it('only ever picks a species that can appear', () => {
    const rnd = seeded(7);
    for (let i = 0; i < 200; i++) {
      expect(pickSpecies([common, mythic], 'loch-moss', 'Neon Night', 'breezy', rnd)).toBe(mythic);
    }
  });
});

describe('flockSize', () => {
  it('stays within the flock range, inclusive', () => {
    const s = fake('flocker', { flock: [3, 7] });
    const rnd = seeded(3);
    const seen = new Set<number>();
    for (let i = 0; i < 1000; i++) {
      const n = flockSize(s, rnd);
      expect(n).toBeGreaterThanOrEqual(3);
      expect(n).toBeLessThanOrEqual(7);
      seen.add(n);
    }
    expect(seen.has(3)).toBe(true);
    expect(seen.has(7)).toBe(true);
  });
});

describe('windAt and wildName', () => {
  it('cycles through all three winds and is deterministic', () => {
    const seen = new Set<string>();
    for (let t = 0; t <= 1000; t++) seen.add(windAt(t));
    expect(seen).toEqual(new Set(['calm', 'breezy', 'blustery']));
    expect(windAt(123.5)).toBe(windAt(123.5));
  });

  it('names each wind', () => {
    expect(wildName('calm')).toBe('Calm');
    expect(wildName('breezy')).toBe('Breezy');
    expect(wildName('blustery')).toBe('Blustery');
  });
});
