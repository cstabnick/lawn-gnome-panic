// The lot as pure data: edges (walls, doors, windows), furniture, rooms and paths. No THREE, no DOM.
import { FURNITURE, LOT_H, LOT_W } from './config';
import type { EdgeKey, EdgeKind, FurnitureDef, Lot, PlacedItem, Room, RoomKind, Rot } from './types';

export type Tile = { tx: number; ty: number };
export type Vertex = { vx: number; vy: number };
/** 0 = north (-y), 1 = east (+x), 2 = south (+y), 3 = west (-x). */
export type Dir = 0 | 1 | 2 | 3;

const DIRS: [number, number][] = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
];
const ROOM_KINDS: Exclude<RoomKind, 'empty'>[] = ['bedroom', 'bathroom', 'kitchen', 'living'];

function tileKey(tx: number, ty: number): string {
  return `${tx},${ty}`;
}
function inLot(lot: Lot, tx: number, ty: number): boolean {
  return tx >= 0 && ty >= 0 && tx < lot.w && ty < lot.h;
}
/** Walls and windows block walking and split rooms. */
function isCut(lot: Lot, k: EdgeKey): boolean {
  const e = lot.edges[k];
  return e === 'wall' || e === 'window';
}
function isFlat(kind: string): boolean {
  return FURNITURE[kind]?.flat === true;
}
function footprintOf(kind: string, rot: Rot): { w: number; d: number } {
  const def: FurnitureDef | undefined = FURNITURE[kind];
  return def ? itemSize(def, rot) : { w: 1, d: 1 };
}
function footprintTiles(tx: number, ty: number, w: number, d: number): Tile[] {
  const out: Tile[] = [];
  for (let j = 0; j < d; j++) for (let i = 0; i < w; i++) out.push({ tx: tx + i, ty: ty + j });
  return out;
}
function coversTile(item: PlacedItem, tx: number, ty: number): boolean {
  const { w, d } = footprintOf(item.kind, item.rot);
  return tx >= item.tx && tx < item.tx + w && ty >= item.ty && ty < item.ty + d;
}
function overlapsItem(item: PlacedItem, tx: number, ty: number, w: number, d: number): boolean {
  const o = footprintOf(item.kind, item.rot);
  return item.tx < tx + w && tx < item.tx + o.w && item.ty < ty + d && ty < item.ty + o.d;
}
function solidTileKeys(lot: Lot): Set<string> {
  const out = new Set<string>();
  for (const item of lot.items) {
    if (isFlat(item.kind)) continue;
    for (const t of itemTiles(item)) out.add(tileKey(t.tx, t.ty));
  }
  return out;
}
/** The edge on side `dir` of tile (tx, ty), as a key. */
function sideKey(tx: number, ty: number, dir: Dir): EdgeKey {
  if (dir === 0) return edgeKey('h', tx, ty);
  if (dir === 1) return edgeKey('v', tx + 1, ty);
  if (dir === 2) return edgeKey('h', tx, ty + 1);
  return edgeKey('v', tx, ty);
}

export function newLot(w: number = LOT_W, h: number = LOT_H): Lot {
  return { w, h, edges: {}, items: [], nextId: 1, floors: {} };
}
/** A small ready house (about 8 x 6 tiles, one door, one window) with nothing in it, used by NewHouseholdOptions.lot === 'starter'. */
export function starterLot(): Lot {
  const lot = newLot();
  const outer: EdgeKey[] = [];
  // Cottage outline: vertex rectangle (8,6)-(16,12), tiles x 8..15, y 6..11.
  for (let x = 8; x < 16; x++) outer.push(edgeKey('h', x, 6), edgeKey('h', x, 12));
  for (let y = 6; y < 12; y++) outer.push(edgeKey('v', 8, y), edgeKey('v', 16, y));
  // Interior wall splitting the narrow west room (x 8..11) from the main room (x 12..15).
  for (let y = 6; y < 12; y++) outer.push(edgeKey('v', 12, y));
  setEdges(lot, outer, 'wall');
  setEdges(lot, [edgeKey('h', 11, 12)], 'door');
  setEdges(lot, [edgeKey('h', 13, 6), edgeKey('v', 16, 8)], 'window');
  setEdges(lot, [edgeKey('v', 12, 10)], 'door');
  for (let ty = 6; ty < 12; ty++) {
    for (let tx = 8; tx < 16; tx++) lot.floors[tileKey(tx, ty)] = tx < 12 ? 'tile' : 'wood';
  }
  return lot;
}

