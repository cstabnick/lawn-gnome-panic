import type { DeltaGrid, DeltaPatch } from './deltas';
import { clamp } from './math';

export type BrushMode = 'raise' | 'lower' | 'smooth' | 'flatten' | 'noise';

export interface BrushOp {
  mode: BrushMode;
  /** Centre of the dab, world metres. */
  x: number;
  z: number;
  /** Radius, metres. */
  radius: number;
  /** raise/lower: metres moved per dab at the centre. smooth/flatten: 0..1, the fraction of the gap closed per dab. */
  strength: number;
  /** flatten only: the total height (metres) to flatten to. */
  target?: number;
  /** noise only: which pattern to roughen with (the same seed gives the same bumps, so a stroke is repeatable). */
  seed?: number;
}

/** A repeatable pseudo-random value in [-1, 1] for the vertex (ix, iz) and a seed. Integer maths only. */
export function vertexNoise(ix: number, iz: number, seed = 0): number {
  let h = Math.imul(ix, 374761393) ^ Math.imul(iz, 668265263) ^ Math.imul(seed | 0, 2246822519);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return ((h >>> 0) / 4294967296) * 2 - 1;
}

const MAX_UNITS = 6000;

/** Applies one dab to `grid` and returns the changes as a patch (empty arrays when nothing changed).
 * `heightAt(x, z)` is the CURRENT total height (base + stamps + this grid), used by smooth and flatten. */
export function applyBrush(grid: DeltaGrid, op: BrushOp, heightAt: (x: number, z: number) => number): DeltaPatch {
  const out: DeltaPatch = { ix: [], iz: [], before: [], after: [] };
  const { x, z, radius, strength } = op;
  if (!(radius > 0) || !Number.isFinite(radius) || !Number.isFinite(x) || !Number.isFinite(z) || !Number.isFinite(strength)) {
    return out;
  }
  if (op.target !== undefined && !Number.isFinite(op.target)) return out;

  // Every new value is computed from heightAt before anything is written, so smooth and flatten
  // do not depend on the order the vertices are visited in.
  const flatTarget = op.mode === 'flatten' ? (op.target ?? heightAt(x, z)) : 0;
  const pending: { ix: number; iz: number; cur: number; next: number }[] = [];

  for (let ix = Math.floor(x - radius); ix <= Math.ceil(x + radius); ix++) {
    for (let iz = Math.floor(z - radius); iz <= Math.ceil(z + radius); iz++) {
      const d = Math.hypot(ix - x, iz - z);
      if (!(d < radius)) continue;
      const w = (1 - (d / radius) ** 2) ** 2;
      const cur = grid.getUnits(ix, iz);
      let delta: number;
      if (op.mode === 'raise') {
        delta = Math.round(strength * 100 * w);
      } else if (op.mode === 'lower') {
        delta = -Math.round(strength * 100 * w);
      } else if (op.mode === 'noise') {
        delta = Math.round(strength * 100 * w * vertexNoise(ix, iz, op.seed ?? 0));
      } else {
        const total = heightAt(ix, iz);
        if (op.mode === 'smooth') {
          const mean = (total + heightAt(ix + 1, iz) + heightAt(ix - 1, iz) + heightAt(ix, iz + 1) + heightAt(ix, iz - 1)) / 5;
          delta = Math.round((mean - total) * strength * w * 100);
        } else {
          delta = Math.round((flatTarget - total) * strength * w * 100);
        }
      }
      if (!Number.isFinite(delta)) continue;
      const next = clamp(cur + delta, -MAX_UNITS, MAX_UNITS);
      if (next === cur) continue;
      pending.push({ ix, iz, cur, next });
    }
  }

  for (const p of pending) {
    grid.setUnits(p.ix, p.iz, p.next);
    out.ix.push(p.ix);
    out.iz.push(p.iz);
    out.before.push(p.cur);
    out.after.push(p.next);
  }
  return out;
}
