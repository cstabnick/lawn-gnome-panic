// Tow physics: a tube pulled by a boat on a rope, lean swings, hops, falls, determinism, scoring.
import { describe, expect, it } from 'vitest';
import { hookPoint, newScore, newTube, scoreStep, stepTube } from './tow';
import { TOW } from './types';
import type { BoatPose, Sea, TubeEvent, TubeInput, TubeState } from './types';

const FLAT: Sea = { surface: () => 0, slope: (_x, _z, out) => { out.x = 0; out.z = 0; } };
const WAVY: Sea = {
  surface: (x) => 0.3 * Math.sin(0.2 * x),
  slope: (x, _z, out) => { out.x = 0.06 * Math.cos(0.2 * x); out.z = 0; },
};
const DT = 1 / 60;
const STILL: TubeInput = { lean: 0, hop: false };

/** A boat driving straight along +z (yaw 0) at `speed`, advanced in place. */
function boatAt(z: number, speed: number): BoatPose {
  return { x: 0, z, yaw: 0, speed, radius: 2.5 };
}

/** Run `secs` of simulation with the boat moving; `input(t)` gives the rider's input and `boatSpeed` the boat speed. */
function run(
  sea: Sea, secs: number, speed: number, input: (t: number) => TubeInput, slot = 0,
): { tube: TubeState; boat: BoatPose; events: TubeEvent[] } {
  let boat = boatAt(0, speed);
  const tube = newTube(boat, slot, sea);
  const events: TubeEvent[] = [];
  const steps = Math.round(secs / DT);
  for (let i = 0; i < steps; i++) {
    const ev = stepTube(tube, boat, input(i * DT), sea, DT);
    if (ev) events.push(ev);
    boat = { ...boat, z: boat.z + speed * DT };
  }
  return { tube, boat, events };
}

describe('the hook point and the first tube', () => {
  it('hooks at the stern, shifted by the slot side offset', () => {
    const b = boatAt(10, 0);
    expect(hookPoint(b, 0)).toEqual({ x: 0, z: 10 - 2.5 });
    const h1 = hookPoint(b, 1); // side +0.6 is the boat's left, (cos yaw, -sin yaw) = (1, 0) at yaw 0
    expect(h1.x).toBeCloseTo(0.6, 6);
    expect(h1.z).toBeCloseTo(7.5, 6);
  });

  it('a new tube sits on the water at its rope length behind the hook, at rest', () => {
    const b = boatAt(0, 0);
    const t = newTube(b, 0, FLAT);
    expect(t.z).toBeCloseTo(-2.5 - 9, 6);
    expect(t.y).toBeCloseTo(TOW.floatY, 6);
    expect([t.vx, t.vy, t.vz]).toEqual([0, 0, 0]);
  });
});

describe('towing', () => {
  for (const [name, sea] of [['flat sea', FLAT], ['sloped sea', WAVY]] as const) {
    it(`pulls a tube from rest to near boat speed in 10 s and keeps it on the rope (${name})`, () => {
      let boat = boatAt(0, 12);
      const tube = newTube(boat, 0, sea);
      for (let i = 0; i < 10 / DT; i++) {
        stepTube(tube, boat, STILL, sea, DT);
        boat = { ...boat, z: boat.z + 12 * DT };
      }
      const speed = Math.hypot(tube.vx, tube.vz);
      expect(Math.abs(speed - 12)).toBeLessThan(2);
      const h = hookPoint(boat, 0);
      const stretch = Math.hypot(h.x - tube.x, h.z - tube.z) - 9;
      expect(stretch).toBeGreaterThanOrEqual(0.5);
      expect(stretch).toBeLessThanOrEqual(2);
    });
  }

  it('lean +1 swings the tube to the boat right of the wake', () => {
    // Short window: a held full lean at 12 m/s throws the rider after ~1.9 s (see the fall test).
    const { tube, boat } = run(FLAT, 0.75, 12, () => ({ lean: 1, hop: false }));
    const right = { x: -Math.cos(boat.yaw), z: Math.sin(boat.yaw) };
    const dot = (tube.x - boat.x) * right.x + (tube.z - boat.z) * right.z;
    expect(tube.fallen).toBe(false);
    expect(dot).toBeGreaterThan(0);
    expect(tube.lean).toBeCloseTo(1, 6);
  });

  it('a hop on the water gives air and a landed event', () => {
    let hopped = false;
    const { events } = run(FLAT, 4, 12, (t) => {
      const hop = !hopped && t >= 3;
      if (hop) hopped = true;
      return { lean: 0, hop };
    });
    const landed = events.find((e) => e?.t === 'landed');
    expect(landed).toBeDefined();
    if (landed?.t === 'landed') expect(landed.air).toBeGreaterThanOrEqual(0.25);
  });

  it('a 25 m/s boat with a hard lean eventually throws the rider', () => {
    const { events, tube } = run(FLAT, 20, 25, () => ({ lean: 1, hop: false }));
    expect(events.some((e) => e?.t === 'fell')).toBe(true);
    expect(tube.fallen).toBe(true);
  });

  it('identical inputs give identical states', () => {
    const input = (t: number): TubeInput => ({ lean: Math.sin(t * 2), hop: Math.floor(t) % 3 === 0 && t % 1 < DT });
    const a = run(WAVY, 8, 15, input).tube;
    const b = run(WAVY, 8, 15, input).tube;
    expect(b).toEqual(a);
  });
});

describe('scoring', () => {
  it('accumulates distance and points while towing', () => {
    const sc = newScore();
    let boat = boatAt(0, 12);
    const tube = newTube(boat, 0, FLAT);
    for (let i = 0; i < 4 / DT; i++) {
      const ev = stepTube(tube, boat, STILL, FLAT, DT);
      scoreStep(sc, tube, ev, DT);
      boat = { ...boat, z: boat.z + 12 * DT };
    }
    expect(sc.dist).toBeGreaterThan(20);
    expect(sc.topSpeed).toBeGreaterThan(0);
    expect(sc.points).toBe(Math.round(sc.dist + sc.air * TOW.airPoints + sc.bigAirs * TOW.bigAirPoints));
  });

  it('a landed event adds air points, and a big air also adds the bonus', () => {
    const t = newTube(boatAt(0, 0), 0, FLAT);
    const sc = newScore();
    scoreStep(sc, t, { t: 'landed', air: 0.5 }, DT);
    expect(sc.air).toBeCloseTo(0.5, 6);
    expect(sc.bigAirs).toBe(0);
    expect(sc.points).toBe(Math.round(0.5 * TOW.airPoints));
    scoreStep(sc, t, { t: 'landed', air: 0.9 }, DT);
    expect(sc.bigAirs).toBe(1);
    expect(sc.points).toBe(Math.round(1.4 * TOW.airPoints + TOW.bigAirPoints));
  });

  it('a fall counts once and stops distance', () => {
    const t = newTube(boatAt(0, 0), 0, FLAT);
    t.fallen = true;
    t.vz = 10;
    const sc = newScore();
    scoreStep(sc, t, { t: 'fell', vx: 0, vy: 4, vz: 10 }, DT);
    expect(sc.falls).toBe(1);
    expect(sc.dist).toBe(0);
  });
});
