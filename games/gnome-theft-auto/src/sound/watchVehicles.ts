// Watches every other vehicle each frame and makes it heard: engine and siren loops, crashes, skids, horns,
// explosions, sinking. (Stub: filled in by Epic 2.)
import type { Vehicle } from '../types';

export interface VehicleSoundFrame {
  dt: number;
  vehicles: readonly Vehicle[];
  /** The vehicle the player drives or rides (its own sounds come from audio.ts), or null on foot. */
  playerVehicle: Vehicle | null;
  playerX: number;
  playerZ: number;
  /** Wanted level (watch.heat floored), 0..5. */
  heat: number;
  /** Ambulances on their way (ambulance.ts sirens()). */
  ambulances: readonly { x: number; z: number }[];
}

export interface VehicleSounds {
  update(f: VehicleSoundFrame): void;
}

export function createVehicleSounds(): VehicleSounds {
  return { update() {} };
}
