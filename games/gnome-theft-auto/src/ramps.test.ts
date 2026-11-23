import { describe, expect, it } from 'vitest';
import { VehicleController, v3 } from '@lawn/vehicle';
import { VEHICLES } from './config';
import { DEFAULT_MODE_ID, tuneById, vehicleConfig } from './handling';
import { rampContactAt, rampGroundProbe, pushOutOfRampSides, rampNormal, attachRampGround } from './ramps';
import { STUNT_RAMPS } from './stunts';
import { heightAt, terrainProbe } from './terrain';

const ramp = STUNT_RAMPS.find((r) => r.id === 'greenhouse-neon')!;
const hl = ramp.length / 2;
const hw = ramp.width / 2;

/** World point at a ramp-frame position (yaw 0 here: along = +z, across = +x). */
const at = (along: number, across: number) => ({ x: ramp.x + across, z: ramp.z + along });

describe('rampGroundProbe', () => {
  it('a straight-down cast from above the ramp centre hits the slope, tilted back', () => {
    const probe = rampGroundProbe(terrainProbe());
    const surfaceY = heightAt(ramp.x, ramp.z) + ramp.height / 2;
    const hit = probe.cast(v3(ramp.x, surfaceY + 2, ramp.z), v3(0, -1, 0), 50);
    expect(hit).not.toBeNull();
    expect(hit!.distance).toBeCloseTo(2, 1);
    expect(hit!.point.y).toBeCloseTo(surfaceY, 1);
    expect(hit!.normal.y).toBeGreaterThan(0.9);
    expect(hit!.normal.z).toBeLessThan(-0.1);
  });

  it('a cast outside every footprint equals the base probe', () => {
    const base = terrainProbe();
    const probe = rampGroundProbe(base);
    const origin = v3(-300, 5, -300);
    const dir = v3(0, -1, 0);
    expect(probe.cast(origin, dir, 50)?.distance).toBeCloseTo(base.cast(origin, dir, 50)!.distance, 9);
  });

  it('a cast starting below the ramp top, beside the lip, does not hit the ramp', () => {
    const probe = rampGroundProbe(terrainProbe());
    const p = at(hl - 0.3, 0);
    const origin = v3(p.x, heightAt(p.x, p.z) + 0.5, p.z);
    const hit = probe.cast(origin, v3(0, -1, 0), 50);
    expect(hit).not.toBeNull();
    expect(hit!.distance).toBeCloseTo(0.5, 2);
  });
});

describe('pushOutOfRampSides', () => {
  it('a circle beside the middle of a ramp at ground height is pushed out sideways', () => {
    const r = 1.4;
    const p = at(0, hw + 0.5);
    const out = pushOutOfRampSides(p.x, p.z, r, 0);
    expect(out.hit).toBe(true);
    expect(out.x).toBeCloseTo(ramp.x + hw + r, 6);
    expect(out.z).toBeCloseTo(p.z, 6);
    expect(out.nx).toBeCloseTo(1, 6);
  });

  it('just past the lip, facing back, a circle is pushed out of the lip end', () => {
    const r = 1.4;
    const p = at(hl + 0.5, 0);
    const out = pushOutOfRampSides(p.x, p.z, r, 0);
    expect(out.hit).toBe(true);
    expect(out.z).toBeCloseTo(ramp.z + hl + r, 6);
    expect(out.x).toBeCloseTo(p.x, 6);
    expect(out.nz).toBeCloseTo(1, 6);
  });

  it('at the low entry end a circle is not pushed', () => {
    const p = at(-hl - 0.5, 0);
    expect(pushOutOfRampSides(p.x, p.z, 1.4, 0).hit).toBe(false);
    const q = at(-hl + 0.5, hw + 0.5);
    expect(pushOutOfRampSides(q.x, q.z, 1.4, 0).hit).toBe(false);
  });

  it('a circle whose base is above the slope is not pushed', () => {
    const p = at(0, hw + 0.5);
    expect(pushOutOfRampSides(p.x, p.z, 1.4, 2.0).hit).toBe(false);
  });
});

describe('rampContactAt and rampNormal', () => {
  it('finds the ramp under a point and its slope height', () => {
    const c = rampContactAt(ramp.x, ramp.z);
    expect(c?.ramp.id).toBe('greenhouse-neon');
    expect(c?.elev).toBeCloseTo(ramp.height / 2, 6);
    expect(rampContactAt(ramp.x + hw + 1, ramp.z)).toBeNull();
  });

  it('the normal is unit length and tilted back from the lip', () => {
    const n = rampNormal(ramp);
    expect(Math.hypot(n.x, n.y, n.z)).toBeCloseTo(1, 9);
    expect(n.z).toBeLessThan(0);
  });
});

describe('ramp as ground for the physics chassis (the bug)', () => {
  /** Drive a chassis up the ramp at 18 m/s, from 8 m before its entry, and record how high the body gets above the ground. */
  function driveUp(withRamp: boolean): { maxHeight: number; progress: number } {
    const base = terrainProbe();
    const ctrl = new VehicleController(
      vehicleConfig(VEHICLES['zero-turn'], tuneById(DEFAULT_MODE_ID)!),
      { ground: withRamp ? rampGroundProbe(base) : base },
    );
    if (withRamp) attachRampGround(ctrl);
    const startZ = ramp.z - hl - 8;
    ctrl.place(v3(ramp.x, heightAt(ramp.x, startZ), startZ), ramp.yaw, 18);
    const dt = 1 / 60;
    let maxHeight = 0;
    for (let i = 0; i < 3 * 60; i++) {
      ctrl.update(dt, { steer: 0, throttle: 0.6, brake: 0, handbrake: 0, source: 'keyboard' });
      const b = ctrl.body.pos;
      maxHeight = Math.max(maxHeight, b.y - heightAt(b.x, b.z));
    }
    return { maxHeight, progress: ctrl.body.pos.z - ramp.z };
  }

  it('with the ramp probe the car rides up and off the lip, well past the ramp centre', () => {
    const { maxHeight, progress } = driveUp(true);
    expect(maxHeight).toBeGreaterThan(1.5);
    expect(progress).toBeGreaterThan(hl + 8);
  });

  it('without the ramp probe the car drives through the wedge and stays low', () => {
    const { maxHeight } = driveUp(false);
    expect(maxHeight).toBeLessThan(0.8);
  });
});
