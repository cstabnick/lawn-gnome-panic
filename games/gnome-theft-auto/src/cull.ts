// Distance culling and shadow-caster culling for Gnome Theft Auto, in one place.
//
// Three.js already skips objects outside the camera frustum, but only per object: a prop 600 m away inside the view
// cone is still drawn (fog hides it from 420 m), and every caster inside the sun's shadow box is drawn a second time
// into the shadow map. This module stops drawing registered objects past their class's draw distance and stops them
// casting past its shadow distance, both scaled by the quality tier (quality.ts). app.ts calls updateCull each frame.
//
// How to register content:
//
//   import { registerCull, buildStaticCells } from './cull';
//   registerCull(object, 'prop');            // one placed object (Group or Mesh); its world bounds are measured now
//   registerCull(npcGroup, 'prop', { moves: true });   // something that moves: its position is re-read at each check
//   scene.add(buildStaticCells(placements, { lights: false, name: 'forest-scenery' }));   // many static prefabs
//
// Content built inside buildWorld is registered for you (registerScenery in app.ts sorts it into classes by size), and
// so is anything a module adds to the scene before the first frame (registerLate, as moving objects). Objects created
// later (spawned pickups, new vehicles) need registerCull or syncCullSet. Past DETAIL_DIST a registered object's small
// parts stop drawing (its cheap far version).
//
// Rules:
// - Register an object after it is placed. Things added under it later are not culled with it.
// - The game never sees culling in `visible`: from updateCull until the scene's render ends (the "cull pass"), a culled
//   root reads `visible === false` and skips its matrix update, so three's three walks of the scene (matrices, main pass,
//   shadow pass) skip its whole subtree; outside the pass `visible` reads what the game set, and systems that show and
//   hide objects keep working. Owned batches (buildStaticCells) use `visible` directly. Small parts dropped at range
//   (DETAIL_DIST) leave camera layer 0.
// - Do not register terrain chunks, water, or anything map-wide (an InstancedMesh over the whole map): one bound
//   covering everything is never culled. Split it per cell instead (buildStaticCells does that for prefabs).
// - One merged mesh the size of a region defeats frustum culling and is drawn in full, twice, from anywhere on the map:
//   prefer buildStaticCells over one buildStaticPrefabs call for scenery spread over a region.
import * as THREE from 'three';
import { buildStaticPrefabs, type StaticBatchOptions, type StaticPrefabPlacement } from '@lawn/prefabs';
import { CULL_CLASS_INDEX, CULL_CLASS_ORDER, getGtaKernelRuntime, type GtaKernelRuntime } from './wasm/gtaWasm';

export type CullClass = 'tiny' | 'detail' | 'prop' | 'gnome' | 'vehicle' | 'tree' | 'building' | 'cell' | 'landmark';

/** Distances in metres at quality scale 1, from the camera to the object's bounding circle (xz). */
export const CULL_DIST: Record<CullClass, { draw: number; shadow: number }> = {
  /** Flowers, cans, pebbles: never cast. */
  tiny: { draw: 80, shadow: 0 },
  /** Small props: mailboxes, crates, signs. */
  detail: { draw: 140, shadow: 30 },
  /** Ordinary props, furniture, fences. */
  prop: { draw: 220, shadow: 50 },
  /** Pedestrian gnomes (about 20 small meshes each). */
  gnome: { draw: 170, shadow: 35 },
  /** Parked and moving vehicles. */
  vehicle: { draw: 300, shadow: 55 },
  /** Trees and big plants. */
  tree: { draw: 340, shadow: 80 },
  /** Houses, shops, sheds. */
  building: { draw: 520, shadow: 110 },
  /** One cell of merged static scenery (buildStaticCells). */
  cell: { draw: 420, shadow: 90 },
  /** Seen from anywhere (towers on the skyline): only shadows are culled. */
  landmark: { draw: Infinity, shadow: 140 },
};

