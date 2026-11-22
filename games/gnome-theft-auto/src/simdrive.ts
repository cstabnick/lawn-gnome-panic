// Driving model for every ground vehicle the player drives: @lawn/vehicle (raycast chassis, Pacejka tyres, assists), shaped by
// the vehicle's profile and setup (handling.ts). Traffic and the flyers (Crop Duster, Whirligig) stay arcade.
// "Driving realism" is a CHEAT in Options (options.ts): the default is the Casual sim; Arcade brings back the original flat model.
// Online play works: remote players see the driven vehicle's broadcast pose (see main.ts).
import { VehicleController, qRotate, qYaw, v3, type TuningValues } from '@lawn/vehicle';
import { play } from './audio';
import { angleDiff, clampToWorld, pushOutOfBoxes } from './collide';
import {
  DEFAULT_MODE_ID, TUNES, clampSetup, profileFor, riderLean, stockSetup, tuneById, vehicleConfig, type Tune,
} from './handling';
import type { InputState, Vehicle, VehicleKind, VehicleSpec, World } from './types';
import { heightAt, terrainFlat, terrainProbe } from './terrain';
import { CRASH_MIN, CRASH_SCALE, damageVehicle } from './vehicles';

export { TUNES, type Tune } from './handling';

const params = new URLSearchParams(location.search);

// ---- Driving mode (realism), saved per browser ---------------------------------------------------------------------------
// A new key: the old `gta-sim-tune` (from the ?drive=sim proof of concept) may hold a mode picked while trying it out.
const MODE_KEY = 'gta-driving-mode';
const GARAGE_KEY = 'gta-garage';

function readStore(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}
function writeStore(key: string, value: string): void {
  try { localStorage.setItem(key, value); } catch { /* storage may be blocked */ }
}

/** ?tune= / ?preset= pick a mode for this visit; ?drive=arcade forces the original model; otherwise the saved mode, otherwise the default. */
function initialTune(): Tune {
  const asked = tuneById(params.get('tune')) ?? tuneById(params.get('preset'));
  if (asked) return asked;
  if (params.get('drive') === 'arcade') return tuneById('arcade')!;
  const saved = tuneById(readStore(MODE_KEY));
  // ?drive=sim means "the physics model", even if arcade was saved.
  if (saved && !(saved.arcade && params.get('drive') === 'sim')) return saved;
  return tuneById(DEFAULT_MODE_ID) ?? TUNES[0];
}
let current: Tune = initialTune();
export const getTune = (): Tune => current;
/** True while the physics model is in use (any mode but Arcade). */
export const simActive = (): boolean => !current.arcade;
export function setTune(id: string): Tune {
  current = tuneById(id) ?? current;
  writeStore(MODE_KEY, current.id);
  return current;
}

// ---- Garage: each vehicle's setup (the 11 knobs), stock until changed. No UI yet; ?debug exposes it as __gta.garage ------------
const garage: Partial<Record<VehicleKind, Partial<TuningValues>>> = (() => {
  try { return JSON.parse(readStore(GARAGE_KEY) ?? '{}') as Partial<Record<VehicleKind, Partial<TuningValues>>>; } catch { return {}; }
})();
/** The setup this vehicle model drives with right now (stock plus anything saved), clamped to its ranges. */
export const getSetup = (kind: VehicleKind): TuningValues => clampSetup(kind, { ...stockSetup(kind), ...garage[kind] });
/** Change some knobs of a vehicle's setup (clamped to its ranges) and save it. Re-create a running chassis with `createSimDrive` to feel it. */
export function setSetup(kind: VehicleKind, patch: Partial<TuningValues>): TuningValues {
  garage[kind] = getSetup(kind);
  garage[kind] = clampSetup(kind, { ...garage[kind], ...patch });
  writeStore(GARAGE_KEY, JSON.stringify(garage));
  return getSetup(kind);
}
export function resetSetup(kind: VehicleKind): TuningValues {
  delete garage[kind];
  writeStore(GARAGE_KEY, JSON.stringify(garage));
  return getSetup(kind);
}

export interface SimDrive {
  ctrl: VehicleController;
  /** Interpolated chassis pose for the mesh: object origin (road level), orientation. */
  px: number; py: number; pz: number;
  qx: number; qy: number; qz: number; qw: number;
  /** What the game saw last frame, to notice outside changes (vehicle bumps, teleports). */
  lastX: number; lastZ: number; lastSpeed: number;
  /** Seconds spent tipped past TIPPED_DEG; the chassis is stood back up after RIGHT_AFTER. */
  tippedT: number;
}

/** The chassis config for one vehicle model in the current mode, with its saved setup. */
export const mowerConfig = (spec: VehicleSpec, tune: Tune = current) => vehicleConfig(spec, tune, getSetup(spec.kind));

export function createSimDrive(v: Vehicle): SimDrive {
  const ctrl = new VehicleController(mowerConfig(v.spec), { ground: terrainProbe() });
  ctrl.place(v3(v.x, heightAt(v.x, v.z), v.z), v.yaw, v.speed);
  const sd: SimDrive = { ctrl, px: v.x, py: 0, pz: v.z, qx: 0, qy: 0, qz: 0, qw: 1, lastX: v.x, lastZ: v.z, lastSpeed: v.speed, tippedT: 0 };
  writePose(v, sd);
  return sd;
}

