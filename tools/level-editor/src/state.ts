// The editor's shared state: the context every module receives. Owns undo/redo bookkeeping, dirty tracking and the one
// supported way to change zone data (editZone) or the brush raster (commitDeltas).
import type { DeltaPatch, Rect } from '@lawn/level';
import { WORLD, type ZoneDef, type ZoneId } from '@gnomomia/config';
import type { ChangeEvent, Dirty, EditorContext, MutableZone, Selection, StatusKind } from './context';
import { createEmitter, createHistory } from './history';
import type { GameAdapter, World } from './context';

/** The fields of a level a game lets the editor change (GameAdapter.editableKeys), copied for undo and for draft recovery. */
export type Snapshot = Record<string, unknown>;

export function snapshot(def: MutableZone, keys: readonly string[]): Snapshot {
  const s: Snapshot = {};
  const d = def as unknown as Record<string, unknown>;
  for (const k of keys) s[k] = d[k] === undefined ? undefined : structuredClone(d[k]);
  return s;
}

export function restore(def: MutableZone, s: Snapshot, keys: readonly string[]): void {
  const d = def as unknown as Record<string, unknown>;
  for (const k of keys) d[k] = s[k] === undefined ? undefined : structuredClone(s[k]);
}

/** Gnomomia's box a zone can change: its square plus the blend margin round it. (Other games bring their own.) */
export function zoneRect(def: ZoneDef): Rect {
  const o = def.origin ?? { x: 0, z: 0 };
  const h = def.half + WORLD.blend;
  return { minX: o.x - h, maxX: o.x + h, minZ: o.z - h, maxZ: o.z + h };
}

export function createContext(world: World, adapter: GameAdapter): EditorContext {
  const history = createHistory();
  const dirty: Dirty = { zones: new Set(), deltas: false, paint: false, walkRects: [] };
  const events = {
    changed: createEmitter<ChangeEvent>(),
    selection: createEmitter<Selection>(),
    zone: createEmitter<ZoneId>(),
    status: createEmitter<{ msg: string; kind: StatusKind }>(),
  };
  let zone: ZoneId = world.outdoorZones[0];
  let selection: Selection = null;
  let snap = 0;

  const keys = adapter.editableKeys;
  const ctx: EditorContext = {
    adapter,
    terrain: world.terrain,
    zones: world.zones,
    outdoorZones: world.outdoorZones,
    deltas: world.deltas,
    paint: world.terrain.paint,
    // main.ts assigns the real viewport before any tool is mounted.
    viewport: undefined as never,
    history,
    dirty,
    events,
    get zone() { return zone; },
    setZone(id) {
      if (id === zone) return;
      zone = id;
      selection = null;
      events.selection.emit(null);
      events.zone.emit(id);
    },
    get selection() { return selection; },
    select(sel) {
      selection = sel;
      events.selection.emit(sel);
    },
    get gatesOpen() { return world.gatesOpen; },
    setGatesOpen(open) {
      world.setGatesOpen(open);
      events.changed.emit({ rect: null, kind: 'load' });
    },
    editZone(label, id, fn) {
      const def = world.zones[id] as unknown as MutableZone;
      const before = snapshot(def, keys);
      fn(def);
      const after = snapshot(def, keys);
      // Moving an exit moves the road to the zone on the other end, so that zone's ridge cut, flora and walk tile go stale too.
      const touched = (): Rect[] => {
        const rects = [adapter.zoneRect(world.zones[id])];
        for (const snap of [before, after]) {
          for (const e of (snap.exits as { to: string; door?: boolean }[] | undefined) ?? []) {
            const other = world.zones[e.to as ZoneId];
            if (other && !other.indoor && e.to !== id && !e.door) rects.push(adapter.zoneRect(other));
          }
        }
        return rects;
      };
      const apply = (): void => {
        const rects = touched();
        dirty.zones.add(id);
        for (const rect of rects) {
          dirty.walkRects.push(rect);
          world.terrain.invalidate(rect);
          ctx.viewport.refresh(rect);
        }
        events.changed.emit({ rect: rects[0], kind: 'zone' });
      };
      apply();
      history.push({
        label,
        undo() { restore(def, before, keys); apply(); },
        redo() { restore(def, after, keys); apply(); },
      });
    },
    commitDeltas(label, patch: DeltaPatch, rect, applied) {
      if (patch.ix.length === 0) return;
      const apply = (): void => {
        dirty.deltas = true;
        dirty.walkRects.push(rect);
        world.terrain.invalidate(rect);
        ctx.viewport.refresh(rect);
        events.changed.emit({ rect, kind: 'deltas' });
      };
      if (!applied) world.deltas.applyPatch(patch);
      apply();
      history.push({
        label,
        undo() { world.deltas.applyPatch(patch, true); apply(); },
        redo() { world.deltas.applyPatch(patch); apply(); },
      });
    },
    commitPaint(label, patch, rect, applied) {
      if (patch.ix.length === 0) return;
      const apply = (): void => {
        dirty.paint = true;
        dirty.walkRects.push(rect);
        world.terrain.invalidate(rect);
        ctx.viewport.refresh(rect);
        events.changed.emit({ rect, kind: 'paint' });
      };
      if (!applied) world.terrain.paint.applyPatch(patch);
      apply();
      history.push({
        label,
        undo() { world.terrain.paint.applyPatch(patch, true); apply(); },
        redo() { world.terrain.paint.applyPatch(patch); apply(); },
      });
    },
    touch(rect) {
      world.terrain.invalidate(rect);
      ctx.viewport.refresh(rect);
      events.changed.emit({ rect, kind: 'deltas' });
    },
    status(msg, kind = 'info') {
      events.status.emit({ msg, kind });
    },
    get snap() { return snap; },
    set snap(v: number) { snap = v; },
    round(v) { return snap > 0 ? Math.round(v / snap) * snap : Math.round(v * 10) / 10; },
  };
  return ctx;
}
