// Where the air-and-sea craft are parked, as data, and one call to spawn any of them by kind (the trainer and the later
// hangar / boathouse storage use spawnCraft). Positions are offsets from the Desert Airfield's centre in world axes
// (the runway runs along x at z = airfield.z; the Crop Dusters stand on the north apron at z + 18).
import type * as THREE from 'three';
import { pushOutOfBoxes } from '../collide';
import { VEHICLES } from '../config';
import { createVehicle } from '../vehicles';
import type { Vehicle, VehicleKind, World } from '../types';

/** The three aircraft this workstream added (all spec.air). */
export const AIR_KINDS: readonly VehicleKind[] = ['hedge-hopper', 'sycamore-copter', 'dandelion-drifter'];

export interface CraftSpawn {
  kind: VehicleKind;
  /** Offset from the airfield centre, world axes, metres. */
  dx: number;
  dz: number;
  yaw: number;
}

/** Parked at the Desert Airfield: the Hedge-Hopper on the apron beside the Crop Dusters, nose down the runway; the
 *  Sycamore Copter and the Dandelion Drifter further east on open ground north of the strip. */
export const CRAFT_SPAWNS: readonly CraftSpawn[] = [
  { kind: 'hedge-hopper', dx: -15, dz: 18, yaw: Math.PI / 2 },
  { kind: 'sycamore-copter', dx: 22, dz: 26, yaw: Math.PI },
  { kind: 'dandelion-drifter', dx: 50, dz: 28, yaw: Math.PI },
];

/** World positions for CRAFT_SPAWNS, each nudged out of any building it would stand in. */
export function craftSpawnPoints(world: Pick<World, 'airfield' | 'boxes'>): { kind: VehicleKind; x: number; z: number; yaw: number }[] {
  return CRAFT_SPAWNS.map((s) => {
    const p = pushOutOfBoxes(world.airfield.x + s.dx, world.airfield.z + s.dz, VEHICLES[s.kind].radius, world.boxes, 0);
    return { kind: s.kind, x: p.x, z: p.z, yaw: s.yaw };
  });
}

/** Build any vehicle kind at a spot (boats float, aircraft sit on the ground). The caller pushes it into the vehicle list. */
export function spawnCraft(scene: THREE.Scene, kind: VehicleKind, x: number, z: number, yaw: number): Vehicle {
  return createVehicle(scene, kind, x, z, yaw);
}

/** Spawn every CRAFT_SPAWNS craft into `vehicles` (app.ts calls it once after the world is built). */
export function spawnAirfieldCraft(scene: THREE.Scene, world: World, vehicles: Vehicle[]): Vehicle[] {
  const made = craftSpawnPoints(world).map((p) => spawnCraft(scene, p.kind, p.x, p.z, p.yaw));
  vehicles.push(...made);
  return made;
}
