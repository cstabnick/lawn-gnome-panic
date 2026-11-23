// Turfton garden blocks (terrain pass, item 3): every ordinary city block outside downtown and the landmarks is laid out
// as a designed garden instead of 1-3 random giant garden objects. Pure planning (`planGardenBlock`) plus one static
// prefab batch (`buildGardenBlocks`). Life-size pieces from @lawn/prefabs (gta-landscaping.ts) and the garden props.
import * as THREE from 'three';
import { buildPrefab, buildStaticPrefabs, type StaticPrefabPlacement } from '@lawn/prefabs';
import type { Box } from './types';
import { REGION_THEMES } from './regionThemes';

/** A city block's buildable rectangle (already inset from the roads and sidewalks). */
export interface BlockRect { minX: number; maxX: number; minZ: number; maxZ: number }

/**
 * One prefab in a garden block. `solid` ones get a collider of their measured footprint, or `colliderH` tall when set
 * (railings are 1 m tall whatever their top rail measures).
 */
export interface GardenPlacement { id: string; x: number; z: number; yaw: number; scale: number; solid: boolean; colliderH?: number }

/** Turfton's piece ids come from its region theme (src/data/regionThemes.json), so the garden only uses what Turfton lists. */
const TURFTON = REGION_THEMES.turfton;
function themed(id: string, from: readonly string[]): string {
  if (!from.includes(id)) throw new Error(`${id} is not in the Turfton theme`);
  return id;
}
const HEDGE = TURFTON.hedge as string;
const BORDER = TURFTON.border;
const RAIL = TURFTON.fence;
const BALL = themed('boxwood-ball', TURFTON.planting);
const CONE = themed('topiary-cone', TURFTON.planting);
const PLANTER = themed('stone-planter', TURFTON.signature);
/** Chance that one full block swaps the hedge on one side for railings. */
const RAIL_CHANCE = 0.35;
/** Railing pieces are 3 m long and laid end to end. */
const RAIL_LEN = 3;
/** Railings are solid and stand 1 m tall. */
const RAIL_H = 1.0;

/** Giant centrepieces: one of these per block at most, scaled so the longer side is 12-18 m. */
const CENTREPIECES = ['garden-shed', 'stone-fountain', 'compost-heap', 'birdbath', 'brick-stack'] as const;
/** Strip blocks (a side under this, in metres) get a single hedge line instead of a garden. */
const STRIP_MAX = 24;
/** Hedge border: outer face 1.5 m inside the block edge, centre 2 m in (the hedge is 1 m deep). */
const HEDGE_INSET = 1.5;
const HEDGE_D = 2.0;
/** Entrances in the middle of each hedge side. */
const ENTRANCE = 6;
/** Corners: 3.5 m in from the hedge corner (so 5 m from the block corner). */
const CORNER_IN = 5;
/** Garden border pieces sit just inside the hedge. */
const SIDE_PIECE_D = 3.0;

/** Footprint rectangle (absolute, on the ground) of a placed prefab. */
type Rect = BlockRect;

const protoCache = new Map<string, THREE.Box3>();
/** A prefab's local box at scale 1, read once (the same way world.ts measures prefabs). */
function localBox(id: string): THREE.Box3 {
  let b = protoCache.get(id);
  if (!b) {
    b = new THREE.Box3().setFromObject(buildPrefab(id, { lights: false }));
    protoCache.set(id, b);
  }
  return b;
}

/** The footprint of a prefab placed at (x, z), yaw and scale (Three.js rotation.y, then the scale is uniform). */
export function gardenFootprint(p: Pick<GardenPlacement, 'id' | 'x' | 'z' | 'yaw' | 'scale'>): Rect {
  const lb = localBox(p.id);
  const c = Math.cos(p.yaw);
  const s = Math.sin(p.yaw);
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const x0 of [lb.min.x, lb.max.x]) {
    for (const z0 of [lb.min.z, lb.max.z]) {
      const x = x0 * p.scale;
      const z = z0 * p.scale;
      const rx = c * x + s * z;
      const rz = -s * x + c * z;
      minX = Math.min(minX, rx); maxX = Math.max(maxX, rx);
      minZ = Math.min(minZ, rz); maxZ = Math.max(maxZ, rz);
    }
  }
  return { minX: p.x + minX, maxX: p.x + maxX, minZ: p.z + minZ, maxZ: p.z + maxZ };
}

const overlapRect = (a: Rect, b: Rect): boolean =>
  a.minX < b.maxX && a.maxX > b.minX && a.minZ < b.maxZ && a.maxZ > b.minZ;

/** Longer horizontal side of a prefab at scale 1. */
function longSide(id: string): number {
  const lb = localBox(id);
  return Math.max(lb.max.x - lb.min.x, lb.max.z - lb.min.z);
}

/**
 * Centres of 4 m pieces laid end to end over [a, b], centred in the run (any leftover is split at both ends). A run
 * shorter than one piece has no pieces.
 */
