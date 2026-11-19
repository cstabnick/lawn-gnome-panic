// The baked walkability grid shipped with the game: loaded once at startup, so the static part of isBlocked is one lookup.
import { WalkGrid, type WalkFile } from '@lawn/level';
import bake from './data/levels/walk.bake.json';

/** The input hash the shipped bake was made from. The test compares it with a fresh computeBakeHash. */
export const BAKED_WALK_HASH: string = (bake as WalkFile).inputHash;

/** The baked walkability grid shipped with the game (src/data/levels/walk.bake.json), or null when there is none or the
 * page was opened with ?walkbake=0. Must not throw. */
export function loadWalkGrid(): WalkGrid | null {
  try {
    if (typeof location !== 'undefined' && new URLSearchParams(location.search).get('walkbake') === '0') return null;
    const file = bake as WalkFile;
    if (!file.tiles || file.tiles.length === 0) return null;
    return WalkGrid.fromJSON(file);
  } catch (e) {
    console.error('walk bake could not be loaded; using live walkability', e);
    return null;
  }
}