/**
 * The cheap far version of an object: past this distance its small parts (a gnome's eyes, buttons and buckle, a mower's
 * bolts and lamps: any mesh under DETAIL_PART_M across) stop drawing, so a gnome of about 20 meshes draws as its 5-8
 * big ones. Classes without an entry keep every part.
 */
export const DETAIL_DIST: Partial<Record<CullClass, number>> = { gnome: 35, vehicle: 50, detail: 45, prop: 60 };
/** A part is a detail when its bounding sphere is under this diameter (m), or under a sixth of the object's. */
export const DETAIL_PART_M = 0.35;

export interface CullOptions {
  /** The object moves: re-read its position at each check (default false). */
  moves?: boolean;
  /** Override the measured radius (m). */
  radius?: number;
  /** The culler owns `visible` (merged batches nobody else touches): faster than per-mesh layers. Default false. */
  owned?: boolean;
}

interface Entry {
  obj: THREE.Object3D;
  cls: CullClass;
  x: number;
  z: number;
  r: number;
  owned: boolean;
  moves: boolean;
  /** Every mesh / points / line under it (layers), and those that cast shadows when registered. */
  drawn: THREE.Object3D[];
  casters: THREE.Object3D[];
  /** The small parts hidden past DETAIL_DIST (a subset of drawn). */
  details: THREE.Object3D[];
  shown: boolean;
  casting: boolean;
  /** Small parts drawn (near). */
  near: boolean;
  /** Slot in Wasm SIMD culler buffer (0..8191, or -1 if overflowed). */
  slot: number;
}

const MAX_WASM_CULL_SLOTS = 8192;
const entries: Entry[] = [];
const movingEntries: Entry[] = [];
const slotToEntry: (Entry | null)[] = [];
const freeSlots: number[] = [];
let maxSlotUsed = 0;
let overflowedWasmSlots = 0;
let cullRuntimeInited: GtaKernelRuntime | null = null;

function ensureCullWasmReady(): GtaKernelRuntime | null {
  const rt = getGtaKernelRuntime();
  if (!rt) return null;
  if (cullRuntimeInited !== rt) {
    cullRuntimeInited = rt;
    const limBase = rt.ex.getCullLimPtr() >>> 2;
    for (let i = 0; i < CULL_CLASS_ORDER.length; i++) {
      const cls = CULL_CLASS_ORDER[i];
      const lim = CULL_DIST[cls];
      const det = DETAIL_DIST[cls] ?? Infinity;
      const p = limBase + i * 4;
      rt.f32[p] = lim.draw === Infinity ? 1e30 : lim.draw;
      rt.f32[p + 1] = lim.shadow === Infinity ? 1e30 : lim.shadow;
      rt.f32[p + 2] = det === Infinity ? 1e30 : det;
      rt.f32[p + 3] = 0;
    }
    const actBase = rt.ex.getCullActivePtr();
    rt.u8.fill(0, actBase, actBase + MAX_WASM_CULL_SLOTS);
    const xBase = rt.ex.getCullXPtr() >>> 2;
    const zBase = rt.ex.getCullZPtr() >>> 2;
    const rBase = rt.ex.getCullRPtr() >>> 2;
    const clsBase = rt.ex.getCullClsPtr();
    const stBase = rt.ex.getCullStatePtr();
    for (const e of entries) {
      if (e.slot < 0) continue;
      rt.f32[xBase + e.slot] = e.x;
      rt.f32[zBase + e.slot] = e.z;
      rt.f32[rBase + e.slot] = e.r;
      rt.u8[clsBase + e.slot] = CULL_CLASS_INDEX[e.cls];
      rt.u8[stBase + e.slot] = (e.shown ? 1 : 0) | (e.casting ? 2 : 0) | (e.near ? 4 : 0);
      rt.u8[actBase + e.slot] = 1;
    }
  }
  return rt;
}

