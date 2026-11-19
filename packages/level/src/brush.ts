// STUB: a worker fills this in (see docs/roadmaps/level-format.md, issue B1). Keep the exported signature.
import type { DeltaGrid, DeltaPatch } from './deltas';

export type BrushMode = 'raise' | 'lower' | 'smooth' | 'flatten';

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
}

/** Applies one dab to `grid` and returns the changes as a patch (empty arrays when nothing changed).
 * `heightAt(x, z)` is the CURRENT total height (base + stamps + this grid), used by smooth and flatten. */
export function applyBrush(_grid: DeltaGrid, _op: BrushOp, _heightAt: (x: number, z: number) => number): DeltaPatch {
  return { ix: [], iz: [], before: [], after: [] };
}
