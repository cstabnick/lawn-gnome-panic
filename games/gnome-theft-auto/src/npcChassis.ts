// NPC driving on the sim chassis (L93): near NPC cars (traffic, race rivals, the follow-quest leader) drive on the same
// @lawn/vehicle physics as the player, always with the CASUAL tune and the stock setup, whatever handling mode the
// player picked (arcade, simcade, drift...). Far cars stay on the cheap arcade step (vehicles.ts stepVehicle).
// The chassis lives here (a WeakMap), never on v.sim: v.sim means "the player's chassis" everywhere else.
// STUB: filled by issue E02 1-8.
import type { SimDrive } from './simdrive';
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

/** The arcade-style command every NPC driver already produces (traffic.ts finish): throttle -1..1 (negative = brake, then reverse from rest), steer -1..1 (same sign as the player's moveX). */
export interface NpcCommand { throttle: number; steer: number; lift: number }

/** A sim chassis for NPC car v, built from the CASUAL tune and the stock setup (simdrive.ts createChassis), placed at v's pose and speed. */
export function createNpcChassis(v: Vehicle): SimDrive {
  void v;
  throw new Error('createNpcChassis: stub');
}

/** v's NPC chassis, or undefined while it drives on the arcade step. */
export function npcChassisOf(_v: Vehicle): SimDrive | undefined {
  return undefined;
}

/** Drop v's NPC chassis (it goes back to the arcade step from its current pose; no pop). */
export function dropNpcChassis(_v: Vehicle): void { /* stub */ }

/**
 * Step NPC car v one frame with command c: on its sim chassis when it has one (stepChassis), else the arcade step
 * (vehicles.ts stepVehicle). Use this instead of stepVehicle for every NPC-driven ground car.
 */
export function stepNpcCar(v: Vehicle, c: NpcCommand, dt: number, world: World): void {
  stepVehicle(v, c, dt, world);
}

/**
 * Once per frame, before stepping NPC cars: give the nearest NPC ground cars within NPC_CHASSIS.radius of (focusX, focusZ)
 * a chassis (at most maxCars) and drop it from cars beyond radius * hysteresis, exploded or sunk cars, cars whose driver
 * is no longer 'npc', boats and flyers.
 */
export function assignNpcChassis(_vehicles: readonly Vehicle[], _focusX: number, _focusZ: number): void { /* stub */ }
