// STUB: a worker fills this in (docs/roadmaps/level-format.md, issue E7). Keep the exported signatures.
import type { EditorContext } from './context';

export interface SaveResult {
  /** Repo-relative paths written. */
  files: string[];
}

/** Writes everything dirty (zone level documents, the delta raster) through the dev server. Clears ctx.dirty.zones and
 * ctx.dirty.deltas on success. Rejects with a readable Error on failure. */
export async function saveAll(_ctx: EditorContext): Promise<SaveResult> {
  throw new Error('persist.ts is not implemented yet');
}
