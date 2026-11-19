// Pixels for a top-down overlay over a rectangle: one pixel per `cell` metres. Row 0 is the rectangle's minZ edge, so a
// plane whose uv v = 0 sits at minZ gets the texture the right way round. Pure: the caller decides what a cell looks like.
import type { Rect } from '@lawn/level';

export function paintGrid(
  rect: Rect,
  cell: number,
  cellColour: (x: number, z: number) => [number, number, number, number],
): { width: number; height: number; data: Uint8ClampedArray } {
  const width = Math.max(1, Math.ceil((rect.maxX - rect.minX) / cell));
  const height = Math.max(1, Math.ceil((rect.maxZ - rect.minZ) / cell));
  const data = new Uint8ClampedArray(width * height * 4);
  for (let j = 0; j < height; j++) {
    for (let i = 0; i < width; i++) {
      const [r, g, b, a] = cellColour(rect.minX + (i + 0.5) * cell, rect.minZ + (j + 0.5) * cell);
      const o = (j * width + i) * 4;
      data[o] = r;
      data[o + 1] = g;
      data[o + 2] = b;
      data[o + 3] = a;
    }
  }
  return { width, height, data };
}
