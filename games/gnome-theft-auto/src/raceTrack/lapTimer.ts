// Free-roam lap timing at the Speedway: drive any ground vehicle over the start line and the lap clock runs; pass every
// checkpoint in order and cross the line again for a lap time. Best laps are saved per vehicle model and overall.
// STUB: filled in by its issue; the exported signatures are the contract.
import type { Vehicle, VehicleKind } from '../types';

export const LAP_SAVE_KEY = 'gta-speedway-laps-v1';

export interface LapInfo {
  /** The lap's time, seconds. */
  time: number;
  kind: VehicleKind;
  /** True when it beat this vehicle model's saved best. */
  personalBest: boolean;
  /** Best lap of any vehicle, seconds (after this lap). */
  overallBest: number;
}

export interface LapTimer {
  /** Per frame, with the vehicle the player drives (null on foot). Stands down while a race runs (state.ts raceActive()). */
  update(dt: number, v: Vehicle | null): void;
  /** Saved best lap for a vehicle model, or overall when no kind is given; null if none. */
  best(kind?: VehicleKind): number | null;
}

export function createLapTimer(ui: HTMLElement, onLap: (info: LapInfo) => void): LapTimer {
  void ui; void onLap;
  return { update() {}, best: () => null };
}
