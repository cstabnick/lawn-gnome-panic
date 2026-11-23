// The mount sequence (mount.ts): every vehicle can be got into from any side, closed vehicles use their doors, a driver
// can be yanked out first, and the vehicle is only seated (and so drivable) once the sequence has finished.
import { describe, expect, it } from 'vitest';
import { MOUNT, VEHICLES } from './config';
import { beginMount, climbSeconds, doorsOf, mountStyleOf, seatWorld, stepMount, toWorld, type MountFrame, type MountSeq } from './mount';
import { exitLocal } from './seats';
import type { Vehicle, VehicleKind } from './types';

const DT = 1 / 60;

/** A stand-in vehicle (no scene, no prefab): just the fields the sequence reads. */
function fakeVehicle(kind: VehicleKind, x = 0, z = 0, yaw = 0, speed = 0): Vehicle {
  return {
    id: 1, kind, spec: VEHICLES[kind], x, y: 0, z, yaw, speed, vy: 0, driver: 'none', tint: 0,
    object: null as never, rider: null, riderLook: null, wheelSpin: 0, steerVis: 0, hp: 1, damage: 0, lastHit: 0,
  } as unknown as Vehicle;
}

/** Runs a sequence to its end. Returns every frame and the events in order. */
function run(seq: MountSeq, maxSeconds = 20): { frames: MountFrame[]; events: string[] } {
  const frames: MountFrame[] = [];
  const events: string[] = [];
  for (let i = 0; i < maxSeconds / DT && !seq.done; i++) {
    const f = stepMount(seq, DT);
    frames.push(f);
    if (f.event) events.push(f.event);
  }
  return { frames, events };
}

const dist = (a: { x: number; z: number }, b: { x: number; z: number }) => Math.hypot(a.x - b.x, a.z - b.z);
const CLOSED: VehicleKind[] = ['hoa-van', 'snail-coach'];
const OPEN: VehicleKind[] = ['push-bike', 'ride-on', 'zero-turn', 'combine', 'plane', 'whirligig', 'lowrider', 'boot-float', 'mulch-spreader'];

describe('vehicle mount support', () => {
  it('every closed vehicle has doors, and each door sits on the side it is named for', () => {
    for (const kind of CLOSED) {
      const v = fakeVehicle(kind);
      expect(v.spec.openTop).toBe(false);
      expect(doorsOf(v).length).toBeGreaterThan(0);
      for (const d of doorsOf(v)) {
        expect(Math.sign(d.at[0])).toBe(d.side === 'left' ? 1 : -1);
        expect(d.pivot).toBe(d.side === 'left' ? 'door-left' : 'door-right');
      }
    }
  });

  it('open-top vehicles have no doors and every vehicle has a climb style', () => {
    for (const kind of OPEN) {
      const v = fakeVehicle(kind);
      expect(doorsOf(v)).toEqual([]);
      expect(mountStyleOf(v)).toBeTruthy();
    }
  });

  it('climbs vary by vehicle: a high seat takes longer than a low one', () => {
    expect(climbSeconds(fakeVehicle('combine'))).toBeGreaterThan(climbSeconds(fakeVehicle('push-bike')));
    const styles = new Set([...OPEN, ...CLOSED].map((k) => mountStyleOf(fakeVehicle(k))));
    expect(styles.size).toBeGreaterThanOrEqual(3);
  });
});

describe('getting in', () => {
  it('reaches the seat from every side of an open-top mower, and only reports seated at the end', () => {
    const v = fakeVehicle('ride-on', 10, -5, 0.4);
    const seat = seatWorld(v);
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      const start = { x: v.x + Math.sin(a) * 4, y: 0, z: v.z + Math.cos(a) * 4 };
      const seq = beginMount('enter', v, start);
      const { frames, events } = run(seq);
      expect(seq.done).toBe(true);
      expect(events).toEqual(['seated']);
      expect(frames.findIndex((f) => f.event === 'seated')).toBe(frames.length - 1);
      const end = frames[frames.length - 1].pose;
      expect(dist(end, seat)).toBeLessThan(0.05);
      expect(end.seated).toBe(true);
    }
  });

  it('stands on the nearest rim point, not the far side, when it walks round', () => {
    const v = fakeVehicle('zero-turn', 0, 0, 0);
    const seq = beginMount('enter', v, { x: 5, y: 0, z: 0 });
    // The first walking frame heads for the side nearest the gnome (+x, the left).
    const first = stepMount(seq, DT);
    expect(first.pose.x).toBeGreaterThan(0);
    const { frames } = run(seq);
    const reach = frames.find((f) => f.pose.reach > 0);
    expect(reach).toBeDefined();
    expect(Math.hypot(reach!.pose.x, reach!.pose.z)).toBeCloseTo(v.spec.radius + MOUNT.standOff, 1);
  });

  it('can mount a moving vehicle: the gnome chases the rim and still gets in', () => {
    const v = fakeVehicle('hoa-van', 0, 0, 0, 12);
    const seq = beginMount('enter', v, { x: 3, y: 0, z: 0 });
    const { events } = run(seq);
    expect(events).toEqual(['seated']);
  });

  it('a closed vehicle opens its nearest door, then closes it as the gnome settles in', () => {
    const v = fakeVehicle('hoa-van');
    const seq = beginMount('enter', v, { x: -6, y: 0, z: 1 });
    expect(seq.door).toBe(1); // the right-hand door (-x) is nearer
    expect(seq.phases).toContain('door');
    let maxOpen = 0;
    let sawOpenWhilePhase = false;
    let frame: MountFrame | undefined;
    for (let i = 0; i < 20 / DT && !seq.done; i++) {
      frame = stepMount(seq, DT);
      if (frame.door) {
        maxOpen = Math.max(maxOpen, frame.door.open);
        if (frame.door.open >= 1 && frame.pose.climb > 0) sawOpenWhilePhase = true;
      }
    }
    expect(frame?.door?.pivot).toBe('door-right');
    expect(maxOpen).toBe(1);
    expect(sawOpenWhilePhase).toBe(true);
    expect(frame?.door?.open).toBeCloseTo(0, 1);
  });

  it('a closed vehicle keeps its door in the sequence: an open-top one never does', () => {
    expect(beginMount('enter', fakeVehicle('hoa-van'), { x: 0, y: 0, z: 9 }).phases).toContain('door');
    expect(beginMount('enter', fakeVehicle('ride-on'), { x: 0, y: 0, z: 9 }).phases).not.toContain('door');
  });
});