export function edgeKey(axis: 'h' | 'v', x: number, y: number): EdgeKey {
  return `${axis}:${x},${y}`;
}
export function parseEdge(k: EdgeKey): { axis: 'h' | 'v'; x: number; y: number } {
  const [a, rest] = k.split(':');
  const [x, y] = rest.split(',').map(Number);
  return { axis: a as 'h' | 'v', x, y };
}
/** The straight run of edges from vertex a toward vertex b along the longer axis (a diagonal drag snaps to its dominant axis). Empty if a === b. */
export function edgesBetween(a: Vertex, b: Vertex): EdgeKey[] {
  const dx = b.vx - a.vx;
  const dy = b.vy - a.vy;
  const out: EdgeKey[] = [];
  if (Math.abs(dx) >= Math.abs(dy)) {
    if (dx === 0) return out;
    const s = Math.sign(dx);
    for (let i = 0; i < Math.abs(dx); i++) {
      const x = s > 0 ? a.vx + i : a.vx - i - 1;
      out.push(edgeKey('h', x, a.vy));
    }
  } else {
    const s = Math.sign(dy);
    for (let i = 0; i < Math.abs(dy); i++) {
      const y = s > 0 ? a.vy + i : a.vy - i - 1;
      out.push(edgeKey('v', a.vx, y));
    }
  }
  return out;
}
export function edgeInBounds(lot: Lot, k: EdgeKey): boolean {
  const { axis, x, y } = parseEdge(k);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return false;
  if (axis === 'h') return x >= 0 && x < lot.w && y >= 0 && y <= lot.h;
  if (axis === 'v') return x >= 0 && x <= lot.w && y >= 0 && y < lot.h;
  return false;
}
/** Set (kind) or clear (null) every listed in-bounds edge. Returns how many actually changed. */
export function setEdges(lot: Lot, keys: EdgeKey[], kind: EdgeKind | null): number {
  let changed = 0;
  for (const k of keys) {
    if (!edgeInBounds(lot, k)) continue;
    if (kind === null) {
      if (k in lot.edges) {
        delete lot.edges[k];
        changed++;
      }
    } else if (lot.edges[k] !== kind) {
      lot.edges[k] = kind;
      changed++;
    }
  }
  return changed;
}

/** Footprint in tiles after rotation (rot 1 and 3 swap w and d). */
export function itemSize(def: FurnitureDef, rot: Rot): { w: number; d: number } {
  return rot % 2 === 0 ? { w: def.w, d: def.d } : { w: def.d, d: def.w };
}
export function itemTiles(item: PlacedItem): Tile[] {
  const { w, d } = footprintOf(item.kind, item.rot);
  return footprintTiles(item.tx, item.ty, w, d);
}
/** In bounds, no overlap with a solid item (flat items overlap anything except another flat item), and a solid item may not sit on a tile whose edge walls cut through it (it may touch walls). */
export function canPlace(lot: Lot, kind: string, tx: number, ty: number, rot: Rot, ignoreId?: number): boolean {
  const { w, d } = footprintOf(kind, rot);
  if (tx < 0 || ty < 0 || tx + w > lot.w || ty + d > lot.h) return false;
  const flat = isFlat(kind);
  for (const other of lot.items) {
    if (other.id === ignoreId) continue;
    // Same kind of thing (solid with solid, flat with flat) may not overlap; a rug may sit under a solid item.
    if (isFlat(other.kind) === flat && overlapsItem(other, tx, ty, w, d)) return false;
  }
  if (!flat) {
    for (let i = 0; i < w; i++) {
      for (let j = 0; j < d; j++) {
        if (i > 0 && isCut(lot, edgeKey('v', tx + i, ty + j))) return false;
        if (j > 0 && isCut(lot, edgeKey('h', tx + i, ty + j))) return false;
      }
    }
  }
  return true;
}
export function placeItem(lot: Lot, kind: string, tx: number, ty: number, rot: Rot): PlacedItem | null {
  if (!canPlace(lot, kind, tx, ty, rot)) return null;
  const item: PlacedItem = { id: lot.nextId++, kind, tx, ty, rot };
  lot.items.push(item);
  return item;
}
export function removeItem(lot: Lot, id: number): PlacedItem | null {
  const i = lot.items.findIndex((it) => it.id === id);
  if (i < 0) return null;
  const [item] = lot.items.splice(i, 1);
  return item;
}
export function moveItem(lot: Lot, id: number, tx: number, ty: number, rot: Rot): boolean {
  const item = lot.items.find((it) => it.id === id);
  if (!item) return false;
  if (!canPlace(lot, item.kind, tx, ty, rot, id)) return false;
  item.tx = tx;
  item.ty = ty;
  item.rot = rot;
  return true;
}
/** The solid item covering the tile, else the flat one, else null. */
export function itemAt(lot: Lot, tx: number, ty: number): PlacedItem | null {
  let flat: PlacedItem | null = null;
  for (const item of lot.items) {
    if (!coversTile(item, tx, ty)) continue;
    if (!isFlat(item.kind)) return item;
    flat = flat ?? item;
  }
  return flat;
}
/** World centre (x, z) of the footprint. */
export function itemCenter(item: PlacedItem): { x: number; z: number } {
  const { w, d } = footprintOf(item.kind, item.rot);
  return { x: item.tx + w / 2, z: item.ty + d / 2 };
}
/** Yaw (three rotation.y) that turns a model whose front is +z to face rot: 0 -> 0, 1 -> -PI/2 (west), 2 -> PI, 3 -> PI/2 (east). */
export function facingYaw(rot: Rot): number {
  return [0, -Math.PI / 2, Math.PI, Math.PI / 2][rot];
}

