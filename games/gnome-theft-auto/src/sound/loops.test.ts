import { describe, expect, it, vi } from 'vitest';
import { assignVoices } from './loops';

// bus.ts touches `window` when loaded (via audio.ts); assignVoices is pure, so stub the bus out.
vi.mock('./bus', () => ({
  busOut: () => null,
  getListener: () => ({ x: 0, z: 0, yaw: 0 }),
}));

describe('assignVoices', () => {
  it('keeps keys in the voice they already have', () => {
    expect(assignVoices(['a', null, 'b'], ['b', 'a'])).toEqual(['a', null, 'b']);
  });
  it('fills free voices with the new keys in order', () => {
    expect(assignVoices([null, 'a', null], ['a', 'c', 'd'])).toEqual(['c', 'a', 'd']);
  });
  it('drops keys that are no longer wanted', () => {
    expect(assignVoices(['a', 'b'], ['b'])).toEqual([null, 'b']);
    expect(assignVoices(['a'], [])).toEqual([null]);
  });
  it('never assigns one key to two voices', () => {
    const out = assignVoices(['a', 'a', null], ['a', 'a', 'b']);
    const keys = out.filter((k) => k !== null);
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys).toContain('a');
    expect(keys).toContain('b');
  });
  it('gives a busy voice no new key, but still keeps its own', () => {
    expect(assignVoices([null, null], ['a'], [true, false])).toEqual([null, 'a']);
    expect(assignVoices(['a', null], ['a', 'b'], [true, false])).toEqual(['a', 'b']);
    expect(assignVoices([null], ['a'], [true])).toEqual([null]);
  });
  it('returns one entry per voice', () => {
    expect(assignVoices([null, null, null], ['x'])).toHaveLength(3);
  });
});
