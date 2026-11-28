// What a Pardonlin district plan is (E30): plain data that town.ts turns into meshes, colliders and sign text, and that
// layout.test.ts checks (clear of roads, paths and the river; no two buildings overlapping; vignettes, signs and
// residents per district). Pure types and small helpers, no three.js.
import type { AmbientGnomeDef } from '../ambientGnomes';
import { euroBuilding } from '../eurokit/catalog';
import type { EuroPlacement } from '../eurokit/street';
import type { GroundPatch } from './groundPlan';
import { cornersOf, footprintProblem, footprintsOverlap, inRect, type DistrictId, type Footprint, type Rect } from './layout';

/**
 * A prop (any @lawn/prefabs id) on the ground at (x, z). `y` lifts it above the ground (a cup on a table: 0.75).
 * `rot` is a full Euler rotation [rx, ry, rz] (overrides yaw: a chair knocked over is [0, yaw, PI/2] lifted 0.25).
 * `solid` gives it a collider: a box w x d (turned by yaw) or a round post of radius r, h metres tall.
 */
export interface PlanProp {
  id: string;
  x: number;
  z: number;
  yaw?: number;
  y?: number;
  rot?: [number, number, number];
  scale?: number;
  tint?: number;
  trim?: number;
  solid?: { w: number; d: number; h: number } | { r: number; h: number };
}

/**
 * Text drawn on a sign. menu / poster / street put the kit's sign prefab (euro-chalkboard-sign, euro-poster-board,
 * euro-street-sign) at (x, z) turned to yaw, text on its blank face. 'plaque' is text only: a plate w x h metres whose
 * centre is `y` metres above the ground at (x, z), facing yaw (local +z); stand it at least 0.03 m in front of the wall
 * it hangs on. 'banner' is the same as plaque in banner colours (shop names, the Bean Tower's ticket board).
 */
export interface PlanSign {
  kind: 'menu' | 'poster' | 'street' | 'plaque' | 'banner';
  text: string;
  x: number;
  z: number;
  yaw: number;
  /** plaque / banner only. */
  y?: number;
  w?: number;
  h?: number;
}

/** A small story told by props (the props are in `props`; this names it and says what it shows, for screens.md). */
export interface Vignette {
  id: string;
  name: string;
  x: number;
  z: number;
  /** One or two sentences: what the props say happened. */
  story: string;
}

export interface DistrictPlan {
  id: DistrictId;
  /** European buildings (planStreetRow output or hand-placed kit buildings: ids from eurokit/catalog.ts EURO_BUILDINGS). */
  buildings: EuroPlacement[];
  props: PlanProp[];
  signs: PlanSign[];
  vignettes: Vignette[];
  /** Continentals standing about doing something place-specific (createAmbientGnomes defs). */
  residents: AmbientGnomeDef[];
  /** Laid ground (FX09): squares, courtyards, walks (ground.ts drapes them; pavements along roads are automatic). */
  ground: GroundPatch[];
}

export function emptyPlan(id: DistrictId): DistrictPlan {
  return { id, buildings: [], props: [], signs: [], vignettes: [], residents: [], ground: [] };
}

/**
 * The footprint a building needs: its body plus the apron in front (awnings, steps, tables), and a corner building's
 * side apron. Null when the id is not a kit building.
 */
export function buildingFootprint(p: EuroPlacement): Footprint | null {
  const b = euroBuilding(p.id);
  if (!b) return null;
  const s = p.scale ?? 1;
  const side = b.sideApron ?? 0;
  // Local centre shift: the apron is on +z, the side apron on +x.
  const lx = (side / 2) * s, lz = (b.apron / 2) * s;
  const c = Math.cos(p.yaw), sn = Math.sin(p.yaw);
  return {
    x: p.x + lx * c + lz * sn,
    z: p.z - lx * sn + lz * c,
    w: (b.width + side) * s,
    d: (b.depth + b.apron) * s,
    yaw: p.yaw,
  };
}

/** The footprint of a solid prop's collider, or null for a prop that is not solid. */
export function propFootprint(p: PlanProp): Footprint | null {
  if (!p.solid) return null;
  if ('r' in p.solid) return { x: p.x, z: p.z, w: p.solid.r * 2, d: p.solid.r * 2, yaw: 0 };
  return { x: p.x, z: p.z, w: p.solid.w, d: p.solid.d, yaw: p.yaw ?? 0 };
}

/**
 * The buildings that may stand: each must pass footprintProblem (roads, paths, river, region), keep all four footprint
 * corners inside `rects` (the district's), and not overlap anything in `taken` or a building kept before it. Kept
 * footprints are added to `taken`, so call it row after row with the same array.
 */
export function keepClear(buildings: readonly EuroPlacement[], taken: Footprint[], rects: readonly Rect[]): EuroPlacement[] {
  const out: EuroPlacement[] = [];
  for (const b of buildings) {
    const f = buildingFootprint(b);
    if (!f || footprintProblem(f)) continue;
    if (!cornersOf(f).every(([x, z]) => rects.some((r) => inRect(r, x, z)))) continue;
    if (taken.some((o) => footprintsOverlap(f, o))) continue;
    taken.push(f);
    out.push(b);
  }
  return out;
}

/** Local (along the row, out from the front) -> world, for a frame at (x, z) turned by yaw. */
export function local(x: number, z: number, yaw: number, lx: number, lz: number): [number, number] {
  const c = Math.cos(yaw), s = Math.sin(yaw);
  return [x + lx * c + lz * s, z - lx * s + lz * c];
}
