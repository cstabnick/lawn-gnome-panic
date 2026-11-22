// What the ground is made of: a paint grid with one cell per height-grid cell (TERRAIN.step metres), built once from the
// finished heights (lazily, like the height grid). The ground mesh takes each triangle's texture from it
// (terrainMesh.ts) and the vehicles their driving surface (surfaces.ts). Null everywhere while the terrain is flat, so
// the flat world is unchanged.
//
// The rule, in order (the first that applies wins; roads, the runway and the Basin ice are asphalt / ice before this):
//   1. a trail (road path `trail/...`, within half its width)            -> dirt
//   2. ground at least TERRAIN.rockSlope steep (outside Turfton)          -> rock
//   3. the region's own paint (src/landforms/<region>.ts paint())         -> whatever it says
//   4. within TERRAIN.mudReach of a river or canal bank (outside Turfton) -> mud
//   5. otherwise unpainted: the region's own ground texture and surface
//
// Pure (no three.js): imports only types from textures.ts.
import { distToSeg } from '@lawn/level';
import { TERRAIN, WORLD_HALF } from './config';
import { regionAt, trails } from './levels';
import { PAINT_KINDS, regionPaintAt, riverDistAt, waterDistAt, type GroundFacts, type PaintKind } from './landforms';
import type { SurfaceKind } from './surfaces';
import { GRID_N, heightGrid, terrainFlat, terrainOptions } from './terrain';
import type { GroundKind } from './textures';

/** How each paint kind drives. */
export const PAINT_SURFACE: Record<PaintKind, SurfaceKind> = {
  rock: 'rock', dirt: 'dirt', gravel: 'gravel', mud: 'mud', ice: 'ice', snow: 'snow', sand: 'sand', grass: 'grass',
  farm: 'farm', forest: 'grass', moss: 'grass', meadow: 'grass',
};

/** How each paint kind looks (ground texture). */
export const PAINT_GROUND: Record<PaintKind, GroundKind> = {
  rock: 'rock', dirt: 'dirt', gravel: 'gravel', mud: 'mud', ice: 'ice', snow: 'snow', sand: 'sand', grass: 'grass',
  farm: 'farm', forest: 'forest', moss: 'moss', meadow: 'meadow',
};

let paint: Uint8Array | null = null;
let builtFor: Float32Array | null = null;

function buildPaint(g: Float32Array): Uint8Array {
  const N = GRID_N;
  const C = N - 1;
  const S = TERRAIN.step;
  const H = WORLD_HALF;
  const out = new Uint8Array(C * C);
  const DIRT = PAINT_KINDS.indexOf('dirt') + 1;
  const ROCK = PAINT_KINDS.indexOf('rock') + 1;
  const MUD = PAINT_KINDS.indexOf('mud') + 1;
  // 1. Trails, rasterised first (cells whose centre is within half the trail's width).
  for (const t of trails()) {
    const half = (t.width || TERRAIN.trailWidth) / 2;
    for (let k = 0; k + 1 < t.points.length; k++) {
      const [ax, az] = t.points[k], [bx, bz] = t.points[k + 1];
      const i0 = Math.max(0, Math.floor((Math.min(ax, bx) - half + H) / S) - 1), i1 = Math.min(C - 1, Math.ceil((Math.max(ax, bx) + half + H) / S));
      const j0 = Math.max(0, Math.floor((Math.min(az, bz) - half + H) / S) - 1), j1 = Math.min(C - 1, Math.ceil((Math.max(az, bz) + half + H) / S));
      for (let j = j0; j <= j1; j++) {
        const z = -H + (j + 0.5) * S;
        for (let i = i0; i <= i1; i++) {
          if (distToSeg(-H + (i + 0.5) * S, z, ax, az, bx, bz) <= half) out[j * C + i] = DIRT;
        }
      }
    }
  }
  const facts: GroundFacts = { height: 0, slope: 0, riverDist: 0, waterDist: 0, region: 'turfton' };
  for (let j = 0; j < C; j++) {
    const z = -H + (j + 0.5) * S;
    for (let i = 0; i < C; i++) {
      const idx = j * C + i;
      if (out[idx] !== 0) continue;
      const x = -H + (i + 0.5) * S;
      const region = regionAt(x, z);
      if (region === 'turfton') continue;
      const h00 = g[j * N + i], h10 = g[j * N + i + 1], h01 = g[(j + 1) * N + i], h11 = g[(j + 1) * N + i + 1];
      const dx = (h10 - h00 + h11 - h01) / (2 * S), dz = (h01 - h00 + h11 - h10) / (2 * S);
      const slope = Math.hypot(dx, dz);
      if (slope >= TERRAIN.rockSlope) { out[idx] = ROCK; continue; }
      facts.height = (h00 + h10 + h01 + h11) / 4;
      facts.slope = slope;
      facts.riverDist = riverDistAt(x, z);
      facts.waterDist = waterDistAt(x, z);
      facts.region = region;
      const own = regionPaintAt(x, z, facts);
      if (own) out[idx] = PAINT_KINDS.indexOf(own) + 1;
      else if (facts.riverDist < TERRAIN.mudReach) out[idx] = MUD;
    }
  }
  return out;
}

/** The paint at world (x, z), or null where it is unpainted (and everywhere while flat or without landforms). */
export function paintAt(x: number, z: number): PaintKind | null {
  if (terrainFlat() || !terrainOptions().landforms) return null;
  const g = heightGrid();
  if (!g) return null;
  if (!paint || builtFor !== g) { paint = buildPaint(g); builtFor = g; }
  const C = GRID_N - 1;
  const i = Math.floor((x + WORLD_HALF) / TERRAIN.step), j = Math.floor((z + WORLD_HALF) / TERRAIN.step);
  if (i < 0 || j < 0 || i >= C || j >= C) return null;
  const v = paint[j * C + i];
  return v === 0 ? null : PAINT_KINDS[v - 1];
}

/** The driving surface the paint gives at (x, z), or null (unpainted / flat). */
export function paintedSurfaceAt(x: number, z: number): SurfaceKind | null {
  const p = paintAt(x, z);
  return p ? PAINT_SURFACE[p] : null;
}

/** The ground texture the paint gives at (x, z), or null (unpainted / flat). */
export function paintedGroundAt(x: number, z: number): GroundKind | null {
  const p = paintAt(x, z);
  return p ? PAINT_GROUND[p] : null;
}
