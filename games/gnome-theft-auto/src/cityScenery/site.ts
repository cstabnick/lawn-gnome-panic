// Where new scenery may stand (docs/roadmaps/gta-parks-and-fringe.md). One Site is made after the whole world is built
// (every collider in world.boxes, the skyways installed) and shared by the parks, the street scenery and the fringe, in
// that order: each placement checks `free` and then `claim`s its footprint, so later planners keep clear of it.
//
// Keep-outs: every collider (world.boxes), parked vehicles, cutscene stage spots and stage sets, quest givers, world
// details, ambient gnomes, easter-egg pickups, vibe set pieces, dew barrels, stunt ramps (and their landing run),
// reserved flat sites, the fort, the airfield, skyway work sites, water, bridges, skyway decks, roads (and the city
// sidewalks), the world edge. Deterministic: the same world gives the same answers on every client.
import * as THREE from 'three';
import { buildPrefab } from '@lawn/prefabs';
import { AIRFIELD, BASE, CITY_HALF, HIGHWAYS, ROAD_LINES, SPAWN, WORLD_HALF } from '../config';
import type { Box, World } from '../types';
import { heightAt } from '../terrain';
import { onWaterCourse, waterLevelAt, bridgeDeckAt } from '../water';
import { stageKeepOut } from '../stageClear';
import { stageSetBoxes } from '../quests/stages';
import { GIVERS } from '../quests/defs';
import { WORLD_DETAILS } from '../worldDetails';
import { AMBIENT_GNOMES } from '../ambientGnomes';
import { GOLDEN_ACORN_SPOTS, HOA_SIGN_SPOTS } from '../easterEggs';
import { vibeSetPieceSpots } from '../vibeNpcs';
import { STUNT_RAMPS } from '../stunts';
import { markersOf, markerNum } from '../levels';
import { deckContactsAt } from '../highways/deck';
import { SKYWAY_SITES } from '../highways/skyways';
import { mowableAt } from '../flora/kinds';
import type { Dress, DressClass, DressPlan } from './types';
import type { Swatch } from '@lawn/prefabs';

export interface Rect { minX: number; maxX: number; minZ: number; maxZ: number }

export interface FreeOpts {
  /** Gap to keep from colliders and claimed footprints (m). Default 0.3. Negative lets pieces touch (fence runs). */
  pad?: number;
  /** Every corner, edge middle and the centre must be at least this far from a road centre line. Default 7.55
   *  (outside a city sidewalk: road half width 5 + sidewalk 2.5). */
  roadClear?: number;
  /** Keep this far from water and bridges (m). Default 2. */
  water?: number;
  /** Keep this far from any skyway deck (m). Default 3. */
  deck?: number;
}

export interface PlaceOpts extends FreeOpts {
  id: string;
  x: number; z: number;
  yaw?: number;
  scale?: number;
  cls: DressClass;
  /** true: a collider of the measured footprint and height; a number: a collider that tall (m above the ground).
   *  Ignored (no collider) for mowable plants (flora/kinds.ts mowableAt). */
  solid?: boolean | number;
  tint?: Swatch | number;
  trim?: Swatch | number;
  /** Skip when the ground under the footprint varies by more than this (m). Default 1.2. */
  maxDrop?: number;
}

export interface Site {
  readonly world: World;
  /** Colliders claimed so far (absolute top h). install.ts adds them to world.boxes. */
  readonly colliders: Box[];
  /** True when the rectangle is clear of every keep-out (see the file header). */
  free(r: Rect, opts?: FreeOpts): boolean;
  /** Mark a footprint as taken. With `top` (m above the ground) it is also a collider. */
  claim(r: Rect, top?: number): void;
  /** Ground patches (paths, yards, tracks, ponds) must never overlap each other (they would z-fight): true when `r`
   *  touches no patch claimed so far. Props do not block patches; patches block props only if also claim()ed. */
  patchFree(r: Rect): boolean;
  claimPatch(r: Rect): void;
  /** Distance from (x, z) to the nearest road centre line: every highway and street, and the city grid. */
  roadDist(x: number, z: number): number;
  /** Largest ground height difference over the rectangle's corners and centre. */
  drop(r: Rect): number;
  /** Measure, check, claim and add one prefab to `plan.dress`. False when it does not fit (nothing is added). */
  place(plan: DressPlan, o: PlaceOpts): boolean;
}

