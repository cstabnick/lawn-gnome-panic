import { describe, expect, it } from 'vitest';
import { GNOME_GAP, newWalker, separateWalkers } from './gnomes';

const dist = (a: { x: number; z: number }, b: { x: number; z: number }) => Math.hypot(a.x - b.x, a.z - b.z);

describe('gnomes bump instead of passing through each other', () => {
  it('pushes two overlapping gnomes apart to the gap', () => {
    const a = newWalker(-0.2, 1.2);
    const b = newWalker(0.1, 1.2);
    separateWalkers(a, b);
    expect(dist(a, b)).toBeGreaterThanOrEqual(GNOME_GAP - 1e-9);
  });

  it('leaves gnomes that are already apart alone', () => {
    const a = newWalker(-1, 1.2);
    const b = newWalker(1, 1.2);
    separateWalkers(a, b);
    expect(a.x).toBe(-1);
    expect(b.x).toBe(1);
  });

  it('a fixed (remote) gnome does not move; the local one takes the push', () => {
    const a = newWalker(0, 1.2);
    const b = newWalker(0.1, 1.2);
    separateWalkers(a, b, true, false);
    expect(a.x).toBe(0);
    expect(dist(a, b)).toBeGreaterThanOrEqual(GNOME_GAP - 1e-9);
  });

  it('keeps pushed gnomes on the floor', () => {
    const a = newWalker(2.45, 0);
    const b = newWalker(2.5, 0);
    separateWalkers(a, b);
    expect(Math.abs(a.x)).toBeLessThanOrEqual(2.5);
    expect(Math.abs(b.x)).toBeLessThanOrEqual(2.5);
  });
});
