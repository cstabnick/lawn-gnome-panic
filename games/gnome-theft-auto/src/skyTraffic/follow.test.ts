import { describe, it, expect } from 'vitest';
import { newFollow, stepFollow, followSpecFor } from './follow';
import type { SkyBody, SkyWaypoint } from './types';

const DT = 1 / 30;

function body(over: Partial<SkyBody> = {}): SkyBody {
  return { x: 0, y: 0, z: 0, yaw: 0, speed: 0, vy: 0, pitch: 0, roll: 0, ...over };
}

describe('followSpecFor', () => {
  it('marks rotor craft as hover and fixed-wing craft as not', () => {
    expect(followSpecFor('sycamore-copter').hover).toBe(true);
    expect(followSpecFor('plane').hover).toBe(false);
    expect(followSpecFor('hedge-hopper').hover).toBe(false);
  });
});

describe('stepFollow', () => {
  it('flies a fixed-wing square route and reaches every waypoint in order', () => {
    const route: SkyWaypoint[] = [
      { x: 0, z: 600, agl: 50, speed: 35 },
      { x: 600, z: 600, agl: 50, speed: 35 },
      { x: 600, z: 0, agl: 50, speed: 35 },
      { x: 0, z: 0, agl: 50, speed: 35 },
    ];
    const b = body({ y: 50, speed: 35 });
    const spec = followSpecFor('hedge-hopper');
    const st = newFollow(route, b);
    const reached: number[] = [];
    for (let s = 0; s < 120 / DT && !st.done; s++) {
      const r = stepFollow(b, st, spec, 0, DT);
      if (r >= 0) reached.push(r);
    }
    expect(reached).toEqual([0, 1, 2, 3]);
    expect(st.done).toBe(true);
  });

  it('holds at a ground waypoint: speed falls to 0 and the body stays put', () => {
    const route: SkyWaypoint[] = [
      { x: 0, z: 50, agl: 0, speed: 5, ground: true, hold: 2 },
      { x: 0, z: 200, agl: 0, speed: 5, ground: true },
    ];
    const b = body();
    const spec = followSpecFor('hedge-hopper');
    const st = newFollow(route, b);
    // Fly until the first waypoint is reached.
    let arrivedAt: { x: number; z: number } | null = null;
    for (let s = 0; s < 60 / DT; s++) {
      if (stepFollow(b, st, spec, 0, DT) === 0) { arrivedAt = { x: b.x, z: b.z }; break; }
    }
    expect(arrivedAt).not.toBeNull();
    // Hold for the full 2 s: stays within 2 m, and the speed reaches 0.
    let maxDrift = 0;
    for (let s = 0; s < 2 / DT && st.holdT > 0; s++) {
      stepFollow(b, st, spec, 0, DT);
      maxDrift = Math.max(maxDrift, Math.hypot(b.x - arrivedAt!.x, b.z - arrivedAt!.z));
    }
    expect(maxDrift).toBeLessThan(2);
    expect(b.speed).toBe(0);
    expect(st.i).toBe(1);
  });

  it('flies a vertical loop: y rises above 90, pitch passes PI, then pitch is 0 and the route advances', () => {
    const route: SkyWaypoint[] = [
      { x: 0, z: 20, agl: 50, speed: 30, loop: 25 },
      { x: 0, z: 400, agl: 50, speed: 30 },
    ];
    const b = body({ y: 50, speed: 30 });
    const spec = followSpecFor('hedge-hopper');
    const st = newFollow(route, b);
    let maxY = -Infinity;
    let maxPitch = -Infinity;
    for (let s = 0; s < 30 / DT && st.i === 0; s++) {
      stepFollow(b, st, spec, 0, DT);
      if (st.loopT >= 0) {
        maxY = Math.max(maxY, b.y);
        maxPitch = Math.max(maxPitch, b.pitch);
      }
    }
    expect(maxY).toBeGreaterThan(90);
    expect(maxPitch).toBeGreaterThanOrEqual(Math.PI);
    expect(st.i).toBe(1);
    expect(st.loopT).toBe(-1);
    expect(b.pitch).toBe(0);
  });

  it('glides down to a ground waypoint and never sinks below the floor', () => {
    const route: SkyWaypoint[] = [{ x: 0, z: 300, agl: 0, speed: 8, ground: true }];
    const b = body({ y: 30, speed: 8 });
    const spec = followSpecFor('hedge-hopper');
    const st = newFollow(route, b);
    let minY = Infinity;
    let reachedAt = -1;
    for (let s = 0; s < 120 / DT && !st.done; s++) {
      const r = stepFollow(b, st, spec, 0, DT);
      minY = Math.min(minY, b.y);
      if (r === 0) { reachedAt = b.y; break; }
    }
    expect(reachedAt).toBeGreaterThanOrEqual(0);
    expect(Math.abs(reachedAt)).toBeLessThan(1);
    expect(minY).toBeGreaterThanOrEqual(0);
  });
});
