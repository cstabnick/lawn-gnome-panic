// Sim jobs: what the world shows. Waiting fares at the kerb (a gnome with a raised arm), NPC passengers seated in a
// job vehicle (local or remote), parcels on board, the roof sign, depot kiosks with their dispatchers, falling cargo
// crates. Capped and shared: at most MAX_WAITING waiting gnomes and MAX_SEATED seated ones exist at once.
import * as THREE from 'three';
import { buildPrefab } from '@lawn/prefabs';
import type { GnomeLook, GnomeModel } from '@lawn/gnome';
import type { World } from '../types';
import { createAnimator, type Animator } from '../anim/animator';
import { registerCull } from '../cull';
import { circleClearOfStreets } from '../parking';
import { heightAt, slopeAt, waterAt } from '../terrain';
import { boxesBlocked, findSafeSpot } from '../lockup/safeSpot';
import type { SpotProbe } from '../lockup/types';
import { gnomeState, makeGnome } from '../gnomes';
import { passengerCount, seatPos } from '../seats';
import { JOBS } from './defs';
import type { Box, JobId, ParcelKind, Vehicle } from './types';

export const MAX_WAITING = 3;
export const MAX_SEATED = 10;

export type SeatMood = 'calm' | 'nervous' | 'happy' | 'seasick';

export interface DepotSpot {
  job: JobId | 'tubes';
  x: number;
  z: number;
  yaw: number;
}

export interface JobVisuals {
  /** A waiting NPC at (x, z) facing yaw, playing `pose` (anim id: 'hail-cab', 'wait-bus', 'wave'). Same id: moved. */
  showWaiting(id: string, x: number, z: number, yaw: number, lookSeed: number, pose: string): void;
  hideWaiting(id: string): void;
  /** Seat NPCs in v: [seat, lookSeed] pairs (seat 1.. = spec.passengerSeats[seat - 1]); [] clears v. */
  setPassengers(v: Vehicle, seats: readonly (readonly [number, number])[], mood: SeatMood): void;
  /** Parcel prefabs stacked on v (courier); [] clears. */
  setParcels(v: Vehicle, kinds: readonly ParcelKind[]): void;
  /** The job's roof sign / light on v; null removes it. */
  setSign(v: Vehicle, job: JobId | null): void;
  /** Remove everything this module put on v (passengers, parcels, sign). */
  clearVehicle(v: Vehicle): void;
  /** Build the four depot kiosks, their dispatcher gnomes and the Mossbank tube rack, once. Returns where they stood
   *  and the colliders (the caller pushes them into world.boxes). */
  buildDepots(world: World): { spots: DepotSpot[]; boxes: Box[] };
  /** A cargo crate falling from (x, y, z) with ground velocity (vx, vz): lands, stays 20 s, then goes. */
  dropCrate(x: number, y: number, z: number, vx: number, vz: number): void;
  /** Animate waiting and seated gnomes; hide what is farther than 140 m from (camX, camZ). */
  update(dt: number, camX: number, camZ: number): void;
}

// ---- Tuning and tables ----

/** Anything farther than this from the camera is hidden and not animated. */
const RANGE = 140;
const MAX_CRATES = 4;
const CRATE_GRAVITY = 18;
/** Seconds a landed crate stays before it is removed. */
const CRATE_STAY = 20;
/** Height of the yellow marker above a waiting gnome's origin (m). */
const MARKER_Y = 1.6;
const TUBE_RACK_TARGET = { x: -702, z: -548 };

const HATS = [0xd93636, 0x2f64c9, 0x3fa34d, 0xf2c230, 0x8e44ad, 0xf08a24, 0x1abc9c, 0xe84393];
const COATS = [0x2f64c9, 0x6b4a2e, 0x3fa34d, 0xc0392b, 0x7f8c8d, 0xd35400, 0x16a085, 0xf5f5dc];
const PANTS = [0x4b3a2a, 0x2c3e50, 0x6b4a2e, 0x34495e];
const SKINS = [0xf1c27d, 0xe0ac69, 0xc68642, 0x8d5524, 0xffdbac];
const BEARDS = [0xf4f4f4, 0xdddddd, 0x8b5a2b, 0x3b2a1a, 0xc0c0c0];

const PARCEL_PREFAB: Record<ParcelKind, string> = {
  food: 'parcel-hot-food', fragile: 'parcel-fragile', heavy: 'parcel-heavy', vip: 'parcel-vip', mail: 'parcel-mail',
};
const SIGN_PREFAB: Record<JobId, string | null> = { taxi: 'taxi-roof-sign', courier: 'courier-roof-sign', boat: 'ferry-pennant', pilot: null };
const DISPATCH_ANIM: Record<JobId | 'tubes', string> = {
  taxi: 'phone-call', courier: 'take-notes', pilot: 'look-around', boat: 'vendor-call', tubes: 'vendor-call',
};

