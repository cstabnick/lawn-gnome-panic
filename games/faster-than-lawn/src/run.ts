// The persistent run: the player's mower, scrap and map. Lives in the Phaser game registry.
import Phaser from 'phaser';
import { generateSector } from './sim/sector';
import { makePlayerShip } from './sim/ships';
import type { Beacon, SectorMap, ShipState } from './sim/types';

export interface RunState {
  ship: ShipState;
  scrap: number;
  sector: SectorMap;
  beaconId: number;  // beacon the mower is parked at
  jumps: number;
}

const REGISTRY_KEY = 'run';

export function newRun(rng: () => number = Math.random): RunState {
  return { ship: makePlayerShip(), scrap: 30, sector: generateSector(rng), beaconId: 0, jumps: 0 };
}

/** Get the current run, creating one if none exists. */
export function getRun(scene: Phaser.Scene): RunState {
  let run = scene.registry.get(REGISTRY_KEY) as RunState | undefined;
  if (!run) {
    run = newRun();
    scene.registry.set(REGISTRY_KEY, run);
  }
  return run;
}

/** Start a fresh run (TitleScene / GameOverScene call this before going to the map). */
export function resetRun(scene: Phaser.Scene): RunState {
  const run = newRun();
  scene.registry.set(REGISTRY_KEY, run);
  return run;
}

export function currentBeacon(run: RunState): Beacon {
  return run.sector.beacons[run.beaconId];
}

/** Tier of the fight at a beacon: its column, clamped to 1..5. */
export function beaconTier(beacon: Beacon): number {
  return Math.max(1, Math.min(5, beacon.column));
}
