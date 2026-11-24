// Driving model for every ground vehicle the player drives: @lawn/vehicle (raycast chassis, Pacejka tyres, assists), shaped by
// the vehicle's profile and setup (handling.ts). Traffic and the flyers (Crop Duster, Whirligig) stay arcade.
// "Driving realism" is a CHEAT in Options (options.ts): the default is the Casual sim; Arcade brings back the original flat model.
// Online play works: remote players see the driven vehicle's broadcast pose (see main.ts).
import { VehicleController, qRotate, qYaw, v3, type TuningValues, type VehicleInput } from '@lawn/vehicle';
import { play } from './audio';
import { angleDiff, clampToWorld, sweepCircleBoxes, wallBounce } from './collide';
import {
  DEFAULT_MODE_ID, TUNES, clampSetup, profileFor, riderLean, stockSetup, tuneById, vehicleConfig, type Tune,
} from './handling';
import type { InputState, Vehicle, VehicleKind, VehicleSpec, World } from './types';
import { groundAt, terrainFlat, terrainProbe } from './terrain';
import { CRASH_MIN, CRASH_SCALE, damageVehicle } from './vehicles';
import { notifySaveChanged } from './saveHook';

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
  notifySaveChanged();
  return getSetup(kind);
}
export function resetSetup(kind: VehicleKind): TuningValues {
  delete garage[kind];
  writeStore(GARAGE_KEY, JSON.stringify(garage));
  notifySaveChanged();
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

/** The chassis config for one vehicle model in the current mode, with its saved setup and the loadout's ride height (-1..1). */
export const mowerConfig = (spec: VehicleSpec, tune: Tune = current, rideHeight = 0) =>
  vehicleConfig(spec, tune, getSetup(spec.kind), rideHeight);

export function createSimDrive(v: Vehicle): SimDrive {
  return createChassis(v, current, getSetup(v.spec.kind), v.look?.rideHeight ?? 0);
}

/**
 * A sim chassis for `v` with an explicit mode, setup and ride height (createSimDrive uses the player's current mode and
 * saved setup; npcChassis.ts uses the Casual tune and the stock setup, whatever the player picked).
 */
export function createChassis(v: Vehicle, tune: Tune, setup: TuningValues, rideHeight = 0): SimDrive {
  const ctrl = new VehicleController(vehicleConfig(v.spec, tune, setup, rideHeight), { ground: terrainProbe() });
  ctrl.place(v3(v.x, groundAt(v.x, v.z, v.y), v.z), v.yaw, v.speed);
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
  v.y = groundAt(v.x, v.z, sd.py);
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

/**
 * Airtime and landing tuning for every sim chassis (the player's and NPCs'), L55. The controller runs real 9.81 gravity
 * (its tyre loads and springs are tuned for that), so jumps off ramps hang: while no wheel touches the ground the chassis
 * gets `airGravity` m/s^2 of extra pull. On the frame the wheels touch down after a jump, the body's upward velocity is
 * multiplied by `landingRebound` (and keeps doing so for `landingSettle` seconds), so it does not bounce back up.
 * E14's dirt bike and rally jumps rely on these numbers.
 */
export const SIM_AIR = {
  /** Extra downward acceleration while airborne (m/s^2), on top of the controller's 9.81. */
  airGravity: 0,
  /** Upward body velocity kept on touchdown (0..1, 1 = unchanged). */
  landingRebound: 1,
  /** Seconds after touchdown during which landingRebound keeps applying. */
  landingSettle: 0,
};

/** Step the player's sim-driven vehicle for one frame: game input in, game-space pose out. Returns true on the frame a tipped vehicle is stood back up. */
export function stepSimDrive(v: Vehicle, sd: SimDrive, inp: InputState, dt: number, world: World): boolean {
  const binary = !inp.pad && (inp.moveX === 0 || Math.abs(inp.moveX) === 1);
  return stepChassis(v, sd, {
    steer: inp.moveX,
    throttle: Math.max(0, inp.moveY),
    brake: Math.max(0, -inp.moveY),
    handbrake: inp.lift > 0 ? 1 : 0,
    source: inp.pad ? 'gamepad' : binary ? 'keyboard' : 'stick',
  }, dt, world);
}

/**
 * Step any sim chassis one frame from controller input (steer -1..1, throttle/brake/handbrake 0..1; brake from rest
 * reverses): world collision, bump stop, righting, then the game pose (v.x/y/z/yaw/speed). Shared by the player
 * (stepSimDrive) and NPC cars (npcChassis.ts). Returns true on the frame a tipped vehicle is stood back up.
 */
export function stepChassis(v: Vehicle, sd: SimDrive, input: VehicleInput, dt: number, world: World): boolean {
  const body = sd.ctrl.body;
  // Anything the game did to the vehicle since last frame (a bump pushed it, or slowed it): carry it into the body.
  const dx = v.x - sd.lastX;
  const dz = v.z - sd.lastZ;
  if (Math.abs(dx) + Math.abs(dz) > 1e-4) { body.pos.x += dx; body.pos.z += dz; }
  if (Math.abs(sd.lastSpeed) > 0.5 && v.speed !== sd.lastSpeed) {
    const k = v.speed / sd.lastSpeed;
    body.vel.x *= k; body.vel.z *= k;
  }

  const x0 = body.pos.x, z0 = body.pos.z;
  sd.ctrl.update(dt, input);

  // Buildings: sweep the chassis from where it started the frame, so it cannot tunnel through a wall; a hit bounces it off
  // the wall's normal (a glancing hit keeps most of its speed along the wall, as the arcade model's wall slide does).
  const sw = sweepCircleBoxes(x0, z0, body.pos.x, body.pos.z, v.spec.radius, world.boxes, groundAt(body.pos.x, body.pos.z, body.pos.y));
  if (sw.hit) {
    body.pos.x = sw.x; body.pos.z = sw.z;
    const b = wallBounce(body.vel.x, body.vel.z, sw.nx, sw.nz);
    body.vel.x = b.vx; body.vel.z = b.vz;
    body.angVel.y *= 0.6;
    if (b.impact > 6 && v.driver === 'player') play('bump');
    if (b.impact > CRASH_MIN) damageVehicle(v, (b.impact - CRASH_MIN) / CRASH_SCALE);
  }
  const kept = clampToWorld(body.pos.x, body.pos.z, world.half, v.spec.radius);
  if (kept.hit) { body.pos.x = kept.x; body.pos.z = kept.z; body.vel.x *= 0.5; body.vel.z *= 0.5; }
  // Bump stop on hills: @lawn/vehicle has none, so hitting the foot of a slope at top speed (about 2 g of extra load) bottoms
  // the short mower suspension out and the body sinks into the ground. Keep its centre of mass above the terrain. Off
  // while the terrain is flat, so the flat world drives exactly as before.
  if (!terrainFlat()) {
    const floor = groundAt(body.pos.x, body.pos.z, body.pos.y) + SIM_FLOOR;
    if (body.pos.y < floor) { body.pos.y = floor; if (body.vel.y < 0) body.vel.y = 0; }
  }

  // Safety net: stuck on its side or roof for a moment, stand it back up in place, facing where it was heading.
  const tilt = Math.acos(Math.min(1, qRotate(body.quat, v3(0, 1, 0)).y)) * (180 / Math.PI);
  sd.tippedT = tilt > TIPPED_DEG ? sd.tippedT + dt : 0;
  let righted = false;
  if (sd.tippedT > RIGHT_AFTER) {
    sd.ctrl.place(v3(body.pos.x, groundAt(body.pos.x, body.pos.z, body.pos.y), body.pos.z), qYaw(body.quat), 0);
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