describe('getting out', () => {
  it('climbs out of an open-top vehicle to the ground on the left side and reports stood', () => {
    const v = fakeVehicle('ride-on', 0, 0, 0);
    const seq = beginMount('exit', v, seatWorld(v));
    const { events, frames } = run(seq);
    expect(events).toEqual(['stood']);
    const end = frames[frames.length - 1].pose;
    expect(end.seated).toBe(false);
    expect(end.y).toBeCloseTo(0, 3);
    expect(end.x).toBeCloseTo(v.spec.radius + 0.8, 1);
  });

  it('leaves a closed vehicle through its first door, opening it first', () => {
    const v = fakeVehicle('snail-coach');
    const seq = beginMount('exit', v, seatWorld(v));
    expect(seq.phases[0]).toBe('door');
    const { frames, events } = run(seq);
    expect(events).toEqual(['stood']);
    expect(frames.some((f) => f.door && f.door.open >= 1)).toBe(true);
    const doorGround = toWorld(v, -(Math.abs(doorsOf(v)[0].at[0]) + MOUNT.standOff), 0, doorsOf(v)[0].at[2]);
    expect(dist(frames[frames.length - 1].pose, doorGround)).toBeLessThan(0.05);
  });
});

describe('yanking a driver out', () => {
  it('pulls the driver out before the climb, and reports the pull first and the seat last', () => {
    const v = fakeVehicle('ride-on', 0, 0, 0);
    v.rider = {} as never;
    const seq = beginMount('yank', v, { x: 4, y: 0, z: 0 });
    const { frames, events } = run(seq);
    expect(events).toEqual(['pulled', 'seated']);
    const pulled = frames.findIndex((f) => f.event === 'pulled');
    const pullFrames = frames.slice(0, pulled + 1).filter((f) => f.rider);
    expect(pullFrames.length).toBeGreaterThan(0);
    // The driver ends on the gnome's side, lying over (rolled a quarter turn).
    const last = pullFrames[pullFrames.length - 1].rider!;
    expect(last.x).toBeGreaterThan(0);
    expect(Math.abs(last.roll)).toBeCloseTo(Math.PI / 2, 1);
  });

  it('a closed vehicle is yanked through its door', () => {
    const v = fakeVehicle('hoa-van');
    const seq = beginMount('yank', v, { x: -5, y: 0, z: 1 });
    expect(seq.phases).toEqual(['walk', 'reach', 'door', 'pull', 'climb', 'settle']);
    expect(run(seq).events).toEqual(['pulled', 'seated']);
  });
});

describe('the vehicle is not drivable until the sequence is done', () => {
  it('no frame before the last reports seated, so the game cannot take the wheel early', () => {
    const v = fakeVehicle('combine');
    const seq = beginMount('enter', v, { x: 5, y: 0, z: 2 });
    const frames: MountFrame[] = [];
    for (let i = 0; i < 30 / DT && !seq.done; i++) frames.push(stepMount(seq, DT));
    expect(frames.slice(0, -1).some((f) => f.event === 'seated' || f.done)).toBe(false);
    expect(frames[frames.length - 1].done).toBe(true);
  });
});

describe('ride height', () => {
  it('a lifted or slammed body moves the seat the sequence climbs into (rig.seatLift)', () => {
    for (const lift of [0.3, -0.08]) {
      const v = fakeVehicle('ride-on', 3, 4, 0.7);
      const stockSeat = seatWorld(v);
      (v as { rig?: unknown }).rig = { seatLift: lift };
      const seat = seatWorld(v);
      expect(seat.y).toBeCloseTo(stockSeat.y + lift, 6);
      expect(seat.x).toBeCloseTo(stockSeat.x, 6);
      expect(seat.z).toBeCloseTo(stockSeat.z, 6);
      const seq = beginMount('enter', v, { x: v.x + 4, y: 0, z: v.z });
      const { frames } = run(seq);
      expect(frames[frames.length - 1].pose.y).toBeCloseTo(seat.y, 2);
    }
  });
});

describe('exiting from a named seat', () => {
  it('a passenger on a parked ride-on starts in its own seat and stands at its own exit spot', () => {
    const v = fakeVehicle('ride-on', 0, 0, 0);
    const seq = beginMount('exit', v, seatWorld(v, 1), 1);
    const { frames } = run(seq);
    expect(dist(frames[0].pose, seatWorld(v, 1))).toBeLessThan(0.05);
    expect(dist(frames[0].pose, seatWorld(v, 0))).toBeGreaterThan(0.3);
    const e = exitLocal(v.spec, 1);
    const want = toWorld(v, e.x, 0, e.z);
    expect(dist(frames[frames.length - 1].pose, want)).toBeLessThan(0.01);
  });
});
