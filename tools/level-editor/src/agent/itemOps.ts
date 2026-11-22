// Every change Select makes to an item, as functions of the context: the Select tool's clicks and keys call these, and so does
// the agent API (window.le). Each call is exactly one undo step (one ctx.editZone). Pure apart from ctx: no DOM.
import { prefabFootprint } from '@lawn/prefabs';
import type { CollectionDef, EditorContext, FieldDef, Item, MutableZone } from '../context';
import type { ItemRef } from './types';

/** The position fields every collection has, as the Select panel shows them. */
const POSITION: readonly FieldDef[] = [
  { key: 'x', label: 'X', type: 'number', step: 0.1 },
  { key: 'z', label: 'Z', type: 'number', step: 0.1 },
];

function collectionOf(ctx: EditorContext, id: string): CollectionDef {
  const c = ctx.adapter.collections.find((x) => x.id === id);
  if (!c) throw new Error(`No collection "${id}" in ${ctx.adapter.id}`);
  return c;
}

function zoneDef(ctx: EditorContext): MutableZone {
  return ctx.zones[ctx.zone] as MutableZone;
}

/** The FieldDef for a key of a collection (x / z always exist). Throws before anything changes. */
function fieldFor(c: CollectionDef, key: string): FieldDef {
  const f = c.fields.find((x) => x.key === key) ?? POSITION.find((x) => x.key === key);
  if (!f) throw new Error(`${c.label} has no field "${key}"`);
  return f;
}

/** The live index an ItemRef points at in the current zone. Throws a readable Error when the collection or item is missing. */
export function resolveRef(ctx: EditorContext, ref: ItemRef): number {
  const c = collectionOf(ctx, ref.collection);
  const items = c.items(zoneDef(ctx));
  const accepted = (item: Item | undefined): item is Item => item !== undefined && (!c.accepts || c.accepts(item));
  if ('index' in ref) {
    const item = Number.isInteger(ref.index) ? items[ref.index] : undefined;
    if (!accepted(item)) throw new Error(`No ${c.label} at index ${ref.index}`);
    return ref.index;
  }
  const i = items.findIndex((item) => accepted(item) && item.id === ref.id);
  if (i < 0) throw new Error(`No ${c.label} with id "${ref.id}"`);
  return i;
}

/** Adds an item at (x, z) (rounded with ctx.round), then applies `fields` in the same undo step. Returns its index. */
export function addItem(ctx: EditorContext, collection: string, x: number, z: number, fields?: Record<string, unknown>, label?: string): number {
  const c = collectionOf(ctx, collection);
  if (c.fixed) throw new Error(`${c.label} cannot be added`);
  const entries = Object.entries(fields ?? {}).map(([key, value]) => ({ f: fieldFor(c, key), key, value }));
  ctx.editZone(label ?? `Add ${c.label}`, ctx.zone, (def) => {
    const y = ctx.terrain.heightAt(x, z);
    const item = c.makeIn ? c.makeIn(def, ctx.round(x), ctx.round(z), y) : c.make(ctx.round(x), ctx.round(z), y);
    c.items(def).push(item);
    for (const { f, key, value } of entries) {
      if (f.set) f.set(item, value);
      else item[key] = value;
    }
  });
  return c.items(zoneDef(ctx)).length - 1;
}

/** Moves an item to (x, z) (rounded with ctx.round); its followers move by the same amount. */
export function moveItem(ctx: EditorContext, ref: ItemRef, x: number, z: number, label?: string): void {
  const c = collectionOf(ctx, ref.collection);
  const index = resolveRef(ctx, ref);
  ctx.editZone(label ?? `Move ${c.label}`, ctx.zone, (def) => {
    const it = c.items(def)[index];
    // Followers are read before the item moves: their delta is measured from where the item is now.
    const followers = c.follows?.(def, it) ?? [];
    const nx = ctx.round(x);
    const nz = ctx.round(z);
    const dx = nx - it.x;
    const dz = nz - it.z;
    it.x = nx;
    it.z = nz;
    for (const f of followers) {
      f.x = Math.round((f.x + dx) * 100) / 100;
      f.z = Math.round((f.z + dz) * 100) / 100;
    }
  });
}

