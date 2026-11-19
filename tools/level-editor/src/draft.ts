// Unsaved edits survive a page reload: every change is mirrored (debounced) into localStorage, and the next start offers to
// put it back. Saving, or having nothing unsaved, clears it. Never throws: private windows and full quotas just mean no draft.
import { DeltaGrid, type DeltaFile } from '@lawn/level';
import type { EditorContext, MutableZone } from './context';
import { restore, snapshot, zoneRect, type Snapshot } from './state';

const KEY = 'level-editor.draft.v1';

export interface Draft {
  v: 1;
  /** Date.now() when it was written. */
  at: number;
  /** The editable layers of every unsaved zone. */
  zones: Record<string, Snapshot>;
  deltas: DeltaFile | null;
}

/** What is unsaved right now, or null when nothing is. */
export function buildDraft(ctx: EditorContext): Draft | null {
  if (ctx.dirty.zones.size === 0 && !ctx.dirty.deltas) return null;
  const zones: Record<string, Snapshot> = {};
  for (const id of ctx.dirty.zones) zones[id] = snapshot(ctx.zones[id] as unknown as MutableZone);
  return { v: 1, at: Date.now(), zones, deltas: ctx.dirty.deltas ? ctx.deltas.toJSON() : null };
}

/** Puts a draft's edits back: no undo entries (they were made in an earlier session), but every zone it touches is marked
 * unsaved and its caches are dropped. */
export function applyDraft(ctx: EditorContext, d: Draft): void {
  for (const [id, snap] of Object.entries(d.zones)) {
    const def = ctx.zones[id as keyof typeof ctx.zones];
    if (!def) continue;
    restore(def as unknown as MutableZone, snap);
    ctx.dirty.zones.add(def.id);
    const rect = zoneRect(def);
    ctx.dirty.walkRects.push(rect);
    ctx.terrain.invalidate(rect);
  }
  if (d.deltas) {
    ctx.deltas.copyFrom(DeltaGrid.fromJSON(d.deltas));
    ctx.dirty.deltas = true;
    const b = ctx.deltas.bounds();
    if (b) {
      ctx.dirty.walkRects.push(b);
      ctx.terrain.invalidate(b);
    }
  }
  ctx.viewport.refresh();
  ctx.events.changed.emit({ rect: null, kind: 'load' });
}

export function readDraft(): Draft | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const d = JSON.parse(raw) as Draft;
    return d && d.v === 1 && typeof d.zones === 'object' ? d : null;
  } catch {
    return null;
  }
}

export function writeDraft(d: Draft | null): void {
  try {
    if (d) localStorage.setItem(KEY, JSON.stringify(d));
    else localStorage.removeItem(KEY);
  } catch {
    // No storage: the editor still works, it just cannot recover after a reload.
  }
}

/** Mirrors the unsaved state into the draft after each change (at most every 400 ms). `sync()` writes now: call it after a save. */
export function installDraft(ctx: EditorContext): { sync(): void } {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const sync = (): void => {
    clearTimeout(timer);
    writeDraft(buildDraft(ctx));
  };
  ctx.events.changed.on(() => {
    clearTimeout(timer);
    timer = setTimeout(sync, 400);
  });
  return { sync };
}
