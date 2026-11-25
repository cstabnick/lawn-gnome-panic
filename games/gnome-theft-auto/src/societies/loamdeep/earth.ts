// Loamdeep's packed earth (E17 issue B8): everything in the cell that is not a hall or a tunnel is solid earth.
// STUB: the B8 worker fills it.
import type { InteriorKit } from '../../interiors/types';
import type { Rect } from '../config';

/** The solid rectangles of `bounds` left after carving out every `open` rect, on a `cell`-metre grid, merged. */
export function carveEarth(_bounds: Rect, _open: readonly Rect[], _cell: number): Rect[] {
  return [];
}

/** Packed earth for Loamdeep: colliders and inward-facing earth faces round every hall and tunnel. */
export function buildEarth(_kit: InteriorKit): void {}
