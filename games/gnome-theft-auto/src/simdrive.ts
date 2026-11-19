// Optional driving model: ?drive=sim swaps the arcade mower physics for @lawn/vehicle (raycast chassis, Pacejka tyres, assists)
// for the mower the player drives. POC: ground vehicles only, offline only (see main.ts). ?preset=casual|hybrid|simcade picks the family.
import { PRESETS, VehicleController, qRotate, qYaw, retuneDirectDrive, scaleConfig, v3, withOverrides, type VehicleConfig } from '@lawn/vehicle';
import { play } from './audio';
import { clampToWorld, pushOutOfBoxes } from './collide';
import type { InputState, Vehicle, VehicleSpec, World } from './types';

const params = new URLSearchParams(location.search);

/** True when the page was opened with ?drive=sim. */
export const SIM_DRIVE = params.get('drive') === 'sim';
export const SIM_PRESET = PRESETS[params.get('preset') ?? ''] ? (params.get('preset') as string) : 'casual';

/** A reference car is about this long (m); a mower's collision radius scales the whole family from it. */
const REFERENCE_RADIUS = 2.3;

export interface SimDrive {
  ctrl: VehicleController;
  /** Interpolated chassis pose for the mesh: object origin (road level), orientation. */
  px: number; py: number; pz: number;
  qx: number; qy: number; qz: number; qw: number;
  /** What the game saw last frame, to notice outside changes (vehicle bumps, teleports). */
  lastX: number; lastZ: number; lastSpeed: number;
}

/** One config per mower model: the chosen preset scaled to the mower's size, then retuned to its top speed and pickup. */
export function mowerConfig(spec: VehicleSpec, preset = SIM_PRESET): VehicleConfig {
  let cfg = scaleConfig(PRESETS[preset], spec.radius / REFERENCE_RADIUS);
  cfg = retuneDirectDrive(cfg, spec.maxSpeed, spec.accel);
  // Mowers always use the direct drive (no gearbox), and the player holds the throttle.
  return withOverrides(cfg, { drivetrain: { mode: 'DirectDrive' }, mobileInput: { autoAccelerate: false } });
}

export function createSimDrive(v: Vehicle): SimDrive {
  const ctrl = new VehicleController(mowerConfig(v.spec));
  ctrl.place(v3(v.x, 0, v.z), v.yaw, v.speed);
  const sd: SimDrive = { ctrl, px: v.x, py: 0, pz: v.z, qx: 0, qy: 0, qz: 0, qw: 1, lastX: v.x, lastZ: v.z, lastSpeed: v.speed };
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
  v.y = 0;
  v.z = sd.pz;
  v.yaw = qYaw(p.quat);
  v.speed = sd.ctrl.telemetry.forwardSpeed;
  sd.lastX = v.x;
  sd.lastZ = v.z;
  sd.lastSpeed = v.speed;
}

/** Step the player's sim-driven vehicle for one frame: game input in, game-space pose out. */
export function stepSimDrive(v: Vehicle, sd: SimDrive, inp: InputState, dt: number, world: World): void {
  const body = sd.ctrl.body;
  // Anything the game did to the vehicle since last frame (a mower bump pushed it, or slowed it): carry it into the body.
  const dx = v.x - sd.lastX;
  const dz = v.z - sd.lastZ;
  if (Math.abs(dx) + Math.abs(dz) > 1e-4) { body.pos.x += dx; body.pos.z += dz; }
  if (Math.abs(sd.lastSpeed) > 0.5 && v.speed !== sd.lastSpeed) {
    const k = v.speed / sd.lastSpeed;
    body.vel.x *= k; body.vel.z *= k;
  }

  const binary = (inp.moveX === 0 || Math.abs(inp.moveX) === 1);
  sd.ctrl.update(dt, {
    steer: inp.moveX,
    throttle: Math.max(0, inp.moveY),
    brake: Math.max(0, -inp.moveY),
    handbrake: inp.lift > 0 ? 1 : 0,
    source: binary ? 'keyboard' : 'stick',
  });

  // Buildings and the world edge: push the chassis out and bleed its speed, as the arcade model does.
  const impact = Math.hypot(body.vel.x, body.vel.z);
  const pushed = pushOutOfBoxes(body.pos.x, body.pos.z, v.spec.radius, world.boxes, 0);
  if (pushed.hit) {
    body.pos.x = pushed.x; body.pos.z = pushed.z;
    body.vel.x *= 0.35; body.vel.z *= 0.35;
    if (impact > 6) play('bump');
  }
  const kept = clampToWorld(body.pos.x, body.pos.z, world.half, v.spec.radius);
  if (kept.hit) { body.pos.x = kept.x; body.pos.z = kept.z; body.vel.x *= 0.5; body.vel.z *= 0.5; }

  writePose(v, sd);
  v.steerVis += (sd.ctrl.input.steer - v.steerVis) * Math.min(1, 8 * dt);
}
