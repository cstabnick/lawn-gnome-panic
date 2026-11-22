// The level document: what a level file contains. Pure data (JSON). Coordinates are metres; +z is south.
// A game opts into the layers it needs and keeps everything game-specific in `data`.

/** An axis-aligned rectangle in world (or zone-local) metres. */
export interface Rect {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

/** A procedural generator by id: the game registers the function, the document stores which one and its inputs. */
export interface GeneratorRef {
  id: string;
  /** Bump when the algorithm changes, so an old document never silently changes shape. */
  version: number;
  seed?: number;
  params: Record<string, number | string | boolean>;
}

/**
 * A parametric ground edit, applied to the finished height at (x, z), in list order.
 * flatten: h = to + (h - to) * smoothstep(inner, outer, d)   (d = distance from the centre; fully flat inside `inner`)
 * gauss:   h += amount * exp(-d^2 / sigma^2)                  (a hill when amount > 0, a pit when < 0)
 */
export type Stamp =
  | { op: 'flatten'; x: number; z: number; inner: number; outer: number; to: number }
  | { op: 'gauss'; x: number; z: number; sigma: number; amount: number };

export type PathKind = 'road' | 'wall' | 'fence' | 'water';

/** A polyline: a road, a wall, a fence line, a river or canal course (`water`). `width` in metres where the kind has one. */
export interface PathDef {
  id: string;
  kind: PathKind;
  points: [number, number][];
  width?: number;
}

/** A prefab (@lawn/prefabs id) standing in the level. `solidR` > 0 makes it a round collider of that radius. */
export interface PropDef {
  prefab: string;
  x: number;
  z: number;
  rot?: number;
  scale?: number;
  tint?: string;
  solidR?: number;
}

/** A named point (spawn, portal, flag, tee...). `data` is the game's own. */
export interface MarkerDef {
  id: string;
  kind: string;
  x: number;
  z: number;
  r?: number;
  data?: Record<string, unknown>;
}

/** One level. `G` is the game's own block (validated by the game, not by this package). */
export interface LevelDoc<G = unknown> {
  format: 'lawn-level';
  version: 1;
  /** The game folder name, e.g. 'gnomes-of-gnomomia'. */
  game: string;
  id: string;
  name: string;
  /** Playable area, centred on the document's own origin. */
  bounds: { w: number; d: number };
  base?: GeneratorRef;
  stamps: Stamp[];
  paths: PathDef[];
  props: PropDef[];
  markers: MarkerDef[];
  data: G;
}