// ---- Prefab footprints (cached unscaled local boxes) ----------------------------------------------------------------

const protoCache = new Map<string, THREE.Box3>();
/** A prefab's local bounding box at scale 1 (measured once). */
export function prefabBox(id: string): THREE.Box3 {
  let b = protoCache.get(id);
  if (!b) {
    b = new THREE.Box3().setFromObject(buildPrefab(id, { lights: false }));
    protoCache.set(id, b);
  }
  return b;
}

/** Height of a prefab at a scale (top of its box). */
export function prefabHeight(id: string, scale = 1): number {
  return prefabBox(id).max.y * scale;
}

/** The ground rectangle of a prefab placed at (x, z), yaw (three.js rotation.y) and scale. */
export function footprintRect(id: string, x: number, z: number, yaw = 0, scale = 1): Rect {
  const lb = prefabBox(id);
  const c = Math.cos(yaw), s = Math.sin(yaw);
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const x0 of [lb.min.x, lb.max.x]) {
    for (const z0 of [lb.min.z, lb.max.z]) {
      const px = x0 * scale, pz = z0 * scale;
      const rx = c * px + s * pz;
      const rz = -s * px + c * pz;
      minX = Math.min(minX, rx); maxX = Math.max(maxX, rx);
      minZ = Math.min(minZ, rz); maxZ = Math.max(maxZ, rz);
    }
  }
  return { minX: x + minX, maxX: x + maxX, minZ: z + minZ, maxZ: z + maxZ };
}

export const rectAround = (x: number, z: number, hw: number, hd = hw): Rect =>
  ({ minX: x - hw, maxX: x + hw, minZ: z - hd, maxZ: z + hd });

export const growRect = (r: Rect, g: number): Rect =>
  ({ minX: r.minX - g, maxX: r.maxX + g, minZ: r.minZ - g, maxZ: r.maxZ + g });

const gapOf = (a: Rect, b: Rect): number => {
  const dx = Math.max(a.minX - b.maxX, b.minX - a.maxX);
  const dz = Math.max(a.minZ - b.maxZ, b.minZ - a.maxZ);
  if (dx < 0 && dz < 0) return Math.max(dx, dz);
  return Math.hypot(Math.max(dx, 0), Math.max(dz, 0));
};

/** The 9 sample points of a rectangle: corners, edge middles, centre. */
function samples(r: Rect): [number, number][] {
  const cx = (r.minX + r.maxX) / 2, cz = (r.minZ + r.maxZ) / 2;
  return [
    [r.minX, r.minZ], [cx, r.minZ], [r.maxX, r.minZ],
    [r.minX, cz], [cx, cz], [r.maxX, cz],
    [r.minX, r.maxZ], [cx, r.maxZ], [r.maxX, r.maxZ],
  ];
}

// ---- Roads ------------------------------------------------------------------------------------------------------

interface Seg { ax: number; az: number; bx: number; bz: number; minX: number; maxX: number; minZ: number; maxZ: number }
let segCache: Seg[] | null = null;
function roadSegs(): Seg[] {
  if (segCache) return segCache;
  const out: Seg[] = [];
  for (const h of HIGHWAYS) {
    for (let k = 0; k + 1 < h.points.length; k++) {
      const [ax, az] = h.points[k], [bx, bz] = h.points[k + 1];
      out.push({ ax, az, bx, bz, minX: Math.min(ax, bx), maxX: Math.max(ax, bx), minZ: Math.min(az, bz), maxZ: Math.max(az, bz) });
    }
  }
  segCache = out;
  return out;
}

/** Distance from (x, z) to the nearest road centre line (highways, streets and the city grid inside Turfton). */
export function roadDistance(x: number, z: number): number {
  let d = Infinity;
  for (const s of roadSegs()) {
    // Quick reject: farther from the segment's box than the best so far.
    const bx = Math.max(s.minX - x, 0, x - s.maxX), bz = Math.max(s.minZ - z, 0, z - s.maxZ);
    if (bx * bx + bz * bz >= d * d) continue;
    const vx = s.bx - s.ax, vz = s.bz - s.az;
    const l2 = vx * vx + vz * vz || 1e-9;
    const t = Math.max(0, Math.min(1, ((x - s.ax) * vx + (z - s.az) * vz) / l2));
    d = Math.min(d, Math.hypot(x - (s.ax + vx * t), z - (s.az + vz * t)));
  }
  if (Math.abs(x) <= CITY_HALF + 10 && Math.abs(z) <= CITY_HALF + 10) {
    for (const v of ROAD_LINES) {
      if (Math.abs(z) <= CITY_HALF) d = Math.min(d, Math.abs(x - v));
      if (Math.abs(x) <= CITY_HALF) d = Math.min(d, Math.abs(z - v));
    }
  }
  return d;
}

