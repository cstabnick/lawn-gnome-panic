// Read-only questions about the editor, answered as plain JSON-safe data (see types.ts). No DOM, no three.js objects returned.
import type { CollectionDef, EditorContext, FieldDef, Item, MutableZone } from '../context';
import { findPath3 } from '@gnomomia/pathfind';
import { computeReachability } from '@gnomomia/reach';
import { allPrefabs } from '@lawn/prefabs';
import { searchPrefabs, type PrefabLite } from '../prefabSearch';
import type { CollectionInfo, EditorState, ItemRef, ItemView, PathResult, Probe, ReachResultView } from './types';

// Same tolerances and budget as the Analyze tool's own path and reachability checks (tools/analyze.ts).
const REACHED_TOL = 1.5;
const PATH_EXPAND = 60000;

function collectionOf(ctx: EditorContext, id: string): CollectionDef {
  const c = ctx.adapter.collections.find((x) => x.id === id);
  if (!c) throw new Error(`No collection "${id}" in ${ctx.adapter.id}`);
  return c;
}

/** The collection's live array in the current zone (the same array the Select tool edits). */
function liveItems(ctx: EditorContext, c: CollectionDef): Item[] {
  return c.items(ctx.zones[ctx.zone] as unknown as MutableZone);
}

function accepted(c: CollectionDef, item: Item): boolean {
  return c.accepts ? c.accepts(item) : true;
}

function acceptedCount(ctx: EditorContext, c: CollectionDef): number {
  return liveItems(ctx, c).filter((item) => accepted(c, item)).length;
}

/** Locates one item: `index` into the live array (which must be an accepted item), or the first accepted item with that `id`. */
function resolve(ctx: EditorContext, ref: ItemRef): { c: CollectionDef; index: number; item: Item } {
  const c = collectionOf(ctx, ref.collection);
  const live = liveItems(ctx, c);
  if ('index' in ref) {
    const item = live[ref.index];
    if (!Number.isInteger(ref.index) || item === undefined || !accepted(c, item)) {
      throw new Error(`No ${c.label} at index ${ref.index}`);
    }
    return { c, index: ref.index, item };
  }
  const index = live.findIndex((it) => accepted(c, it) && it.id === ref.id);
  if (index < 0) throw new Error(`No ${c.label} with id "${ref.id}"`);
  return { c, index, item: live[index] };
}

function jsonSafe(v: unknown): unknown {
  const s = JSON.stringify(v ?? null);
  return s === undefined ? null : JSON.parse(s);
}

function fieldValue(f: FieldDef, item: Item): unknown {
  return jsonSafe(f.get ? f.get(item) : item[f.key]);
}

function view(c: CollectionDef, item: Item, index: number): ItemView {
  const v: ItemView = { collection: c.id, index, x: item.x, z: item.z, fields: {} };
  if (typeof item.id === 'string') v.id = item.id;
  const named = [item.name, item.label, item.id, item.prefab].find((n) => n !== undefined);
  if (named !== undefined) v.name = String(named);
  for (const f of c.fields) v.fields[f.key] = fieldValue(f, item);
  return v;
}

function collectionInfo(ctx: EditorContext, c: CollectionDef): CollectionInfo {
  const info: CollectionInfo = {
    id: c.id,
    label: c.label,
    fixed: !!c.fixed,
    count: acceptedCount(ctx, c),
    fields: c.fields.map((f) => {
      const out: CollectionInfo['fields'][number] = { key: f.key, label: f.label, type: f.type };
      if (f.type === 'enum') out.options = [...f.options];
      return out;
    }),
  };
  return info;
}

export function editorState(ctx: EditorContext): EditorState {
  const sel = ctx.selection;
  return {
    game: ctx.adapter.id,
    zone: ctx.zone,
    levels: ctx.adapter.levels().map((l) => ({ id: l.id, name: l.name })),
    loaded: [...ctx.outdoorZones],
    selection: sel ? { collection: sel.collection, index: sel.index } : null,
    dirty: { zones: [...ctx.dirty.zones], deltas: ctx.dirty.deltas, paint: ctx.dirty.paint },
    staleWalkAreas: ctx.dirty.walkRects.length,
    undo: ctx.history.nextUndo,
    canRedo: ctx.history.canRedo,
    snap: ctx.snap,
    gatesOpen: ctx.gatesOpen,
    tools: [...ctx.adapter.tools],
    collections: ctx.adapter.collections.map((c) => collectionInfo(ctx, c)),
  };
}

