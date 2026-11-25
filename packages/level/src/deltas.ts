// Brush edits: a sparse height-offset raster laid over a game's own terrain. One value per whole metre (a vertex at
// integer x, z), 64 x 64 vertices per chunk, stored as Int16 centimetres. Chunk (ci, cj) holds ix in [64ci, 64ci+63].
// The raster is added to the finished height, so an empty grid changes nothing.
import { base64ToBytes, bytesToBase64 } from './math';
import type { Rect } from './types';

export const DELTA_CHUNK = 64;
export const DELTA_UNIT = 0.01;
const MAX_UNITS = 32767;

/** A reversible batch of vertex changes (units are centimetres). */
export interface DeltaPatch {
  ix: number[];
  iz: number[];
  before: number[];
  after: number[];
}

/** The file form: only non-zero chunks, each as base64 of 4096 little-endian Int16 values (row-major, z rows). */
export interface DeltaFile {
  format: 'lawn-deltas';
  version: 1;
  chunk: 64;
  unit: 0.01;
  chunks: Record<string, string>;
}

const key = (ci: number, cj: number): number => (ci + 32768) * 65536 + (cj + 32768);

export class DeltaGrid {
  private chunks = new Map<number, Int16Array>();

  /** True when no chunk has ever been written (the common case: sampling is then free). */
  isEmpty(): boolean {
    return this.chunks.size === 0;
  }

  /** The stored value at integer vertex (ix, iz), in centimetres. 0 outside every chunk. */
  getUnits(ix: number, iz: number): number {
    const c = this.chunks.get(key(ix >> 6, iz >> 6));
    return c ? c[((iz & 63) << 6) | (ix & 63)] : 0;
  }

  /** Writes centimetres at (ix, iz), clamped to the Int16 range. Writing 0 to a missing chunk allocates nothing. */
  setUnits(ix: number, iz: number, units: number): void {
    const u = Math.max(-MAX_UNITS, Math.min(MAX_UNITS, Math.round(units)));
    const k = key(ix >> 6, iz >> 6);
    let c = this.chunks.get(k);
    if (!c) {
      if (u === 0) return;
      c = new Int16Array(DELTA_CHUNK * DELTA_CHUNK);
      this.chunks.set(k, c);
    }
    c[((iz & 63) << 6) | (ix & 63)] = u;
  }

  /** Metres at an integer vertex. */
  get(ix: number, iz: number): number {
    return this.getUnits(ix, iz) * DELTA_UNIT;
  }

  /** Bilinear height offset in metres at (x, z). */
  sample(x: number, z: number): number {
    if (this.chunks.size === 0) return 0;
    const ix = Math.floor(x);
    const iz = Math.floor(z);
    const fx = x - ix;
    const fz = z - iz;
    const a = this.getUnits(ix, iz);
    const b = this.getUnits(ix + 1, iz);
    const c = this.getUnits(ix, iz + 1);
    const d = this.getUnits(ix + 1, iz + 1);
    return (a * (1 - fx) * (1 - fz) + b * fx * (1 - fz) + c * (1 - fx) * fz + d * fx * fz) * DELTA_UNIT;
  }

  /** Applies a patch forwards (`undo` false: write `after`) or backwards (write `before`). */
  applyPatch(p: DeltaPatch, undo = false): void {
    const vals = undo ? p.before : p.after;
    for (let i = 0; i < p.ix.length; i++) this.setUnits(p.ix[i], p.iz[i], vals[i]);
  }

  /** Makes this raster hold exactly what `other` holds (the same chunks and values). */
  copyFrom(other: DeltaGrid): void {
    this.chunks.clear();
    for (const [k, c] of other.chunks) this.chunks.set(k, Int16Array.from(c));
  }

  /** Drops chunks that are all zero. */
  prune(): void {
    for (const [k, c] of this.chunks) if (!c.some((v) => v !== 0)) this.chunks.delete(k);
  }

