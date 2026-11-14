// src/vehicles.ts: rideable mowers and the combine. STUB: filled in by epic 2.
import * as THREE from 'three';
import { VEHICLE_SLOTS, VEHICLES, type Game, type Soldier, type Vehicle, type VehicleControl } from './config';
import { createMowerModel } from './models/mowerModels';

/** Creates one vehicle per VEHICLE_SLOTS entry at its slot, adds the models to the scene. */
export function createVehicles(scene: THREE.Scene): Vehicle[] {
  return VEHICLE_SLOTS.map((slot, i) => {
    const def = VEHICLES[slot.kind];
    const model = createMowerModel(slot.kind);
    model.group.scale.setScalar(def.scale);
    model.group.position.set(slot.x, 0, slot.z);
    model.group.rotation.y = slot.yaw;
    scene.add(model.group);
    return {
      id: i, def, home: { x: slot.x, z: slot.z, yaw: slot.yaw }, team: slot.team,
      pos: new THREE.Vector3(slot.x, 0, slot.z), yaw: slot.yaw, speed: 0,
      hp: def.maxHp, alive: true, respawnT: 0, driver: null, model,
    };
  });
}

/** The closest alive, driverless vehicle within reach of a living soldier on foot, or null. */
export function nearestEnterable(game: Game, s: Soldier): Vehicle | null {
  void game; void s;
  return null;
}

/** Puts a soldier in the driver seat (no checks beyond the vehicle being free). */
export function enterVehicle(game: Game, s: Soldier, v: Vehicle): void {
  void game; void s; void v;
}

/** Gets a soldier out, beside the vehicle. */
export function exitVehicle(game: Game, s: Soldier): void {
  void game; void s;
}

/** Sets this frame's control for a vehicle. Call every frame while driving; a vehicle with no control this frame brakes. */
export function driveVehicle(v: Vehicle, ctl: VehicleControl): void {
  void v; void ctl;
}

/** Applies damage; at hp <= 0 the vehicle is destroyed (explosion, driver killed) and respawns later at home. */
export function damageVehicle(game: Game, v: Vehicle, amount: number, by: Soldier | null): void {
  void game; void v; void amount; void by;
}

/** Driving physics, terrain following, collisions, running soldiers over, respawns, model animation. */
export function updateVehicles(game: Game, dt: number): void {
  void game; void dt;
}