/** Does the edge on side `dir` of tile (tx, ty) stop walking? Walls and windows do; doors and empty edges do not. */
export function edgeBlocks(lot: Lot, tx: number, ty: number, dir: Dir): boolean {
  return isCut(lot, sideKey(tx, ty, dir));
}
export function isWalkable(lot: Lot, tx: number, ty: number): boolean {
  if (!inLot(lot, tx, ty)) return false;
  for (const item of lot.items) {
    if (!isFlat(item.kind) && coversTile(item, tx, ty)) return false;
  }
  return true;
}
/** 4-connected A* over walkable tiles, respecting edgeBlocks. Includes `from` and `to`. Null if unreachable. `to` itself may be non-walkable only if allowGoalSolid. */
export function findPath(lot: Lot, from: Tile, to: Tile, allowGoalSolid = false): Tile[] | null {
  if (!inLot(lot, from.tx, from.ty) || !inLot(lot, to.tx, to.ty)) return null;
  if (from.tx === to.tx && from.ty === to.ty) return [{ tx: from.tx, ty: from.ty }];
  if (!allowGoalSolid && !isWalkable(lot, to.tx, to.ty)) return null;

  const solid = solidTileKeys(lot);
  const W = lot.w;
  const idx = (tx: number, ty: number) => ty * W + tx;
  const goal = idx(to.tx, to.ty);
  const start = idx(from.tx, from.ty);
  const h = (i: number) => Math.abs((i % W) - to.tx) + Math.abs(Math.floor(i / W) - to.ty);

  const g = new Map<number, number>([[start, 0]]);
  const parent = new Map<number, number>();
  const closed = new Set<number>();
  const open: number[] = [start];

  while (open.length > 0) {
    let best = 0;
    let bestF = Infinity;
    for (let k = 0; k < open.length; k++) {
      const i = open[k];
      const f = (g.get(i) ?? Infinity) + h(i);
      if (f < bestF) {
        bestF = f;
        best = k;
      }
    }
    const cur = open[best];
    open[best] = open[open.length - 1];
    open.pop();
    if (cur === goal) {
      const path: Tile[] = [];
      let at: number | undefined = cur;
      while (at !== undefined) {
        path.push({ tx: at % W, ty: Math.floor(at / W) });
        at = parent.get(at);
      }
      return path.reverse();
    }
    closed.add(cur);
    const cx = cur % W;
    const cy = Math.floor(cur / W);
    for (let dir = 0; dir < 4; dir++) {
      const nx = cx + DIRS[dir][0];
      const ny = cy + DIRS[dir][1];
      if (!inLot(lot, nx, ny)) continue;
      const ni = idx(nx, ny);
      if (closed.has(ni)) continue;
      if (edgeBlocks(lot, cx, cy, dir as Dir)) continue;
      const isGoal = ni === goal;
      if (!(isGoal && allowGoalSolid) && solid.has(tileKey(nx, ny))) continue;
      const ng = (g.get(cur) ?? 0) + 1;
      if (ng >= (g.get(ni) ?? Infinity)) continue;
      g.set(ni, ng);
      parent.set(ni, cur);
      if (!open.includes(ni)) open.push(ni);
    }
  }
  return null;
}
/** The walkable tile where a gnome stands to use an item: the tile in front of it (rot-aware), else any reachable free neighbour; null if boxed in. */
export function approachTile(lot: Lot, item: PlacedItem): Tile | null {
  const { w, d } = footprintOf(item.kind, item.rot);
  const cells = footprintTiles(item.tx, item.ty, w, d);
  const inFoot = new Set(cells.map((t) => tileKey(t.tx, t.ty)));
  const cx = item.tx + w / 2;
  const cz = item.ty + d / 2;
  const byCentre = (a: Tile, b: Tile) =>
    Math.hypot(a.tx + 0.5 - cx, a.ty + 0.5 - cz) - Math.hypot(b.tx + 0.5 - cx, b.ty + 0.5 - cz);

  // Front row: rot 0 faces south (+z), 1 west (-x), 2 north (-z), 3 east (+x).
  const front: Tile[] = [];
  if (item.rot === 0) for (let i = 0; i < w; i++) front.push({ tx: item.tx + i, ty: item.ty + d });
  if (item.rot === 2) for (let i = 0; i < w; i++) front.push({ tx: item.tx + i, ty: item.ty - 1 });
  if (item.rot === 1) for (let j = 0; j < d; j++) front.push({ tx: item.tx - 1, ty: item.ty + j });
  if (item.rot === 3) for (let j = 0; j < d; j++) front.push({ tx: item.tx + w, ty: item.ty + j });
  front.sort(byCentre);

  // Any other tile touching the footprint on a side.
  const seen = new Set<string>(front.map((t) => tileKey(t.tx, t.ty)));
  const ring: Tile[] = [];
  for (const c of cells) {
    for (const [dx, dy] of DIRS) {
      const t = { tx: c.tx + dx, ty: c.ty + dy };
      const k = tileKey(t.tx, t.ty);
      if (inFoot.has(k) || seen.has(k)) continue;
      seen.add(k);
      ring.push(t);
    }
  }
  ring.sort(byCentre);

  const reaches = (t: Tile): boolean => {
    for (let dir = 0; dir < 4; dir++) {
      const [dx, dy] = DIRS[dir];
      if (!inFoot.has(tileKey(t.tx + dx, t.ty + dy))) continue;
      if (!edgeBlocks(lot, t.tx, t.ty, dir as Dir)) return true;
    }
    return false;
  };
  for (const t of [...front, ...ring]) {
    if (isWalkable(lot, t.tx, t.ty) && reaches(t)) return t;
  }
  return null;
}
/**
 * Flood-fill every tile into rooms. Walls, windows AND doors all separate rooms (a doorway is where one room ends and the next begins, so a
 * cottage room with a front door is still its own room, not part of the lawn). A region is not enclosed when it has an open edge, or a door,
 * on the lot border. The lawn around the house is one region, never enclosed.
 */
