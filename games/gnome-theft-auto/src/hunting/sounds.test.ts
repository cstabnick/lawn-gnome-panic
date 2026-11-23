import { describe, expect, it } from 'vitest';
import { hasSound } from '../sound/bus';
import { HUNT_SOUND_IDS, registerHuntSounds } from './sounds';

describe('hunt sounds', () => {
  it('registers a recipe for every hunt sound id', () => {
    registerHuntSounds();
    for (const id of HUNT_SOUND_IDS) expect(hasSound(id)).toBe(true);
  });

  it('a second call does not throw', () => {
    registerHuntSounds();
    expect(() => registerHuntSounds()).not.toThrow();
  });
});
