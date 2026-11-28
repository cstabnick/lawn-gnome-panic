// The player's home layout (E10, L22): pure rules for placing, moving, rotating and storing furniture in Flat 3B, plus
// load/save under HOME_KEY and a change event. No DOM, no three.js (tests run it headless). Every function that
// changes a layout mutates it in place and returns whether it changed; callers then saveLayout() and emitHomeChange().
import { notifySaveChanged } from '../saveHook';
import {
  FLAT_ROOM, FLOOR_COLOURS, FURNITURE_SHOP, HOME_KEY, STARTER_ITEMS, WALL_COLOURS,
  type FurnitureStock, type HomeLayout, type PlacedPiece,
} from './types';

export interface HomeStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const QUARTER = Math.PI / 2;

function defaultStorage(): HomeStorage | undefined {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : undefined;
  } catch {
    return undefined;
  }
}

/** The shop row for a prefab id (also used for pieces placed by the game, e.g. the starter crate). */
export function stockOf(prefab: string): FurnitureStock | undefined {
  return FURNITURE_SHOP.find((s) => s.prefab === prefab);
}

/** A fresh move-in layout: the starter pieces, nothing stored, the bank's colours. */
export function starterLayout(): HomeLayout {
  const items: PlacedPiece[] = STARTER_ITEMS.map((p, i) => ({ ...p, uid: `p${i + 1}` }));
  return {
    v: 1, kind: 'flat', items, stored: {}, wall: WALL_COLOURS[0].id, floor: FLOOR_COLOURS[0].id,
    next: items.length + 1, placedEver: 0,
  };
}

const num = (v: unknown, d: number): number => (typeof v === 'number' && Number.isFinite(v) ? v : d);

/** Parse saved JSON; anything missing or broken falls back to the starter layout's values. Unknown prefabs are dropped. */
export function parseLayout(raw: string | null | undefined): HomeLayout {
  const base = starterLayout();
  if (!raw) return base;
  let o: Partial<HomeLayout>;
  try {
    o = JSON.parse(raw) as Partial<HomeLayout>;
  } catch {
    return base;
  }
  if (!o || typeof o !== 'object' || o.v !== 1) return base;
  const items: PlacedPiece[] = [];
  for (const it of Array.isArray(o.items) ? o.items : []) {
    if (!it || typeof it.prefab !== 'string' || !stockOf(it.prefab) || typeof it.uid !== 'string') continue;
    items.push({ uid: it.uid, prefab: it.prefab, x: num(it.x, 0), z: num(it.z, 0), yaw: num(it.yaw, 0) });
  }
  const stored: Record<string, number> = {};
  if (o.stored && typeof o.stored === 'object') {
    for (const [k, n] of Object.entries(o.stored)) {
      if (stockOf(k) && typeof n === 'number' && n > 0) stored[k] = Math.floor(n);
    }
  }
  const maxUid = items.reduce((m, it) => Math.max(m, Number(it.uid.slice(1)) || 0), 0);
  return {
    v: 1,
    kind: o.kind === 'cabin' ? 'cabin' : 'flat',
    items,
    stored,
    wall: WALL_COLOURS.some((c) => c.id === o.wall) ? (o.wall as string) : base.wall,
    floor: FLOOR_COLOURS.some((c) => c.id === o.floor) ? (o.floor as string) : base.floor,
    next: Math.max(num(o.next, 1), maxUid + 1),
    placedEver: Math.max(0, Math.floor(num(o.placedEver, 0))),
  };
}

let cached: HomeLayout | null = null;

/** The current layout (loaded once from storage, then kept in memory). */
export function loadLayout(storage: HomeStorage | undefined = defaultStorage()): HomeLayout {
  if (cached) return cached;
  let raw: string | null = null;
  try {
    raw = storage?.getItem(HOME_KEY) ?? null;
  } catch {
    raw = null;
  }
  cached = parseLayout(raw);
  return cached;
}

/** Store the layout (and mark the cloud save dirty). */
export function saveLayout(l: HomeLayout, storage: HomeStorage | undefined = defaultStorage()): void {
  cached = l;
  try {
    storage?.setItem(HOME_KEY, JSON.stringify(l));
  } catch {
    /* private window: the layout lives for this session only */
  }
  notifySaveChanged();
}

/** Tests and save imports: forget the in-memory copy so the next loadLayout reads storage again. */
export function resetLayoutCache(): void {
  cached = null;
}

// ---- Geometry ----------------------------------------------------------------------------------------------------

/** Footprint half-sizes on x and z at this yaw (quarter turns swap w and d). */
export function halfSize(prefab: string, yaw: number): { hx: number; hz: number } {
  const s = stockOf(prefab);
  const w = s?.w ?? 0.6, d = s?.d ?? 0.6;
  const turned = Math.abs(Math.round(yaw / QUARTER)) % 2 === 1;
  return turned ? { hx: d / 2, hz: w / 2 } : { hx: w / 2, hz: d / 2 };
}

const snap = (v: number, g: number): number => Math.round(v / g) * g;

