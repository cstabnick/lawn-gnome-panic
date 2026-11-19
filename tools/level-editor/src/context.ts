// The contracts every editor module codes against. Nothing here draws or talks to the server.
import type * as THREE from 'three';
import type { DeltaGrid, DeltaPatch, PaintGrid, PaintPatch, PathDef, PropDef, Rect, Stamp } from '@lawn/level';
import type { Deck, HouseDef, Region, ZoneDef, ZoneId } from '@gnomomia/config';
import type { Terrain } from '@gnomomia/terrainCore';

export type Lake = { x: number; z: number; r: number };

/** A zone whose editable layers can be changed in place. The editor only ever changes these fields. */
export type MutableZone = Omit<ZoneDef, 'regions' | 'lakes' | 'houses' | 'decks' | 'stamps' | 'paths' | 'props'> & {
  regions: Region[];
  lakes: Lake[];
  houses: HouseDef[];
  decks?: Deck[];
  stamps?: Stamp[];
  paths?: PathDef[];
  props?: PropDef[];
};

export type ToolId = 'view' | 'brush' | 'paint' | 'select' | 'road' | 'analyze';

/** What a point on the terrain under the pointer is. */
export interface GroundHit {
  x: number;
  y: number;
  z: number;
}

/** The 3D view. Implemented by viewport.ts. Units are metres, world coordinates (the game's, +z south). */
export interface Viewport {
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;
  readonly dom: HTMLCanvasElement;
  /** Tools add their own helper objects here (rings, lines, overlays). Cleared by whoever added them. */
  readonly overlay: THREE.Group;
  /** The terrain point under a pointer event, or null over the sky. Marches the ray against terrain.heightAt. */
  pick(ev: PointerEvent | MouseEvent): GroundHit | null;
  /** Re-meshes the terrain chunks overlapping `rect` (all of them when omitted). Call after terrain.invalidate(rect). */
  refresh(rect?: Rect): void;
  /** true: left drag orbits (the 'view' tool). false: left drag belongs to the active tool; right drag orbits, middle pans. The wheel always zooms. */
  setLeftOrbit(on: boolean): void;
  /** Points the camera at (x, z) on the ground, from `distance` metres away (default: keep the current one). */
  focus(x: number, z: number, distance?: number): void;
  /** Runs `fn(dtSeconds)` before every render. Returns an unsubscribe function. */
  onFrame(fn: (dt: number) => void): () => void;
  dispose(): void;
}

/** Something the select tool can place and move: one list in a zone (houses, lakes, decks, props, stamps...). */
export type Item = { x: number; z: number } & Record<string, unknown>;

export type FieldDef =
  | { key: string; label: string; type: 'number'; step?: number; min?: number; max?: number }
  | { key: string; label: string; type: 'text' }
  /** A prefab id from @lawn/prefabs: the Select tool shows a searchable picker. */
  | { key: string; label: string; type: 'prefab' }
  /** A colour stored as a 0xRRGGBB number: shown as a colour picker. */
  | { key: string; label: string; type: 'color' }
  /** A true / false flag: shown as a checkbox. */
  | { key: string; label: string; type: 'bool' }
  | { key: string; label: string; type: 'enum'; options: readonly string[] };

export interface CollectionDef {
  id: string;
  label: string;
  /** 0xRRGGBB used for drawing and highlighting. */
  color: number;
  /** circle: drawn as a ring of radius(item). rect: drawn as a w x d box (item.w, item.d), axis aligned. */
  shape: 'circle' | 'rect';
  /** Picking radius in metres. */
  radius(item: Item): number;
  /** The live array in the zone, created when absent. Several collections may share one array (stamps); use `accepts`. */
  items(def: MutableZone): Item[];
  accepts?(item: Item): boolean;
  /** A new item at (x, z); `groundY` is the terrain height there. */
  make(x: number, z: number, groundY: number): Item;
  fields: FieldDef[];
  /** true: the items can be moved and edited but not added or deleted (spawn, shrine, exits). */
  fixed?: boolean;
  /** A reason this item must not be deleted, or null when it can be. `index` is into items(def). */
  deleteBlocked?(def: MutableZone, index: number): string | null;
}

export type StatusKind = 'info' | 'ok' | 'error';

export type Selection = { collection: string; index: number } | null;

export interface Emitter<T> {
  on(fn: (v: T) => void): () => void;
  emit(v: T): void;
}

export interface ChangeEvent {
  /** The box that changed, or null for "everything" (a load, a zone switch). */
  rect: Rect | null;
  kind: 'zone' | 'deltas' | 'paint' | 'load';
}

export interface HistoryEntry {
  label: string;
  undo(): void;
  redo(): void;
}

export interface History {
  push(e: HistoryEntry): void;
  undo(): void;
  redo(): void;
  readonly canUndo: boolean;
  readonly canRedo: boolean;
  /** The label of the entry undo() would revert, or ''. */
  readonly nextUndo: string;
  readonly onChange: Emitter<void>;
}

/** What has changed since the last save / bake. */
export interface Dirty {
  zones: Set<ZoneId>;
  deltas: boolean;
  /** Surface paint changed since the last save. */
  paint: boolean;
  /** Boxes whose walk tiles must be re-baked. */
  walkRects: Rect[];
}

