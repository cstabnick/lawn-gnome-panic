import { describe, expect, it } from 'vitest';
import { hasSound } from '../sound/bus';
import { FISH_SOUND_IDS } from './types';
import { registerFishSounds } from './sounds';

describe('fishing sounds', () => {
  it('registers a recipe for every fishing sound id', () => {
    registerFishSounds();
    for (const id of FISH_SOUND_IDS) expect(hasSound(id)).toBe(true);
  });

  it('a second call does not throw', () => {
    registerFishSounds();
    expect(() => registerFishSounds()).not.toThrow();
  });
});
