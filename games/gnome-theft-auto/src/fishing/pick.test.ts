import { describe, expect, it } from 'vitest';
import { BAITS, RODS, baitById } from './tackle';
import { FISH_SPECIES, FISH_SPOTS, spotById } from './species';
import { FISH, RARITY_WEIGHT } from './types';
import type { FishSpecies, RegionId, FishWater, TimeLabel } from './types';
import {
  biteDelay, fishWeight, pickFish, rollSize, spotAt, weatherAt, type PickCtx,
} from './pick';
import { fishWaterAt } from './waterKind';

/** A seeded LCG in [0, 1). */
function seeded(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const REGION_FOR_WATER: Record<FishWater, RegionId> = {
  loch: 'loch-moss',
  river: 'mossy-wood',
  canal: 'cloverfield-farms',
  sea: 'cloverfield-farms',
};

const MOON_JIG = baitById('moon-jig')!;
const DOUGH = baitById('dough')!;

function ctxFor(s: FishSpecies, time: TimeLabel, spotId: string | null = s.spot ?? null): PickCtx {
  return {
    water: s.waters[0],
    region: s.regions?.[0] ?? REGION_FOR_WATER[s.waters[0]],
    time,
    weather: 'clear',
    bait: MOON_JIG,
    rodTier: 3,
    spot: spotId ? (spotById(spotId) ?? null) : null,
  };
}

describe('species table', () => {
  it('has unique ids, 20+ common-to-rare species and 3 mythic ones', () => {
    const ids = FISH_SPECIES.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(FISH_SPECIES.filter((s) => s.rarity !== 'mythic').length).toBeGreaterThanOrEqual(20);
    expect(FISH_SPECIES.filter((s) => s.rarity === 'mythic').length).toBeGreaterThanOrEqual(3);
  });

  it('has valid prefabs, size ranges, bait keys, spots and rod tiers', () => {
    const baitIds = new Set(BAITS.map((b) => b.id));
    const spotIds = new Set(FISH_SPOTS.map((p) => p.id));
    const tiers = new Set(RODS.map((r) => r.tier));
    for (const s of FISH_SPECIES) {
      expect(s.prefab.startsWith('fish-')).toBe(true);
      expect(s.size[0]).toBeLessThan(s.size[1]);
      for (const key of Object.keys(s.baits ?? {})) expect(baitIds.has(key)).toBe(true);
      if (s.spot !== undefined) expect(spotIds.has(s.spot)).toBe(true);
      expect(tiers.has(s.minRod)).toBe(true);
    }
  });
});

describe('fishWeight and pickFish', () => {
  it('every species can bite somewhere', () => {
    for (const s of FISH_SPECIES) {
      const spot = s.spot ? spotById(s.spot) ?? null : null;
      const best = Math.max(
        ...(['Neon Night', 'Noon'] as const).map((time) => fishWeight(s, ctxFor(s, time, spot?.id ?? null))),
      );
      expect(best, s.id).toBeGreaterThan(0);
    }
  });

  it('mythic weight is 0 without its spot and below its minimum rod', () => {
    for (const s of FISH_SPECIES.filter((f) => f.rarity === 'mythic')) {
      const spot = spotById(s.spot!)!;
      expect(fishWeight(s, ctxFor(s, 'Neon Night', null)), s.id).toBe(0);
      expect(fishWeight(s, { ...ctxFor(s, 'Neon Night', spot.id), rodTier: s.minRod - 1 }), s.id).toBe(0);
      expect(fishWeight(s, ctxFor(s, 'Neon Night', spot.id)), s.id).toBeGreaterThan(0);
    }
  });

  it('commons outnumber rares in the canal at Noon with dough', () => {
    const c: PickCtx = {
      water: 'canal', region: 'cloverfield-farms', time: 'Noon', weather: 'clear', bait: DOUGH, rodTier: 3, spot: null,
    };
    const rnd = seeded(2024);
    let commons = 0;
    let rares = 0;
    for (let i = 0; i < 2000; i++) {
      const s = pickFish(c, rnd);
      expect(s).not.toBeNull();
      if (s!.rarity === 'common') commons++;
      if (s!.rarity === 'rare') rares++;
    }
    expect(commons).toBeGreaterThan(rares);
  });

  it('pickFish is null when nothing can bite', () => {
    // A rod below every species' minRod (the lowest is 0) can land nothing.
    const c: PickCtx = {
      water: 'sea', region: 'loch-moss', time: 'Noon', weather: 'clear', bait: DOUGH, rodTier: -1, spot: null,
    };
    expect(pickFish(c, seeded(1))).toBeNull();
  });

  it('rare weights use the bait bonus and the hot spot', () => {
    // Puddle Sunfish: rare, no bait or spot entries, so only the bait bonus and the hot spot change its weight.
    const rare = FISH_SPECIES.find((s) => s.rarity === 'rare' && !s.baits && !s.weather && !s.spot)!;
    const base = ctxFor(rare, 'Noon', null);
    const spotCtx = { ...base, spot: FISH_SPOTS.find((p) => p.water === rare.waters[0])! };
    const plain = fishWeight(rare, { ...base, bait: DOUGH });
    expect(plain).toBeGreaterThan(0);
    expect(fishWeight(rare, { ...base, bait: MOON_JIG })).toBeCloseTo(plain * MOON_JIG.rareBonus / DOUGH.rareBonus, 9);
    expect(fishWeight(rare, { ...spotCtx, bait: DOUGH })).toBeCloseTo(plain * FISH.hotspotRare, 9);
    expect(RARITY_WEIGHT.rare).toBeGreaterThan(0);
  });
});

describe('rollSize, biteDelay, spots and weather', () => {
  it('rollSize stays inside each species range and is whole cm', () => {
    for (const s of FISH_SPECIES) {
      const rnd = seeded(s.size[0] + 7);
      for (let i = 0; i < 200; i++) {
        const n = rollSize(s, rnd);
        expect(n).toBeGreaterThanOrEqual(s.size[0]);
        expect(n).toBeLessThanOrEqual(s.size[1]);
        expect(Number.isInteger(n)).toBe(true);
      }
      expect(rollSize(s, () => 0)).toBe(s.size[0]);
    }
  });

  it('biteDelay is shorter at a hot spot for the same rnd sequence', () => {
    const bait = BAITS[1];
    const hot = biteDelay(bait, true, seeded(99));
    const cold = biteDelay(bait, false, seeded(99));
    expect(hot).toBeLessThan(cold);
    expect(hot).toBeGreaterThan(0);
  });

  it('spotAt finds the spot within the radius only', () => {
    const spot = FISH_SPOTS[0];
    expect(spotAt(spot.x + 1, spot.z)?.id).toBe(spot.id);
    expect(spotAt(spot.x + FISH.spotRadius + 5, spot.z + 5000)).toBeNull();
  });

  it('weatherAt derives snow, mist and clear', () => {
    expect(weatherAt('frostbite-fells', 'Noon')).toBe('snow');
    expect(weatherAt('loch-moss', 'Dawn')).toBe('mist');
    expect(weatherAt('loch-moss', 'Morning')).toBe('mist');
    expect(weatherAt('loch-moss', 'Dusk')).toBe('clear');
    expect(weatherAt('cloverfield-farms', 'Dawn')).toBe('clear');
  });
});

describe('hot spots sit in water', () => {
  it('every FISH_SPOTS spot is on the water kind it names', () => {
    for (const spot of FISH_SPOTS) {
      expect(fishWaterAt(spot.x, spot.z), spot.id).toBe(spot.water);
    }
  }, 30000);
});
