// Visual body roll (FX04, D31): the roll settles per kind from sideways acceleration. Run: npx vitest run src/bodyRoll.test.ts
import { describe, expect, it } from 'vitest';
import { VEHICLES } from './config';
import { bodyRollOf, stepBodyRoll } from './bodyRoll';
import type { Vehicle, VehicleKind } from './types';

const DEG = Math.PI / 180;
const FRAME = 1 / 60;

interface Fake { rig?: object; y?: number; driver?: string; specKind?: VehicleKind }

/** A fake vehicle: no chassis sim, so the lean reads speed x yaw rate like Arcade. */
function make(kind: VehicleKind, extra: Fake = {}): Vehicle {
  const spec = VEHICLES[extra.specKind ?? kind];
  return {
    id: 1, kind, spec, x: 0, y: extra.y ?? 0, z: 0, yaw: 0, speed: 12, vy: 0, driver: extra.driver ?? 'npc',
    rig: extra.rig, tint: 0, object: null, rider: null, riderLook: null,
  } as unknown as Vehicle;
}

/** Drive `secs` at a steady yaw rate (rad/s; + = yaw increasing = a left turn for this convention) and return the roll. */
function turn(v: Vehicle, yawRate: number, secs: number): void {
  for (let i = 0; i < secs / FRAME; i++) {
    v.yaw += yawRate * FRAME;
    stepBodyRoll(v, FRAME);
  }
}

describe('visual body roll', () => {
  it('a Deux-Pots turning left rolls onto its outside springs, 8-10 degrees, with no bank', () => {
    const v = make('deux-pots', { rig: {} });
    turn(v, 1.2, 2); // 12 m/s x 1.2 rad/s = 14.4 m/s^2 sideways: full lean
    const { shell, bank } = bodyRollOf(v);
    expect(shell).toBeGreaterThan(8 * DEG);
    expect(shell).toBeLessThan(10 * DEG);
    expect(bank).toBe(0);
  });

  it('a Wespa turning right banks into the turn, 10-15 degrees, with no shell', () => {
    const v = make('wespa');
    turn(v, -1.2, 2);
    const { shell, bank } = bodyRollOf(v);
    expect(bank).toBeGreaterThan(10 * DEG);
    expect(bank).toBeLessThan(15 * DEG);
    expect(shell).toBe(0);
  });

  it('an HOA van rolls less than 2 degrees', () => {
    const v = make('hoa-van', { rig: {} });
    turn(v, 1.2, 2);
    expect(Math.abs(bodyRollOf(v).shell)).toBeLessThan(2 * DEG);
    expect(bodyRollOf(v).bank).toBe(0);
  });

  it('a car without a sprung shell tips its whole body, capped at 0.06 rad', () => {
    const v = make('hoa-van');
    turn(v, 1.2, 2);
    const { bank, shell } = bodyRollOf(v);
    expect(Math.abs(bank)).toBeLessThanOrEqual(0.06 + 1e-9);
    expect(shell).toBe(0);
  });

  it('a vehicle with no roll stays level', () => {
    // A kind with no profile (so no roll) on a ground vehicle's spec.
    const v = make('no-profile' as VehicleKind, { specKind: 'wespa' });
    turn(v, 1.2, 2);
    expect(bodyRollOf(v)).toEqual({ bank: 0, shell: 0 });
  });

  it('a vehicle that has never been stepped reads zero', () => {
    expect(bodyRollOf(make('deux-pots', { rig: {} }))).toEqual({ bank: 0, shell: 0 });
  });

  it('eases back to level when airborne', () => {
    const v = make('deux-pots', { rig: {} });
    turn(v, 1.2, 2);
    expect(bodyRollOf(v).shell).toBeGreaterThan(8 * DEG);
    v.y = 2; // two metres over flat ground
    turn(v, 1.2, 1);
    expect(Math.abs(bodyRollOf(v).shell)).toBeLessThan(0.01);
  });

  it('stays finite at a coarse step and across a 180-degree yaw jump', () => {
    const v = make('deux-pots', { rig: {} });
    for (let i = 0; i < 40; i++) {
      v.yaw += i === 20 ? Math.PI : 0.05;
      stepBodyRoll(v, 0.05);
      const { shell, bank } = bodyRollOf(v);
      expect(Number.isFinite(shell)).toBe(true);
      expect(Number.isFinite(bank)).toBe(true);
    }
  });
});