export function detectRooms(lot: Lot): Room[] {
  const seen = new Set<string>();
  const rooms: Room[] = [];
  let id = 1;
  for (let ty = 0; ty < lot.h; ty++) {
    for (let tx = 0; tx < lot.w; tx++) {
      if (seen.has(tileKey(tx, ty))) continue;
      seen.add(tileKey(tx, ty));
      const stack: Tile[] = [{ tx, ty }];
      const tiles: Tile[] = [];
      let enclosed = true;
      while (stack.length > 0) {
        const cur = stack.pop() as Tile;
        tiles.push(cur);
        for (let dir = 0; dir < 4; dir++) {
          if (edgeBlocks(lot, cur.tx, cur.ty, dir as Dir)) continue;
          const nx = cur.tx + DIRS[dir][0];
          const ny = cur.ty + DIRS[dir][1];
          if (!inLot(lot, nx, ny)) {
            enclosed = false;
            continue;
          }
          if (lot.edges[sideKey(cur.tx, cur.ty, dir as Dir)] === 'door') continue; // a doorway ends the room
          const k = tileKey(nx, ny);
          if (seen.has(k)) continue;
          seen.add(k);
          stack.push({ tx: nx, ty: ny });
        }
      }
      rooms.push({ id: id++, tiles, kind: roomKind(lot, tiles), enclosed });
    }
  }
  return rooms;
}
export function roomAt(rooms: Room[], tx: number, ty: number): Room | null {
  return rooms.find((r) => r.tiles.some((t) => t.tx === tx && t.ty === ty)) ?? null;
}
/** The kind with the most `counts` among the room's items (ties: bedroom, bathroom, kitchen, living); 'empty' if none. */
export function roomKind(lot: Lot, tiles: Tile[]): RoomKind {
  const inRoom = new Set(tiles.map((t) => tileKey(t.tx, t.ty)));
  const counts: Record<Exclude<RoomKind, 'empty'>, number> = { bedroom: 0, bathroom: 0, kitchen: 0, living: 0 };
  for (const item of lot.items) {
    if (!inRoom.has(tileKey(item.tx, item.ty))) continue;
    const c = FURNITURE[item.kind]?.counts;
    if (c) counts[c]++;
  }
  let best: RoomKind = 'empty';
  let bestN = 0;
  for (const k of ROOM_KINDS) {
    if (counts[k] > bestN) {
      bestN = counts[k];
      best = k;
    }
  }
  return best;
}
/** Where the carpool stops (the gnome walks here to leave for work and appears here when back): the lot's south-west corner tile. */
export function carpoolTile(lot: Lot): Tile {
  return { tx: 0, ty: lot.h - 1 };
}
/** Sum of item prices on the lot (for the "house value" readout). */
export function lotValue(lot: Lot): number {
  return lot.items.reduce((sum, it) => sum + (FURNITURE[it.kind]?.price ?? 0), 0);
}
