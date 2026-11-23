// Real game vehicles (vehicles.ts createVehicle, glaze looks included) as scene actors: spawned from a ScriptVehicle,
// posed each frame from a VehicleSample (wheels turn, body leans on its suspension, headlights), seats for actors.
import type * as THREE from 'three';
import { normalizeLoadout } from '@lawn/glaze';
import { VEHICLES } from '../config';
import { coverLift } from '../seatCover';
import { heightAt, waterAt } from '../terrain';
import type { Vehicle, VehicleKind } from '../types';
import { createVehicle, removeVehicle, setVehicleHeadlights, setVehicleLook, syncVehicleMesh } from '../vehicles';
import type { ScriptVehicle, Vec3, VehicleSample } from './script';

/** How a kind moves: on wheels, afloat, or in the air. */
export function vehicleMode(kind: VehicleKind): 'ground' | 'boat' | 'air' {
  const s = VEHICLES[kind];
  return s.boat ? 'boat' : s.flies ? 'air' : 'ground';
}

/** Where a vehicle of `kind` sits at (x, z): the water surface for boats (if any), else the ground. */
export function vehicleGroundFor(kind: VehicleKind, x: number, z: number): number {
  if (vehicleMode(kind) === 'boat') {
    const w = waterAt(x, z);
    if (w) return w.surface - (VEHICLES[kind].draft ?? 0.25);
  }
  return heightAt(x, z);
}

/** Puts a game vehicle on stage from a ScriptVehicle: stock or Pay 'n' Glaze look, parked, lights as scripted. */
export function spawnSceneVehicle(scene: THREE.Scene, def: ScriptVehicle): Vehicle {
  const [x, z] = def.at.length === 2 ? def.at : [def.at[0], def.at[2]];
  const v = createVehicle(scene, def.kind, x, z, def.yaw ?? 0, def.tint);
  v.y = def.at.length === 3 ? def.at[1] : vehicleGroundFor(def.kind, x, z);
  if (def.loadout && v.look) setVehicleLook(v, normalizeLoadout({ ...v.look, ...def.loadout }, v.tint));
  v.questOwned = true;
  v.driver = 'none';
  setVehicleHeadlights([v], !!def.headlights);
  v.object.visible = !def.hidden;
  syncVehicleMesh(v, 0);
  return v;
}

/** Puts the vehicle where the sample says, and animates it for dt (wheels, suspension, steering, headlights). */
export function poseSceneVehicle(v: Vehicle, s: VehicleSample, dt: number): void {
  // The scripted pose replaces the physics chassis; the director gives the player's vehicle a fresh one afterwards.
  if (v.sim) v.sim = undefined;
  v.x = s.x;
  v.y = s.y;
  v.z = s.z;
  v.yaw = s.yaw;
  v.speed = s.speed;
  v.vy = 0;
  v.steerVis += (s.steer - v.steerVis) * Math.min(1, dt * 6);
  // A driving vehicle has a driver, so the body works its suspension.
  v.driver = s.driving ? 'npc' : 'none';
  v.object.visible = s.visible;
  setVehicleHeadlights([v], s.headlights);
  // A boat's pitch and roll settle towards level; syncVehicleMesh reads them.
  if (v.boat) {
    v.boat.pitch *= 0.95;
    v.boat.roll *= 0.95;
  }
  syncVehicleMesh(v, dt);
}

/** A seat's position in the vehicle root's local space (0 = driver). */
export function seatLocal(v: Vehicle, seat: number): Vec3 {
  const p = seat > 0 && v.spec.passengerSeats?.[seat - 1] ? v.spec.passengerSeats[seat - 1] : v.spec.seat;
  return [p[0], p[1] + (v.rig?.seatLift ?? 0) + coverLift(v, seat), p[2]];
}

/** Takes a scene vehicle off stage. */
export function removeSceneVehicle(scene: THREE.Scene, v: Vehicle): void {
  removeVehicle(scene, v);
}
