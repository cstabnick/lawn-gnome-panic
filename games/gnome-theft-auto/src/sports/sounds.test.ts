import { describe, expect, it } from 'vitest';
import { hasSound } from '../sound/bus';
import { registerSportsSounds } from './sounds';

const IDS = [
  'jam-bounce', 'jam-swish', 'jam-clang', 'jam-dunk', 'jam-whistle', 'jam-cheer', 'jam-drainpipe',
  'skate-roll', 'skate-pop', 'skate-land', 'skate-grind', 'skate-bail', 'skate-push',
] as const;

describe('sports sounds', () => {
  it('registers a recipe for every court and skate sound id', () => {
    registerSportsSounds();
    for (const id of IDS) expect(hasSound(id), id).toBe(true);
  });

  it('a second call does not throw', () => {
    registerSportsSounds();
    expect(() => registerSportsSounds()).not.toThrow();
  });
});
