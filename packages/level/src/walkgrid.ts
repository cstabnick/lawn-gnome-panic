// Baked walkability: one bit per 0.25 m cell saying "something static blocks a walker here" (water, trees, rocks, walls,
// house footprints, ramp bodies). Baked in tiles (a game picks the rectangles: Gnomomia uses each outdoor zone plus its
// blend margin). Anything outside every tile is "not baked": solidAt returns undefined and the caller asks the live
// function instead. Quest gates and props added at run time are not in the grid; the game overlays them.
import { base64ToBytes, bytesToBase64 } from './math';
import type { Rect } from './types';

export const WALK_CELL = 0.25;

export interface WalkTile {
  id: string;
  /** World position of the tile's cell (0, 0) corner; a multiple of WALK_CELL. */
  minX: number;
  minZ: number;
  cols: number;
  rows: number;
  /** cols * rows bits, row-major (row = z), bit i at bits[i >> 3] >> (i & 7). 1 = solid. */
  bits: Uint8Array;
}

export interface WalkFile {
  format: 'lawn-walk';
  version: 1;
  cell: 0.25;
  /** Fingerprint of everything the bake depended on (computed by the game's bake script). */
  inputHash: string;
  tiles: { id: string; minX: number; minZ: number; cols: number; rows: number; rle: string }[];
}

/** Bakes a tile covering `rect` (grown to whole cells) by asking `solid` at every cell centre. */
export function bakeTile(id: string, rect: Rect, solid: (x: number, z: number) => boolean): WalkTile {
  const minX = Math.floor(rect.minX / WALK_CELL) * WALK_CELL;
  const minZ = Math.floor(rect.minZ / WALK_CELL) * WALK_CELL;
  const cols = Math.ceil((rect.maxX - minX) / WALK_CELL);
  const rows = Math.ceil((rect.maxZ - minZ) / WALK_CELL);
  const bits = new Uint8Array(Math.ceil((cols * rows) / 8));
  let i = 0;
  for (let r = 0; r < rows; r++) {
    const z = minZ + (r + 0.5) * WALK_CELL;
    for (let c = 0; c < cols; c++, i++) {
      if (solid(minX + (c + 0.5) * WALK_CELL, z)) bits[i >> 3] |= 1 << (i & 7);
    }
  }
  return { id, minX, minZ, cols, rows, bits };
}

/** Run lengths of alternating 0-bits and 1-bits starting with 0-bits, each a little-endian u16; a run of 65536 or more
 * is written as 65535, 0, remainder so every run fits. */
export function encodeRle(bits: Uint8Array, count: number): Uint8Array {
  const runs: number[] = [];
  let cur = 0;
  let len = 0;
  const push = (n: number): void => {
    while (n > 65535) {
      runs.push(65535, 0);
      n -= 65535;
    }
    runs.push(n);
  };
  for (let i = 0; i < count; i++) {
    const b = (bits[i >> 3] >> (i & 7)) & 1;
    if (b === cur) len++;
    else {
      push(len);
      cur = b;
      len = 1;
    }
  }
  push(len);
  const out = new Uint8Array(runs.length * 2);
  const dv = new DataView(out.buffer);
  runs.forEach((n, k) => dv.setUint16(k * 2, n, true));
  return out;
}

export function decodeRle(rle: Uint8Array, count: number): Uint8Array {
  const bits = new Uint8Array(Math.ceil(count / 8));
  const dv = new DataView(rle.buffer, rle.byteOffset, rle.byteLength);
  let i = 0;
  let cur = 0;
  for (let k = 0; k < rle.length / 2; k++) {
    const n = dv.getUint16(k * 2, true);
    if (cur === 1) for (let j = 0; j < n; j++, i++) bits[i >> 3] |= 1 << (i & 7);
    else i += n;
    cur ^= 1;
  }
  if (i !== count) throw new Error(`walk tile RLE covers ${i} cells, expected ${count}`);
  return bits;
}

export class WalkGrid {
  private byId = new Map<string, WalkTile>();
  private list: WalkTile[] = [];
  inputHash = '';

  get tileIds(): string[] {
    return [...this.byId.keys()];
  }

  /** Every installed tile, for bulk upload (e.g. Wasm pathfinding linear memory). */
  tiles(): readonly WalkTile[] {
    return this.list;
  }

  setTile(t: WalkTile): void {
    this.byId.set(t.id, t);
    this.list = [...this.byId.values()];
  }

  deleteTile(id: string): void {
    this.byId.delete(id);
    this.list = [...this.byId.values()];
  }

  /** Ids of the tiles whose rectangle overlaps `r`. */
  tilesIn(r: Rect): string[] {
    return this.list
      .filter((t) => t.minX < r.maxX && t.minX + t.cols * WALK_CELL > r.minX && t.minZ < r.maxZ && t.minZ + t.rows * WALK_CELL > r.minZ)
      .map((t) => t.id);
  }

  /** True/false when (x, z) is inside a baked tile (solid or not); undefined when no tile covers it. */
  solidAt(x: number, z: number): boolean | undefined {
    for (const t of this.list) {
      const c = Math.floor((x - t.minX) / WALK_CELL);
      const r = Math.floor((z - t.minZ) / WALK_CELL);
      if (c < 0 || r < 0 || c >= t.cols || r >= t.rows) continue;
      const i = r * t.cols + c;
      return ((t.bits[i >> 3] >> (i & 7)) & 1) === 1;
    }
    return undefined;
  }

  toJSON(): WalkFile {
    const tiles = [...this.byId.values()]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((t) => ({ id: t.id, minX: t.minX, minZ: t.minZ, cols: t.cols, rows: t.rows, rle: bytesToBase64(encodeRle(t.bits, t.cols * t.rows)) }));
    return { format: 'lawn-walk', version: 1, cell: 0.25, inputHash: this.inputHash, tiles };
  }

  static fromJSON(f: WalkFile): WalkGrid {
    const g = new WalkGrid();
    g.inputHash = f.inputHash;
    for (const t of f.tiles) {
      g.setTile({ id: t.id, minX: t.minX, minZ: t.minZ, cols: t.cols, rows: t.rows, bits: decodeRle(base64ToBytes(t.rle), t.cols * t.rows) });
    }
    return g;
  }
}
