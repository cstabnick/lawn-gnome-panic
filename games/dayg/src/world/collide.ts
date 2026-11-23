// Collision and height queries over the blockout. Pure: no DOM, no three.js (plain { x, y, z } objects).
import { STEP_UP } from '../config';
import type { HavenId, Rect, RegionId } from '../sim/types';
import { REGIONS, regionAt } from '../sim/regions';
import type { BlockDef, BlockoutMap, ClimbRouteDef, PitDef, Side } from './types';

export interface Vec3 { x: number; y: number; z: number }
export interface FaceHit { id: string; kind: 'block' | 'pit'; side: Side; topY: number; baseY: number; distance: number; along: number; routes: ClimbRouteDef[] }
export interface Collider {
  /** Highest walkable surface under (x, z) that is at or below fromY + STEP_UP: block tops, else the base ground (pit floor -depth or 0). */
  groundAt(x: number, z: number, fromY: number): number;
  /** Base ground with no blocks: -depth inside a pit, else 0. */
  baseAt(x: number, z: number): number;
  /** Moves an upright cylinder at pos by (dx, dz) with sliding (try full move, then x only, then z only), in sub-steps of at most 0.25 gm.
      A position is blocked when it overlaps (circle vs rectangle in xz) a block whose top > pos.y + stepUp and whose bottom < pos.y + height,
      or when baseAt there > pos.y + stepUp (a pit wall seen from inside), or when it is outside MAP_OUTLINE.
      Writes the result into out (x, z only; y unchanged) and returns the id of the first thing it pushed against, or null. */
  move(pos: Vec3, dx: number, dz: number, radius: number, height: number, stepUp: number, out: Vec3): string | null;
  /** The nearest block face (or pit wall, when standing in a pit) crossed by a ray from (x, z) along facing (sin f, cos f) within reach,
      whose top is above y + stepUp and whose bottom is at or below y + 1. along = metres along the face (from its west end for n/s faces,
      north end for e/w faces) where the ray hits; routes = the fixed and placed routes on that face with |route.at - along| <= tolerance. */
  faceAhead(x: number, y: number, z: number, facing: number, reach: number, stepUp: number, tolerance: number): FaceHit | null;
  /** The face behind the edge the player stands at: when the player is on a block top within `reach` of one of its sides, facing outwards
      (within 60 degrees), returns that side of the block with routes (used to climb down). Null otherwise. */
  edgeAhead(x: number, y: number, z: number, facing: number, reach: number, tolerance: number): FaceHit | null;
  regionAt(x: number, z: number): RegionId | null;
  havenAt(x: number, y: number, z: number): HavenId | null;   // inside a haven rect with y >= minY
  inBounds(x: number, z: number): boolean;                    // inside MAP_OUTLINE
  addRoute(route: ClimbRouteDef): void;
  /** Adds a runtime block (indexed like map blocks); a block with the same id is replaced. */
  addBlock(b: BlockDef): void;
  /** Removes a runtime or map block by id; false when there was none. Its routes stay registered. */
  removeBlock(id: string): boolean;
  /** Removes a placed or map route by id; false when there was none. */
  removeRoute(id: string): boolean;
  routesOn(id: string, side: Side): ClimbRouteDef[];
  blockById(id: string): BlockDef | undefined;
}

const CELL = 16;
const SUB_STEP = 0.25;
const ON_TOP_EPS = 0.2;          // edgeAhead: how close y must be to a block top to count as standing on it
const COS_60 = 0.5;
/** Id returned by move() when the map outline stops it. */
export const BOUNDS_ID = 'bounds';

const cellKey = (cx: number, cz: number): number => (cx + 2048) * 4096 + (cz + 2048);
const inRect = (r: Rect, x: number, z: number): boolean => x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1;