function runCentres(a: number, b: number, step = 4): number[] {
  const n = Math.floor((b - a) / step);
  const start = a + ((b - a) - n * step) / 2 + step / 2;
  return Array.from({ length: n }, (_, k) => start + k * step);
}

/** Sides of a block: 0 north (minZ), 1 south (maxZ), 2 west (minX), 3 east (maxX). */
type Side = 0 | 1 | 2 | 3;

/** A point on a side: `t` along the side from its start, `d` in from the edge. */
function sidePoint(b: BlockRect, side: Side, t: number, d: number): { x: number; z: number } {
  switch (side) {
    case 0: return { x: b.minX + t, z: b.minZ + d };
    case 1: return { x: b.minX + t, z: b.maxZ - d };
    case 2: return { x: b.minX + d, z: b.minZ + t };
    default: return { x: b.maxX - d, z: b.minZ + t };
  }
}

const sideLength = (b: BlockRect, side: Side): number => (side < 2 ? b.maxX - b.minX : b.maxZ - b.minZ);
/** Hedges and borders on the north and south sides run along x; the west and east ones along z. */
const sideYaw = (side: Side): number => (side < 2 ? 0 : Math.PI / 2);

type Add = (id: string, x: number, z: number, yaw: number, scale: number, solid: boolean, colliderH?: number) => void;

/** A strip block (a side under STRIP_MAX): one hedge line down the middle, a 6 m gap every 20 m, an end piece each end. */
function planStrip(b: BlockRect, rnd: () => number, add: Add): void {
  const alongX = b.maxX - b.minX >= b.maxZ - b.minZ;
  const lo = alongX ? b.minX : b.minZ;
  const hi = alongX ? b.maxX : b.maxZ;
  const cross = alongX ? (b.minZ + b.maxZ) / 2 : (b.minX + b.maxX) / 2;
  const yaw = alongX ? 0 : Math.PI / 2;
  const at = (t: number): { x: number; z: number } => (alongX ? { x: t, z: cross } : { x: cross, z: t });
  const end = hi - 2.5;
  let t = lo + 2.5;
  while (t < end) {
    const e = Math.min(t + 14, end);
    for (const c of runCentres(t, e)) {
      const p = at(c);
      add(HEDGE, p.x, p.z, yaw, 1, true);
    }
    t = e + 6;
  }
  for (const tEnd of [lo + 1, hi - 1]) {
    const shrub = rnd() < 0.5 ? BALL : CONE;
    const p = at(tEnd);
    add(shrub, p.x, p.z, 0, 1, shrub === CONE);
  }
}

/** A full block: hedge border with entrances, a centre (centrepiece or rock garden), corner shrubs, side borders. */
function planFull(b: BlockRect, rnd: () => number, add: Add): void {
  const cx = (b.minX + b.maxX) / 2;
  const cz = (b.minZ + b.maxZ) / 2;

  // (a) Hedge border, and maybe a hedge arch in one entrance.
  const archOn = rnd() < 0.5;
  const archSide = Math.floor(rnd() * 4) as Side;
  for (const side of [0, 1, 2, 3] as Side[]) {
    const L = sideLength(b, side);
    const mid = L / 2;
    const yaw = sideYaw(side);
    const segs: [number, number][] = [
      [HEDGE_INSET, mid - ENTRANCE / 2],
      [mid + ENTRANCE / 2, L - HEDGE_INSET],
    ];
    for (const [s0, s1] of segs) {
      for (const t of runCentres(s0, s1)) {
        const p = sidePoint(b, side, t, HEDGE_D);
        add(HEDGE, p.x, p.z, yaw, 1, true);
      }
    }
    if (archOn && side === archSide) {
      const p = sidePoint(b, side, mid, HEDGE_D);
      add('hedge-arch', p.x, p.z, yaw, 1, true);
    }
  }

  // (b) Centre: one giant centrepiece, or a rock garden with a flower bed on each side.
  const centre = rnd() < 0.5;
  if (centre) {
    const id = CENTREPIECES[Math.floor(rnd() * CENTREPIECES.length)];
    const target = 12 + rnd() * 6;
    const yaw = Math.floor(rnd() * 4) * (Math.PI / 2);
    add(id, cx, cz, yaw, target / longSide(id), true);
  } else {
    add('rock-garden', cx, cz, 0, 1.6, true);
    const OUT = 4;
    add('flower-bed', cx, cz - OUT, 0, 1, false);
    add('flower-bed', cx, cz + OUT, 0, 1, false);
    add('flower-bed', cx - OUT, cz, Math.PI / 2, 1, false);
    add('flower-bed', cx + OUT, cz, Math.PI / 2, 1, false);
  }

  // (c) Each inner corner: one of two boxwood balls, a topiary cone, three grasses, or a stone planter.
  for (const ci of [0, 1]) {
    for (const cj of [0, 1]) {
      const x = ci ? b.maxX - CORNER_IN : b.minX + CORNER_IN;
      const z = cj ? b.maxZ - CORNER_IN : b.minZ + CORNER_IN;
      const ux = ci ? -1 : 1;
      const uz = cj ? -1 : 1;
      const kind = Math.floor(rnd() * 4);
      if (kind === 0) {
        add(BALL, x, z, 0, 1, false);
        add(BALL, x + ux * 1.5, z, 0, 1, false);
      } else if (kind === 1) {
        add(CONE, x, z, 0, 1, true);
      } else if (kind === 2) {
        add('ornamental-grass', x, z, 0, 1, false);
        add('ornamental-grass', x + ux * 1.2, z, 0, 1, false);
        add('ornamental-grass', x + ux * 0.6, z + uz * 1.2, 0, 1, false);
      } else {
        add(PLANTER, x, z, 0, 1, true);
      }
    }
  }

  // (d) Along one hedge side, inside it: two lavender rows or two garden borders.
  const lavender = rnd() < 0.5;
  const borderSide = Math.floor(rnd() * 4) as Side;
  const id = lavender ? 'lavender-row' : BORDER;
  for (const t of [sideLength(b, borderSide) / 4, (3 * sideLength(b, borderSide)) / 4]) {
    const p = sidePoint(b, borderSide, t, SIDE_PIECE_D);
    add(id, p.x, p.z, sideYaw(borderSide), 1, false);
  }
}