const byObj = new Map<THREE.Object3D, Entry>();
const box = new THREE.Box3();
const v = new THREE.Vector3();
let scale = 1;
let shadowScale = 1;
let cursor = 0;
let full = true;

// ---- The cull pass: culled roots leave three's scene walks for the length of one render -----------------------------
// Measured (perf pass 2): a third of the meshes are culled at any time, and three still walked them three times a frame
// (updateMatrixWorld, the main pass, the shadow pass). Hiding culled roots for the render cut render CPU by about 28 %.

/** True from updateCull until the scene's render ends (onAfterRender). */
let pass = false;
/** The game's own `visible` of a root the culler can hide. */
const OWN_VISIBLE = Symbol('cullOwnVisible');
/** The root is culled now (hidden during the pass). */
const CULLED = Symbol('culled');
/** The class's own updateMatrixWorld, kept while the root's is wrapped. */
const BASE_UMW = Symbol('cullBaseUpdateMatrixWorld');
type Prunable = THREE.Object3D & { [OWN_VISIBLE]?: boolean; [CULLED]?: boolean; [BASE_UMW]?: (force?: boolean) => void };

/** Lets the culler hide `obj` during the cull pass without the game seeing it (see the header). */
function makePrunable(obj: THREE.Object3D): void {
  const p = obj as Prunable;
  if (p[OWN_VISIBLE] !== undefined) return;
  p[OWN_VISIBLE] = obj.visible;
  p[CULLED] = false;
  Object.defineProperty(obj, 'visible', {
    configurable: true,
    enumerable: true,
    get(this: Prunable) {
      return this[OWN_VISIBLE] === true && !(pass && this[CULLED]);
    },
    set(this: Prunable, value: boolean) {
      this[OWN_VISIBLE] = value;
    },
  });
  const base = obj.updateMatrixWorld;
  p[BASE_UMW] = base;
  obj.updateMatrixWorld = function (this: Prunable, force?: boolean): void {
    if (pass && this[CULLED]) {
      // Not drawn this frame: leave its matrices, and recompute them (and its children's) when it is drawn again.
      if (force) this.matrixWorldNeedsUpdate = true;
      return;
    }
    base.call(this, force);
  };
}

/** Undoes makePrunable: `visible` is a plain property again with the game's value. */
function unprune(obj: THREE.Object3D): void {
  const p = obj as Prunable;
  if (p[OWN_VISIBLE] === undefined) return;
  const vis = p[OWN_VISIBLE];
  Object.defineProperty(obj, 'visible', { value: vis, writable: true, configurable: true, enumerable: true });
  if (p[BASE_UMW] && Object.prototype.hasOwnProperty.call(obj, 'updateMatrixWorld')) {
    delete (obj as { updateMatrixWorld?: unknown }).updateMatrixWorld;
  }
  delete p[OWN_VISIBLE];
  delete p[CULLED];
  delete p[BASE_UMW];
}

const passScenes = new WeakSet<THREE.Object3D>();
/** Ends the cull pass when `scene` has rendered (chained onto its onAfterRender). Called by registerScenery / registerLate. */
export function attachCullPass(scene: THREE.Object3D): void {
  if (passScenes.has(scene)) return;
  passScenes.add(scene);
  const prev = scene.onAfterRender;
  scene.onAfterRender = function (this: THREE.Object3D, ...args: Parameters<THREE.Object3D['onAfterRender']>): void {
    pass = false;
    prev.apply(this, args);
  };
}

/** Whether the cull pass is on (tests). */
export function cullPassActive(): boolean {
  return pass;
}

/** Ends the cull pass by hand (tests, or a frame that updated the culler but skipped the render). */
export function endCullPass(): void {
  pass = false;
}

/** Distance multipliers from the quality tier: `view` for drawing, `shadow` for casting. */
export function setCullScale(view: number, shadow = view): void {
  if (view === scale && shadow === shadowScale) return;
  scale = view;
  shadowScale = shadow;
  full = true;
}

