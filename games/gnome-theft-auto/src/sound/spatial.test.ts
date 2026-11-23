import { describe, expect, it } from 'vitest';
import { admit, duckLevel, spatial } from './spatial';

describe('spatial', () => {
  it('is loud and centred on top of the listener, silent past maxDist', () => {
    const near = spatial(0, 0, 0, 0, 0, 50);
    expect(near.gain).toBeCloseTo(1, 5);
    expect(near.pan).toBe(0);
    expect(spatial(60, 0, 0, 0, 0, 50).gain).toBe(0);
  });
  it('falls off with distance and muffles far sounds', () => {
    const a = spatial(5, 0, 0, 0, 0, 80);
    const b = spatial(40, 0, 0, 0, 0, 80);
    expect(a.gain).toBeGreaterThan(b.gain);
    expect(a.cutoff).toBeGreaterThan(b.cutoff);
  });
  it('pans right for a sound on the right of a listener facing +z', () => {
    // yaw 0 faces +z; right is -x.
    expect(spatial(-20, 0, 0, 0, 0, 80).pan).toBeGreaterThan(0.5);
    expect(spatial(20, 0, 0, 0, 0, 80).pan).toBeLessThan(-0.5);
  });
});

describe('admit', () => {
  it('plays under the cap, steals for a louder sound, drops a quieter one', () => {
    expect(admit(0.1, [0.5], 2)).toBe('play');
    expect(admit(0.9, [0.5, 0.2], 2)).toBe('steal');
    expect(admit(0.1, [0.5, 0.2], 2)).toBe('drop');
  });
});

describe('duckLevel', () => {
  it('takes the deepest duck', () => {
    expect(duckLevel([])).toBe(1);
    expect(duckLevel([0.5, 0.2])).toBe(0.2);
  });
});
