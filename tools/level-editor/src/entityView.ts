// STUB: a worker fills this in (docs/roadmaps/level-format.md, issue E2). Keep the exported signature.
import type { EditorContext } from './context';

/** Draws the zone's layers into ctx.viewport.overlay and keeps them current. Returns a disposer. */
export function createEntityView(_ctx: EditorContext): { dispose(): void } {
  return { dispose() {} };
}