// ---- The site -----------------------------------------------------------------------------------------------------

const CELL = 16;

/** Keep-out rectangles that are not colliders (built once per site). */
function keepOuts(world: World): Rect[] {
  const out: Rect[] = [];
  const sq = (x: number, z: number, r: number): void => { out.push(rectAround(x, z, r)); };
  for (const k of stageKeepOut()) out.push(k);
  for (const b of stageSetBoxes()) out.push(b);
  for (const g of Object.values(GIVERS) as { x: number; z: number }[]) sq(g.x, g.z, 3);
  for (const d of WORLD_DETAILS) sq(d.x, d.z, 2.5);
  for (const a of AMBIENT_GNOMES) sq(a.x, a.z, 1.5);
  for (const s of GOLDEN_ACORN_SPOTS) sq(s.x, s.z, 1.5);
  for (const s of HOA_SIGN_SPOTS) sq(s.x, s.z, 1.5);
  for (const p of Object.values(vibeSetPieceSpots(world))) sq(p.x, p.z, 3);
  for (const b of world.dewBarrels ?? []) sq(b.x, b.z, 2);
  for (const p of world.parked) sq(p.x, p.z, 4);
  sq(SPAWN.x, SPAWN.z, 4);
  // Gnorwin Clayfoot's coned statue (easterEggs.ts builds it after the world, with no collider).
  sq(-30, 24.8, 2);
  for (const r of STUNT_RAMPS) {
    // The ramp and its landing run: from 2 m behind the entry to 28 m past the lip, 4 m wider than the ramp.
    const fx = Math.sin(r.yaw), fz = Math.cos(r.yaw), rx = Math.cos(r.yaw), rz = -Math.sin(r.yaw);
    const hw = r.width / 2 + 2;
    const pts: [number, number][] = [];
    for (const a of [-r.length / 2 - 2, r.length / 2 + 28]) {
      for (const c of [-hw, hw]) pts.push([r.x + a * fx + c * rx, r.z + a * fz + c * rz]);
    }
    out.push({
      minX: Math.min(...pts.map((p) => p[0])), maxX: Math.max(...pts.map((p) => p[0])),
      minZ: Math.min(...pts.map((p) => p[1])), maxZ: Math.max(...pts.map((p) => p[1])),
    });
  }
  for (const m of markersOf('reserve')) {
    out.push(growRect(rectAround(m.x, m.z, markerNum(m, 'hw'), markerNum(m, 'hd')), 4));
  }
  out.push(growRect({ minX: BASE.minX, maxX: BASE.maxX, minZ: BASE.minZ, maxZ: BASE.maxZ }, 6));
  out.push(growRect(rectAround(AIRFIELD.x, AIRFIELD.z, AIRFIELD.length / 2, AIRFIELD.width / 2 + 30), 6));
  for (const p of AIRFIELD.planeSpots) sq(p.x, p.z, 10);
  for (const s of SKYWAY_SITES) out.push(growRect(s.yard, 3));
  return out;
}

