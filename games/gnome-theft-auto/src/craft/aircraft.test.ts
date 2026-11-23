import { describe, expect, it } from 'vitest';
import { VEHICLES } from '../config';
import { heightAt } from '../terrain';
import type { DriveControls, Vehicle, World } from '../types';
import { stepAircraft } from './aircraft';

const NO_INPUT: DriveControls = { throttle: 0, steer: 0, lift: 0 };

function fakeCopter(y: number, driver: Vehicle['driver']): Vehicle {
  return {
    id: 1, kind: 'sycamore-copter', spec: VEHICLES['sycamore-copter'], x: 480, y, z: -80, yaw: 0, speed: 0, vy: 0,
    driver, hp: 1,
  } as unknown as Vehicle;
}

const WORLD = { boxes: [], half: 900 } as unknown as World;

describe('stepAircraft', () => {
  it('lift 1 for 2 s raises the copter', () => {
    const v = fakeCopter(heightAt(480, -80) + 2, 'player');
    const start = v.y;
    const noDamage = (): void => { throw new Error('no damage expected'); };
    for (let i = 0; i < 120; i++) stepAircraft(v, { ...NO_INPUT, lift: 1 }, 1 / 60, WORLD, noDamage);
    expect(v.y).toBeGreaterThan(start + 1);
  });

  it('an unpowered copter dropped from 60 m calls the damage callback on landing', () => {
    const floor = heightAt(480, -80);
    const v = fakeCopter(floor + 60, 'none');
    let damaged = 0;
    const damage = (_v: Vehicle, amount: number): void => { damaged += amount; };
    for (let i = 0; i < 60 * 60 && damaged === 0; i++) stepAircraft(v, NO_INPUT, 1 / 60, WORLD, damage);
    expect(damaged).toBeGreaterThan(0);
    expect(v.y).toBeGreaterThanOrEqual(floor - 0.01);
  });
});