/** Bounding circle in xz of an object's world box: [cx, cz, r, height], or null when it has no geometry. */
export function boundsOf(obj: THREE.Object3D): [number, number, number, number] | null {
  obj.updateWorldMatrix(true, true);
  box.setFromObject(obj);
  if (box.isEmpty()) return null;
  return [(box.min.x + box.max.x) / 2, (box.min.z + box.max.z) / 2, Math.hypot(box.max.x - box.min.x, box.max.z - box.min.z) / 2, box.max.y - box.min.y];
}

/** Registers an object with the culler (see the header for the rules). Registering twice changes its class. */
export function registerCull(obj: THREE.Object3D, cls: CullClass, opts: CullOptions = {}): void {
  const old = byObj.get(obj);
  if (old) {
    old.cls = cls;
    const rt = ensureCullWasmReady();
    if (rt && old.slot >= 0) rt.u8[rt.ex.getCullClsPtr() + old.slot] = CULL_CLASS_INDEX[cls];
    full = true;
    return;
  }
  const drawn: THREE.Object3D[] = [];
  const casters: THREE.Object3D[] = [];
  const details: THREE.Object3D[] = [];
  const b = boundsOf(obj);
  obj.getWorldPosition(v);
  // A moving object is tracked by its origin, so its radius covers its bounds as seen from the origin.
  const r = opts.radius ?? (b ? (opts.moves ? Math.hypot(b[0] - v.x, b[1] - v.z) + b[2] : b[2]) : 0);
  let slot = -1;
  if (freeSlots.length > 0) {
    slot = freeSlots.pop()!;
  } else if (maxSlotUsed < MAX_WASM_CULL_SLOTS) {
    slot = maxSlotUsed++;
  } else {
    overflowedWasmSlots++;
  }
  const e: Entry = {
    obj, cls, x: b && !opts.moves ? b[0] : v.x, z: b && !opts.moves ? b[1] : v.z, r, owned: !!opts.owned, moves: !!opts.moves,
    drawn, casters, details, shown: true, casting: true, near: true, slot,
  };
  collect(e);
  if (!e.owned) makePrunable(obj);
  entries.push(e);
  if (e.moves) movingEntries.push(e);
  if (slot >= 0) {
    slotToEntry[slot] = e;
    const rt = ensureCullWasmReady();
    if (rt) {
      rt.f32[(rt.ex.getCullXPtr() >>> 2) + slot] = e.x;
      rt.f32[(rt.ex.getCullZPtr() >>> 2) + slot] = e.z;
      rt.f32[(rt.ex.getCullRPtr() >>> 2) + slot] = e.r;
      rt.u8[rt.ex.getCullClsPtr() + slot] = CULL_CLASS_INDEX[cls];
      rt.u8[rt.ex.getCullStatePtr() + slot] = 7; // shown=1, casting=1, near=1
      rt.u8[rt.ex.getCullActivePtr() + slot] = 1;
    }
  }
  byObj.set(obj, e);
  full = true;
}

/**
 * The meshes under obj, and those that cast shadows. Whether a mesh casts is recorded the first time it is seen
 * (userData.cullCast), so meshes that never cast are never switched on, and meshes added later (a vehicle's rider) are
 * picked up when a moving entry is collected again.
 */