/**
 * The garden layout of one block: pure and deterministic for a given `rnd` sequence. `blocked(r)` is true where nothing
 * may stand (an existing collider or a highway running through the city); every placement's footprint must pass it and
 * must not overlap an earlier placement in the same block. Every branch draws the same random numbers in the same order.
 */
export function planGardenBlock(
  block: BlockRect, rnd: () => number, blocked: (r: BlockRect) => boolean,
): GardenPlacement[] {
  const out: GardenPlacement[] = [];
  const taken: Rect[] = [];
  const add: Add = (id, x, z, yaw, scale, solid, colliderH) => {
    const r = gardenFootprint({ id, x, z, yaw, scale });
    if (blocked(r) || taken.some((t) => overlapRect(t, r))) return;
    taken.push(r);
    out.push(colliderH === undefined ? { id, x, z, yaw, scale, solid } : { id, x, z, yaw, scale, solid, colliderH });
  };
  const thin = Math.min(block.maxX - block.minX, block.maxZ - block.minZ) < STRIP_MAX;
  if (thin) {
    planStrip(block, rnd, add);
    return out;
  }
  planFull(block, rnd, add);
  // (e) Turfton railings, drawn last so every draw above keeps its place: one roll per block. On a hit, one side's
  // hedge (and any arch) comes out and the railings take its line, keeping the same 6 m entrance.
  const roll = rnd();
  if (roll < RAIL_CHANCE) {
    const side = Math.floor((roll / RAIL_CHANCE) * 4) as Side;
    const line = sideLine(block, side);
    for (let i = out.length - 1; i >= 0; i--) {
      const p = out[i];
      if ((p.id === HEDGE || p.id === 'hedge-arch') && Math.abs(lineOf(p, side) - line) < 1e-9) out.splice(i, 1);
    }
    taken.length = 0;
    for (const p of out) taken.push(gardenFootprint(p));
    planRailings(block, side, add);
  }
  return out;
}

/** The coordinate a side's hedge line sits at: z for the north and south sides, x for the west and east ones. */
function sideLine(b: BlockRect, side: Side): number {
  const p = sidePoint(b, side, 0, HEDGE_D);
  return side < 2 ? p.z : p.x;
}

const lineOf = (p: GardenPlacement, side: Side): number => (side < 2 ? p.z : p.x);

/** Railings on one side's hedge line: the same two runs as the hedge, in 3 m pieces laid end to end. */
function planRailings(b: BlockRect, side: Side, add: Add): void {
  const L = sideLength(b, side);
  const mid = L / 2;
  const segs: [number, number][] = [
    [HEDGE_INSET, mid - ENTRANCE / 2],
    [mid + ENTRANCE / 2, L - HEDGE_INSET],
  ];
  for (const [s0, s1] of segs) {
    for (const t of runCentres(s0, s1, RAIL_LEN)) {
      const p = sidePoint(b, side, t, HEDGE_D);
      add(RAIL, p.x, p.z, sideYaw(side), 1, true, RAIL_H);
    }
  }
}

/** Builds every block's placements as one static prefab batch on `scene` and pushes the solid ones' colliders. */
export function buildGardenBlocks(scene: THREE.Scene, boxes: Box[], plans: readonly GardenPlacement[]): void {
  if (plans.length === 0) return;
  const placements: StaticPrefabPlacement[] = plans.map((p) => ({ id: p.id, x: p.x, y: 0, z: p.z, yaw: p.yaw, scale: p.scale }));
  scene.add(buildStaticPrefabs(placements, { lights: false, name: 'turfton-gardens' }));
  for (const p of plans) {
    if (!p.solid) continue;
    const r = gardenFootprint(p);
    boxes.push({ minX: r.minX, maxX: r.maxX, minZ: r.minZ, maxZ: r.maxZ, h: p.colliderH ?? localBox(p.id).max.y * p.scale });
  }
}