  /** Visits every allocated chunk `(ci, cj)` with its raw 64×64 row-major Int16 centimetre array. */
  forEachChunk(fn: (ci: number, cj: number, data: Int16Array) => void): void {
    for (const [k, c] of this.chunks) {
      fn(Math.floor(k / 65536) - 32768, (k % 65536) - 32768, c);
    }
  }

  /** The box (metres) covered by allocated chunks, or null when empty. */
  bounds(): Rect | null {
    if (this.chunks.size === 0) return null;
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (const k of this.chunks.keys()) {
      const ci = Math.floor(k / 65536) - 32768;
      const cj = (k % 65536) - 32768;
      minX = Math.min(minX, ci * DELTA_CHUNK);
      maxX = Math.max(maxX, (ci + 1) * DELTA_CHUNK);
      minZ = Math.min(minZ, cj * DELTA_CHUNK);
      maxZ = Math.max(maxZ, (cj + 1) * DELTA_CHUNK);
    }
    return { minX, maxX, minZ, maxZ };
  }

  toJSON(): DeltaFile {
    this.prune();
    const chunks: Record<string, string> = {};
    const keys = [...this.chunks.keys()].sort((a, b) => a - b);
    for (const k of keys) {
      const c = this.chunks.get(k)!;
      const bytes = new Uint8Array(c.length * 2);
      const dv = new DataView(bytes.buffer);
      for (let i = 0; i < c.length; i++) dv.setInt16(i * 2, c[i], true);
      chunks[`${Math.floor(k / 65536) - 32768},${(k % 65536) - 32768}`] = bytesToBase64(bytes);
    }
    return { format: 'lawn-deltas', version: 1, chunk: 64, unit: 0.01, chunks };
  }

  static fromJSON(f: DeltaFile): DeltaGrid {
    const g = new DeltaGrid();
    for (const [name, b64] of Object.entries(f.chunks)) {
      const [ci, cj] = name.split(',').map(Number);
      const bytes = base64ToBytes(b64);
      if (bytes.length !== DELTA_CHUNK * DELTA_CHUNK * 2) throw new Error(`delta chunk ${name}: wrong size ${bytes.length}`);
      const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
      const c = new Int16Array(DELTA_CHUNK * DELTA_CHUNK);
      for (let i = 0; i < c.length; i++) c[i] = dv.getInt16(i * 2, true);
      g.chunks.set(key(ci, cj), c);
    }
    return g;
  }
}

/** Merges many patches (the dabs of one brush stroke) into one: per vertex, the first `before` and the last `after`. */
export class PatchBuilder {
  private at = new Map<number, number>();
  private p: DeltaPatch = { ix: [], iz: [], before: [], after: [] };

  add(patch: DeltaPatch): void {
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

  /** The merged patch, without vertices that ended up where they started. */
  build(): DeltaPatch {
    const out: DeltaPatch = { ix: [], iz: [], before: [], after: [] };
    for (let i = 0; i < this.p.ix.length; i++) {
      if (this.p.before[i] === this.p.after[i]) continue;
      out.ix.push(this.p.ix[i]);
      out.iz.push(this.p.iz[i]);
      out.before.push(this.p.before[i]);
      out.after.push(this.p.after[i]);
    }
    return out;
  }

  /** The box (metres) of the vertices touched so far, grown by 1 m for bilinear reach, or null when none. */
  bounds(): Rect | null {
    const n = this.p.ix.length;
    if (n === 0) return null;
    // A loop, not Math.min(...array): spreading a big stroke's vertex list overflows the call stack.
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (let i = 0; i < n; i++) {
      const x = this.p.ix[i], z = this.p.iz[i];
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (z < minZ) minZ = z;
      if (z > maxZ) maxZ = z;
    }
    return { minX: minX - 1, maxX: maxX + 2, minZ: minZ - 1, maxZ: maxZ + 2 };
  }
}