function writePose(v: Vehicle, sd: SimDrive): void {
  const p = sd.ctrl.renderPose();
  const up = qRotate(p.quat, v3(0, 1, 0));
  const h = sd.ctrl.rideHeight;
  sd.px = p.pos.x - up.x * h;
  sd.py = p.pos.y - up.y * h;
  sd.pz = p.pos.z - up.z * h;
  sd.qx = p.quat.x; sd.qy = p.quat.y; sd.qz = p.quat.z; sd.qw = p.quat.w;
  v.x = sd.px;
  v.z = sd.pz;
  v.y = heightAt(v.x, v.z);
  v.yaw = qYaw(p.quat);
  v.speed = sd.ctrl.telemetry.forwardSpeed;
  sd.lastX = v.x;
  sd.lastZ = v.z;
  sd.lastSpeed = v.speed;
}

/** Lowest the chassis's centre of mass may sit above the terrain (m), on hills. */
const SIM_FLOOR = 0.08;

/** A vehicle tipped past this many degrees for RIGHT_AFTER seconds is stood back up where it is (a safety net: no stock setup should get there). */
const TIPPED_DEG = 70;
const RIGHT_AFTER = 1.5;

/** Step the player's sim-driven vehicle for one frame: game input in, game-space pose out. Returns true on the frame a tipped vehicle is stood back up. */
export function stepSimDrive(v: Vehicle, sd: SimDrive, inp: InputState, dt: number, world: World): boolean {
  const body = sd.ctrl.body;
  // Anything the game did to the vehicle since last frame (a bump pushed it, or slowed it): carry it into the body.
  const dx = v.x - sd.lastX;
  const dz = v.z - sd.lastZ;
  if (Math.abs(dx) + Math.abs(dz) > 1e-4) { body.pos.x += dx; body.pos.z += dz; }
  if (Math.abs(sd.lastSpeed) > 0.5 && v.speed !== sd.lastSpeed) {
    const k = v.speed / sd.lastSpeed;
    body.vel.x *= k; body.vel.z *= k;
  }

  const binary = !inp.pad && (inp.moveX === 0 || Math.abs(inp.moveX) === 1);
  sd.ctrl.update(dt, {
    steer: inp.moveX,
    throttle: Math.max(0, inp.moveY),
    brake: Math.max(0, -inp.moveY),
    handbrake: inp.lift > 0 ? 1 : 0,
    source: inp.pad ? 'gamepad' : binary ? 'keyboard' : 'stick',
  });

  // Buildings and the world edge: push the chassis out and bleed its speed, as the arcade model does.
  const impact = Math.hypot(body.vel.x, body.vel.z);
  const pushed = pushOutOfBoxes(body.pos.x, body.pos.z, v.spec.radius, world.boxes, heightAt(body.pos.x, body.pos.z));
  if (pushed.hit) {
    body.pos.x = pushed.x; body.pos.z = pushed.z;
    body.vel.x *= 0.35; body.vel.z *= 0.35;
    if (impact > 6) play('bump');
    if (impact > CRASH_MIN) damageVehicle(v, (impact - CRASH_MIN) / CRASH_SCALE);
  }
  const kept = clampToWorld(body.pos.x, body.pos.z, world.half, v.spec.radius);
  if (kept.hit) { body.pos.x = kept.x; body.pos.z = kept.z; body.vel.x *= 0.5; body.vel.z *= 0.5; }
  // Bump stop on hills: @lawn/vehicle has none, so hitting the foot of a slope at top speed (about 2 g of extra load) bottoms
  // the short mower suspension out and the body sinks into the ground. Keep its centre of mass above the terrain. Off
  // while the terrain is flat, so the flat world drives exactly as before.
  if (!terrainFlat()) {
    const floor = heightAt(body.pos.x, body.pos.z) + SIM_FLOOR;
    if (body.pos.y < floor) { body.pos.y = floor; if (body.vel.y < 0) body.vel.y = 0; }
  }

  // Safety net: stuck on its side or roof for a moment, stand it back up in place, facing where it was heading.
  const tilt = Math.acos(Math.min(1, qRotate(body.quat, v3(0, 1, 0)).y)) * (180 / Math.PI);
  sd.tippedT = tilt > TIPPED_DEG ? sd.tippedT + dt : 0;
  let righted = false;
  if (sd.tippedT > RIGHT_AFTER) {
    sd.ctrl.place(v3(body.pos.x, heightAt(body.pos.x, body.pos.z), body.pos.z), qYaw(body.quat), 0);
    sd.tippedT = 0;
    righted = true;
  }

  writePose(v, sd);
  v.steerVis += (sd.ctrl.input.steer - v.steerVis) * Math.min(1, 8 * dt);
  return righted;
}

// ---- Rider weight shift ----------------------------------------------------------------------------------------------------
const lean = { id: -1, prevYaw: 0, accel: 0, angle: 0 };

/**
 * The seated rider's roll (radians, + = towards the rider's right) for this frame. The body is thrown to the outside of a
 * turn, so turning left leans the rider right. Sideways acceleration comes from the chassis telemetry under the sim and from
 * speed x yaw rate under Arcade, so both models lean. Pass null when not riding; it eases back to upright.
 */
export function updateRiderLean(v: Vehicle | null, dt: number): number {
  if (!v || v.spec.flies || dt <= 0) {
    lean.id = -1;
    lean.angle = 0;
    return 0;
  }
  if (lean.id !== v.id) { lean.id = v.id; lean.prevYaw = v.yaw; lean.accel = 0; lean.angle = 0; }
  let raw: number;
  if (v.sim) raw = v.sim.ctrl.telemetry.latAccelRight;
  else raw = (-angleDiff(v.yaw, lean.prevYaw) / dt) * v.speed;
  lean.prevYaw = v.yaw;
  lean.accel += (raw - lean.accel) * Math.min(1, 10 * dt);
  const target = riderLean(lean.accel, profileFor(v.kind));
  lean.angle += (target - lean.angle) * Math.min(1, 8 * dt);
  return lean.angle;
}
