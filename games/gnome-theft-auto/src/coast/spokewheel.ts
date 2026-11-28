// The Spokewheel (E11 issue 2B): a standing wheel that turns on the shared wave clock, and a one-turn ride.
import * as THREE from 'three';
import { buildPrefab, getPrefab } from '@lawn/prefabs';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { registerCull } from '../cull';
import { addInteractSpot } from '../interactables';
import type { JobsDeps } from '../jobs/types';
import { parseSavesJson } from '../quests/questSave';
import { playAt } from '../sound/bus';
import { heightAt } from '../terrain';
import type { Box, Vehicle } from '../types';
import { createVehicle, removeVehicle, syncVehicleMesh } from '../vehicles';
import { waveTime } from '../waves';
import { COAST, COAST_ACH } from './config';
import { nightGlowMat, onCoastNight } from './nightLights';
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

const QUEST_SAVE_KEY = 'gta-quests-v1';
/** Marram's quest is done (the wheel is free). Reads the quest save, same pattern as societies/achievements.ts. */
function questDone(id: string): boolean {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(QUEST_SAVE_KEY) : null;
    return parseSavesJson(raw)[id]?.state === 'done';
  } catch {
    return false;
  }
}

/** Where the stand prefab's four feet stand, in prefab-local metres at scale 1 (A-frame legs). */
const FOOT_X = 0.85, FOOT_Z = 0.4;
const LEG_SIZE = 1.6, LEG_H = 8;
const BELL_SIZE = 0.8, BELL_H = 1.6;
/** Where a rider is set down after a full turn (on the platform, clear of every collider below). */
export function spokewheelSetDown(): { x: number; z: number; yaw: number } {
  const w = COAST.spokewheel;
  const x = w.board.x + 1.5, z = w.board.z + 2;
  return { x, z, yaw: Math.atan2(-195 - x, 1115 - z) };
}

/** The colliders this module adds: four stand feet and the bell post. */
export function spokewheelLegBoxes(): Box[] {
  const w = COAST.spokewheel;
  const S = w.radius / 1.25;
  const out: Box[] = [];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const cx = w.x + sx * FOOT_X * S, cz = w.z + sz * FOOT_Z * S;
    out.push({ minX: cx - LEG_SIZE / 2, maxX: cx + LEG_SIZE / 2, minZ: cz - LEG_SIZE / 2, maxZ: cz + LEG_SIZE / 2, h: LEG_H });
  }
  out.push({
    minX: w.bell.x - BELL_SIZE / 2, maxX: w.bell.x + BELL_SIZE / 2,
    minZ: w.bell.z - BELL_SIZE / 2, maxZ: w.bell.z + BELL_SIZE / 2, h: BELL_H,
  });
  return out;
}

