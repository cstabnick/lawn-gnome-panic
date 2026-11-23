import { describe, expect, it } from 'vitest';
import type { Vehicle } from './types';
import { runOverHit } from './runOver';
import { heightAt } from './terrain';
import { WORLD_HALF } from './config';

const BODY_R = 0.4;
const DT = 0.05;

/** A vehicle heading +z (yaw 0) at (x, z), on the ground, moving at `speed`. */
function car(x: number, z: number, speed: number, lift = 0): Vehicle {
  return {
    x, y: heightAt(x, z) + lift, z, yaw: 0, speed, driver: 'none', spec: { radius: 1.4 },
  } as unknown as Vehicle;
}

describe('runOverHit', () => {
  it('hits a gnome the car crosses in one frame at 34 m/s (from 1.5 m before to 0.2 m past)', () => {
    const gx = 0, gz = 0;
    // Current position 0.2 m past the gnome; last frame it was 1.5 m before it (34 m/s * 0.05 s = 1.7 m per frame).
    const v = car(gx, gz + 0.2, 34);
    expect(runOverHit(v, gx, gz, BODY_R, DT)).toBe(true);
  });

  it('hits a gnome that the car left behind this frame, even though its current position is outside the circle', () => {
    const gx = 0, gz = 0;
    // Now 1.8 m past the gnome: outside the current circle (1.4 * 0.9 + 0.4 = 1.66 m), but last frame it was 0.1 m
    // short of the gnome, so the path passed through its reach. A point test at the current position misses this.
    const v = car(gx, gz + 1.8, 34);
    expect(runOverHit(v, gx, gz, BODY_R, DT)).toBe(true);
  });

  it('does not hit at 5 m/s (below the minimum speed)', () => {
    const gx = 0, gz = 0;
    const v = car(gx, gz + 0.2, 5);
    expect(runOverHit(v, gx, gz, BODY_R, DT)).toBe(false);
  });

  it('does not hit a gnome beside the path', () => {
    const v = car(0, 0, 34);
    expect(runOverHit(v, 3, -1, BODY_R, DT)).toBe(false);
  });

  it('does not hit when the vehicle is 2 m above the ground under it', () => {
    const gx = 0, gz = 0;
    const v = car(gx, gz + 0.2, 34, 2);
    expect(runOverHit(v, gx, gz, BODY_R, DT)).toBe(false);
  });

  it('hits on raised ground when the vehicle sits on it', () => {
    // Find a point where the ground is well above 1.5 m; if the terrain has none, the test fails loudly.
    let px = NaN, pz = NaN;
    search: for (let x = -WORLD_HALF; x <= WORLD_HALF; x += 8) {
      for (let z = -WORLD_HALF; z <= WORLD_HALF; z += 8) {
        if (heightAt(x, z) > 2.5) { px = x; pz = z; break search; }
      }
    }
    expect(Number.isFinite(px)).toBe(true);
    const h = heightAt(px, pz);
    const v = car(px, pz + 0.2, 34);
    v.y = h;
    expect(runOverHit(v, px, pz, BODY_R, DT)).toBe(true);
  });
});