/** Snap yaw to the nearest quarter turn in [0, 2π). */
export function snapYaw(yaw: number): number {
  const q = ((Math.round(yaw / QUARTER) % 4) + 4) % 4;
  return q * QUARTER;
}

/**
 * Where a piece may stand: snapped to the grid and to quarter turns, kept inside the walls (FLAT_ROOM.margin). A wall
 * piece (stock.wall) is pushed onto the nearest wall and turned to face into the room.
 */
export function clampPose(prefab: string, x: number, z: number, yaw: number): { x: number; z: number; yaw: number } {
  const s = stockOf(prefab);
  const W = FLAT_ROOM.w / 2, D = FLAT_ROOM.d / 2;
  if (s?.wall) {
    // Nearest wall: west (x = -W, faces +x), east (faces -x), north (z = -D, faces +z), south (faces -z).
    const dW = x + W, dE = W - x, dN = z + D, dS = D - z;
    const m = Math.min(dW, dE, dN, dS);
    const t = s.d / 2 + 0.02;
    if (m === dN) return { x: clamp(snap(x, FLAT_ROOM.grid), -W + s.w / 2, W - s.w / 2), z: -D + t, yaw: 0 };
    if (m === dS) return { x: clamp(snap(x, FLAT_ROOM.grid), -W + s.w / 2, W - s.w / 2), z: D - t, yaw: Math.PI };
    if (m === dW) return { x: -W + t, z: clamp(snap(z, FLAT_ROOM.grid), -D + s.w / 2, D - s.w / 2), yaw: QUARTER };
    return { x: W - t, z: clamp(snap(z, FLAT_ROOM.grid), -D + s.w / 2, D - s.w / 2), yaw: 3 * QUARTER };
  }
  const y = snapYaw(yaw);
  const { hx, hz } = halfSize(prefab, y);
  const mx = W - FLAT_ROOM.margin - hx, mz = D - FLAT_ROOM.margin - hz;
  return { x: clamp(snap(x, FLAT_ROOM.grid), -mx, mx), z: clamp(snap(z, FLAT_ROOM.grid), -mz, mz), yaw: y };
}

function clamp(v: number, lo: number, hi: number): number {
  return lo > hi ? (lo + hi) / 2 : Math.min(hi, Math.max(lo, v));
}

interface Rect { minX: number; maxX: number; minZ: number; maxZ: number }

function rectOf(prefab: string, x: number, z: number, yaw: number): Rect {
  const { hx, hz } = halfSize(prefab, yaw);
  return { minX: x - hx, maxX: x + hx, minZ: z - hz, maxZ: z + hz };
}

const overlaps = (a: Rect, b: Rect): boolean => a.minX < b.maxX - 0.01 && a.maxX > b.minX + 0.01 && a.minZ < b.maxZ - 0.01 && a.maxZ > b.minZ + 0.01;

/** The doorway square that must stay clear (so the player can always get in and out). */
export function doorRect(): Rect {
  const h = FLAT_ROOM.doorClear / 2;
  return { minX: FLAT_ROOM.door.x - h, maxX: FLAT_ROOM.door.x + h, minZ: FLAT_ROOM.d / 2 - FLAT_ROOM.doorClear, maxZ: FLAT_ROOM.d / 2 };
}

/**
 * Can `prefab` stand at this (already clamped) pose? Not in the doorway, not overlapping another solid piece
 * (`ignoreUid` = the piece being moved). Flat pieces (rugs) and wall pieces only avoid others of their own sort.
 */
export function fits(l: HomeLayout, prefab: string, x: number, z: number, yaw: number, ignoreUid: string | null = null): boolean {
  const s = stockOf(prefab);
  const r = rectOf(prefab, x, z, yaw);
  if (!s?.wall && !s?.flat && overlaps(r, doorRect())) return false;
  for (const it of l.items) {
    if (it.uid === ignoreUid) continue;
    const o = stockOf(it.prefab);
    const sameSort = (!!o?.wall === !!s?.wall) && (!!o?.flat === !!s?.flat);
    if (!sameSort) continue;
    if (overlaps(r, rectOf(it.prefab, it.x, it.z, it.yaw))) return false;
  }
  return true;
}

/** A free pose for a new piece: the room centre if it fits, else the nearest free grid point (spiral), else null. */
export function freeSpot(l: HomeLayout, prefab: string, nearX = 0, nearZ = 0, yaw = 0): { x: number; z: number; yaw: number } | null {
  const g = FLAT_ROOM.grid * 2;
  for (let ring = 0; ring < 30; ring++) {
    for (let i = -ring; i <= ring; i++) {
      for (let j = -ring; j <= ring; j++) {
        if (Math.max(Math.abs(i), Math.abs(j)) !== ring) continue;
        const p = clampPose(prefab, nearX + i * g, nearZ + j * g, yaw);
        if (fits(l, prefab, p.x, p.z, p.yaw)) return p;
      }
    }
  }
  return null;
}

// ---- Edits -------------------------------------------------------------------------------------------------------

export function pieceById(l: HomeLayout, uid: string): PlacedPiece | undefined {
  return l.items.find((it) => it.uid === uid);
}

