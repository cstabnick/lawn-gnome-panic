// Surface paint: a sparse raster of "what the ground is made of", one byte per whole metre cell, 64 x 64 cells per chunk.
// 0 means "not painted" (the game's own ground colour); 1..255 are the game's own surface ids (a palette the game defines).
// Cell (ix, iz) covers x in [ix, ix + 1) and z in [iz, iz + 1). Like the delta raster it starts empty and changes nothing.
import { base64ToBytes, bytesToBase64 } from './math';
import type { Rect } from './types';

export const PAINT_CHUNK = 64;

/** A reversible batch of cell changes (surface ids). */
export interface PaintPatch {
  ix: number[];
  iz: number[];
  before: number[];
  after: number[];
}

/** The file form: only non-empty chunks, each as base64 of 4096 bytes (row-major, z rows). */
export interface PaintFile {
  format: 'lawn-paint';
  version: 1;
  chunk: 64;
  chunks: Record<string, string>;
}

const key = (ci: number, cj: number): number => (ci + 32768) * 65536 + (cj + 32768);

export class PaintGrid {
  private chunks = new Map<number, Uint8Array>();

  isEmpty(): boolean {
    return this.chunks.size === 0;
  }

  /** The surface id of cell (ix, iz): 0 when unpainted. */
  get(ix: number, iz: number): number {
    const c = this.chunks.get(key(ix >> 6, iz >> 6));
    return c ? c[((iz & 63) << 6) | (ix & 63)] : 0;
  }

  /** The surface id at the world point (x, z). */
  at(x: number, z: number): number {
    if (this.chunks.size === 0) return 0;
    return this.get(Math.floor(x), Math.floor(z));
  }

  /** Paints a cell. Writing 0 into a missing chunk allocates nothing. */
  set(ix: number, iz: number, id: number): void {
    const v = Math.max(0, Math.min(255, Math.round(id)));
    const k = key(ix >> 6, iz >> 6);
    let c = this.chunks.get(k);
    if (!c) {
      if (v === 0) return;
      c = new Uint8Array(PAINT_CHUNK * PAINT_CHUNK);
      this.chunks.set(k, c);
    }
    c[((iz & 63) << 6) | (ix & 63)] = v;
  }

  applyPatch(p: PaintPatch, undo = false): void {
    const vals = undo ? p.before : p.after;
    for (let i = 0; i < p.ix.length; i++) this.set(p.ix[i], p.iz[i], vals[i]);
  }

  /** Makes this raster hold exactly what `other` holds. */
  copyFrom(other: PaintGrid): void {
    this.chunks.clear();
    for (const [k, c] of other.chunks) this.chunks.set(k, Uint8Array.from(c));
  }

  /** Drops chunks that are entirely unpainted. */
  prune(): void {
    for (const [k, c] of this.chunks) if (!c.some((v) => v !== 0)) this.chunks.delete(k);
  }

  /** Visits every allocated chunk `(ci, cj)` with its raw 64×64 row-major Uint8 surface-id array. */
  forEachChunk(fn: (ci: number, cj: number, data: Uint8Array) => void): void {
    for (const [k, c] of this.chunks) {
      fn(Math.floor(k / 65536) - 32768, (k % 65536) - 32768, c);
    }
  }

  /** The box (metres) of the allocated chunks, or null when empty. */
  bounds(): Rect | null {
    if (this.chunks.size === 0) return null;
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (const k of this.chunks.keys()) {
      const ci = Math.floor(k / 65536) - 32768;
      const cj = (k % 65536) - 32768;
      minX = Math.min(minX, ci * PAINT_CHUNK);
      maxX = Math.max(maxX, (ci + 1) * PAINT_CHUNK);
      minZ = Math.min(minZ, cj * PAINT_CHUNK);
      maxZ = Math.max(maxZ, (cj + 1) * PAINT_CHUNK);
    }
    return { minX, maxX, minZ, maxZ };
  }

  toJSON(): PaintFile {
    this.prune();
    const chunks: Record<string, string> = {};
    for (const k of [...this.chunks.keys()].sort((a, b) => a - b)) {
      chunks[`${Math.floor(k / 65536) - 32768},${(k % 65536) - 32768}`] = bytesToBase64(this.chunks.get(k)!);
    }
    return { format: 'lawn-paint', version: 1, chunk: 64, chunks };
  }

  static fromJSON(f: PaintFile): PaintGrid {
    const g = new PaintGrid();
    for (const [name, b64] of Object.entries(f.chunks)) {
      const [ci, cj] = name.split(',').map(Number);
      const bytes = base64ToBytes(b64);
      if (bytes.length !== PAINT_CHUNK * PAINT_CHUNK) throw new Error(`paint chunk ${name}: wrong size ${bytes.length}`);
      g.chunks.set(key(ci, cj), Uint8Array.from(bytes));
    }
    return g;
  }
}

/** Merges many patches (the cells of one paint stroke) into one: per cell, the first `before` and the last `after`. */
export class PaintPatchBuilder {
  private at = new Map<number, number>();
  private p: PaintPatch = { ix: [], iz: [], before: [], after: [] };

  add(patch: PaintPatch): void {
    for (let i = 0; i < patch.ix.length; i++) {
      const k = patch.ix[i] * 1_000_003 + patch.iz[i];
      const slot = this.at.get(k);
      if (slot === undefined) {
        this.at.set(k, this.p.ix.length);
        this.p.ix.push(patch.ix[i]);
        this.p.iz.push(patch.iz[i]);
        this.p.before.push(patch.before[i]);
        this.p.after.push(patch.after[i]);
      } else {
        this.p.after[slot] = patch.after[i];
      }
    }
  }

  build(): PaintPatch {
    const out: PaintPatch = { ix: [], iz: [], before: [], after: [] };
    for (let i = 0; i < this.p.ix.length; i++) {
      if (this.p.before[i] === this.p.after[i]) continue;
      out.ix.push(this.p.ix[i]);
      out.iz.push(this.p.iz[i]);
      out.before.push(this.p.before[i]);
      out.after.push(this.p.after[i]);
    }
    return out;
  }

  /** The box of the cells touched so far, or null when none. */
  bounds(): Rect | null {
    const n = this.p.ix.length;
    if (n === 0) return null;
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (let i = 0; i < n; i++) {
      const x = this.p.ix[i], z = this.p.iz[i];
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (z < minZ) minZ = z;
      if (z > maxZ) maxZ = z;
    }
    return { minX, maxX: maxX + 1, minZ, maxZ: maxZ + 1 };
  }
}