function collect(e: Entry): void {
  const { drawn, casters, details } = e;
  drawn.length = 0;
  casters.length = 0;
  details.length = 0;
  const lod = DETAIL_DIST[e.cls] !== undefined && !e.owned;
  const small = Math.min(DETAIL_PART_M, e.r / 3) / 2;
  e.obj.traverse((o) => {
    const d = o as THREE.Object3D & { isMesh?: boolean; isPoints?: boolean; isLine?: boolean; isSprite?: boolean; geometry?: THREE.BufferGeometry };
    if (!(d.isMesh || d.isPoints || d.isLine || d.isSprite)) return;
    drawn.push(o);
    if (o.userData.cullCast === undefined) o.userData.cullCast = o.castShadow;
    if (o.userData.cullCast) casters.push(o);
    if (lod && d.isMesh && d.geometry) {
      if (o.userData.cullPartR === undefined) {
        if (!d.geometry.boundingSphere) d.geometry.computeBoundingSphere();
        o.updateWorldMatrix(true, false);
        o.userData.cullPartR = (d.geometry.boundingSphere?.radius ?? 1) * o.matrixWorld.getMaxScaleOnAxis();
      }
      if (o.userData.cullPartR < small) details.push(o);
    }
  });
}

/** Stops culling an object and leaves it drawn and casting as registered. */
export function unregisterCull(obj: THREE.Object3D): void {
  const e = byObj.get(obj);
  if (!e) return;
  byObj.delete(obj);
  entries.splice(entries.indexOf(e), 1);
  if (e.moves) {
    const mi = movingEntries.indexOf(e);
    if (mi >= 0) movingEntries.splice(mi, 1);
  }
  if (e.slot >= 0) {
    slotToEntry[e.slot] = null;
    freeSlots.push(e.slot);
    if (cullRuntimeInited) cullRuntimeInited.u8[cullRuntimeInited.ex.getCullActivePtr() + e.slot] = 0;
  } else {
    overflowedWasmSlots = Math.max(0, overflowedWasmSlots - 1);
  }
  if (e.moves) collect(e);
  setNear(e, true);
  setShown(e, true);
  if (!e.owned) unprune(obj);
  for (const c of e.casters) c.castShadow = true;
}

/** Objects registered, drawn and casting now (the ?perf overlay and tests). */
export function cullStats(): { registered: number; shown: number; casting: number } {
  let shown = 0;
  let casting = 0;
  for (const e of entries) {
    if (e.shown) shown++;
    if (e.casting && e.casters.length) casting++;
  }
  return { registered: entries.length, shown, casting };
}

function setShown(e: Entry, show: boolean): void {
  if (e.owned) e.obj.visible = show;
  else (e.obj as Prunable)[CULLED] = !show;
  e.shown = show;
}

function setNear(e: Entry, near: boolean): void {
  e.near = near;
  for (const o of e.details) {
    if (near) o.layers.enable(0);
    else o.layers.disable(0);
  }
}

/** Draw and cast decisions for an object at distance d (m, to its bounding circle) of class cls. Pure; tested. */
export function cullDecision(cls: CullClass, d: number, view = 1, shadow = 1): { show: boolean; cast: boolean; near: boolean } {
  const lim = CULL_DIST[cls];
  const show = d <= lim.draw * view;
  return { show, cast: show && d <= lim.shadow * shadow, near: d <= (DETAIL_DIST[cls] ?? Infinity) * view };
}

function applyDecision(e: Entry, show: boolean, cast: boolean, near: boolean): void {
  if (e.moves && (show !== e.shown || cast !== e.casting || near !== e.near)) {
    // Parts added since the last look (a rider, a load) join; at range the small ones among them leave layer 0 too.
    collect(e);
    if (!e.near && near === e.near) setNear(e, false);
  }
  if (near !== e.near) setNear(e, near);
  if (show !== e.shown) setShown(e, show);
  if (cast !== e.casting) {
    for (const c of e.casters) c.castShadow = cast;
    e.casting = cast;
  }
}

function apply(e: Entry, cx: number, cz: number): void {
  if (e.moves) {
    e.obj.getWorldPosition(v);
    e.x = v.x;
    e.z = v.z;
  }
  const d = Math.max(0, Math.hypot(e.x - cx, e.z - cz) - e.r);
  const { show, cast, near } = cullDecision(e.cls, d, scale, shadowScale);
  applyDecision(e, show, cast, near);
}

