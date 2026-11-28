import { describe, expect, it } from 'vitest';
import { hasSound } from '../sound/bus';
import { GOLF_SOUNDS } from './types';
import { registerGolfSounds } from './sounds';

describe('golf sounds', () => {
  it('registers a recipe for every golf sound id', () => {
    registerGolfSounds();
    for (const id of GOLF_SOUNDS) expect(hasSound(id), id).toBe(true);
  });

  it('a second call does not throw', () => {
    registerGolfSounds();
    expect(() => registerGolfSounds()).not.toThrow();
  });
});
