// NPC driving on the sim chassis (L93): near NPC cars (traffic, race rivals, the follow-quest leader) drive on the same
// @lawn/vehicle physics as the player, always with the CASUAL tune and the stock setup, whatever handling mode the
// player picked (arcade, simcade, drift...). Far cars stay on the cheap arcade step (vehicles.ts stepVehicle).
// The chassis lives here (a WeakMap), never on v.sim: v.sim means "the player's chassis" everywhere else.
import { createChassis, stepChassis, type SimDrive } from './simdrive';
import { stockSetup, tuneById } from './handling';
import { stepVehicle } from './vehicles';
import type { Vehicle, World } from './types';

/** Tuning. */
export const NPC_CHASSIS = {
  /** Cars within this many metres of the focus (camera/player) may get a sim chassis. */
  radius: 60,
  /** At most this many NPC cars on the sim chassis at once (the nearest win). */
  maxCars: 8,
  /** Leave the sim (back to arcade) only beyond radius * hysteresis, so a car on the edge does not flip each frame. */
  hysteresis: 1.15,
} as const;

/** NPC steering assist and candidate tuning. */
export const NPC_ASSIST = {
  /** Steer limit = clamp(steerBase - speed / maxSpeed, steerMin, 1). */
  steerBase: 1.2,
  steerMin: 0.35,
  /** Steer smoothing rate (1/s). */
  steerRate: 6,
  /** Lift the throttle when |steer| is above sharpSteer and speed is above sharpSpeed * maxSpeed. */
  sharpSteer: 0.8,
  sharpSpeed: 0.6,
  /** Frames a car stays a candidate after its last stepNpcCar call. */
  steppedFrames: 30,
} as const;

/** The arcade-style command every NPC driver already produces (traffic.ts finish): throttle -1..1 (negative = brake, then reverse from rest), steer -1..1 (same sign as the player's moveX). */
export interface NpcCommand { throttle: number; steer: number; lift: number }

const chassis = new WeakMap<Vehicle, SimDrive>();
const steerState = new WeakMap<Vehicle, number>();
const lastStepped = new WeakMap<Vehicle, number>();
let frame = 0;

const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));

/** A sim chassis for NPC car v, built from the CASUAL tune and the stock setup (simdrive.ts createChassis), placed at v's pose and speed. */
export function createNpcChassis(v: Vehicle): SimDrive {
  const sd = createChassis(v, tuneById('casual')!, stockSetup(v.spec.kind), 0);
  chassis.set(v, sd);
  steerState.set(v, 0);
  return sd;
}

/** v's NPC chassis, or undefined while it drives on the arcade step. */
export function npcChassisOf(v: Vehicle): SimDrive | undefined {
  return chassis.get(v);
}

/** Drop v's NPC chassis (it goes back to the arcade step from its current pose; no pop). */
export function dropNpcChassis(v: Vehicle): void {
  if (chassis.delete(v)) v.vy = 0;
  steerState.delete(v);
}

/**
 * Step NPC car v one frame with command c: on its sim chassis when it has one (stepChassis), else the arcade step
 * (vehicles.ts stepVehicle). Use this instead of stepVehicle for every NPC-driven ground car.
 */
export function stepNpcCar(v: Vehicle, c: NpcCommand, dt: number, world: World): void {
  lastStepped.set(v, frame);
  const sd = chassis.get(v);
  if (!sd) { stepVehicle(v, c, dt, world); return; }
  const A = NPC_ASSIST;
  const maxSpeed = v.spec.maxSpeed;
  const speed = Math.abs(v.speed);
  const limit = clamp(A.steerBase - speed / maxSpeed, A.steerMin, 1);
  const want = clamp(c.steer, -limit, limit);
  const prev = steerState.get(v) ?? 0;
  const steer = prev + (want - prev) * Math.min(1, A.steerRate * dt);
  steerState.set(v, steer);
  let throttle = Math.max(0, c.throttle);
  if (Math.abs(c.steer) > A.sharpSteer && speed > A.sharpSpeed * maxSpeed) throttle = 0;
  stepChassis(v, sd, { steer, throttle, brake: Math.max(0, -c.throttle), handbrake: 0, source: 'stick' }, dt, world);
}

/**
 * Once per frame, before stepping NPC cars: give the nearest NPC ground cars within NPC_CHASSIS.radius of (focusX, focusZ)
 * a chassis (at most maxCars) and drop it from cars beyond radius * hysteresis, exploded or sunk cars, cars whose driver
 * is no longer 'npc', boats and flyers.
 */
export function assignNpcChassis(vehicles: readonly Vehicle[], focusX: number, focusZ: number): void {
  frame++;
  const near: { v: Vehicle; d: number }[] = [];
  for (const v of vehicles) {
    const sp = v.spec;
    const ok = v.driver === 'npc' && !v.exploded && !v.sunk && !sp.boat && !sp.flies && !sp.air && !v.sim
      && frame - (lastStepped.get(v) ?? -1e9) <= NPC_ASSIST.steppedFrames;
    if (ok) {
      const d = Math.hypot(v.x - focusX, v.z - focusZ);
      if (d <= NPC_CHASSIS.radius * (chassis.has(v) ? NPC_CHASSIS.hysteresis : 1)) { near.push({ v, d }); continue; }
    }
    dropNpcChassis(v);
  }
  near.sort((a, b) => a.d - b.d);
  near.forEach(({ v }, i) => {
    if (i < NPC_CHASSIS.maxCars) { if (!chassis.has(v)) createNpcChassis(v); } else dropNpcChassis(v);
  });
}
