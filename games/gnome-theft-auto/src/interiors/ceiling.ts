// The current interior's ceiling height (FX02, D58): the interior runtime sets it on entering a room and clears it on
// leaving; the foot camera (camera.ts) keeps itself this far under it so a low room never shows the sky above its
// cut-away ceiling. Pure and tiny on purpose: camera.ts imports it on its hot path (no three.js, no runtime import).

/** How far under the ceiling the foot camera stays, metres. */
export const CEILING_CLEARANCE = 0.3;

let ceilingY: number | null = null;

/** The runtime: the room's ceiling height (floor y = 0) while inside, null outside. */
export function setInteriorCeiling(y: number | null): void {
  ceilingY = y !== null && Number.isFinite(y) && y > 0 ? y : null;
}

/** The current room's ceiling height, or null when the player is not inside an interior. */
export function interiorCeiling(): number | null {
  return ceilingY;
}
