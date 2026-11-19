// STUB: a worker fills this in (see docs/roadmaps/level-format.md, issue B2). Keep the exported signatures.
import type { LevelDoc } from './types';

/** Problems with a level document, one readable string each, empty when it is fine. Checks the shared layers only
 * (the game validates its own `data`). Never throws. */
export function validateLevelDoc(_doc: unknown): string[] {
  return [];
}

/** True (and narrows) when validateLevelDoc finds nothing. */
export function isLevelDoc(doc: unknown): doc is LevelDoc {
  return validateLevelDoc(doc).length === 0;
}
