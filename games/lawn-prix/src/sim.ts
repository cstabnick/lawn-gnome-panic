// STUB (Epic 2 fills this in): the race simulation, pure functions of plain data. No three.js, no DOM, no Math.random.
import type { KartInput, KartState, RaceState, VehicleId } from './config';
import { RACE } from './config';
import { gridSlot } from './track';

/** A new race: one kart per entry, on grid slots 0..n-1, at rest. skill: 1 for humans, RACE.cpuSkill[i] for CPUs. */
export function createRace(entries: readonly { vehicle: VehicleId; skill: number }[], laps: number = RACE.laps): RaceState {
  const karts: KartState[] = entries.map((e, i) => {
    const g = gridSlot(i);
    return { vehicle: e.vehicle, x: g.x, z: g.z, h: g.h, vx: 0, vz: 0, st: 0, s: g.s, dist: g.dist, lap: 0,
      drift: 0, charge: 0, boost: 0, off: false, skill: e.skill, fin: null };
  });
  return { t: 0, laps, karts, firstFin: null, over: false };
}

/** Advance one kart by dt (driving physics, drift/boost, off-track, progress and laps). Does not touch race.t. */
export function stepKart(k: KartState, input: KartInput | null, dt: number, raceT: number, laps: number): void {
  void k; void input; void dt; void raceT; void laps;
}

/** Push overlapping karts apart and bounce them (mass-weighted). Returns the indices of karts that bumped this step. */
export function resolveBumps(karts: KartState[]): number[] {
  void karts;
  return [];
}

/** One fixed step of the whole race: every kart, then bumps, then finish bookkeeping. inputs[i] may be null (coast). */
export function stepRace(race: RaceState, inputs: readonly (KartInput | null)[], dt: number): void {
  race.t += dt;
  void inputs;
}

/** Places by index: 0 = 1st. Finished karts by fin time, then the rest by dist (further = better). Ties share. */
export function racePlaces(race: RaceState): number[] {
  return race.karts.map(() => 0);
}

/** A CPU driver: follow the racing line a little ahead, full throttle, drift in long corners. Pure, deterministic. */
export function cpuInput(race: RaceState, index: number): KartInput {
  void race; void index;
  return { steer: 0, throttle: 1, drift: false };
}
