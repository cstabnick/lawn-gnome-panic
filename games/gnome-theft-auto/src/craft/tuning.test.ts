import { describe, expect, it } from 'vitest';
import { VEHICLES } from '../config';
import { hullSpecOf } from './hull';
import { NO_TUNE, applyAirTune, applyHullTune, clampTune, statMult, statsFor, tuneCost } from './tuning';

describe('craft tuning', () => {
  it('NO_TUNE leaves an air spec and a hull spec unchanged', () => {
    const air = VEHICLES['hedge-hopper'].air!;
    expect(applyAirTune(air, NO_TUNE)).toEqual(air);
    const hull = hullSpecOf(VEHICLES['gravy-boat']);
    expect(applyHullTune(hull, NO_TUNE)).toEqual(hull);
  });

  it('engine 3 multiplies thrust by 1.24', () => {
    const air = VEHICLES['hedge-hopper'].air!;
    const tuned = applyAirTune(air, { ...NO_TUNE, engine: 3 });
    expect(tuned.thrust).toBeCloseTo(air.thrust * 1.24, 10);
    expect(tuned).not.toBe(air);
  });

  it('lift 3 lowers stall speed by 12% and raises climb rate', () => {
    const air = VEHICLES['hedge-hopper'].air!;
    expect(air.stallSpeed).toBeDefined();
    const tuned = applyAirTune(air, { ...NO_TUNE, lift: 3 });
    expect(tuned.stallSpeed).toBeCloseTo(air.stallSpeed! * 0.88, 10);
    expect(tuned.climbRate).toBeCloseTo(air.climbRate * 1.24, 10);
  });

  it('applies the hull tune to accel, top speed, turn rate and side grip', () => {
    const hull = hullSpecOf(VEHICLES['gravy-boat']);
    const tuned = applyHullTune(hull, { ...NO_TUNE, engine: 1, topSpeed: 2, handling: 3 });
    expect(tuned.accel).toBeCloseTo(hull.accel * 1.08, 10);
    expect(tuned.maxSpeed).toBeCloseTo(hull.maxSpeed * 1.1, 10);
    expect(tuned.turnRate).toBeCloseTo(hull.turnRate * 1.21, 10);
    expect(tuned.sideGrip).toBeCloseTo(hull.sideGrip * 1.21, 10);
    expect(tuned.draft).toBe(hull.draft);
  });

  it('statMult is 1 + step x level, with the level clamped', () => {
    expect(statMult('engine', 0)).toBe(1);
    expect(statMult('engine', 3)).toBeCloseTo(1.24, 10);
    expect(statMult('engine', 9)).toBeCloseTo(1.24, 10);
  });

  it('clampTune rounds and clamps each stat, and gives stock for non-objects', () => {
    expect(clampTune({ engine: 9, topSpeed: -2, handling: 'x', lift: 1.6 })).toEqual({
      engine: 3, topSpeed: 0, handling: 0, lift: 2,
    });
    expect(clampTune(null)).toEqual(NO_TUNE);
    expect(clampTune('nope')).toEqual(NO_TUNE);
  });

  it('tuneCost sums the prices bought; lowering costs nothing', () => {
    expect(tuneCost(NO_TUNE, { ...NO_TUNE, engine: 2 })).toBe(670);
    expect(tuneCost({ ...NO_TUNE, engine: 2 }, NO_TUNE)).toBe(0);
    expect(tuneCost(NO_TUNE, { ...NO_TUNE, lift: 1 })).toBe(230);
  });

  it('statsFor filters by regime', () => {
    expect(statsFor('sea').map((s) => s.id)).not.toContain('lift');
    expect(statsFor('air').map((s) => s.id)).toContain('lift');
  });

  it('does not mutate its inputs', () => {
    const t = { engine: 9, topSpeed: 1, handling: 0, lift: 0 };
    const snapshot = JSON.stringify(t);
    clampTune(t);
    tuneCost(NO_TUNE, t);
    applyAirTune(VEHICLES['hedge-hopper'].air!, t);
    expect(JSON.stringify(t)).toBe(snapshot);
  });
});
