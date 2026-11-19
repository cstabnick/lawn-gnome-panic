// The contracts every editor module codes against. Nothing here draws or talks to the server.
import type * as THREE from 'three';
import type { DeltaGrid, DeltaPatch, PathDef, PropDef, Rect, Stamp } from '@lawn/level';
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

export type ToolId = 'view' | 'brush' | 'select' | 'road' | 'analyze';

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
  /** A reason this item must not be deleted, or null when it can be. `index` is into items(def). */
  deleteBlocked?(def: MutableZone, index: number): string | null;
}

export type Selection = { collection: string; index: number } | null;

export interface Emitter<T> {
  on(fn: (v: T) => void): () => void;
  emit(v: T): void;
}

export interface ChangeEvent {
  /** The box that changed, or null for "everything" (a load, a zone switch). */
  rect: Rect | null;
  kind: 'zone' | 'deltas' | 'load';
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
  /** Boxes whose walk tiles must be re-baked. */
  walkRects: Rect[];
}

export interface EditorContext {
  readonly terrain: Terrain;
  /** The live zones the terrain reads (world coordinates). Edit them only through editZone(). */
  readonly zones: Record<ZoneId, ZoneDef>;
  /** Overworld zone ids, in a stable order. */
  readonly outdoorZones: readonly ZoneId[];
  /** The brush raster; the same object as terrain.deltas. Change it only through commitDeltas() / touch(). */
  readonly deltas: DeltaGrid;
  /** Set by main.ts once the viewport exists, before any tool is mounted. */
  viewport: Viewport;
  readonly history: History;
  readonly dirty: Dirty;
  readonly events: {
    changed: Emitter<ChangeEvent>;
    selection: Emitter<Selection>;
    zone: Emitter<ZoneId>;
    status: Emitter<string>;
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
  /** Live preview while a tool is mid-drag: terrain.invalidate(rect) + viewport.refresh(rect) + 'changed'. No undo entry. */
  touch(rect: Rect): void;
  status(msg: string): void;
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
