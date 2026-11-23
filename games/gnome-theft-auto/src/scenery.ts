// Countryside landscaping (terrain pass): tree belts on the landscape's ridges, hills and mountain (src/data/landscape.json),
// regional roadsides (hedges, walls, fences) along the country highways, signature props beside the roads. Every choice
// comes from the region's theme (src/regionThemes.ts), so each region looks like itself and borders blend.
// planScenery is pure and deterministic for a given `existing` list; buildScenery puts it in the world.
import * as THREE from 'three';
import { buildPrefab, buildStaticPrefabs } from '@lawn/prefabs';
import { mulberry32 } from '@lawn/level';
import { CITY_HALF, HIGHWAYS, ROAD_WIDTH, type Highway } from './config';
import type { Box } from './types';
import { heightAt } from './terrain';
import { onWaterCourse } from './water';
import { stageKeepOut } from './stageClear';
import { LANDSCAPE, featureHeightAt, macroMaskAt, type LandscapeFeature } from './landforms/macro';
import { distToPolyline, valueNoise } from './landforms/noise';
import { themeAt, themeSize, type RegionTheme } from './regionThemes';

/** One prefab of the countryside scenery. `y` is absolute (the ground under it plus any lift). */
export interface SceneryPlacement { id: string; x: number; y: number; z: number; yaw: number; scale: number }

export interface SceneryPlan {
  placements: SceneryPlacement[];
  /** Colliders (tree trunks, walls), `h` = absolute top height. */
  boxes: Box[];
}

/** Keep-out grown round the city square. */
const CITY_GROW = 40;
/** The world's playable square half size: nothing is planted beyond it. */
const EDGE = 880;
/** Keep clear of any highway centre line (road half width plus 3). */
const ROAD_CLEAR = ROAD_WIDTH / 2 + 3;
/** Keep clear of water (margin on each course). */
const WATER_MARGIN = 4;
/** Roadsides and signature props start this far outside the city square. */
const LINEAR_CITY_CLEAR = 100;
/** Keep clear of existing colliders. */
const COLLIDER_CLEAR = 3;
/** Keep this far from the stage keep-outs (cutscene spots and their sight lines): a low hedge can hide a shot's target. */
const SIGHT_CLEAR = 12;
/** Roadside pieces keep this far from any other highway (junctions). */
const JUNCTION_CLEAR = 25;
/** Roadside pieces sit this far from the road centre line. */
const ROADSIDE_OFFSET = 9;
/** Gaps (entrances) in the roadside line: a 10 m gap every 60 m. */
const ROADSIDE_RUN = { every: 60, gap: 10 };
/** Signature props: 15-20 m off the road, every 90-150 m along it. */
const SIGNATURE_OFFSET = { min: 15, span: 5 };
const SIGNATURE_STEP = { min: 90, span: 60 };
const BELT_SPACING = 9;
const BELT_JITTER = 3;
const CELL = 16;
const MAX_PLACEMENTS = 3200;
/** Trees and rocks: the trunk footprint, a 1 m square for trunks. */
const TRUNK_HALF = 0.5;
/** Collider footprints for planting and rocks only when their measured footprint is at least this wide. */
const COLLIDER_MIN_SIDE = 1.5;
const LINEAR_RUN = 4;

interface Rect { minX: number; maxX: number; minZ: number; maxZ: number }

const protoCache = new Map<string, THREE.Box3>();
function localBox(id: string): THREE.Box3 {
  let b = protoCache.get(id);
  if (!b) {
    b = new THREE.Box3().setFromObject(buildPrefab(id, { lights: false }));
    protoCache.set(id, b);
  }
  return b;
}

/** Scale to place a prefab at: its region size (themeSize) over its measured longest horizontal side, else life-size. */
function scaleFor(id: string): number {
  const size = themeSize(id);
  if (!size) return 1;
  const b = localBox(id);
  return size / Math.max(b.max.x - b.min.x, b.max.z - b.min.z);
}

/** Length along the prefab's x axis once placed (roadside pieces are laid end to end by this). */
function pieceLength(id: string): number {
  const b = localBox(id);
  return (b.max.x - b.min.x) * scaleFor(id);
}

/** Half sizes of a prefab's footprint at a scale and yaw (its axes rotated, then measured), and its height. */
function footprintOf(id: string, scale: number, yaw: number): { hw: number; hd: number; h: number } {
  const lb = localBox(id);
  const c = Math.cos(yaw), s = Math.sin(yaw);
  let hw = 0, hd = 0;
  for (const x0 of [lb.min.x, lb.max.x]) {
    for (const z0 of [lb.min.z, lb.max.z]) {
      const x = x0 * scale, z = z0 * scale;
      hw = Math.max(hw, Math.abs(c * x + s * z));
      hd = Math.max(hd, Math.abs(-s * x + c * z));
    }
  }
  return { hw, hd, h: lb.max.y * scale };
}