export interface EditorContext {
  readonly adapter: GameAdapter;
  readonly terrain: Terrain;
  /** The live zones the terrain reads (world coordinates). Edit them only through editZone(). */
  readonly zones: Record<ZoneId, ZoneDef>;
  /** Overworld zone ids, in a stable order. */
  readonly outdoorZones: readonly ZoneId[];
  /** The brush raster; the same object as terrain.deltas. Change it only through commitDeltas() / touch(). */
  readonly deltas: DeltaGrid;
  /** The surface-paint raster; the same object as terrain.paint. Change it only through commitPaint() / touch(). */
  readonly paint: PaintGrid;
  /** Set by main.ts once the viewport exists, before any tool is mounted. */
  viewport: Viewport;
  readonly history: History;
  readonly dirty: Dirty;
  readonly events: {
    changed: Emitter<ChangeEvent>;
    selection: Emitter<Selection>;
    zone: Emitter<ZoneId>;
    status: Emitter<{ msg: string; kind: StatusKind }>;
  };
  /** The zone being edited. */
  readonly zone: ZoneId;
  setZone(id: ZoneId): void;
  readonly selection: Selection;
  select(sel: Selection): void;
  /** true: every quest gate is open (the default, for reachability); false: gates as a new game has them. */
  readonly gatesOpen: boolean;
  setGatesOpen(open: boolean): void;
  /** Changes a zone's editable layers: runs `fn` on the live zone, marks the zone dirty, invalidates the terrain over the
   * whole zone, refreshes the view, emits 'changed' and pushes an undo entry. */
  editZone(label: string, zone: ZoneId, fn: (def: MutableZone) => void): void;
  /** Records a finished brush stroke. `applied` true: the patch is already in the raster (the tool applied dabs live). */
  commitDeltas(label: string, patch: DeltaPatch, rect: Rect, applied: boolean): void;
  /** Records a finished paint stroke (see commitDeltas). */
  commitPaint(label: string, patch: PaintPatch, rect: Rect, applied: boolean): void;
  /** Live preview while a tool is mid-drag: terrain.invalidate(rect) + viewport.refresh(rect) + 'changed'. No undo entry. */
  touch(rect: Rect): void;
  status(msg: string, kind?: StatusKind): void;
  /** Grid for placing and dragging, in metres; 0 = free (positions are rounded to 0.1 m). */
  snap: number;
  /** A coordinate rounded the way the editor stores it: to the snap grid, or to 0.1 m when snap is off. */
  round(v: number): number;
}

/** One entry of the toolbar. */
export interface Tool {
  id: ToolId;
  label: string;
  /** Builds the tool's panel into `panel`. Called once, at start-up. */
  mount(ctx: EditorContext, panel: HTMLElement): void;
  /** The tool becomes active: attach pointer / key listeners to ctx.viewport.dom here. */
  activate(): void;
  /** Detach everything attached in activate() and remove anything added to the overlay. */
  deactivate(): void;
}

// ---------------------------------------------------------------- games

/** What a game's editor session works on: its terrain (a stub for flat games), the levels it loaded and the brush raster. */
export interface World {
  terrain: Terrain;
  /** The loaded levels ("zones"), keyed by id. Games whose levels each have their own coordinate space load one at a time. */
  zones: Record<ZoneId, ZoneDef>;
  deltas: DeltaGrid;
  /** Ids of the levels the view meshes and the zone box lists. */
  outdoorZones: ZoneId[];
  /** Flips the gate check the terrain was built with (a no-op for games without gates). */
  setGatesOpen(open: boolean): void;
  readonly gatesOpen: boolean;
}

/**
 * Everything that is specific to one game, in one place. The editor itself (view, undo, save, draft recovery, the tools) only
 * talks to this. Gnomomia and Club Gnome have one each (src/adapters/).
 */
export interface GameAdapter {
  /** Short id used in the URL (?game=) and in the draft key. */
  readonly id: string;
  readonly label: string;
  /** true: each level is its own coordinate space, so only one is loaded at a time and switching levels reloads the page (?level=). */
  readonly singleLevel: boolean;
  /** Every level of the game, for the header selector (loaded or not). */
  levels(): { id: string; name: string }[];
  /** Builds the world; `levelId` picks the level for single-level games. */
  createWorld(levelId?: string): World;
  /** What the Select tool can place and edit. */
  readonly collections: readonly CollectionDef[];
  /** The fields of a level that the editor changes: copied for undo and for draft recovery. */
  readonly editableKeys: readonly string[];
  /** The box an edit to this level can change (for invalidating caches and re-meshing). */
  zoneRect(def: ZoneDef): Rect;
  /** Which tools this game shows. */
  readonly tools: readonly ToolId[];
  /** A level as the document the dev server saves (`game` and `id` are read by the server to pick the file). */
  toDoc(def: ZoneDef): { game: string; id: string; doc: unknown };
  /** Draws the things standing in the level (the 3D objects). */
  createObjectView(ctx: EditorContext): { dispose(): void };
  /** Throws an Error with a readable message to stop a save (unknown prefab ids, broken links...). */
  beforeSave?(ctx: EditorContext, dirtyZones: readonly string[]): void;
}
