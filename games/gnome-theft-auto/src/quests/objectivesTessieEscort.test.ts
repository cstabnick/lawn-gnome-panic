import { describe, expect, it, vi } from 'vitest';

// The runner module imports the vehicle code, whose audio module touches `window` at load time. The pure helpers
// tested here need none of it, so a bare stand-in is enough.
vi.hoisted(() => {
  (globalThis as { window?: unknown }).window = { addEventListener() {}, removeEventListener() {} };
});

const { advanceAlong, isRam } = await import('./objectivesTessieEscort');

describe('advanceAlong', () => {
  const route: [number, number][] = [[0, 0], [10, 0], [10, 10]];

  // `i` is the index of the next route point to reach.
  it('walks toward the next point and keeps its index', () => {
    const r = advanceAlong(route, 1, 0, 0, 4);
    expect(r.x).toBeCloseTo(4);
    expect(r.z).toBeCloseTo(0);
    expect(r.i).toBe(1);
    expect(r.arrived).toBe(false);
  });

  it('carries leftover distance across a corner', () => {
    const r = advanceAlong(route, 1, 8, 0, 5);
    expect(r.i).toBe(2);
    expect(r.x).toBeCloseTo(10);
    expect(r.z).toBeCloseTo(3);
  });

  it('reports arrival once the last point is reached', () => {
    const r = advanceAlong(route, 2, 10, 9, 5);
    expect(r.arrived).toBe(true);
    expect(r.x).toBeCloseTo(10);
    expect(r.z).toBeCloseTo(10);
  });
});

describe('isRam', () => {
  it('needs enough speed and a close boat', () => {
    expect(isRam(5, 8, 4.2, 5)).toBe(true);
    expect(isRam(-6, 8, 4.2, 5)).toBe(true);
    expect(isRam(3, 8, 4.2, 5)).toBe(false);
    expect(isRam(6, 20, 4.2, 5)).toBe(false);
  });
});
