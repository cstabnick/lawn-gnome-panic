// Removes mowable plants' colliders from the world's box list (flora/harvest.ts hands plants over; their static boxes go).
// Plan: docs/roadmaps/gta-mowable-plants.md.
import type { Box } from '../types';
import type { PlantSeed } from './types';

const CENTRE_TOL = 0.35;
const HALF_XZ_SLACK = 0.3;
const TOP_ABOVE = 0.6;
const TOP_BELOW = 0.5;
const FILE_CELL = 8;

/** True when box `b` is the collider a builder gave plant `s` (see the rules in the issue). */
export function plantBoxMatch(b: Box, s: PlantSeed): boolean {
  const bx = (b.minX + b.maxX) / 2, bz = (b.minZ + b.maxZ) / 2;
  const tol2 = CENTRE_TOL * CENTRE_TOL;
  const nearCx = (bx - s.cx) * (bx - s.cx) + (bz - s.cz) * (bz - s.cz) <= tol2;
  const nearOrigin = (bx - s.x) * (bx - s.x) + (bz - s.z) * (bz - s.z) <= tol2;
  if (!nearCx && !nearOrigin) return false;
  if ((b.maxX - b.minX) / 2 > s.hw + HALF_XZ_SLACK) return false;
  if ((b.maxZ - b.minZ) / 2 > s.hd + HALF_XZ_SLACK) return false;
  if (b.h > s.y + s.h + TOP_ABOVE) return false;
  if (b.h < s.y - TOP_BELOW) return false;
  return true;
}

function fileKey(ix: number, iz: number): string {
  return ix + ',' + iz;
}

/**
 * Removes (in place) every box in `boxes` that plantBoxMatch matches to one of `seeds`. Returns how many were removed.
 * The array object is kept (other systems hold a reference to it); kept boxes keep their order.
 */
export function extractPlantBoxes(boxes: Box[], seeds: readonly PlantSeed[]): number {
  if (seeds.length === 0 || boxes.length === 0) return 0;
  // Load-time code: file the seeds by the 8 m cell of their footprint centre.
  const filed = new Map<string, PlantSeed[]>();
  for (const s of seeds) {
    const key = fileKey(Math.floor(s.cx / FILE_CELL), Math.floor(s.cz / FILE_CELL));
    let list = filed.get(key);
    if (!list) { list = []; filed.set(key, list); }
    list.push(s);
  }

  let w = 0;
  let removed = 0;
  for (let i = 0; i < boxes.length; i++) {
    const b = boxes[i];
    const bx = (b.minX + b.maxX) / 2, bz = (b.minZ + b.maxZ) / 2;
    const ix = Math.floor(bx / FILE_CELL), iz = Math.floor(bz / FILE_CELL);
    let hit = false;
    for (let dz = -1; dz <= 1 && !hit; dz++) {
      for (let dx = -1; dx <= 1 && !hit; dx++) {
        const list = filed.get(fileKey(ix + dx, iz + dz));
        if (!list) continue;
        for (const s of list) {
          if (plantBoxMatch(b, s)) { hit = true; break; }
        }
      }
    }
    if (hit) removed++;
    else boxes[w++] = b;
  }
  boxes.length = w;
  return removed;
}