/** Once per frame, with the camera's position: checks 100% of objects via Wasm SIMD (or a quarter in JS fallback). */
export function updateCull(cx: number, cz: number): void {
  const n = entries.length;
  if (n === 0) return;
  // The render that follows is the cull pass (ended by the scene's onAfterRender, see attachCullPass).
  pass = true;

  const rt = overflowedWasmSlots === 0 ? ensureCullWasmReady() : null;
  if (rt && maxSlotUsed > 0) {
    const xBase = rt.ex.getCullXPtr() >>> 2;
    const zBase = rt.ex.getCullZPtr() >>> 2;
    for (let i = 0; i < movingEntries.length; i++) {
      const m = movingEntries[i];
      m.obj.getWorldPosition(v);
      m.x = v.x;
      m.z = v.z;
      rt.f32[xBase + m.slot] = v.x;
      rt.f32[zBase + m.slot] = v.z;
    }
    const changed = rt.ex.updateCullWasm(maxSlotUsed, cx, cz, scale, shadowScale);
    const outBase = rt.ex.getCullOutPtr() >>> 2;
    for (let i = 0; i < changed; i++) {
      const packed = rt.u32[outBase + i];
      const slot = packed >>> 3;
      const e = slotToEntry[slot];
      if (!e) continue;
      applyDecision(e, (packed & 1) !== 0, (packed & 2) !== 0, (packed & 4) !== 0);
    }
    full = false;
    return;
  }

  if (full) {
    for (const e of entries) apply(e, cx, cz);
    full = false;
    return;
  }
  const step = Math.min(n, Math.max(64, Math.ceil(n / 4)));
  for (let k = 0; k < step; k++) {
    cursor = (cursor + 1) % n;
    apply(entries[cursor], cx, cz);
  }
}

/** Re-checks every object on the next update (after a teleport or a camera cut). */
export function cullAll(): void {
  full = true;
}

/** Class for a placed object from its size: what registerScenery uses. Pure; tested. */
export function classBySize(r: number, h: number): CullClass {
  if (h > 24) return 'landmark';
  if (r < 0.6 && h < 1.2) return 'tiny';
  if (r < 1.6) return 'detail';
  if (r < 5) return h > 6 ? 'tree' : 'prop';
  return 'building';
}

/** Scene objects never registered by registerScenery (they stream, or cover the map). */
const SKIP_NAMES = new Set(['terrain-chunks', 'water', 'waterworks']);

/**
 * Registers static scenery added to the scene after `fromIndex` (e.g. everything buildWorld added), each top-level
 * object in the class its size gives. Skips lights, cameras, named streaming groups, already-registered batches and
 * anything wider than `maxRadius` (map-wide meshes). Returns how many were registered.
 */
export function registerScenery(scene: THREE.Object3D, fromIndex: number, maxRadius = 200): number {
  attachCullPass(scene);
  let n = 0;
  const one = (obj: THREE.Object3D, depth: number): void => {
    if (byObj.has(obj) || SKIP_NAMES.has(obj.name) || obj.userData.cullCells) return;
    if ((obj as THREE.Light).isLight || (obj as THREE.Camera).isCamera) return;
    const b = boundsOf(obj);
    if (!b) return;
    if (b[2] > maxRadius) {
      // A map-wide container of separate pieces (the waterworks' bridges and docks): cull each piece.
      if (depth === 0 && !(obj as THREE.Mesh).isMesh && obj.children.length > 1) for (const c of obj.children) one(c, 1);
      return;
    }
    registerCull(obj, classBySize(b[2], b[3]));
    n++;
  };
  for (const obj of scene.children.slice(fromIndex)) one(obj, 0);
  return n;
}

