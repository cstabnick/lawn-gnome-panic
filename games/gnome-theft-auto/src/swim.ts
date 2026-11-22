// Gnomes and mowers in water (Wild World Epic 4; lore ruling in docs/lore/rulings.md): fired clay gnomes are hollow and
// bob upright like a fishing float; mowers that drive into deep water conk out and sink, and come back later.
import { WATER } from './config';
import { bedAt, heightAt, waterAt } from './terrain';
import type { Vehicle } from './types';

/** 'dry' on land (or on a bridge), 'wade' in water shallower than WATER.wadeDepth, 'bob' in deeper water. */
export type SwimState = 'dry' | 'wade' | 'bob';

/** How a gnome whose feet are at world (x, y, z) stands in the water. */
export function swimState(x: number, y: number, z: number): SwimState {
  const w = waterAt(x, z);
  if (!w || y > w.surface + 0.05) return 'dry';
  return w.depth < WATER.wadeDepth ? 'wade' : 'bob';
}

/** Metres a sunk mower settles toward the bed each second. */
const SINK_SPEED = 1.5;

/**
 * A ground vehicle (not a boat, not a flyer) at its current position: if its wheels are in water deeper than
 * WATER.stallDepth, it conks out: sets v.sunk = true, v.sunkT = 0, v.speed = 0. Returns true on the frame it sinks.
 */
export function checkSink(v: Vehicle): boolean {
  if (v.spec.boat || v.spec.flies || v.sunk || v.exploded) return false;
  const w = waterAt(v.x, v.z);
  if (!w || w.depth <= WATER.stallDepth || v.y >= w.surface - 0.2) return false;
  v.sunk = true;
  v.sunkT = 0;
  v.speed = 0;
  v.vy = 0;
  v.boostActive = false;
  v.sim = undefined;
  if (v.headlights) v.headlights.visible = false;
  return true;
}

/**
 * Every frame: sunk vehicles settle onto the bed; after WATER.sinkRespawnS, once the player is farther than
 * WATER.respawnClear, each comes back at its v.home, dry (sunk = false), and `repair(v)` is called (app.ts passes
 * vehicles.ts repairVehicle; swim.ts must not import vehicles.ts, which imports it).
 */
export function stepSunk(
  vehicles: readonly Vehicle[], dt: number, playerX: number, playerZ: number, repair?: (v: Vehicle) => void,
): void {
  for (const v of vehicles) {
    if (!v.sunk) continue;
    v.sunkT = (v.sunkT ?? 0) + dt;
    v.speed = 0;
    const bed = bedAt(v.x, v.z);
    v.y = Math.max(bed, v.y - SINK_SPEED * dt);

    const home = v.home;
    if (!home || v.sunkT < WATER.sinkRespawnS) continue;
    const clear = WATER.respawnClear;
    if (Math.hypot(v.x - playerX, v.z - playerZ) <= clear) continue;
    if (Math.hypot(home.x - playerX, home.z - playerZ) <= clear) continue;

    v.x = home.x;
    v.z = home.z;
    v.yaw = home.yaw;
    v.y = heightAt(home.x, home.z);
    v.sunk = false;
    v.sunkT = 0;
    v.driver = 'none';
    repair?.(v);
  }
}