/** Add `n` pieces to storage (after buying them). */
export function addStored(l: HomeLayout, prefab: string, n = 1): boolean {
  if (!stockOf(prefab) || n <= 0) return false;
  l.stored[prefab] = (l.stored[prefab] ?? 0) + n;
  return true;
}

/** Take one `prefab` out of storage and stand it at the nearest free spot to (x, z). Returns the new piece or null. */
export function placeFromStore(l: HomeLayout, prefab: string, x = 0, z = 0, yaw = 0): PlacedPiece | null {
  if ((l.stored[prefab] ?? 0) <= 0) return null;
  const p = freeSpot(l, prefab, x, z, yaw);
  if (!p) return null;
  const piece: PlacedPiece = { uid: `p${l.next}`, prefab, ...p };
  l.next += 1;
  l.items.push(piece);
  l.stored[prefab] -= 1;
  if (l.stored[prefab] <= 0) delete l.stored[prefab];
  l.placedEver += 1;
  return piece;
}

/** Move a piece to (x, z, yaw), clamped and snapped. False (nothing changes) if it would not fit there. */
export function movePiece(l: HomeLayout, uid: string, x: number, z: number, yaw?: number): boolean {
  const it = pieceById(l, uid);
  if (!it) return false;
  const p = clampPose(it.prefab, x, z, yaw ?? it.yaw);
  if (!fits(l, it.prefab, p.x, p.z, p.yaw, uid)) return false;
  if (p.x === it.x && p.z === it.z && p.yaw === it.yaw) return false;
  it.x = p.x; it.z = p.z; it.yaw = p.yaw;
  return true;
}

/** Turn a piece a quarter turn clockwise (seen from above). Wall pieces cannot turn. False if it would not fit. */
export function rotatePiece(l: HomeLayout, uid: string): boolean {
  const it = pieceById(l, uid);
  if (!it || stockOf(it.prefab)?.wall) return false;
  return movePiece(l, uid, it.x, it.z, it.yaw - QUARTER);
}

/** Put a placed piece back in storage. */
export function storePiece(l: HomeLayout, uid: string): boolean {
  const i = l.items.findIndex((it) => it.uid === uid);
  if (i < 0) return false;
  const [it] = l.items.splice(i, 1);
  l.stored[it.prefab] = (l.stored[it.prefab] ?? 0) + 1;
  return true;
}

export function setColours(l: HomeLayout, wall?: string, floor?: string): boolean {
  let changed = false;
  if (wall && wall !== l.wall && WALL_COLOURS.some((c) => c.id === wall)) { l.wall = wall; changed = true; }
  if (floor && floor !== l.floor && FLOOR_COLOURS.some((c) => c.id === floor)) { l.floor = floor; changed = true; }
  return changed;
}

/** How many pieces stand in the room. */
export function placedCount(l: HomeLayout): number {
  return l.items.length;
}

/** Stored pieces as a list (shop order). */
export function storedList(l: HomeLayout): { prefab: string; name: string; count: number }[] {
  return FURNITURE_SHOP.filter((s) => (l.stored[s.prefab] ?? 0) > 0).map((s) => ({ prefab: s.prefab, name: s.name, count: l.stored[s.prefab] }));
}

// ---- Change event ------------------------------------------------------------------------------------------------

const listeners = new Set<(l: HomeLayout) => void>();

/** Called after any change to the home (layout, colours, purchase, ownership). Returns an unsubscribe. */
export function onHomeChange(cb: (l: HomeLayout) => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function emitHomeChange(): void {
  const l = loadLayout();
  for (const cb of [...listeners]) cb(l);
}

/** Save and notify in one go (the usual end of an edit). */
export function commitLayout(l: HomeLayout): void {
  saveLayout(l);
  emitHomeChange();
}

// ---- Live pieces (the room registers each placed piece's 3D object; the decorate panel moves them while dragging) ---

/** The part of a THREE.Object3D the panel touches (kept structural so this module stays free of three.js). */
export interface PieceObject {
  position: { x: number; z: number };
  rotation: { y: number };
  visible: boolean;
}

const pieceObjs = new Map<string, PieceObject>();

/** flat3b.ts build(): register the object it built for piece `uid` (local coordinates: room centre on the floor). */
export function registerPieceObject(uid: string, obj: PieceObject): void {
  pieceObjs.set(uid, obj);
}

/** flat3b.ts build(): forget the previous room's objects (call first, the room is rebuilt on every entry). */
export function clearPieceObjects(): void {
  pieceObjs.clear();
}

/** The live object of a placed piece while the player is in the room, else undefined. */
export function pieceObject(uid: string): PieceObject | undefined {
  return pieceObjs.get(uid);
}

// ---- Hooks the room and the panel call (set by home/runtime.ts at install) ----------------------------------------

export interface HomeHooks {
  /** The bed / bedroll "Sleep" spot. */
  sleep(): void;
  /** The "Decorate" spot inside the flat and the Gnomlet Home app. */
  decorate(): void;
}

let hooks: HomeHooks | null = null;
export function setHomeHooks(h: HomeHooks | null): void {
  hooks = h;
}
export function homeHooks(): HomeHooks | null {
  return hooks;
}
