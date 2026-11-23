import { describe, expect, it } from 'vitest';
import { hasSound } from '../sound/bus';
import { callDuration, recipeFor, registerBirdSounds } from './sounds';
import { BIRD_SFX, birdSoundId } from './types';
import type { BirdSpecies, CallKind, CallRecipe } from './types';

const KINDS: CallKind[] = ['whistle', 'trill', 'chirp', 'warble', 'coo', 'hoot', 'screech', 'kek', 'quack', 'honk', 'croak', 'chime'];

describe('callDuration', () => {
  it('is the last note end', () => {
    const call: CallRecipe = { kind: 'whistle', hz: 1000, slide: 1.2, notes: 3, note: 0.1, gap: 0.15 };
    expect(callDuration(call)).toBeCloseTo(0.4, 10);
  });

  it('adds a 0.3 s tail for a chime', () => {
    const call: CallRecipe = { kind: 'chime', hz: 880, slide: 1, notes: 3, note: 0.5, gap: 0.4 };
    expect(callDuration(call)).toBeCloseTo((3 - 1) * 0.4 + 0.5 + 0.3, 10);
  });

  it('keeps a single note as its own length', () => {
    const call: CallRecipe = { kind: 'kek', hz: 2600, slide: 1, notes: 1, note: 0.07, gap: 0.1 };
    expect(callDuration(call)).toBeCloseTo(0.07, 10);
  });
});

describe('recipeFor', () => {
  it('returns a recipe for every call kind', () => {
    for (const kind of KINDS) {
      const r = recipeFor({ kind, hz: 1000, slide: 1.2, notes: 3, note: 0.1, gap: 0.15 });
      expect(typeof r).toBe('function');
    }
  });
});

describe('registerBirdSounds', () => {
  const species: BirdSpecies = {
    id: 'test-finch',
    name: 'Test Finch',
    group: 'songbird',
    rarity: 'common',
    regions: { turfton: 1 },
    time: { Noon: 1 },
    wind: { calm: 1, breezy: 1, blustery: 1 },
    prefab: 'bird-songbird',
    tint: 0xffffff,
    trim: 0x000000,
    scale: 1,
    size: 0.3,
    flight: 'bound',
    speed: 5,
    altitude: 4,
    perches: ['fence'],
    flock: [1, 3],
    shy: 4,
    call: { kind: 'chirp', hz: 3000, slide: 1, notes: 2, note: 0.05, gap: 0.1 },
    callEvery: [3, 6],
    hint: 'Test hint.',
    blurb: 'Test blurb.',
  };

  it('registers the species call and the BIRD_SFX ids, and is safe to call twice', () => {
    registerBirdSounds([species]);
    registerBirdSounds([species]);
    expect(hasSound(birdSoundId(species.id))).toBe(true);
    expect(hasSound(BIRD_SFX.flush)).toBe(true);
    expect(hasSound(BIRD_SFX.shutter)).toBe(true);
    expect(hasSound(BIRD_SFX.tick)).toBe(true);
  });
});