const rectAt = (x: number, z: number, hw: number, hd: number): Rect =>
  ({ minX: x - hw, maxX: x + hw, minZ: z - hd, maxZ: z + hd });

/** Distance between two rectangles (0 when they touch or overlap). */
function rectGap(a: Rect, b: Rect): number {
  const dx = Math.max(a.minX - b.maxX, 0, b.minX - a.maxX);
  const dz = Math.max(a.minZ - b.maxZ, 0, b.minZ - a.maxZ);
  return Math.hypot(dx, dz);
}

/** Distance from (x, z) to the nearest highway centre line, optionally ignoring one highway by id. */
function highwayGap(x: number, z: number, skip?: string): number {
  let best = Infinity;
  for (const h of HIGHWAYS as readonly Highway[]) {
    if (h.id === skip) continue;
    best = Math.min(best, distToPolyline(x, z, h.points));
  }
  return best;
}

/** Ground slope (gradient magnitude) at (x, z), from heightAt at +-2 m. */
function slopeAt(x: number, z: number): number {
  const dx = (heightAt(x + 2, z) - heightAt(x - 2, z)) / 4;
  const dz = (heightAt(x, z + 2) - heightAt(x, z - 2)) / 4;
  return Math.hypot(dx, dz);
}

/** The point at arclength `s` along a polyline, with the unit direction of the segment it falls on (null past the end). */
function pointAlong(points: readonly [number, number][], s: number): { x: number; z: number; dx: number; dz: number } | null {
  let rest = s;
  for (let k = 0; k + 1 < points.length; k++) {
    const [ax, az] = points[k], [bx, bz] = points[k + 1];
    const L = Math.hypot(bx - ax, bz - az);
    if (rest <= L) {
      const t = L > 0 ? rest / L : 0;
      return { x: ax + (bx - ax) * t, z: az + (bz - az) * t, dx: (bx - ax) / L, dz: (bz - az) / L };
    }
    rest -= L;
  }
  return null;
}

/** The roadside piece a theme lines its highways with (null for none). */
function roadsideId(theme: RegionTheme): string | null {
  switch (theme.roadside) {
    case 'hedge': return theme.hedge;
    case 'wall': return theme.wall;
    case 'fence': return theme.fence;
    default: return null;
  }
}

/**
 * The countryside scenery: pure and deterministic. `existing` are the colliders already in the world (keep clear).
 * `stageKeep` are the cutscene stage keep-outs: nothing is planted within SIGHT_CLEAR of them.
 */