export function createCollider(map: BlockoutMap): Collider {
  const routes: ClimbRouteDef[] = [...map.routes];
  const blocks = new Map(map.blocks.map((b) => [b.id, b]));
  const grid = new Map<number, BlockDef[]>();
  const forEachCell = (b: BlockDef, fn: (k: number) => void): void => {
    for (let cx = Math.floor(b.x0 / CELL); cx <= Math.floor(b.x1 / CELL); cx++) {
      for (let cz = Math.floor(b.z0 / CELL); cz <= Math.floor(b.z1 / CELL); cz++) fn(cellKey(cx, cz));
    }
  };
  const indexBlock = (b: BlockDef): void => {
    forEachCell(b, (k) => {
      const list = grid.get(k);
      if (list) list.push(b); else grid.set(k, [b]);
    });
  };
  const unindexBlock = (b: BlockDef): void => {
    forEachCell(b, (k) => {
      const list = grid.get(k);
      if (!list) return;
      const rest = list.filter((o) => o !== b);
      if (rest.length) grid.set(k, rest); else grid.delete(k);
    });
  };
  for (const b of map.blocks) indexBlock(b);
  const removeBlockById = (id: string): boolean => {
    const b = blocks.get(id);
    if (!b) return false;
    unindexBlock(b);
    blocks.delete(id);
    return true;
  };

  /** Unique blocks in every cell the xz box touches. */
  const scratch = new Set<BlockDef>();
  const blocksIn = (x0: number, z0: number, x1: number, z1: number): Set<BlockDef> => {
    scratch.clear();
    for (let cx = Math.floor(x0 / CELL); cx <= Math.floor(x1 / CELL); cx++) {
      for (let cz = Math.floor(z0 / CELL); cz <= Math.floor(z1 / CELL); cz++) {
        const list = grid.get(cellKey(cx, cz));
        if (list) for (const b of list) scratch.add(b);
      }
    }
    return scratch;
  };

  const pitAt = (x: number, z: number): PitDef | null => {
    let best: PitDef | null = null;
    for (const p of map.pits) if (inRect(p.rect, x, z) && (!best || p.depth > best.depth)) best = p;
    return best;
  };
  const baseAt = (x: number, z: number): number => { const p = pitAt(x, z); return p ? -p.depth : 0; };
  const inBounds = (x: number, z: number): boolean => {
    for (const r of REGIONS) if (inRect(r.rect, x, z)) return true;
    return false;
  };
  const routesOn = (id: string, side: Side): ClimbRouteDef[] => routes.filter((r) => r.block === id && r.side === side);
  const routesNear = (id: string, side: Side, along: number, tolerance: number): ClimbRouteDef[] =>
    routes.filter((r) => r.block === id && r.side === side && Math.abs(r.at - along) <= tolerance);

  /** Id of what blocks a cylinder at (x, z), or null. */
  const blockedAt = (x: number, z: number, y: number, radius: number, height: number, stepUp: number): string | null => {
    for (const b of blocksIn(x - radius, z - radius, x + radius, z + radius)) {
      if (b.y + b.h <= y + stepUp || b.y >= y + height) continue;
      const cx = Math.min(Math.max(x, b.x0), b.x1), cz = Math.min(Math.max(z, b.z0), b.z1);
      const ddx = x - cx, ddz = z - cz;
      if (ddx * ddx + ddz * ddz < radius * radius) return b.id;
    }
    const probes: [number, number][] = [[x, z], [x - radius, z], [x + radius, z], [x, z - radius], [x, z + radius]];
    for (const [px, pz] of probes) {
      if (!inBounds(px, pz)) return BOUNDS_ID;
      if (baseAt(px, pz) > y + stepUp) return pitAt(x, z)?.id ?? 'pit';
    }
    return null;
  };

  return {
    groundAt(x, z, fromY) {
      let g = baseAt(x, z);
      const limit = fromY + STEP_UP;
      for (const b of blocksIn(x, z, x, z)) {
        if (!inRect(b, x, z)) continue;
        const top = b.y + b.h;
        if (top <= limit && top > g) g = top;
      }
      return g;
    },
    baseAt,
    move(pos, dx, dz, radius, height, stepUp, out) {
      let x = pos.x, z = pos.z;
      const y = pos.y;
      let hit: string | null = null;
      const n = Math.max(1, Math.ceil(Math.hypot(dx, dz) / SUB_STEP));
      const sx = dx / n, sz = dz / n;
      for (let i = 0; i < n; i++) {
        const full = blockedAt(x + sx, z + sz, y, radius, height, stepUp);
        if (!full) { x += sx; z += sz; continue; }
        hit ??= full;
        if (sx !== 0 && !blockedAt(x + sx, z, y, radius, height, stepUp)) { x += sx; continue; }
        if (sz !== 0 && !blockedAt(x, z + sz, y, radius, height, stepUp)) { z += sz; continue; }
      }
      out.x = x; out.z = z;
      return hit;
    },
    faceAhead(x, y, z, facing, reach, stepUp, tolerance) {
      const dx = Math.sin(facing), dz = Math.cos(facing);
      const ex = x + dx * reach, ez = z + dz * reach;
      let best: FaceHit | null = null;
      for (const b of blocksIn(Math.min(x, ex), Math.min(z, ez), Math.max(x, ex), Math.max(z, ez))) {
        const top = b.y + b.h;
        if (top <= y + stepUp || b.y > y + 1) continue;
        if (x > b.x0 && x < b.x1 && z > b.z0 && z < b.z1) continue; // inside it
        // slab test
        let tx0 = -Infinity, tx1 = Infinity, tz0 = -Infinity, tz1 = Infinity;
        if (dx !== 0) { const a = (b.x0 - x) / dx, c = (b.x1 - x) / dx; tx0 = Math.min(a, c); tx1 = Math.max(a, c); }
        else if (x < b.x0 || x > b.x1) continue;
        if (dz !== 0) { const a = (b.z0 - z) / dz, c = (b.z1 - z) / dz; tz0 = Math.min(a, c); tz1 = Math.max(a, c); }
        else if (z < b.z0 || z > b.z1) continue;
        const tIn = Math.max(tx0, tz0), tOut = Math.min(tx1, tz1);
        if (tIn > tOut || tIn < 0 || tIn > reach) continue;
        if (best && tIn >= best.distance) continue;
        let side: Side, along: number;
        if (tx0 >= tz0) { side = dx > 0 ? 'w' : 'e'; along = z + dz * tIn - b.z0; }
        else { side = dz > 0 ? 'n' : 's'; along = x + dx * tIn - b.x0; }
        best = { id: b.id, kind: 'block', side, topY: top, baseY: b.y, distance: tIn, along, routes: [] };
      }
      const pit = pitAt(x, z);
      if (pit && 0 > y + stepUp) {
        const r = pit.rect;
        const txe = dx > 0 ? (r.x1 - x) / dx : dx < 0 ? (r.x0 - x) / dx : Infinity;
        const tze = dz > 0 ? (r.z1 - z) / dz : dz < 0 ? (r.z0 - z) / dz : Infinity;
        const t = Math.min(txe, tze);
        if (t >= 0 && t <= reach && (!best || t < best.distance)) {
          let side: Side, along: number;
          if (txe <= tze) { side = dx > 0 ? 'e' : 'w'; along = z + dz * t - r.z0; }
          else { side = dz > 0 ? 's' : 'n'; along = x + dx * t - r.x0; }
          best = { id: pit.id, kind: 'pit', side, topY: 0, baseY: -pit.depth, distance: t, along, routes: [] };
        }
      }
      if (best) best.routes = routesNear(best.id, best.side, best.along, tolerance);
      return best;
    },
    edgeAhead(x, y, z, facing, reach, tolerance) {
      const dx = Math.sin(facing), dz = Math.cos(facing);
      let best: FaceHit | null = null;
      let bestScore = Infinity;
      for (const b of blocksIn(x, z, x, z)) {
        if (!inRect(b, x, z)) continue;
        const top = b.y + b.h;
        if (Math.abs(y - top) > ON_TOP_EPS) continue;
        const sides: [Side, number, number, number][] = [ // side, distance to it, outward normal x, z
          ['w', x - b.x0, -1, 0], ['e', b.x1 - x, 1, 0], ['n', z - b.z0, 0, -1], ['s', b.z1 - z, 0, 1],
        ];
        for (const [side, dist, nx, nz] of sides) {
          if (dist > reach || dx * nx + dz * nz < COS_60) continue;
          if (dist >= bestScore) continue;
          bestScore = dist;
          const along = side === 'n' || side === 's' ? x - b.x0 : z - b.z0;
          best = { id: b.id, kind: 'block', side, topY: top, baseY: b.y, distance: dist, along, routes: routesNear(b.id, side, along, tolerance) };
        }
      }
      return best;
    },
    regionAt: (x, z) => regionAt(x, z),
    havenAt: (x, y, z) => {
      for (const h of map.havens) if (inRect(h.rect, x, z) && y >= h.minY) return h.id;
      return null;
    },
    inBounds,
    addRoute: (route) => { routes.push(route); },
    addBlock: (b) => {
      if (blocks.has(b.id)) removeBlockById(b.id);
      blocks.set(b.id, b);
      indexBlock(b);
    },
    removeBlock: removeBlockById,
    removeRoute: (id) => {
      const i = routes.findIndex((r) => r.id === id);
      if (i < 0) return false;
      routes.splice(i, 1);
      return true;
    },
    routesOn,
    blockById: (id) => blocks.get(id),
  };
}