// Shared by every waiting gnome's marker.
const MARKER_GEO = new THREE.ConeGeometry(0.12, 0.28, 8);
MARKER_GEO.rotateX(Math.PI); // apex down
const MARKER_MAT = new THREE.MeshBasicMaterial({ color: 0xffd23f });

/** A small deterministic rng (mulberry32). */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The same look for the same seed on every client (passengers are relayed online by seed). */
export function lookFromSeed(seed: number): GnomeLook {
  const rnd = mulberry32(seed);
  const pick = <T>(a: readonly T[]): T => a[Math.floor(rnd() * a.length)];
  const beard = rnd() < 0.7 ? pick(BEARDS) : null;
  return {
    hat: pick(HATS),
    shirt: pick(COATS),
    pants: pick(PANTS),
    skin: pick(SKINS),
    boots: 0x222222,
    beard,
    hair: beard === null && rnd() < 0.6 ? { color: pick(BEARDS), style: 'pigtails' } : null,
    freckles: rnd() < 0.2,
    dress: beard === null && rnd() < 0.4,
    glasses: rnd() < 0.2,
    bowlCut: null,
  };
}

function seatAnim(v: Vehicle, mood: SeatMood): string {
  if (v.spec.flies) return 'plane-passenger';
  if (mood === 'seasick') return 'seasick';
  if (mood === 'nervous') return 'hold-on';
  if (mood === 'happy') return 'wave-from-seat';
  return 'golf-cart-passenger';
}

/** Removes a gnome model from its parent and frees its geometries. */
function freeModel(model: GnomeModel): void {
  model.object.removeFromParent();
  model.object.traverse((o) => {
    const g = (o as THREE.Mesh).geometry;
    if (g) g.dispose();
  });
}

interface WaitSlot {
  id: string | null;
  seed: number;
  pose: string;
  x: number;
  z: number;
  yaw: number;
  /** Tick of the last showWaiting, for "oldest first". */
  shownAt: number;
  model: GnomeModel | null;
  animator: Animator;
  marker: THREE.Mesh;
}

interface Seated {
  model: GnomeModel;
  animator: Animator;
  x: number;
  y: number;
  z: number;
}

interface SeatedRec {
  key: string;
  mood: SeatMood;
  list: Seated[];
}

interface Depot {
  x: number;
  z: number;
  y: number;
  yaw: number;
  model: GnomeModel;
  animator: Animator;
}

interface Crate {
  obj: THREE.Object3D;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  landed: boolean;
  /** Seconds since it landed. */
  age: number;
}