// The bell: a tiny timer queue, stepped by update().
const bellQueue: number[] = [];
/** Ring the platform bell `times` times, about 0.6 s apart. */
export function ringSpokewheelBell(times = 1): void {
  for (let i = 0; i < times; i++) bellQueue.push(i * 0.6);
}
function stepBell(dt: number): void {
  for (let i = bellQueue.length - 1; i >= 0; i--) {
    bellQueue[i] -= dt;
    if (bellQueue[i] <= 0) {
      bellQueue.splice(i, 1);
      playAt('buoy-bell', COAST.spokewheel.bell, { gain: 0.9 });
    }
  }
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

  const at = (obj: THREE.Object3D, x: number, z: number, yaw = 0): void => {
    obj.position.set(x, heightAt(x, z), z);
    obj.rotation.y = yaw;
    root.add(obj);
  };
  at(coastSign('THE SPOKEWHEEL\nHat on, hands in,\nwait for the bell', { w: 4, h: 1.6, post: 2 }), w.board.x - 5, w.board.z + 2);
  at(coastSign(`${w.fare} ACORNS\nChildren free. Gulls not.`, { w: 2.6, h: 1, post: 1 }), w.board.x + 4, w.board.z + 2);
  at(coastSign("MARRAM'S WHEEL\nMARRAM'S RULES", { w: 2.2, h: 0.9, post: 1 }), w.board.x - 3, w.board.z - 1.8);
  at(coastSign('THE TOP IS FOR LOOKING.\nTHE BOTTOM IS FOR PAYING.', { w: 2.8, h: 1, post: 0.8 }), w.board.x + 5.5, w.board.z - 2.6);
  at(coastSign('DO NOT RISE\nFROM YOUR TEACUP', { w: 2.2, h: 0.9, post: 0.8 }), w.board.x + 9, w.board.z - 2.6);

  // Platform dressing: a rope queue from the east towards the boarding spot (2.4 m clear lane), the bell, Marram's stool, the fare tin.
  const prop = (id: string, x: number, z: number, scale: number, yaw = 0): void => {
    if (!getPrefab(id)) return;
    at(buildPrefab(id, { lights: false, scale }), x, z, yaw);
  };
  for (const px of [3, 5, 7]) for (const sz of [-1.2, 1.2]) prop('rope-stanchion', w.board.x + px, w.board.z + sz, 2);
  prop('spokewheel-bell', w.bell.x, w.bell.z, 2.2, w.bell.yaw);
  prop('stool', w.bell.x - 1.4, w.bell.z - 0.4, 1.4, 0.5);
  prop('fare-tin', w.board.x - 1.8, w.board.z + 0.4, 2.4, 0.4);

  // Lit at night: bulbs round the rim and along the spokes, turning with the wheel, two alternating chase sets.
  const bulbGeo = (pts: [number, number][]): THREE.BufferGeometry => {
    const gs = pts.map(([x, y]) => new THREE.SphereGeometry(0.34, 6, 4).translate(x, y, 0.05));
    const m = mergeGeometries(gs, false);
    for (const g of gs) g.dispose();
    return m;
  };
  const setA: [number, number][] = [], setB: [number, number][] = [];
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * TAU;
    (i % 2 ? setB : setA).push([Math.sin(a) * w.radius, Math.cos(a) * w.radius]);
  }
  for (let sp = 0; sp < 12; sp++) {
    const a = (sp / 12) * TAU;
    for (let j = 0; j < 4; j++) {
      const r = 3.5 + j * 3.6;
      ((sp + j) % 2 ? setB : setA).push([Math.sin(a) * r, Math.cos(a) * r]);
    }
  }
  const matA = nightGlowMat(0xfff1c4, 3.2), matB = nightGlowMat(0xff7fb0, 3.2, 0xf6dce6);
  pivot.add(new THREE.Mesh(bulbGeo(setA), matA), new THREE.Mesh(bulbGeo(setB), matB));
  let clock = 0;
  onCoastNight((night, dt) => {
    clock += dt;
    matA.emissiveIntensity = 3.2 * night * (0.55 + 0.45 * Math.sin(clock * 3));
    matB.emissiveIntensity = 3.2 * night * (0.55 - 0.45 * Math.sin(clock * 3));
  });

  deps.world.boxes.push(...spokewheelLegBoxes());

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
    const free = questDone('coast-spokewheel-gondola');
    if (!free && !deps.economy.spend(w.fare, 'Spokewheel')) { deps.hud.toast('Not enough acorns.'); return true; }
    ringSpokewheelBell();
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
    deps.hud.toast(free ? 'Marram waves you through. Within reason.' : 'Hat on, hands in.');
    ride = { v, k, turned: 0, lastA: a, half: false };
    return true;
  }

  const spot = {
    x: w.board.x,
    z: w.board.z,
    prompt: `Ride the Spokewheel (${w.fare} 🌰)`,
    run: start,
  };
  addInteractSpot(spot);

  return {
    update(dt = 1 / 60): void {
      stepBell(dt);
      if (!spot.prompt.includes('free') && questDone('coast-spokewheel-gondola')) spot.prompt = 'Ride the Spokewheel (free)';
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
        const hp = deps.player.health;
        const sd = spokewheelSetDown();
        deps.throwPlayer(v, 0, 0, 0);
        deps.player.respawn(sd.x, sd.z, sd.yaw);
        deps.player.health = hp;
        deps.hud.toast('The bell. You may get out now.');
        ringSpokewheelBell();
        endRide();
      }
    },
  };
}
