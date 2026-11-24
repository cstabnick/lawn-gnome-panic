// Shared types of the parks, street scenery and fringe dressing (docs/roadmaps/gta-parks-and-fringe.md).
// Pure data: no three.js, no DOM. Planners (src/parks/, src/cityScenery/street.ts, src/fringe/) return a DressPlan;
// src/cityScenery/install.ts builds every plan (static prefab cells, ground patches, marks, cables) and adds the
// colliders to world.boxes.
import type { Swatch } from '@lawn/prefabs';
import type { CullClass } from '../cull';
import type { AmbientGnomeDef } from '../ambientGnomes';

/** How far a placement is drawn (cull.ts classes): small furniture 'detail', props 'prop', trees 'tree', houses 'building'. */
export type DressClass = Extract<CullClass, 'tiny' | 'detail' | 'prop' | 'tree' | 'building'>;

/** One static prefab. `y` is absolute (the ground under it, heightAt). Mowable plants are handed to flora by the builder. */
export interface Dress {
  id: string;
  x: number; y: number; z: number;
  yaw: number;
  scale: number;
  tint?: Swatch | number;
  trim?: Swatch | number;
  cls: DressClass;
}

/** Ground patch kinds: a ground texture (textures.ts GroundKind) or still pond water. */
export type PatchKind = 'gravel' | 'dirt' | 'pavement' | 'mud' | 'sand' | 'farm' | 'snow' | 'pond';

/**
 * A flat patch draped on the ground (LAYER.area, under roads): a park path, a yard, a playground, a pond, a dirt track.
 * rect: centre (x, z), w along the patch's local x, d along its local z, turned by yaw (three.js rotation.y).
 * disc: centre (x, z), radius w / 2 (d and yaw ignored).
 * ribbon: `points` (a polyline, at least 2), width w (x, z, d, yaw ignored).
 * Two patches must never overlap (they would z-fight): planners keep them apart.
 */
export interface GroundPatch {
  kind: PatchKind;
  shape: 'rect' | 'disc' | 'ribbon';
  x: number; z: number;
  w: number; d: number;
  yaw: number;
  points?: [number, number][];
}

/** Painted marks and paper (one atlas texture, decals.ts). */
export type MarkTile =
  | 'stripe' | 'manhole' | 'drain' | 'oil' | 'chalk' | 'line'
  | 'tag-a' | 'tag-b' | 'tag-c' | 'tag-d' | 'poster-a' | 'poster-b' | 'poster-c';

/**
 * A mark: a w x h quad with an atlas tile. Flat (upright false): lies on the ground at y (absolute), w along local x and
 * h along local z, turned by yaw. Upright: stands vertical, its face towards local +z after yaw (a poster on a wall: put
 * it 0.04 m out from the wall face), centre at height y. Drawn on LAYER.decal.
 */
export interface Mark {
  tile: MarkTile;
  x: number; y: number; z: number;
  yaw: number;
  w: number; h: number;
  upright: boolean;
}

/** A sagging wire between two points (power lines, bunting strings), drawn as thin dark boxes. Absolute heights. */
export interface Cable { ax: number; ay: number; az: number; bx: number; by: number; bz: number; sag: number }

/** Something the player can use: sit on a bench, or toss an Acorn in a fountain. */
export interface UseSpot {
  kind: 'bench' | 'wish';
  /** Where the player stands to use it (within 3.6 m), and for a bench where the gnome sits. */
  x: number; z: number;
  /** Bench: the way a seated gnome faces (the bench's yaw). */
  yaw: number;
  /** The park it belongs to (a ParkId) or '' in the street. */
  park: string;
}

/** What a planner returns. Its colliders are not here: Site.claim / Site.place keep them (site.colliders). */
export interface DressPlan {
  dress: Dress[];
  patches: GroundPatch[];
  marks: Mark[];
  cables: Cable[];
  /** Pedestrian walk points to add (park paths). */
  walk: { x: number; z: number }[];
  uses: UseSpot[];
  /** Park townsgnomes (ambientGnomes.ts defs). */
  gnomes: AmbientGnomeDef[];
  /** Ducks on a pond: centre and the radius they paddle round. */
  ducks: { x: number; z: number; r: number; n: number }[];
}

export function emptyPlan(): DressPlan {
  return { dress: [], patches: [], marks: [], cables: [], walk: [], uses: [], gnomes: [], ducks: [] };
}