/** Moves an item by (dx, dz), followers too, rounded to 0.01 m. */
export function nudgeItem(ctx: EditorContext, ref: ItemRef, dx: number, dz: number, label?: string): void {
  const c = collectionOf(ctx, ref.collection);
  const index = resolveRef(ctx, ref);
  ctx.editZone(label ?? `Nudge ${c.label}`, ctx.zone, (def) => {
    const it = c.items(def)[index];
    it.x = Math.round((it.x + dx) * 100) / 100;
    it.z = Math.round((it.z + dz) * 100) / 100;
    for (const f of c.follows?.(def, it) ?? []) {
      f.x = Math.round((f.x + dx) * 100) / 100;
      f.z = Math.round((f.z + dz) * 100) / 100;
    }
  });
}

/** Sets one field (by FieldDef.key) through the field's set() when it has one. A prop's solidR follows a prefab change. */
export function setField(ctx: EditorContext, ref: ItemRef, key: string, value: unknown, label?: string): void {
  const c = collectionOf(ctx, ref.collection);
  const f = fieldFor(c, key);
  const index = resolveRef(ctx, ref);
  ctx.editZone(label ?? `Edit ${c.label} ${f.label}`, ctx.zone, (def) => {
    const it = c.items(def)[index];
    const prev = f.get ? f.get(it) : it[f.key];
    if (f.set) f.set(it, value);
    else it[f.key] = value;
    // A prop's solid radius follows its prefab's footprint (x its scale) unless somebody set it by hand.
    if (f.type === 'prefab' && c.id === 'props') {
      const scale = Number(it.scale ?? 1);
      const round = (v: number): number => Math.round(v * scale * 100) / 100;
      const oldDefault = round(prefabFootprint(String(prev))?.r ?? 0);
      const cur = Number(it.solidR ?? 0);
      if (cur === 0 || Math.abs(cur - oldDefault) < 1e-6) it.solidR = round(prefabFootprint(String(value))?.r ?? 0);
    }
  });
}

/** Turns an item with a numeric `yaw` or `rot` by `da` radians (kept in -pi..pi, rounded to 0.01). Returns false if it has neither. */
export function rotateItem(ctx: EditorContext, ref: ItemRef, da: number, label?: string): boolean {
  const c = collectionOf(ctx, ref.collection);
  const index = resolveRef(ctx, ref);
  const probe = c.items(zoneDef(ctx))[index];
  const key = typeof probe.yaw === 'number' ? 'yaw' : typeof probe.rot === 'number' ? 'rot' : null;
  if (key === null) return false;
  ctx.editZone(label ?? `Rotate ${c.label}`, ctx.zone, (def) => {
    const it = c.items(def)[index];
    let a = Number(it[key]) + da;
    while (a > Math.PI) a -= 2 * Math.PI;
    while (a < -Math.PI) a += 2 * Math.PI;
    it[key] = Math.round(a * 100) / 100;
  });
  return true;
}

/** Deletes an item. Throws (readable message) when the collection is fixed or deleteBlocked gives a reason. Clears the selection if it pointed at it. */
export function deleteItem(ctx: EditorContext, ref: ItemRef, label?: string): void {
  const c = collectionOf(ctx, ref.collection);
  if (c.fixed) throw new Error(`${c.label} cannot be deleted`);
  const index = resolveRef(ctx, ref);
  const blocked = c.deleteBlocked?.(zoneDef(ctx), index);
  if (typeof blocked === 'string') throw new Error(blocked);
  ctx.editZone(label ?? `Delete ${c.label}`, ctx.zone, (def) => {
    c.items(def).splice(index, 1);
  });
  const sel = ctx.selection;
  if (sel !== null && sel.collection === c.id && sel.index === index) ctx.select(null);
}

/** Copies an item two metres away (+2, +2), with its own id when it has one. Throws for fixed collections. Returns the copy's index. */
export function duplicateItem(ctx: EditorContext, ref: ItemRef, label?: string): number {
  const c = collectionOf(ctx, ref.collection);
  if (c.fixed) throw new Error(`${c.label} cannot be duplicated`);
  const index = resolveRef(ctx, ref);
  ctx.editZone(label ?? `Duplicate ${c.label}`, ctx.zone, (def) => {
    const src = c.items(def)[index];
    const copy = structuredClone(src) as Item;
    copy.x = ctx.round(src.x + 2);
    copy.z = ctx.round(src.z + 2);
    const suffix = Math.random().toString(36).slice(2, 7);
    if (typeof copy.id === 'string') copy.id = `${copy.id.replace(/-[a-z0-9]{5}$/, '')}-${suffix}`;
    // A house with no id is numbered by its place in the list; its copy gets a stable id of its own.
    else if (c.id === 'houses') copy.id = `house-${suffix}`;
    c.items(def).push(copy);
  });
  return c.items(zoneDef(ctx)).length - 1;
}
