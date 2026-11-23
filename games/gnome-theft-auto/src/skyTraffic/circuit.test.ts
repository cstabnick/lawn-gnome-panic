// The Flight School Circuit flown end to end by the follower on flat ground: parked, taxi, takeoff roll, climb, the
// pattern, approach, touchdown, rollout and back to the apron, believable heights throughout.
import { describe, expect, it } from 'vitest';
import { followSpecFor, newFollow, stepFollow } from './follow';
import { airfieldCircuit } from './routes';
import type { SkyBody } from './types';

describe('airfield circuit', () => {
  it('takes off, flies the pattern, lands on the runway and taxis back', () => {
    const af = { x: 480, z: -110, yaw: Math.PI / 2, length: 170 };
    const route = airfieldCircuit(af, { x: 440, z: -132, yaw: af.yaw });
    const spec = followSpecFor('hedge-hopper');
    const b: SkyBody = { x: 440, y: 0, z: -132, yaw: Math.PI / 2, speed: 0, vy: 0, pitch: 0, roll: 0 };
    const st = newFollow(route, b, 0);
    const dt = 1 / 30;
    const reached: number[] = [];
    let maxY = 0;
    let yAtRotate = -1;
    let yAtTouchdown = -1;
    for (let t = 0; t < 400 && !st.done; t += dt) {
      const r = stepFollow(b, st, spec, 0, dt);
      if (r >= 0) {
        reached.push(r);
        if (r === 3) yAtRotate = b.y;
        if (r === 9) yAtTouchdown = b.y;
      }
      maxY = Math.max(maxY, b.y);
      expect(b.y).toBeGreaterThanOrEqual(0);
    }
    expect(reached).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
    expect(st.done).toBe(true);
    // Still on the runway at the rotate point, up at pattern height, back on the ground at touchdown.
    expect(yAtRotate).toBeLessThan(0.5);
    expect(maxY).toBeGreaterThan(50);
    expect(yAtTouchdown).toBeLessThan(1.5);
    expect(b.y).toBeLessThan(0.5);
    // Back near the apron.
    expect(Math.hypot(b.x - 440, b.z + 132)).toBeLessThan(25);
  });
});
