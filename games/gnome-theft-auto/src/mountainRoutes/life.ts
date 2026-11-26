// E33: life on the mountain routes: a small herd of goats grazing the Hatbrim's slopes, two raptors circling the Bobble's
// summit and the Keyhole, and the wind and bleats (issue D4). Built once; the goats and birds move per frame, near the
// player only. Deterministic: a seeded mulberry32 draws every random number, so a build always looks the same.
import * as THREE from 'three';
import { buildPrefab } from '@lawn/prefabs';
import { placeOnGround } from '../terrainMesh';
import { heightAt } from '../terrain';
import { playAt } from '../sound';
import type { World } from '../types';
import type { Track } from '../raceTrack/trackDef';
import type { Area, MountainDeps } from './deps';
import { BRIM_WALK_SPOTS } from './defs/brimWalk';
import { HATBAND_SPOTS } from './defs/hatband';
import { SPINE_CUT_SPOTS } from './defs/spineCut';
import { ALL_ROUTES } from './routes';

const SEED = 0xd4;
const GOAT_COUNT_SCREE = 4;
const GOAT_COUNT_PATE = 3;
const GOAT_SPEED = 0.3;
const GOAT_WANDER = 25;
const GOAT_NEAR = 150;
const BLEAT_RANGE = 40;
const WIND_RANGE = 70;

/** Route clearance grid: 2 m cells, a cell is blocked when its centre is within BLOCK_R (+ half a diagonal) of a route. */
const CELL = 2;
const BLOCK_R = 9;

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

function cellKey(ix: number, iz: number): number {
  return (ix + 4096) * 8192 + (iz + 4096);
}

/** Every cell within BLOCK_R of a route's samples (conservative: an unblocked point is over BLOCK_R from every sample). */
function buildBlocked(tracks: readonly Track[]): Set<number> {
  const set = new Set<number>();
  const reach = BLOCK_R + CELL * Math.SQRT1_2;
  const span = Math.ceil(reach / CELL) + 1;
  for (const t of tracks) {
    for (const s of t.samples()) {
      const cx = Math.floor(s.x / CELL);
      const cz = Math.floor(s.z / CELL);
      for (let i = -span; i <= span; i++) {
        for (let j = -span; j <= span; j++) {
          const ix = cx + i;
          const iz = cz + j;
          const dx = (ix + 0.5) * CELL - s.x;
          const dz = (iz + 0.5) * CELL - s.z;
          if (dx * dx + dz * dz <= reach * reach) set.add(cellKey(ix, iz));
        }
      }
    }
  }
  return set;
}

interface Goat {
  obj: THREE.Group;
  cx: number;
  cz: number;
  x: number;
  z: number;
  tx: number;
  tz: number;
  /** Seconds left to graze (head down) or to pause; when it runs out the goat picks a new target. */
  graze: number;
}

interface Bird {
  obj: THREE.Group;
  cx: number;
  cz: number;
  r: number;
  y: number;
  a: number;
  /** Radians per second so the bird flies at 8 m/s. */
  rate: number;
}

const BIRD_SPEED = 8;
const BIRD_BANK = 0.3;

