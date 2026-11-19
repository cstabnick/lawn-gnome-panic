// STUB: a worker fills this in (see docs/roadmaps/level-format.md, issue C1). Keep the exported signature.
import type { WalkGrid } from '@lawn/level';

/** The baked walkability grid shipped with the game (src/data/levels/walk.bake.json), or null when there is none or the
 * page was opened with ?walkbake=0. Must not throw. */
export function loadWalkGrid(): WalkGrid | null {
  return null;
}
