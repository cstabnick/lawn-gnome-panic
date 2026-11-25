// The Spokewheel (E11 issue 2B): a standing wheel that turns on the shared wave clock, and a one-turn ride.
import * as THREE from 'three';
import { buildPrefab } from '@lawn/prefabs';
import { registerCull } from '../cull';
import { addInteractSpot } from '../interactables';
import type { JobsDeps } from '../jobs/types';
import { heightAt } from '../terrain';
import type { Vehicle } from '../types';
import { createVehicle, removeVehicle, syncVehicleMesh } from '../vehicles';
import { waveTime } from '../waves';
import { COAST, COAST_ACH } from './config';
import { coastSign } from './sign';
import type { CoastPart } from './types';

/** The wheel's angle (radians, 0..2pi) at wave-clock time t (waves.ts waveTime()): pure, the same on every client. */
export function spokewheelAngle(t: number): number {
  const a = ((t / COAST.spokewheel.periodS) % 1) * Math.PI * 2;
  return a < 0 ? a + Math.PI * 2 : a;
}

/** Gondola k's pivot in world space at wheel angle `angle`, for ground height `groundY` under the hub. */
export function gondolaPos(k: number, angle: number, groundY: number): { x: number; y: number; z: number } {
  const w = COAST.spokewheel;
  const a = angle + (k / w.gondolas) * Math.PI * 2;
  return { x: w.x + Math.sin(a) * w.radius, y: groundY + w.hubH - Math.cos(a) * w.radius, z: w.z };
}

const TAU = Math.PI * 2;
const GONDOLA_SCALE = 2.2;
/** Height of the gondola prefab's pivot bar above its origin, scaled. */
const PIVOT_H = 1.15 * GONDOLA_SCALE;

let rides = 0;
/** Rides completed (a full turn, back at the bottom) this session. */
export function spokewheelRides(): number {
  return rides;
}

interface Ride { v: Vehicle; k: number; turned: number; lastA: number; half: boolean }

export function installSpokewheel(deps: JobsDeps): CoastPart {
  const w = COAST.spokewheel;
  const S = w.radius / 1.25;
  const groundY = heightAt(w.x, w.z);
  const root = new THREE.Group();
  root.name = 'spokewheel';

  const stand = buildPrefab('spokewheel-stand', { lights: false, scale: S });
  stand.position.set(w.x, groundY, w.z);
  root.add(stand);

  const pivot = new THREE.Group();
  pivot.position.set(w.x, groundY + w.hubH, w.z);
  const wheel = buildPrefab('spokewheel-wheel', { lights: false, scale: S });
  wheel.position.y = -1.34 * S;
  pivot.add(wheel);
  root.add(pivot);

  const gondolas: THREE.Object3D[] = [];
  for (let k = 0; k < w.gondolas; k++) {
    const g = buildPrefab('spokewheel-gondola', { lights: false, scale: GONDOLA_SCALE });
    gondolas.push(g);
    root.add(g);
  }

  const big = coastSign('THE SPOKEWHEEL\nHat on, hands in,\nwait for the bell', { w: 4, h: 1.6, post: 2 });
  big.position.set(w.board.x - 5, heightAt(w.board.x - 5, w.board.z + 2), w.board.z + 2);
  root.add(big);
  const small = coastSign(`${w.fare} ACORNS\nCOME DOWN WHERE YOU WENT UP`, { w: 2.6, h: 1, post: 1 });
  small.position.set(w.board.x + 4, heightAt(w.board.x + 4, w.board.z + 2), w.board.z + 2);
  root.add(small);

  deps.scene.add(root);
  registerCull(root, 'landmark');

  const pos = { x: 0, y: 0, z: 0 };
  let ride: Ride | null = null;

  /** Put gondola k's pivot at wheel angle a into `pos` (no allocation). */
  function pose(k: number, a: number): void {
    const p = gondolaPos(k, a, groundY);
    pos.x = p.x; pos.y = p.y; pos.z = p.z;
  }

  function place(a: number): void {
    pivot.rotation.z = a;
    for (let k = 0; k < gondolas.length; k++) {
      pose(k, a);
      gondolas[k].position.set(pos.x, pos.y - PIVOT_H, pos.z);
    }
  }

  function endRide(): void {
    if (!ride) return;
    removeVehicle(deps.scene, ride.v);
    const i = deps.vehicles.indexOf(ride.v);
    if (i >= 0) deps.vehicles.splice(i, 1);
    gondolas[ride.k].visible = true;
    ride = null;
  }

  function start(): boolean {
    const why = deps.blocked();
    if (why) { deps.hud.toast(why); return true; }
    if (deps.player.vehicle || ride) { deps.hud.toast('Get out first.'); return true; }
    if (!deps.economy.spend(w.fare, 'Spokewheel')) { deps.hud.toast('Not enough acorns.'); return true; }
    const a = spokewheelAngle(waveTime());
    let k = 0, best = Infinity;
    for (let i = 0; i < w.gondolas; i++) {
      const d = Math.abs(((((a + (i / w.gondolas) * TAU + Math.PI) % TAU) + TAU) % TAU) - Math.PI);
      if (d < best) { best = d; k = i; }
    }
    pose(k, a);
    const v = createVehicle(deps.scene, 'spoke-gondola', pos.x, pos.z, 0);
    v.y = pos.y - PIVOT_H;
    deps.vehicles.push(v);
    gondolas[k].visible = false;
    deps.seatPlayer(v);
    deps.hud.toast('Hat on, hands in.');
    ride = { v, k, turned: 0, lastA: a, half: false };
    return true;
  }

  addInteractSpot({
    x: w.board.x,
    z: w.board.z,
    prompt: `Ride the Spokewheel (${w.fare} 🌰)`,
    run: start,
  });

  return {
    update(): void {
      if (ride && deps.player.vehicle !== ride.v) endRide();
      if (!root.visible && !ride) return;
      place(spokewheelAngle(waveTime()));
      if (ride) gondolas[ride.k].visible = false;
    },
    blips: () => [{ x: w.x, z: w.z, color: '#4fa3d9', label: 'The Spokewheel' }],
    drives: (v) => !!ride && v === ride.v,
    stepRider(v, _inp, dt): void {
      const r = ride;
      if (!r || v !== r.v) return;
      const a = spokewheelAngle(waveTime());
      let d = a - r.lastA;
      if (d < -Math.PI) d += TAU;
      else if (d > Math.PI) d -= TAU;
      r.lastA = a;
      r.turned += Math.max(0, d);
      pose(r.k, a);
      v.x = pos.x;
      v.y = pos.y - PIVOT_H;
      v.z = pos.z;
      v.yaw = 0;
      v.speed = 0;
      syncVehicleMesh(v, dt);
      if (!r.half && r.turned >= Math.PI) {
        r.half = true;
        deps.hud.toast('From up here you can see the whole Saltwater.');
      }
      if (r.turned >= TAU) {
        rides++;
        deps.unlock(COAST_ACH.fullCircle);
        window.dispatchEvent(new CustomEvent('gta:spokewheel-ride'));
        deps.throwPlayer(v, 0, 2, 3);
        endRide();
      }
    },
  };
}