export function createMountainLife(scene: THREE.Scene, world: World, deps: MountainDeps): Area {
  void world; void deps;
  heightAt(0, 0);
  const rng = mulberry32(SEED);
  const blocked = buildBlocked(ALL_ROUTES);
  const isBlocked = (x: number, z: number) => blocked.has(cellKey(Math.floor(x / CELL), Math.floor(z / CELL)));

  /** The nearest clear point to (x0, z0), searching outward in rings. */
  const findClear = (x0: number, z0: number): { x: number; z: number } => {
    if (!isBlocked(x0, z0)) return { x: x0, z: z0 };
    for (let r = 4; r <= 60; r += 2) {
      for (let k = 0; k < 16; k++) {
        const a = (k / 16) * Math.PI * 2;
        const x = x0 + Math.cos(a) * r;
        const z = z0 + Math.sin(a) * r;
        if (!isBlocked(x, z)) return { x, z };
      }
    }
    return { x: x0, z: z0 };
  };

  const goats: Goat[] = [];
  const makeHerd = (cx: number, cz: number, count: number) => {
    for (let i = 0; i < count; i++) {
      const obj = buildPrefab('goat', { lights: false });
      obj.name = 'mountain-goat';
      obj.rotation.order = 'YXZ';
      let x = cx;
      let z = cz;
      for (let t = 0; t < 30; t++) {
        const a = rng() * Math.PI * 2;
        const r = Math.sqrt(rng()) * 6;
        const px = cx + Math.cos(a) * r;
        const pz = cz + Math.sin(a) * r;
        if (!isBlocked(px, pz)) { x = px; z = pz; break; }
      }
      placeOnGround(obj, x, z);
      scene.add(obj);
      const g: Goat = { obj, cx, cz, x, z, tx: x, tz: z, graze: 0 };
      pickTarget(g);
      goats.push(g);
    }
  };

  const pickTarget = (g: Goat) => {
    for (let t = 0; t < 24; t++) {
      const a = rng() * Math.PI * 2;
      const r = Math.sqrt(rng()) * GOAT_WANDER;
      const x = g.cx + Math.cos(a) * r;
      const z = g.cz + Math.sin(a) * r;
      if (!isBlocked(x, z)) { g.tx = x; g.tz = z; return; }
    }
    g.tx = g.x;
    g.tz = g.z;
    g.graze = 3;
  };

  const screeCentre = findClear(HATBAND_SPOTS.scree.x, HATBAND_SPOTS.scree.z);
  makeHerd(screeCentre.x, screeCentre.z, GOAT_COUNT_SCREE);
  const pate = BRIM_WALK_SPOTS.pateCairn;
  const pateCentre = findClear(pate.x - 35, pate.z);
  makeHerd(pateCentre.x, pateCentre.z, GOAT_COUNT_PATE);

  const birds: Bird[] = [];
  const makeBird = (spot: { x: number; z: number }, r: number, alt: number) => {
    const obj = buildPrefab('bird-raptor', { lights: false, scale: 1.8, tint: 0x4a3322 });
    obj.name = 'mountain-bird';
    obj.rotation.order = 'YXZ';
    const cx = spot.x;
    const cz = spot.z;
    const y = heightAt(cx, cz) + alt;
    obj.userData.home = { x: cx, z: cz, r };
    scene.add(obj);
    birds.push({ obj, cx, cz, r, y, a: rng() * Math.PI * 2, rate: BIRD_SPEED / r });
  };
  makeBird(BRIM_WALK_SPOTS.summit, 60, 35);
  makeBird(SPINE_CUT_SPOTS.keyhole, 40, 30);

  const summit = BRIM_WALK_SPOTS.summit;
  let bleatIn = 8 + rng() * 12;
  let gustIn = 5 + rng() * 5;

  const stepGoat = (g: Goat, dt: number) => {
    if (g.graze > 0) {
      g.graze -= dt;
      g.obj.rotation.x = 0.15;
      if (g.graze <= 0) { g.obj.rotation.x = 0; pickTarget(g); }
      return;
    }
    const dx = g.tx - g.x;
    const dz = g.tz - g.z;
    const d = Math.hypot(dx, dz);
    if (d < 0.3) {
      g.graze = 3 + rng() * 5;
      return;
    }
    const sp = Math.min(GOAT_SPEED * dt, d);
    const nx = g.x + (dx / d) * sp;
    const nz = g.z + (dz / d) * sp;
    if (isBlocked(nx, nz)) {
      // The straight line runs into a route: stop, then pick another target.
      g.tx = g.x;
      g.tz = g.z;
      g.graze = 0.5;
      return;
    }
    g.x = nx;
    g.z = nz;
    placeOnGround(g.obj, g.x, g.z);
    g.obj.rotation.y = Math.atan2(dx, dz);
  };

  return {
    update(dt, px, pz) {
      for (const g of goats) {
        if (Math.hypot(g.x - px, g.z - pz) > GOAT_NEAR) continue;
        stepGoat(g, dt);
      }
      for (const b of birds) {
        b.a += b.rate * dt;
        const tx = -Math.sin(b.a);
        const tz = Math.cos(b.a);
        b.obj.position.set(b.cx + Math.cos(b.a) * b.r, b.y, b.cz + Math.sin(b.a) * b.r);
        // Heading is the tangent of the circle; the circle turns right, so the bird banks right (roll positive).
        b.obj.rotation.y = Math.atan2(tx, tz);
        b.obj.rotation.z = BIRD_BANK;
      }

      bleatIn -= dt;
      if (bleatIn <= 0) {
        bleatIn = 8 + rng() * 12;
        let best: Goat | null = null;
        let bestD = BLEAT_RANGE;
        for (const g of goats) {
          const d = Math.hypot(g.x - px, g.z - pz);
          if (d < bestD) { bestD = d; best = g; }
        }
        if (best) playAt('goat-bleat', { x: best.x, z: best.z });
      }

      gustIn -= dt;
      if (gustIn <= 0) {
        gustIn = 5 + rng() * 5;
        if (Math.hypot(summit.x - px, summit.z - pz) <= WIND_RANGE) playAt('wind-gust', summit);
      }
    },
    blips: () => [],
  };
}
