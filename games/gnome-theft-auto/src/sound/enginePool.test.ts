import { describe, expect, it, vi } from 'vitest';
import { planVoices } from './enginePool';

// bus.ts touches `window` when loaded (via audio.ts); planVoices is pure, so stub the bus out.
vi.mock('./bus', () => ({
  busOut: () => null,
  getListener: () => ({ x: 0, z: 0, yaw: 0 }),
}));

const free = (key: string | null) => ({ key, free: true });
const busy = (key: string | null) => ({ key, free: false });

describe('planVoices', () => {
  it('keeps a key on the slot it already plays', () => {
    expect(planVoices([busy('a'), free(null)], ['a'])).toEqual(['a', null]);
  });
  it('fills only free empty slots, in order', () => {
    const slots = [busy(null), free(null), free('b')];
    expect(planVoices(slots, ['c', 'd'])).toEqual([null, 'c', null]);
  });
  it('never reuses a slot that is still fading, even for a new key', () => {
    expect(planVoices([busy(null)], ['x'])).toEqual([null]);
  });
  it('never places one key twice', () => {
    expect(planVoices([free('a'), free(null)], ['a', 'a'])).toEqual(['a', null]);
    const out = planVoices([free(null), free(null)], ['x', 'x', 'y']);
    const keys = out.filter((k) => k !== null);
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys).toEqual(['x', 'y']);
  });
  it('returns one entry per slot', () => {
    expect(planVoices([free(null), free(null), busy(null)], ['x'])).toHaveLength(3);
    expect(planVoices([free(null)], [])).toEqual([null]);
  });
});
