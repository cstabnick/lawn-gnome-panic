// Interior space (E05): every point with x >= INTERIOR_MIN_X (5000, sites.ts) belongs to an interior pocket, never to
// the world. Pure and tiny on purpose: collide.ts and terrain.ts import it on their hot paths.
import { INTERIOR_MIN_X } from '../sites';

export { INTERIOR_MIN_X };

/** The floor height of every interior pocket (terrain.ts heightAt returns this inside one). */
export const INTERIOR_FLOOR_Y = 0;

/** True when (x, z) is inside interior space (an interior pocket), so world bounds and terrain do not apply there. */
export function isInteriorPoint(x: number, _z?: number): boolean {
  return x >= INTERIOR_MIN_X;
}
