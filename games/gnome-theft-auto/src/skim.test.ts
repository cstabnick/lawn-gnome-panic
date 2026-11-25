// Skimming over deep water (E27 L114): stepSkim unit cases, then both drive models at Loch Moss.
import { describe, expect, it, vi } from 'vitest';
import { VEHICLES } from './config';
import { bedAt, waterAt } from './terrain';
import { SKIM, hopVelocity, skimSurfaceAt, stepSkim } from './skim';
import { checkSink } from './swim';
import type { SkimEvent } from './skim';
import type { Vehicle, World } from './types';

vi.mock('./audio', () => ({ play: () => undefined }));
(globalThis as { location?: { search: string } }).location ??= { search: '' };
const { stepVehicle } = await import('./vehicles');
const { createSimDrive, stepChassis } = await import('./simdrive');

const world = { boxes: [], half: 3000 } as unknown as World;
const DT = 1 / 30;
const CX = -700, CZ = -680;
const KIND = 'zero-turn' as const;

function rec(x: number, z: number, y: number, yaw: number, speed: number): Vehicle {
  return {
    id: 1, kind: KIND, spec: VEHICLES[KIND], x, y, z, yaw, speed, vy: 0, driver: 'player', tint: 0, object: {} as never,
    rider: null, riderLook: null, wheelSpin: 0, steerVis: 0, hp: 1, damage: 0, lastHit: 0,
  } as unknown as Vehicle;
}

/** A start point and heading in the loch that stay over deep water for `len` metres. */
function openWater(len = 90): { x: number; z: number; yaw: number } {
  for (let a = 0; a < 360; a += 10) {
    const yaw = (a * Math.PI) / 180;
    let ok = true;
    for (let d = 0; d <= len && ok; d += 2) ok = skimSurfaceAt(CX + Math.sin(yaw) * d, CZ + Math.cos(yaw) * d) !== null;
    if (ok) return { x: CX, z: CZ, yaw };
  }
  throw new Error('no open water line from the loch centre');
}

describe('stepSkim', () => {
  const surface = waterAt(CX, CZ)!.surface;
  const at = (x: number, z: number) => rec(x, z, surface, 0, 20);
  it('starts at 20 m/s on the surface, not at 10 m/s, never on land', () => {
    const v = at(CX, CZ);
    expect(stepSkim(v, 20, surface, 0.6, 1 / 30)).toBe(true);
    expect(v.skim!.event).toBe('start');
    const slow = at(CX, CZ);
    expect(stepSkim(slow, 10, surface, 0.3, 1 / 30)).toBe(false);
    const land = rec(0, 0, 0, 0, 20);
    expect(stepSkim(land, 20, 0, 0.6, 1 / 30)).toBe(false);
    expect(land.skim!.event).toBeNull();
  });
  it('ends when it slows below keepSpeed', () => {
    const v = at(CX, CZ);
    stepSkim(v, 20, surface, 0.6, 1 / 30);
    expect(stepSkim(v, 5, surface, 0.1, 1 / 30)).toBe(false);
    expect(v.skim!.event).toBe('end');
  });
  it('hops are capped', () => { expect(hopVelocity(100)).toBe(SKIM.hopVyMax); });
});

function tally(ev: SkimEvent | null | undefined, s: { started: boolean; bounces: number; ended: boolean }): void {
  if (ev === 'start') s.started = true;
  else if (ev === 'bounce') s.bounces++;
  else if (ev === 'end') s.ended = true;
}

describe('arcade skim', () => {
  function run(speed: number) {
    const p = openWater();
    const w = waterAt(p.x, p.z)!;
    const v = rec(p.x, p.z, w.surface, p.yaw, speed);
    const s = { started: false, bounces: 0, ended: false };
    let dist = 0, sunkAt = -1;
    for (let i = 0; i < 8 * 30; i++) {
      stepVehicle(v, { steer: 0, throttle: 1, lift: 0 } as never, DT, world);
      tally(v.skim?.event, s);
      if (v.skim?.event === 'end') dist = v.skim.dist;
      checkSink(v);
      if (v.sunk && sunkAt < 0) sunkAt = i * DT;
    }
    return { ...s, dist, sunk: !!v.sunk, sunkAt };
  }
  it('25 m/s skims, bounces, then sinks', () => {
    const r = run(25);
    console.log('arcade 25', r);
    expect(r.started).toBe(true);
    expect(r.bounces).toBeGreaterThanOrEqual(1);
    expect(r.dist).toBeGreaterThan(15);
    expect(r.dist).toBeLessThan(60);
    expect(r.sunk).toBe(true);
  });
  it('10 m/s just sinks', () => {
    const r = run(10);
    expect(r.started).toBe(false);
    expect(r.sunk).toBe(true);
    expect(r.sunkAt).toBeLessThan(1);
  });
});

describe('sim skim', () => {
  function run(speed: number) {
    const p = openWater();
    const w = waterAt(p.x, p.z)!;
    const v = rec(p.x, p.z, w.surface, p.yaw, speed);
    const sd = createSimDrive(v);
    // createSimDrive stands the chassis on the bed; lift it to the surface as if it had just left a jump.
    sd.ctrl.body.pos.y += w.surface - bedAt(p.x, p.z);
    console.log('sim vel', sd.ctrl.body.vel.x, sd.ctrl.body.vel.z);
    const s = { started: false, bounces: 0, ended: false };
    let dist = 0, sunk = false;
    for (let i = 0; i < 8 * 30; i++) {
      stepChassis(v, sd, { steer: 0, throttle: 1, brake: 0, handbrake: 0, source: 'keyboard' }, DT, world);
      tally(v.skim?.event, s);
      if (v.skim?.event === 'end') dist = v.skim.dist;
      if (checkSink(v)) sunk = true;
      if (v.sunk) break;
    }
    return { ...s, dist, sunk };
  }
  it('25 m/s skims at least 10 m with a bounce', () => {
    const r = run(25);
    console.log('sim 25', r);
    expect(r.started).toBe(true);
    expect(r.bounces).toBeGreaterThanOrEqual(1);
    expect(r.dist).toBeGreaterThan(10);
  });
  it('8 m/s never starts', () => {
    expect(run(8).started).toBe(false);
  });
});
