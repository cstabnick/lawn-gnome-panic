// Saves through the level editor's dev-server API (server/api.ts). Nothing here touches the file system.
import type { WalkFile } from '@lawn/level';
import { worldZoneToDoc } from '@gnomomia/levelDocs';
import type { EditorContext } from './context';

export interface SaveResult {
  /** Repo-relative paths written. */
  files: string[];
}

async function post(route: string, body: unknown): Promise<{ file: string }> {
  const res = await fetch('/api' + route, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = (await res.json().catch(() => ({}))) as { file?: string; error?: string; problems?: string[] };
  if (!res.ok) {
    throw new Error((json.error ?? `HTTP ${res.status}`) + (json.problems ? ': ' + json.problems.join('; ') : ''));
  }
  return { file: json.file ?? '' };
}

/** Writes everything dirty (zone level documents, the delta raster) through the dev server. Clears ctx.dirty.zones and
 * ctx.dirty.deltas on success. Rejects with a readable Error on failure. */
export async function saveAll(ctx: EditorContext): Promise<SaveResult> {
  const files: string[] = [];
  // Each zone is cleared as soon as its own save lands, so a failure part-way leaves the rest still dirty.
  for (const id of [...ctx.dirty.zones]) {
    const r = await post('/zone', { doc: worldZoneToDoc(ctx.zones[id]) });
    files.push(r.file);
    ctx.dirty.zones.delete(id);
  }
  if (ctx.dirty.deltas) {
    const r = await post('/deltas', { file: ctx.deltas.toJSON() });
    files.push(r.file);
    ctx.dirty.deltas = false;
  }
  if (files.length > 0 && ctx.dirty.walkRects.length > 0) {
    ctx.status('Saved. The walkability bake is now out of date: use Analyze > Re-bake.');
  }
  return { files };
}

/** Writes a baked walk grid (src/data/levels/walk.bake.json) through the dev server. */
export async function saveWalk(file: WalkFile): Promise<SaveResult> {
  const r = await post('/walk', { file });
  return { files: [r.file] };
}
