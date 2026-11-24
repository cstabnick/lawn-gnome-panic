// The Pebblewick Hopper: a bus between Pebblewick's stop and Turfton's Central Bus Stop (world.spawn). Pay the fare at
// either stop, a fade, and the player steps off at the other.
import * as THREE from 'three';
import { buildPrefab } from '@lawn/prefabs';
import { ROAD_LINES, ROAD_WIDTH } from '../config';
import type { Economy } from '../economy';
import { play2d } from '../sound';
import { heightAt } from '../terrain';
import type { Blip, Box, Hud, Sfx, World } from '../types';
import { TOWN } from './town';

export interface BusDeps {
  scene: THREE.Scene;
  ui: HTMLElement;
  world: World;
  hud: Hud;
  economy: Economy;
  play(sfx: Sfx): void;
  /** Put the player on foot at (x, z) facing yaw and swing the camera behind them. */
  teleport(x: number, z: number, yaw: number): void;
}

export interface TownBus {
  /** The Turfton stop's post collider (pushed into world.boxes by the facade). */
  readonly boxes: readonly Box[];
  prompt(px: number, pz: number): string | null;
  interact(px: number, pz: number): boolean;
  /** True while a ride's fade runs (the facade holds the other prompts). */
  busy(): boolean;
  update(dt: number): void;
  /** The Turfton stop's map dot. */
  blips(): Blip[];
}

export const HOPPER_FARE = 8;

const POST_OFFSETS: readonly [number, number][] = [[3, -4], [-3, -4], [3, 4], [-3, 4], [5, 0], [-5, 0], [0, 5], [0, -5]];
const ROAD_CLEAR = ROAD_WIDTH / 2 + 0.75;
const POST_HEIGHT = 2.4;
const POST_HALF = 0.3;
const RIDE_TO_STOP_DIST = 1.5;

const FADE_IN = 0.5;
const HOLD = 0.8;
const FADE_OUT = 0.5;
const RIDE_CAPTION = 'The Pebblewick Hopper rattles along Route East...';
const FADE_CSS = 'position:fixed;inset:0;z-index:40;background:#000;pointer-events:none;opacity:0;display:flex;'
  + 'align-items:center;justify-content:center;font-family:system-ui,sans-serif;color:#f2c230;font-weight:bold;'
  + 'font-size:18px;text-align:center;padding:12px;';

/** Where the Turfton post stands: the first clear offset from the spawn (no box under its 1 x 1 m square, off every road). */
export function turftonPostSpot(spawn: { x: number; z: number }, boxes: readonly Box[]): { x: number; z: number } {
  for (const [dx, dz] of POST_OFFSETS) {
    const x = spawn.x + dx;
    const z = spawn.z + dz;
    const onRoad = ROAD_LINES.some((l) => Math.abs(x - l) <= ROAD_CLEAR || Math.abs(z - l) <= ROAD_CLEAR);
    if (onRoad) continue;
    const hit = boxes.some((b) => x - 0.5 < b.maxX && x + 0.5 > b.minX && z - 0.5 < b.maxZ && z + 0.5 > b.minZ);
    if (hit) continue;
    return { x, z };
  }
  return { x: spawn.x + 3, z: spawn.z - 4 };
}

const near = (px: number, pz: number, x: number, z: number): boolean => Math.hypot(px - x, pz - z) <= 2.5;

interface Ride {
  t: number;
  dest: { x: number; z: number; yaw: number };
  teleported: boolean;
  el: HTMLDivElement;
}

export function createTownBus(deps: BusDeps): TownBus {
  const { scene, ui, world, hud, economy } = deps;

  // The Turfton post: a signpost, 2.4 m tall, on the chosen spot.
  const post = turftonPostSpot(world.spawn, world.boxes);
  const group = buildPrefab('signpost', { lights: false });
  const size = new THREE.Box3().setFromObject(group).getSize(new THREE.Vector3());
  group.scale.setScalar(POST_HEIGHT / Math.max(size.x, size.y, size.z));
  const postY = heightAt(post.x, post.z);
  group.position.set(post.x, postY, post.z);
  scene.add(group);
  const boxes: Box[] = [{
    minX: post.x - POST_HALF, maxX: post.x + POST_HALF, minZ: post.z - POST_HALF, maxZ: post.z + POST_HALF,
    h: postY + POST_HEIGHT,
  }];

  // Destinations of a ride.
  const dxs = world.spawn.x - post.x;
  const dzs = world.spawn.z - post.z;
  const dSpawn = Math.hypot(dxs, dzs);
  const k = dSpawn > 0 ? Math.min(RIDE_TO_STOP_DIST, dSpawn) / dSpawn : 0;
  const turftonDest = { x: post.x + dxs * k, z: post.z + dzs * k, yaw: world.spawn.yaw };
  const pebblewickDest = { x: TOWN.busStop.arriveX, z: TOWN.busStop.arriveZ, yaw: TOWN.busStop.arriveYaw };

  let ride: Ride | null = null;

  function promptFor(px: number, pz: number): { text: string; dest: { x: number; z: number; yaw: number } } | null {
    if (near(px, pz, TOWN.busStop.x, TOWN.busStop.z)) {
      return { text: `Ride the Pebblewick Hopper to Turfton (${HOPPER_FARE} Acorns)`, dest: turftonDest };
    }
    if (near(px, pz, post.x, post.z)) {
      return { text: `Ride the Pebblewick Hopper to Pebblewick (${HOPPER_FARE} Acorns)`, dest: pebblewickDest };
    }
    return null;
  }

  function startRide(dest: { x: number; z: number; yaw: number }): void {
    const el = document.createElement('div');
    el.id = 'gta-pw-hopper-fade';
    el.style.cssText = FADE_CSS;
    el.textContent = RIDE_CAPTION;
    ui.appendChild(el);
    ride = { t: 0, dest, teleported: false, el };
  }

  return {
    boxes,
    prompt(px, pz) {
      return promptFor(px, pz)?.text ?? null;
    },
    interact(px, pz) {
      if (ride) return true;
      const hit = promptFor(px, pz);
      if (!hit) return false;
      if (!economy.spend(HOPPER_FARE, 'Pebblewick Hopper')) {
        hud.toast('The Hopper driver wants 8 Acorns.');
        return true;
      }
      startRide(hit.dest);
      return true;
    },
    busy: () => ride !== null,
    update(dt) {
      if (!ride) return;
      ride.t += dt;
      const t = ride.t;
      const blackEnd = FADE_IN + HOLD;
      const end = blackEnd + FADE_OUT;
      if (!ride.teleported && t >= FADE_IN) {
        ride.teleported = true;
        deps.teleport(ride.dest.x, ride.dest.z, ride.dest.yaw);
        play2d('pw-bus-horn');
      }
      if (t >= end) {
        ui.removeChild(ride.el);
        ride = null;
        return;
      }
      let opacity = 1;
      if (t < FADE_IN) opacity = t / FADE_IN;
      else if (t >= blackEnd) opacity = 1 - (t - blackEnd) / FADE_OUT;
      ride.el.style.opacity = String(opacity);
    },
    blips(): Blip[] {
      return [{ x: post.x, z: post.z, color: '#d9a441', label: 'Pebblewick Hopper' }];
    },
  };
}
