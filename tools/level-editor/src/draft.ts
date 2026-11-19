// Unsaved edits survive a page reload: every change is mirrored (debounced) into localStorage, and the next start offers to
// put it back. Saving, or having nothing unsaved, clears it. Never throws: private windows and full quotas just mean no draft.
import { DeltaGrid, PaintGrid, type DeltaFile, type PaintFile } from '@lawn/level';
import type { EditorContext, MutableZone } from './context';
import { restore, snapshot, type Snapshot } from './state';

/** One draft per game (and per level for games that load one level at a time). */
export function draftKey(ctx: Pick<EditorContext, 'adapter' | 'zone'>): string {
  return `level-editor.draft.v1.${ctx.adapter.id}${ctx.adapter.singleLevel ? `.${ctx.zone}` : ''}`;
}

export interface Draft {
  v: 1;
  /** Date.now() when it was written. */
  at: number;
  /** The editable layers of every unsaved zone. */
  zones: Record<string, Snapshot>;
  deltas: DeltaFile | null;
  /** Absent in drafts written before paint existed. */
  paint?: PaintFile | null;
}

/** What is unsaved right now, or null when nothing is. */
export function buildDraft(ctx: EditorContext): Draft | null {
  if (ctx.dirty.zones.size === 0 && !ctx.dirty.deltas && !ctx.dirty.paint) return null;
  const zones: Record<string, Snapshot> = {};
  for (const id of ctx.dirty.zones) zones[id] = snapshot(ctx.zones[id] as unknown as MutableZone, ctx.adapter.editableKeys);
  return { v: 1, at: Date.now(), zones, deltas: ctx.dirty.deltas ? ctx.deltas.toJSON() : null, paint: ctx.dirty.paint ? ctx.paint.toJSON() : null };
}

/** Puts a draft's edits back: no undo entries (they were made in an earlier session), but every zone it touches is marked
 * unsaved and its caches are dropped. */
export function applyDraft(ctx: EditorContext, d: Draft): void {
  for (const [id, snap] of Object.entries(d.zones)) {
    const def = ctx.zones[id as keyof typeof ctx.zones];
    if (!def) continue;
    restore(def as unknown as MutableZone, snap, ctx.adapter.editableKeys);
    ctx.dirty.zones.add(def.id);
    const rect = ctx.adapter.zoneRect(def);
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
  if (d.paint) {
    ctx.paint.copyFrom(PaintGrid.fromJSON(d.paint));
    ctx.dirty.paint = true;
    const b = ctx.paint.bounds();
    if (b) {
      ctx.dirty.walkRects.push(b);
      ctx.terrain.invalidate(b);
    }
  }
  ctx.viewport.refresh();
  ctx.events.changed.emit({ rect: null, kind: 'load' });
}

export function readDraft(key: string): Draft | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const d = JSON.parse(raw) as Draft;
    return d && d.v === 1 && typeof d.zones === 'object' ? d : null;
  } catch {
    return null;
  }
}

export function writeDraft(key: string, d: Draft | null): void {
  try {
    if (d) localStorage.setItem(key, JSON.stringify(d));
    else localStorage.removeItem(key);
  } catch {
    // No storage: the editor still works, it just cannot recover after a reload.
  }
}

/** Mirrors the unsaved state into the draft after each change (at most every 400 ms). `sync()` writes now: call it after a save. */
export function installDraft(ctx: EditorContext): { sync(): void } {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const sync = (): void => {
    clearTimeout(timer);
    writeDraft(draftKey(ctx), buildDraft(ctx));
  };
  ctx.events.changed.on(() => {
    clearTimeout(timer);
    timer = setTimeout(sync, 400);
  });
  return { sync };
}
