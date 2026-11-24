import { describe, expect, it } from 'vitest';
import { hasSound } from '../sound/bus';
import { PW_SOUND_IDS, registerTownSounds } from './sounds';

describe('Pebblewick sounds', () => {
  it('registers a recipe for every town sound id, once', () => {
    registerTownSounds();
    expect(() => registerTownSounds()).not.toThrow();
    for (const id of PW_SOUND_IDS) expect(hasSound(id)).toBe(true);
  });
});
