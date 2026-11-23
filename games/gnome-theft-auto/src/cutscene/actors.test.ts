import { describe, expect, it } from 'vitest';
import { gesturePose } from './actors';

describe('gesturePose', () => {
  it('is all zero at the start of a gesture (eased in)', () => {
    const p = gesturePose('wave', 0, 1.2);
    expect(p.right[0]).toBeCloseTo(0, 9);
    expect(p.right[2]).toBeCloseTo(0, 9);
    expect(p.left).toEqual([0, 0, 0]);
    expect(p.pitch).toBeCloseTo(0, 9);
    expect(p.bob).toBeCloseTo(0, 9);
  });

  it('holds the point pose mid-gesture', () => {
    const p = gesturePose('point', 0.6, 1.2);
    expect(p.right[0]).toBeCloseTo(-1.55, 6);
    expect(p.right[1]).toBeCloseTo(0, 6);
    expect(p.right[2]).toBeCloseTo(0, 6);
  });

  it('bows most at the middle of the gesture', () => {
    const mid = gesturePose('bow', 0.6, 1.2).pitch;
    const early = gesturePose('bow', 0.1, 1.2).pitch;
    expect(mid).toBeGreaterThan(early);
    expect(mid).toBeCloseTo(0.6, 6);
  });

  it('is all zero for sit and stand', () => {
    for (const name of ['sit', 'stand'] as const) {
      const p = gesturePose(name, 0.6, 1.2);
      expect(p.left).toEqual([0, 0, 0]);
      expect(p.right).toEqual([0, 0, 0]);
      expect(p.pitch).toBe(0);
      expect(p.bob).toBe(0);
    }
  });
});