/**
 * Registers the props and characters the game's modules added after the world (quest givers, wandering gnomes,
 * interactables, easter eggs, destructibles...) as moving objects in the class their size gives (a gnome-sized
 * object as 'gnome'). Skips `exclude` (the player, vehicles and pedestrians kept by syncCullSet), lights, anything
 * holding a mesh with frustum culling off (effect pools placed by their own code) and anything wider than
 * `maxRadius` (containers of things that move on their own). Returns how many were registered.
 */
export function registerLate(scene: THREE.Object3D, fromIndex: number, exclude: ReadonlySet<THREE.Object3D>, maxRadius = 30): number {
  attachCullPass(scene);
  let n = 0;
  for (const obj of scene.children.slice(fromIndex)) {
    if (byObj.has(obj) || exclude.has(obj) || obj.userData.cullCells || SKIP_NAMES.has(obj.name)) continue;
    if ((obj as THREE.Light).isLight || (obj as THREE.Camera).isCamera) continue;
    let pooled = false;
    obj.traverse((o) => {
      if (!o.frustumCulled && ((o as THREE.Mesh).isMesh || (o as THREE.Points).isPoints || (o as THREE.Sprite).isSprite)) pooled = true;
    });
    if (pooled) continue;
    const b = boundsOf(obj);
    if (!b || b[2] > maxRadius) continue;
    const cls = b[2] < 0.9 && b[3] > 0.6 && b[3] < 2.5 ? 'gnome' : classBySize(b[2], b[3]);
    registerCull(obj, cls, { moves: true });
    n++;
  }
  return n;
}

const sets = new Map<string, Set<THREE.Object3D>>();

/**
 * Keeps a changing list of moving objects (vehicles, pedestrians) registered as `cls` with { moves: true }: new ones
 * are registered, ones no longer listed are unregistered. Call it every few frames with the current list.
 */
export function syncCullSet(key: string, objects: Iterable<THREE.Object3D>, cls: CullClass): void {
  let set = sets.get(key);
  if (!set) sets.set(key, (set = new Set()));
  const now = new Set<THREE.Object3D>();
  for (const o of objects) {
    now.add(o);
    if (!set.has(o)) registerCull(o, cls, { moves: true });
  }
  for (const o of set) if (!now.has(o)) unregisterCull(o);
  sets.set(key, now);
}

/** Cell size of buildStaticCells, m. */
export const STATIC_CELL = 96;

let plantFilter: ((p: StaticPrefabPlacement) => boolean) | null = null;
/**
 * Mowable plants (flora/harvest.ts): while a filter is set, buildStaticCells offers it every placement first, and a
 * placement it takes (returns true) is left out of the merged batch: flora draws it instanced and mows it.
 */
export function setStaticPlantFilter(f: ((p: StaticPrefabPlacement) => boolean) | null): void {
  plantFilter = f;
}

/**
 * buildStaticPrefabs, split into one merged batch per STATIC_CELL square (by placement origin), each registered with
 * the culler as `cls` (default 'cell') and owned by it. Returns a group with the given name holding the cell batches.
 */
export function buildStaticCells(
  placements: readonly StaticPrefabPlacement[],
  opts: StaticBatchOptions & { cell?: number; cls?: CullClass } = {},
): THREE.Group {
  const cell = opts.cell ?? STATIC_CELL;
  const root = new THREE.Group();
  root.name = opts.name ?? 'prefab-cells';
  root.userData.cullCells = true;
  const cells = new Map<string, StaticPrefabPlacement[]>();
  for (const p of placements) {
    if (plantFilter && plantFilter(p)) continue;
    const k = `${Math.floor(p.x / cell)},${Math.floor(p.z / cell)}`;
    let list = cells.get(k);
    if (!list) cells.set(k, (list = []));
    list.push(p);
  }
  const { cell: _c, cls, ...batchOpts } = opts;
  for (const [k, list] of cells) root.add(buildStaticPrefabs(list, { ...batchOpts, name: `${root.name}:${k}` }));
  for (const g of root.children) registerCull(g, cls ?? 'cell', { owned: true });
  return root;
}
