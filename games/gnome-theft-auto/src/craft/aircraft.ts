// Game glue for spec.air aircraft: reads the floor, runs flight.ts stepAir with the owned tuning, collides with buildings,
// and reports damage through the callback (vehicles.ts passes damageVehicle).
import type { DriveControls, Vehicle, World } from '../types';
import { play } from '../audio';
import { sweepCircleBoxes, wallBounce, clampToWorld } from '../collide';
import { deckSurfaceBelow } from '../highways/deck';
import { heightAt, waterAt } from '../terrain';
import { initAir, stepAir } from './flight';
import { applyAirTune } from './tuning';
import { getCraftTune } from './craftTuneStore';
import type { AirStepResult } from './model';

/** Building hits below this speed (m/s) do no damage; above it, each m/s over costs 1/WALL_SCALE of the hit points. Same as vehicles.ts CRASH_MIN / CRASH_SCALE. */
const WALL_MIN = 5;
const WALL_SCALE = 45;
/** Rising ground hits below this speed (m/s) do no damage. */
const GROUND_MIN = 10;

/** Last air step result per vehicle id (lastAirEvent reads it). */
const lastResults = new Map<number, AirStepResult>();

/** The floor under a point: the highest of ground, a bridge or skyway deck under `y`, and the water surface. */
export function floorUnder(x: number, z: number, y: number): { y: number; water: boolean } {
  const ground = heightAt(x, z);
  const deck = deckSurfaceBelow(x, z, y + 0.5) ?? -Infinity;
  const surface = waterAt(x, z)?.surface ?? -Infinity;
  const top = Math.max(ground, deck, surface);
  return { y: top, water: surface > -Infinity && surface === top };
}

/** Step one spec.air aircraft for a frame. `damage(v, amount)` takes hit points off (vehicles.ts damageVehicle). */
export function stepAircraft(
  v: Vehicle,
  c: DriveControls,
  dt: number,
  world: World,
  damage: (v: Vehicle, amount: number) => void,
): AirStepResult {
  const zero: AirStepResult = { touchdownSpeed: 0, damage: 0, liftedOff: false, stallStarted: false };
  if (!v.spec.air) return zero;
  if (!v.air) v.air = initAir();
  const st = v.air;
  const spec = v.driver === 'player' ? applyAirTune(v.spec.air, getCraftTune(v.kind)) : v.spec.air;
  const powered = (v.driver === 'player' || v.driver === 'npc' || v.driver === 'police') && v.hp > 0 && !v.waterlogStalled;

  const x0 = v.x;
  const z0 = v.z;
  const f = floorUnder(v.x, v.z, v.y);
  const r = stepAir(
    v, st, spec,
    { throttle: c.throttle, steer: c.steer, lift: c.lift, powered },
    { floorY: f.y, water: f.water },
    dt,
  );

  // Buildings.
  const sw = sweepCircleBoxes(x0, z0, v.x, v.z, v.spec.radius, world.boxes, v.y);
  v.x = sw.x;
  v.z = sw.z;
  if (sw.hit) {
    const sin = Math.sin(v.yaw);
    const cos = Math.cos(v.yaw);
    const b = wallBounce(sin * v.speed, cos * v.speed, sw.nx, sw.nz);
    v.speed = b.vx * sin + b.vz * cos;
    if (v.driver === 'player' && b.impact > 6) play('bump');
    if (b.impact > WALL_MIN) damage(v, ((b.impact - WALL_MIN) / WALL_SCALE) * 1.5);
  }

  // World edge.
  const kept = clampToWorld(v.x, v.z, world.half, v.spec.radius);
  v.x = kept.x;
  v.z = kept.z;
  if (kept.hit) v.speed *= 0.5;

  // Rising ground, a deck or the water under the aircraft.
  const f2 = floorUnder(v.x, v.z, v.y);
  if (v.y < f2.y - 0.3) {
    // Flew into a hillside or a deck edge: a real hit.
    if (Math.abs(v.speed) > GROUND_MIN) damage(v, (Math.abs(v.speed) - GROUND_MIN) / 60);
    v.y = f2.y;
    v.vy = 0;
    v.speed *= 0.3;
    st.airborne = false;
  } else if (v.y < f2.y) {
    // Taxiing or skimming up a gentle slope: follow the ground.
    v.y = f2.y;
    if (v.vy < 0) v.vy = 0;
  }

  if (r.damage > 0) damage(v, r.damage);
  if (r.touchdownSpeed > spec.safeTouchdown && v.driver === 'player') play('bump');

  lastResults.set(v.id, r);
  return r;
}

/** The last step's result for the aircraft with this vehicle id (craftRuntime.ts toasts stalls and hard landings). */
export function lastAirEvent(id: number): AirStepResult | undefined {
  return lastResults.get(id);
}
