import { describe, expect, it } from 'vitest';
import { gnomomiaAdapter } from '../adapters/gnomomia';
import type { CollectionDef, EditorContext, MutableZone } from '../context';
import { createContext } from '../state';
import { createWorld } from '../world';
import { addItem, deleteItem, duplicateItem, moveItem, resolveRef, setField } from './itemOps';

function makeCtx(): EditorContext {
  const ctx = createContext(createWorld(), gnomomiaAdapter);
  ctx.viewport = { refresh() {}, focus() {} } as never;
  return ctx;
}

function col(ctx: EditorContext, id: string): CollectionDef {
  const c = ctx.adapter.collections.find((x) => x.id === id);
  if (!c) throw new Error(`no ${id}`);
  return c;
}

/** The current zone, typed the way the editor's collections read it. */
function zoneOf(ctx: EditorContext): MutableZone {
  return ctx.zones[ctx.zone] as MutableZone;
}

describe('itemOps', () => {
  it('addItem adds one prop in one undo step', () => {
    const ctx = makeCtx();
    const props = col(ctx, 'props');
    const zone = zoneOf(ctx);
    const before = props.items(zone).length;
    const prefab = props.items(zone)[0]?.prefab ?? 'birdbath';
    const index = addItem(ctx, 'props', 3, 4, { prefab: String(prefab) });
    expect(props.items(zone).length).toBe(before + 1);
    expect(index).toBe(before);
    ctx.history.undo();
    expect(props.items(zone).length).toBe(before);
    expect(ctx.history.canUndo).toBe(false);
  });

  it('moveItem moves by index and by id', () => {
    const ctx = makeCtx();
    const houses = col(ctx, 'houses');
    const zone = zoneOf(ctx);
    const i = addItem(ctx, 'houses', 10, 10, { id: 'house-test' });
    moveItem(ctx, { collection: 'houses', id: 'house-test' }, 20, 30);
    expect(houses.items(zone)[i]).toMatchObject({ x: 20, z: 30 });
    moveItem(ctx, { collection: 'houses', index: i }, 21, 31);
    expect(houses.items(zone)[i]).toMatchObject({ x: 21, z: 31 });
  });

  it('setField with an unknown key throws and records no undo step', () => {
    const ctx = makeCtx();
    const before = ctx.history.canUndo;
    expect(() => setField(ctx, { collection: 'houses', index: 0 }, 'nope', 1)).toThrow('has no field "nope"');
    expect(ctx.history.canUndo).toBe(before);
  });

  it('deleteItem refuses a fixed collection', () => {
    const ctx = makeCtx();
    expect(() => deleteItem(ctx, { collection: 'spawn', index: 0 })).toThrow('cannot be deleted');
  });

  it('duplicateItem returns the copy index', () => {
    const ctx = makeCtx();
    const i = addItem(ctx, 'houses', 10, 10, { id: 'house-test' });
    const j = duplicateItem(ctx, { collection: 'houses', index: i });
    expect(j).toBe(i + 1);
    const copy = col(ctx, 'houses').items(zoneOf(ctx))[j];
    expect(String(copy.id).startsWith('house-test')).toBe(true);
    expect(copy.id).not.toBe('house-test');
  });

  it('resolveRef errors read as specified', () => {
    const ctx = makeCtx();
    expect(() => resolveRef(ctx, { collection: 'nope', index: 0 })).toThrow('No collection "nope" in gnomomia');
    expect(() => resolveRef(ctx, { collection: 'spawn', index: 5 })).toThrow('No Spawn at index 5');
    expect(() => resolveRef(ctx, { collection: 'houses', id: 'missing' })).toThrow('No House with id "missing"');
  });
});
