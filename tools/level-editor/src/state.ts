// The editor's shared state: the context every module receives. Owns undo/redo bookkeeping, dirty tracking and the one
// supported way to change zone data (editZone) or the brush raster (commitDeltas).
import type { DeltaPatch, Rect } from '@lawn/level';
import { WORLD, type ZoneDef, type ZoneId } from '@gnomomia/config';
import type { ChangeEvent, Dirty, EditorContext, MutableZone, Selection, StatusKind } from './context';
import { createEmitter, createHistory } from './history';
import type { World } from './world';

export const EDITABLE = ['regions', 'lakes', 'houses', 'decks', 'stamps', 'paths', 'props', 'spawn', 'shrine', 'exits'] as const;
export type Snapshot = Record<(typeof EDITABLE)[number], unknown>;

export function snapshot(def: MutableZone): Snapshot {
  const s = {} as Snapshot;
  for (const k of EDITABLE) s[k] = def[k] === undefined ? undefined : structuredClone(def[k]);
  return s;
}

export function restore(def: MutableZone, s: Snapshot): void {
  const d = def as unknown as Record<string, unknown>;
  for (const k of EDITABLE) d[k] = s[k] === undefined ? undefined : structuredClone(s[k]);
}

/** The box a zone can change: its square plus the blend margin round it. */
export function zoneRect(def: ZoneDef): Rect {
  const o = def.origin ?? { x: 0, z: 0 };
  const h = def.half + WORLD.blend;
  return { minX: o.x - h, maxX: o.x + h, minZ: o.z - h, maxZ: o.z + h };
}

export function createContext(world: World): EditorContext {
  const history = createHistory();
  const dirty: Dirty = { zones: new Set(), deltas: false, walkRects: [] };
  const events = {
    changed: createEmitter<ChangeEvent>(),
    selection: createEmitter<Selection>(),
    zone: createEmitter<ZoneId>(),
    status: createEmitter<{ msg: string; kind: StatusKind }>(),
  };
  let zone: ZoneId = world.outdoorZones[0];
  let selection: Selection = null;
  let snap = 0;

  const ctx: EditorContext = {
    terrain: world.terrain,
    zones: world.zones,
    outdoorZones: world.outdoorZones,
    deltas: world.deltas,
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
      const before = snapshot(def);
      fn(def);
      const after = snapshot(def);
      // Moving an exit moves the road to the zone on the other end, so that zone's ridge cut, flora and walk tile go stale too.
      const touched = (): Rect[] => {
        const rects = [zoneRect(world.zones[id])];
        for (const snap of [before, after]) {
          for (const e of (snap.exits as { to: string; door?: boolean }[] | undefined) ?? []) {
            const other = world.zones[e.to as ZoneId];
            if (other && !other.indoor && e.to !== id && !e.door) rects.push(zoneRect(other));
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
        undo() { restore(def, before); apply(); },
        redo() { restore(def, after); apply(); },
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