export function createJobVisuals(scene: THREE.Scene): JobVisuals {
  const waiting: WaitSlot[] = [];
  let waitTick = 0;
  let bobT = 0;

  const seated = new Map<Vehicle, SeatedRec>();
  let seatedTotal = 0;

  const parcels = new Map<Vehicle, THREE.Object3D[]>();
  const parcelProto = new Map<ParcelKind, THREE.Object3D>();

  const signs = new Map<Vehicle, THREE.Object3D>();
  /** Height of the roof above the vehicle's origin, measured once per vehicle (its own parts only). */
  const roofTops = new WeakMap<Vehicle, number>();
  /** Objects this module put on a vehicle (passengers, parcels, sign): left out of the roof measure. */
  const ours = new WeakSet<THREE.Object3D>();

  const crates: Crate[] = [];
  let crateProto: THREE.Object3D | null = null;

  const depots: Depot[] = [];
  let depotResult: { spots: DepotSpot[]; boxes: Box[] } | null = null;

  function newSlot(): WaitSlot {
    return {
      id: null, seed: NaN, pose: '', x: 0, z: 0, yaw: 0, shownAt: 0, model: null,
      animator: createAnimator(), marker: new THREE.Mesh(MARKER_GEO, MARKER_MAT),
    };
  }

  function hideSlot(s: WaitSlot): void {
    if (s.model) s.model.object.visible = false;
    s.id = null;
  }

  function dropSeated(v: Vehicle, rec: SeatedRec): void {
    for (const s of rec.list) freeModel(s.model);
    seatedTotal -= rec.list.length;
    seated.delete(v);
  }

  function clearParcels(v: Vehicle): void {
    for (const p of parcels.get(v) ?? []) p.removeFromParent();
    parcels.delete(v);
  }

  function clearSign(v: Vehicle): void {
    signs.get(v)?.removeFromParent();
    signs.delete(v);
  }

  function roofTop(v: Vehicle): number {
    let top = roofTops.get(v);
    if (top === undefined) {
      v.object.updateWorldMatrix(true, true);
      const box = new THREE.Box3();
      for (const c of v.object.children) if (!ours.has(c)) box.expandByObject(c);
      top = box.isEmpty() ? 1 : box.max.y - v.object.position.y;
      roofTops.set(v, top);
    }
    return top;
  }

  function makeDepotProbe(world: World): SpotProbe {
    const blockedBy = boxesBlocked(world.boxes, world.half);
    return {
      ground: heightAt,
      water: (x, z) => waterAt(x, z)?.depth ?? 0,
      slope: slopeAt,
      blocked: (x, z, r) => blockedBy(x, z, r) || !circleClearOfStreets(x, z, r),
    };
  }

  function buildCrateProto(): THREE.Object3D {
    if (!crateProto) crateProto = buildPrefab('cargo-crate');
    return crateProto;
  }

  return {
    showWaiting(id, x, z, yaw, lookSeed, pose) {
      let s = waiting.find((w) => w.id === id);
      if (!s) {
        s = waiting.find((w) => w.id === null);
        if (!s && waiting.length < MAX_WAITING) {
          s = newSlot();
          waiting.push(s);
        }
        // Full: the oldest waiting gnome leaves.
        if (!s) s = waiting.reduce((a, b) => (b.shownAt < a.shownAt ? b : a));
        if (s.id !== null) hideSlot(s);
        s.id = id;
      }
      s.x = x;
      s.z = z;
      s.yaw = yaw;
      s.shownAt = ++waitTick;
      let rebuilt = false;
      if (!s.model || s.seed !== lookSeed) {
        if (s.model) {
          s.marker.removeFromParent();
          freeModel(s.model);
        }
        s.model = makeGnome(scene, lookFromSeed(lookSeed));
        s.model.object.add(s.marker);
        s.seed = lookSeed;
        s.animator = createAnimator();
        rebuilt = true;
      }
      s.model.object.visible = true;
      if (rebuilt || s.pose !== pose) {
        s.animator.play(pose, { loop: true });
        s.pose = pose;
      }
    },

    hideWaiting(id) {
      const s = waiting.find((w) => w.id === id);
      if (s) hideSlot(s);
    },

    setPassengers(v, seats, mood) {
      if (seats.length === 0) {
        const rec = seated.get(v);
        if (rec) dropSeated(v, rec);
        return;
      }
      const key = seats.map(([seat, seed]) => `${seat}:${seed}`).join(',');
      const cur = seated.get(v);
      if (cur && cur.key === key) {
        if (cur.mood !== mood) {
          cur.mood = mood;
          for (const s of cur.list) s.animator.play(seatAnim(v, mood), { loop: true });
        }
        return;
      }
      if (cur) dropSeated(v, cur);

      const list: Seated[] = [];
      const maxSeat = passengerCount(v.spec);
      for (const [seat, seed] of seats) {
        if (seatedTotal >= MAX_SEATED) break;
        if (seat < 1 || seat > maxSeat) continue;
        const [x, y, z] = seatPos(v.spec, seat);
        const model = makeGnome(v.object, lookFromSeed(seed));
        model.object.position.set(x, y, z);
        model.object.rotation.y = 0;
        ours.add(model.object);
        model.update(gnomeState(x, y, z, 0, 0, true), 0);
        const animator = createAnimator();
        animator.play(seatAnim(v, mood), { loop: true, offset: (seed % 100) / 50 });
        list.push({ model, animator, x, y, z });
        seatedTotal++;
      }
      seated.set(v, { key, mood, list });
    },

    setParcels(v, kinds) {
      clearParcels(v);
      const shown = kinds.slice(0, 5);
      const list: THREE.Object3D[] = [];
      shown.forEach((kind, i) => {
        let proto = parcelProto.get(kind);
        if (!proto) {
          proto = buildPrefab(PARCEL_PREFAB[kind]);
          parcelProto.set(kind, proto);
        }
        const p = proto.clone();
        p.scale.setScalar(1.2);
        p.position.set((i - (shown.length - 1) / 2) * 0.5, v.spec.seat[1], v.spec.seat[2] - 0.6);
        v.object.add(p);
        ours.add(p);
        list.push(p);
      });
      if (list.length > 0) parcels.set(v, list);
    },

    setSign(v, job) {
      clearSign(v);
      const id = job ? SIGN_PREFAB[job] : null;
      if (!id) return;
      const sign = buildPrefab(id);
      sign.position.set(0, roofTop(v) + 0.02, 0);
      v.object.add(sign);
      ours.add(sign);
      signs.set(v, sign);
    },

    clearVehicle(v) {
      const rec = seated.get(v);
      if (rec) dropSeated(v, rec);
      clearParcels(v);
      clearSign(v);
    },

    buildDepots(world) {
      if (depotResult) return depotResult;
      const probe = makeDepotProbe(world);
      const spots: DepotSpot[] = [];
      const boxes: Box[] = [];
      const targets: { job: JobId | 'tubes'; x: number; z: number; prefab: string }[] = [
        ...(Object.keys(JOBS) as JobId[]).map((job) => ({
          job, x: JOBS[job].depot.x, z: JOBS[job].depot.z, prefab: JOBS[job].depot.prefab,
        })),
        { job: 'tubes', x: TUBE_RACK_TARGET.x, z: TUBE_RACK_TARGET.z, prefab: 'tube-rack' },
      ];
      targets.forEach((t, i) => {
        const spot = findSafeSpot(t.x, t.z, probe, { radius: 2.2, minDist: 0, maxDist: 40, maxSlope: 0.25, maxWater: 0 });
        if (!spot) return;

        const kiosk = buildPrefab(t.prefab);
        kiosk.position.set(spot.x, spot.y, spot.z);
        kiosk.rotation.y = spot.yaw;
        scene.add(kiosk);
        registerCull(kiosk, 'prop');

        // The dispatcher stands 1.5 m in front of the kiosk, facing out.
        const dx = spot.x + Math.sin(spot.yaw) * 1.5;
        const dz = spot.z + Math.cos(spot.yaw) * 1.5;
        const dy = heightAt(dx, dz);
        const model = makeGnome(scene, lookFromSeed(1000 + i));
        const animator = createAnimator();
        animator.play(DISPATCH_ANIM[t.job], { loop: true, offset: i * 0.7 });
        registerCull(model.object, 'gnome');
        depots.push({ x: dx, z: dz, y: dy, yaw: spot.yaw, model, animator });

        const half = t.prefab === 'pigeon-drop-depot' ? 1.6 : 1.0;
        boxes.push({ minX: spot.x - half, maxX: spot.x + half, minZ: spot.z - half, maxZ: spot.z + half, h: 2.6 });
        spots.push({ job: t.job, x: spot.x, z: spot.z, yaw: spot.yaw });
      });
      depotResult = { spots, boxes };
      return depotResult;
    },

    dropCrate(x, y, z, vx, vz) {
      if (crates.length >= MAX_CRATES) {
        const old = crates.shift();
        old?.obj.removeFromParent();
      }
      const obj = buildCrateProto().clone();
      obj.position.set(x, y, z);
      scene.add(obj);
      crates.push({ obj, x, y, z, vx, vy: 0, vz, landed: false, age: 0 });
    },

    update(dt, camX, camZ) {
      let depotNear = false;
      for (const d of depots) {
        if (Math.hypot(d.x - camX, d.z - camZ) <= RANGE) {
          depotNear = true;
          break;
        }
      }
      let waitingShown = 0;
      for (const s of waiting) if (s.id !== null) waitingShown++;
      if (!depotNear && waitingShown === 0 && seatedTotal === 0 && crates.length === 0) return;

      bobT += dt;

      for (const s of waiting) {
        if (s.id === null || !s.model) continue;
        const near = Math.hypot(s.x - camX, s.z - camZ) <= RANGE;
        s.model.object.visible = near;
        if (!near) continue;
        const y = heightAt(s.x, s.z);
        s.model.update(gnomeState(s.x, y, s.z, s.yaw, 0), dt);
        s.animator.apply(s.model, dt);
        s.marker.position.set(0, MARKER_Y + Math.sin(bobT * 3) * 0.08, 0);
      }

      for (const [v, rec] of seated) {
        const near = Math.hypot(v.x - camX, v.z - camZ) <= RANGE;
        for (const s of rec.list) {
          s.model.object.visible = near;
          if (!near) continue;
          s.model.update(gnomeState(s.x, s.y, s.z, 0, 0, true), dt);
          s.animator.apply(s.model, dt);
        }
      }

      for (const d of depots) {
        if (Math.hypot(d.x - camX, d.z - camZ) > RANGE) continue;
        d.model.update(gnomeState(d.x, d.y, d.z, d.yaw, 0), dt);
        d.animator.apply(d.model, dt);
      }

      for (let i = crates.length - 1; i >= 0; i--) {
        const c = crates[i];
        if (!c.landed) {
          c.vy -= CRATE_GRAVITY * dt;
          c.x += c.vx * dt;
          c.z += c.vz * dt;
          c.y += c.vy * dt;
          const g = heightAt(c.x, c.z);
          const w = waterAt(c.x, c.z);
          const floor = w ? Math.max(g, w.surface) : g;
          if (c.y <= floor) {
            c.y = floor;
            c.landed = true;
            c.vx = 0;
            c.vy = 0;
            c.vz = 0;
          }
        } else {
          c.age += dt;
          if (c.age >= CRATE_STAY) {
            c.obj.removeFromParent();
            crates.splice(i, 1);
            continue;
          }
        }
        c.obj.position.set(c.x, c.y, c.z);
        c.obj.visible = Math.hypot(c.x - camX, c.z - camZ) <= RANGE;
      }
    },
  };
}