export function createSite(world: World): Site {
  const cells = new Map<number, Rect[]>();
  const key = (cx: number, cz: number): number => cx * 100003 + cz;
  const file = (r: Rect): void => {
    for (let cx = Math.floor(r.minX / CELL); cx <= Math.floor(r.maxX / CELL); cx++) {
      for (let cz = Math.floor(r.minZ / CELL); cz <= Math.floor(r.maxZ / CELL); cz++) {
        const k = key(cx, cz);
        const list = cells.get(k);
        if (list) list.push(r); else cells.set(k, [r]);
      }
    }
  };
  for (const b of world.boxes) file(b);
  for (const k of keepOuts(world)) file(k);
  const colliders: Box[] = [];
  const patchCells = new Map<number, Rect[]>();
  const patchFree = (r: Rect): boolean => {
    for (let cx = Math.floor(r.minX / CELL); cx <= Math.floor(r.maxX / CELL); cx++) {
      for (let cz = Math.floor(r.minZ / CELL); cz <= Math.floor(r.maxZ / CELL); cz++) {
        for (const b of patchCells.get(key(cx, cz)) ?? []) if (gapOf(r, b) < 0.05) return false;
      }
    }
    return true;
  };
  const claimPatch = (r: Rect): void => {
    for (let cx = Math.floor(r.minX / CELL); cx <= Math.floor(r.maxX / CELL); cx++) {
      for (let cz = Math.floor(r.minZ / CELL); cz <= Math.floor(r.maxZ / CELL); cz++) {
        const k = key(cx, cz);
        const list = patchCells.get(k);
        if (list) list.push({ ...r }); else patchCells.set(k, [{ ...r }]);
      }
    }
  };

  const hitsFiled = (r: Rect, pad: number): boolean => {
    const g = Math.max(pad, 0);
    for (let cx = Math.floor((r.minX - g) / CELL); cx <= Math.floor((r.maxX + g) / CELL); cx++) {
      for (let cz = Math.floor((r.minZ - g) / CELL); cz <= Math.floor((r.maxZ + g) / CELL); cz++) {
        const list = cells.get(key(cx, cz));
        if (!list) continue;
        for (const b of list) if (gapOf(r, b) < pad) return true;
      }
    }
    return false;
  };

  const drop = (r: Rect): number => {
    let lo = Infinity, hi = -Infinity;
    for (const [x, z] of samples(r)) {
      const h = heightAt(x, z);
      lo = Math.min(lo, h); hi = Math.max(hi, h);
    }
    return hi - lo;
  };

  const free = (r: Rect, o: FreeOpts = {}): boolean => {
    const pad = o.pad ?? 0.3;
    const roadClear = o.roadClear ?? 7.55;
    const water = o.water ?? 2;
    const deck = o.deck ?? 3;
    const edge = WORLD_HALF - 20;
    if (r.minX < -edge || r.maxX > edge || r.minZ < -edge || r.maxZ > edge) return false;
    for (const [x, z] of samples(r)) if (roadDistance(x, z) < roadClear) return false;
    if (hitsFiled(r, pad)) return false;
    for (const [x, z] of samples(growRect(r, water))) {
      if (waterLevelAt(x, z) !== null || bridgeDeckAt(x, z) !== null) return false;
    }
    if (onWaterCourse((r.minX + r.maxX) / 2, (r.minZ + r.maxZ) / 2, water + Math.max(r.maxX - r.minX, r.maxZ - r.minZ) / 2)) return false;
    for (const [x, z] of samples(growRect(r, deck))) if (deckContactsAt(x, z).length > 0) return false;
    return true;
  };

  const claim = (r: Rect, top?: number): void => {
    file({ ...r });
    if (top === undefined) return;
    const y = Math.min(...samples(r).map(([x, z]) => heightAt(x, z)));
    colliders.push({ minX: r.minX, maxX: r.maxX, minZ: r.minZ, maxZ: r.maxZ, h: y + top });
  };

  const place = (plan: DressPlan, o: PlaceOpts): boolean => {
    const yaw = o.yaw ?? 0;
    const scale = o.scale ?? 1;
    const r = footprintRect(o.id, o.x, o.z, yaw, scale);
    if (!free(r, o)) return false;
    if (drop(r) > (o.maxDrop ?? 1.2)) return false;
    const h = prefabHeight(o.id, scale);
    const mow = mowableAt(o.id, h);
    const top = mow || !o.solid ? undefined : typeof o.solid === 'number' ? o.solid : h;
    claim(r, top);
    // Wide things sit on their lowest corner (a little sunk rather than floating); small ones on their centre.
    const wide = Math.max(r.maxX - r.minX, r.maxZ - r.minZ) > 3;
    const y = wide ? Math.min(...samples(r).map(([x, z]) => heightAt(x, z))) - 0.05 : heightAt(o.x, o.z);
    const d: Dress = { id: o.id, x: o.x, y, z: o.z, yaw, scale, cls: o.cls };
    if (o.tint !== undefined) d.tint = o.tint;
    if (o.trim !== undefined) d.trim = o.trim;
    plan.dress.push(d);
    return true;
  };

  return { world, colliders, free, claim, patchFree, claimPatch, roadDist: roadDistance, drop, place };
}
