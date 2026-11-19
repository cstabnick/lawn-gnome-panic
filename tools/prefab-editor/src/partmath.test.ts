import { describe, expect, it } from 'vitest';
import type { Part } from '@lawn/prefabs';
import { centreOf, deltaAbout, transformParts } from './partmath';

const parts: Part[] = [
  { s: 'box', d: [0.1, 0.1, 0.1], at: [0.1, 0, 0], c: 'red' },
  { s: 'box', d: [0.1, 0.1, 0.1], at: [-0.1, 0, 0], rot: [0, 0, 10], c: 'red' },
  { s: 'ball', d: [0.05], at: [0, 0.5, 0], c: 'red' },
];

describe('moving several parts as one', () => {
  it('finds the centre of the selection', () => {
    expect(centreOf(parts, [0, 1]).toArray()).toEqual([0, 0, 0]);
  });

  it('moves every selected part by the same amount and leaves the rest', () => {
    const out = transformParts(parts, [0, 1], deltaAbout(centreOf(parts, [0, 1]), [0, 0.2, 0]));
    expect(out.get(0)).toEqual({ at: [0.1, 0.2, 0] });
    expect(out.get(1)!.at).toEqual([-0.1, 0.2, 0]);
    expect(out.get(1)!.rot).toEqual([0, 0, 10]);
    expect(out.has(2)).toBe(false);
  });

  it('turns the group about its centre, turning each part too', () => {
    const out = transformParts(parts, [0, 1], deltaAbout(centreOf(parts, [0, 1]), [0, 0, 0], [0, 90, 0]));
    const a = out.get(0)!;
    expect(a.at[0]).toBeCloseTo(0);
    expect(a.at[2]).toBeCloseTo(-0.1);
    expect(a.rot![1]).toBeCloseTo(90);
    const b = out.get(1)!;
    expect(b.at[2]).toBeCloseTo(0.1);
  });
});