export function planScenery(existing: readonly Box[], stageKeep: readonly Box[] = []): SceneryPlan {
  const placements: SceneryPlacement[] = [];
  const boxes: Box[] = [];

  // Box lookup: every collider is filed under the 16 m cells its bounds touch.
  const cells = new Map<string, Box[]>();
  const cellKey = (cx: number, cz: number): string => `${cx},${cz}`;
  const file = (b: Box): void => {
    for (let cx = Math.floor(b.minX / CELL); cx <= Math.floor(b.maxX / CELL); cx++) {
      for (let cz = Math.floor(b.minZ / CELL); cz <= Math.floor(b.maxZ / CELL); cz++) {
        const k = cellKey(cx, cz);
        const list = cells.get(k);
        if (list) list.push(b); else cells.set(k, [b]);
      }
    }
  };
  for (const b of existing) file(b);
  const clearOf = (r: Rect): boolean => {
    const g = COLLIDER_CLEAR;
    for (let cx = Math.floor((r.minX - g) / CELL); cx <= Math.floor((r.maxX + g) / CELL); cx++) {
      for (let cz = Math.floor((r.minZ - g) / CELL); cz <= Math.floor((r.maxZ + g) / CELL); cz++) {
        for (const b of cells.get(cellKey(cx, cz)) ?? []) {
          if (rectGap(r, b) < g) return false;
        }
      }
    }
    return true;
  };
  const sightClear = (r: Rect): boolean => stageKeep.every((k) => rectGap(r, k) >= SIGHT_CLEAR);
  const cityGrow = CITY_HALF + CITY_GROW;
  /** Inside the map, outside the city grown by CITY_GROW, and not on water. */
  const openGround = (x: number, z: number): boolean => {
    if (Math.abs(x) > EDGE || Math.abs(z) > EDGE) return false;
    if (Math.max(Math.abs(x), Math.abs(z)) <= cityGrow) return false;
    return !onWaterCourse(x, z, WATER_MARGIN);
  };
  /** Outside the city by the roadside margin (roadsides and signature props start there). */
  const beyondTown = (x: number, z: number): boolean => Math.max(Math.abs(x), Math.abs(z)) > CITY_HALF + LINEAR_CITY_CLEAR;
  const full = (): boolean => placements.length >= MAX_PLACEMENTS;

  /**
   * A tree, a rock or a planting piece at (x, z). Its footprint (a 1 m square for trunks, the measured footprint otherwise)
   * must be clear. Trunks always get a collider; other pieces only when their footprint is at least 1.5 m wide.
   */
  const placeSolid = (id: string, x: number, z: number, yaw: number, scale: number, trunk: boolean): void => {
    if (full() || !openGround(x, z) || highwayGap(x, z) < ROAD_CLEAR) return;
    const y = heightAt(x, z);
    let r: Rect, top: number, collide: boolean;
    if (trunk) {
      r = rectAt(x, z, TRUNK_HALF, TRUNK_HALF);
      top = y + 3;
      collide = true;
    } else {
      const f = footprintOf(id, scale, yaw);
      r = rectAt(x, z, f.hw, f.hd);
      top = y + f.h;
      collide = Math.min(f.hw, f.hd) * 2 >= COLLIDER_MIN_SIDE;
    }
    if (!clearOf(r) || !sightClear(r)) return;
    placements.push({ id, x, y, z, yaw, scale });
    if (!collide) return;
    const box: Box = { minX: r.minX, maxX: r.maxX, minZ: r.minZ, maxZ: r.maxZ, h: top };
    boxes.push(box);
    file(box);
  };

  /** A roadside piece (hedge, wall or fence), lying along the road at its centre, its lowest end sets its height. */
  const placeRoadside = (id: string, x: number, z: number, yaw: number, roadId: string): void => {
    if (full()) return;
    const scale = scaleFor(id);
    const half = pieceLength(id) / 2;
    const ex = Math.cos(yaw), ez = -Math.sin(yaw);
    const ends = [{ x: x + ex * half, z: z + ez * half }, { x: x - ex * half, z: z - ez * half }];
    if (!openGround(x, z) || !ends.every((p) => openGround(p.x, p.z))) return;
    // The road out of town stays open for its first stretch (cutscenes look across it at cars on the road).
    if (!beyondTown(x, z)) return;
    if (highwayGap(x, z, roadId) < JUNCTION_CLEAR) return;
    const f = footprintOf(id, scale, yaw);
    const r = rectAt(x, z, f.hw, f.hd);
    if (!clearOf(r) || !sightClear(r)) return;
    const y = Math.min(heightAt(ends[0].x, ends[0].z), heightAt(ends[1].x, ends[1].z)) - 0.05;
    placements.push({ id, x, y, z, yaw, scale });
    const box: Box = { minX: r.minX, maxX: r.maxX, minZ: r.minZ, maxZ: r.maxZ, h: y + f.h };
    boxes.push(box);
    file(box);
  };

  // 1. Roadsides: every highway, both sides, walked end to end with the theme's piece (themes blend near borders).
  HIGHWAYS.forEach((h: Highway, hi: number) => {
    for (let k = 0; k + 1 < h.points.length; k++) {
      const [ax, az] = h.points[k], [bx, bz] = h.points[k + 1];
      const L = Math.hypot(bx - ax, bz - az);
      if (L < LINEAR_RUN) continue;
      const dx = (bx - ax) / L, dz = (bz - az) / L;
      const yaw = Math.atan2(dx, dz) - Math.PI / 2;
      for (const side of [1, -1]) {
        const rnd = mulberry32(7000 + hi * 97 + k * 13 + (side > 0 ? 1 : 2));
        const nx = -dz * side * ROADSIDE_OFFSET, nz = dx * side * ROADSIDE_OFFSET;
        let s = 0;
        while (s < L) {
          if (s % ROADSIDE_RUN.every < ROADSIDE_RUN.gap) {
            s += ROADSIDE_RUN.gap - (s % ROADSIDE_RUN.every);
            continue;
          }
          const sx = ax + dx * s + nx, sz = az + dz * s + nz;
          const theme = themeAt(sx, sz, rnd());
          const id = roadsideId(theme);
          if (!id) {
            s += LINEAR_RUN;
            continue;
          }
          const len = pieceLength(id);
          if (s + len > L) break;
          placeRoadside(id, ax + dx * (s + len / 2) + nx, az + dz * (s + len / 2) + nz, yaw, h.id);
          s += len;
        }
      }
    }
  });

  // 2. Signature props: one from the theme, 15-20 m off the road on a random side, every 90-150 m along it.
  HIGHWAYS.forEach((h: Highway, hi: number) => {
    const rnd = mulberry32(9100 + hi);
    let s = SIGNATURE_STEP.min * rnd();
    for (;;) {
      const p = pointAlong(h.points, s);
      if (!p) break;
      const side = rnd() < 0.5 ? 1 : -1;
      const off = SIGNATURE_OFFSET.min + SIGNATURE_OFFSET.span * rnd();
      const x = p.x - p.dz * side * off, z = p.z + p.dx * side * off;
      const theme = themeAt(x, z, rnd());
      const pick = theme.signature[Math.floor(rnd() * theme.signature.length)];
      const yaw = rnd() * Math.PI * 2;
      s += SIGNATURE_STEP.min + SIGNATURE_STEP.span * rnd();
      if (!pick || !beyondTown(x, z)) continue;
      placeSolid(pick, x, z, yaw, scaleFor(pick), false);
    }
  });

  // 3. Belts on the landscape features: a jittered grid, kept where the ground is high enough and clumped.
  LANDSCAPE.features.forEach((f: LandscapeFeature, i: number) => {
    const xs = f.points.map((p) => p[0]), zs = f.points.map((p) => p[1]);
    const minX = Math.max(-EDGE, Math.min(...xs) - f.r), maxX = Math.min(EDGE, Math.max(...xs) + f.r);
    const minZ = Math.max(-EDGE, Math.min(...zs) - f.r), maxZ = Math.min(EDGE, Math.max(...zs) + f.r);
    const rnd = mulberry32(4242 + i);
    for (let gx = Math.floor(minX / BELT_SPACING) * BELT_SPACING; gx <= maxX; gx += BELT_SPACING) {
      for (let gz = Math.floor(minZ / BELT_SPACING) * BELT_SPACING; gz <= maxZ; gz += BELT_SPACING) {
        // Eight draws per cell, always, so the stream does not depend on which cells are kept.
        const jx = rnd(), jz = rnd(), pick = rnd(), sc = rnd(), rot = rnd();
        const tu = rnd(), tv = rnd(), ti = rnd();
        if (full()) return;
        const x = gx + (jx * 2 - 1) * BELT_JITTER;
        const z = gz + (jz * 2 - 1) * BELT_JITTER;
        if (x < minX || x > maxX || z < minZ || z > maxZ) continue;
        const h = featureHeightAt(f, x, z, i);
        if (h < 0.15 * f.h) continue;
        if (macroMaskAt(x, z) < 0.5) continue;
        if (valueNoise(x / 60, z / 60, 99 + i) <= -0.1) continue;
        const yaw = rot * Math.PI * 2;
        const theme = themeAt(x, z, tu);
        if (f.kind === 'mountain' && h >= 0.6 * f.h) {
          // A bare rocky top: boulders only, a quarter of the points.
          if (pick < 0.25) placeSolid('garden-rock', x, z, yaw, scaleFor('garden-rock') * (0.9 + 0.4 * sc), false);
          continue;
        }
        if (slopeAt(x, z) >= 0.8) continue;
        if (theme.trees.every((t) => t === 'palm-tree')) {
          // Desert: palms at 40 % of the points, a sparse scatter of boulders at 20 %.
          if (pick < 0.4) placeSolid('palm-tree', x, z, yaw, scaleFor('palm-tree') * (0.9 + 0.4 * sc), true);
          else if (pick < 0.6) placeSolid('garden-rock', x, z, yaw, scaleFor('garden-rock') * (0.9 + 0.4 * sc), false);
          continue;
        }
        if (tv < 0.75) {
          const id = theme.trees[Math.floor(ti * theme.trees.length)];
          if (id) placeSolid(id, x, z, yaw, scaleFor(id) * (0.9 + 0.4 * sc), true);
        } else if (theme.planting.length > 0) {
          const id = theme.planting[Math.floor(ti * theme.planting.length)];
          placeSolid(id, x, z, yaw, scaleFor(id) * (0.9 + 0.4 * sc), false);
        }
      }
    }
  });

  return { placements, boxes };
}

/** Builds planScenery() as static prefab batches on `scene` and pushes its colliders into `boxes`. */
export function buildScenery(scene: THREE.Scene, boxes: Box[]): void {
  // Stage spots (cutscene marks, walks, drive paths) count as existing colliders here, so belts keep clear of them.
  const stage = stageKeepOut();
  const plan = planScenery([...boxes, ...stage], stage);
  scene.add(buildStaticPrefabs(plan.placements, { lights: false, name: 'countryside-scenery' }));
  for (const b of plan.boxes) boxes.push(b);
}
