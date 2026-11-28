import { describe, expect, it } from 'vitest';
import { FOLLOW_S, nudgeOffMarkers, swingAngles, teeMarkerSpots } from './swingPose';

describe('marker nudge', () => {
  it('moves a spot at least 0.7 m off a marker and leaves a far spot alone', () => {
    const marks = teeMarkerSpots({ tee: { x: 0, z: 0 }, path: [{ x: 0, z: 0 }, { x: 0, z: 10 }] });
    expect(marks.length).toBe(2);
    const n = nudgeOffMarkers(marks[0].x + 0.2, marks[0].z, marks);
    expect(Math.hypot(n.x - marks[0].x, n.z - marks[0].z)).toBeGreaterThanOrEqual(0.69);
    expect(nudgeOffMarkers(0, 0, marks)).toEqual({ x: 0, z: 0 });
  });
});

const finite = (p: ReturnType<typeof swingAngles>): boolean =>
  [p.armL, p.armR, p.body].every((v) => !!v && v.every(Number.isFinite));

describe('swingAngles', () => {
  it('gives finite angles for every phase and charge', () => {
    for (const ph of ['walk', 'aim', 'swing', 'flight'] as const) {
      for (const c of [0, 0.3, 1, 2]) expect(finite(swingAngles(ph, c, -1))).toBe(true);
    }
  });
  it('raises the arms with the charge', () => {
    const lo = swingAngles('swing', 0, -1).armR!;
    const hi = swingAngles('swing', 1, -1).armR!;
    expect(hi[0]).toBeLessThan(lo[0]);
  });
  it('follow-through is finite and ends at address', () => {
    for (let t = 0; t <= FOLLOW_S; t += 0.03) expect(finite(swingAngles('flight', 1, t))).toBe(true);
    const end = swingAngles('flight', 1, FOLLOW_S);
    const addr = swingAngles('aim', 0, -1);
    expect(end.armR![0]).toBeCloseTo(addr.armR![0], 5);
  });
});