/** Items of the current zone: one collection, or every collection when `collection` is omitted. Respects CollectionDef.accepts. */
export function listItems(ctx: EditorContext, collection?: string): ItemView[] {
  const cols = collection === undefined ? ctx.adapter.collections : [collectionOf(ctx, collection)];
  const out: ItemView[] = [];
  for (const c of cols) {
    liveItems(ctx, c).forEach((item, index) => {
      if (accepted(c, item)) out.push(view(c, item, index));
    });
  }
  return out;
}

export function getItem(ctx: EditorContext, ref: ItemRef): ItemView {
  const { c, index, item } = resolve(ctx, ref);
  return view(c, item, index);
}

/** What is at (x, z): height, zone, region, paint, blocked, and the current zone's items within `radius` (default 5 m). */
export function probe(ctx: EditorContext, x: number, z: number, radius = 5): Probe {
  const t = ctx.terrain;
  const near: Probe['near'] = [];
  for (const c of ctx.adapter.collections) {
    liveItems(ctx, c).forEach((item, index) => {
      if (!accepted(c, item)) return;
      const distance = Math.round(Math.hypot(item.x - x, item.z - z) * 100) / 100;
      if (Math.hypot(item.x - x, item.z - z) > radius) return;
      const v = view(c, item, index);
      const entry: Probe['near'][number] = { collection: v.collection, index: v.index, distance };
      if (v.id !== undefined) entry.id = v.id;
      if (v.name !== undefined) entry.name = v.name;
      near.push(entry);
    });
  }
  near.sort((a, b) => a.distance - b.distance);
  return {
    x,
    z,
    y: t.heightAt(x, z),
    zone: t.zoneAt(x, z) ?? null,
    region: t.regionNameAt(x, z),
    paint: ctx.paint.at(x, z),
    blocked: t.isBlocked(x, z),
    near,
  };
}

/** The game's own click-to-move path (findPath3) between two ground points. */
export function pathBetween(ctx: EditorContext, a: { x: number; z: number }, b: { x: number; z: number }): PathResult {
  const t = ctx.terrain;
  const start = { x: a.x, y: t.heightAt(a.x, a.z), z: a.z };
  const end = { x: b.x, y: t.heightAt(b.x, b.z), z: b.z };
  const wps = findPath3(start, end, (x, z, fromY) => t.standY(x, z, fromY), PATH_EXPAND);
  if (wps.length === 0) return { reached: false, length: 0, waypoints: [] };
  const pts = [start, ...wps];
  let length = 0;
  for (let i = 1; i < pts.length; i++) {
    length += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y, pts[i].z - pts[i - 1].z);
  }
  const last = wps[wps.length - 1];
  return {
    reached: Math.hypot(last.x - b.x, last.z - b.z) <= REACHED_TOL,
    length,
    waypoints: wps.map((p) => ({ x: p.x, y: p.y, z: p.z })),
  };
}

/** Reachability from the current zone's spawn. Throws for games without the Analyze tool. */
export function reachability(ctx: EditorContext): ReachResultView[] {
  if (!ctx.adapter.tools.includes('analyze')) throw new Error(`${ctx.adapter.label} has no reachability`);
  return computeReachability(ctx.terrain, ctx.zones[ctx.zone]).results.map((r) => ({
    kind: r.kind,
    id: r.id,
    label: r.label,
    x: r.x,
    z: r.z,
    reachable: r.reachable,
  }));
}

/** Prefabs matching `query`, best first. */
export function prefabCatalog(query: string, limit = 20): { id: string; name: string; category: string }[] {
  const all: PrefabLite[] = allPrefabs().map((p) => ({ id: p.id, name: p.name, category: p.category, tags: p.tags, emoji: p.emoji }));
  return searchPrefabs(all, query, 'all', limit).map((p) => ({ id: p.id, name: p.name, category: p.category }));
}
