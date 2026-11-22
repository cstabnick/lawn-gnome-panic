import { describe, expect, it } from 'vitest';
import { gnomomiaAdapter } from '../adapters/gnomomia';
import { snigmsAdapter } from '../adapters/snigms';
import { createContext } from '../state';
import { createWorld } from '../world';
import { editorState, getItem, listItems, pathBetween, prefabCatalog, probe, reachability } from './queries';

function makeCtx() {
  const ctx = createContext(createWorld(), gnomomiaAdapter);
  ctx.viewport = { refresh() {}, focus() {} } as never;
  return ctx;
}

describe('queries', () => {
  it('editorState describes the game and survives a JSON round trip', () => {
    const ctx = makeCtx();
    const s = editorState(ctx);
    expect(s.game).toBe('gnomomia');
    expect(s.collections.map((c) => c.id)).toContain('props');
    expect(JSON.parse(JSON.stringify(s))).toEqual(s);
  });

  it('listItems covers one collection, and every collection when none is named', () => {
    const ctx = makeCtx();
    expect(listItems(ctx, 'spawn')).toHaveLength(1);
    const all = listItems(ctx);
    const counted = editorState(ctx).collections.filter((c) => c.count > 0).map((c) => c.id);
    expect([...new Set(all.map((i) => i.collection))].sort()).toEqual([...counted].sort());
  });

  it('getItem throws for a bad index and returns a view for a good one', () => {
    const ctx = makeCtx();
    expect(() => getItem(ctx, { collection: 'spawn', index: 5 })).toThrow('No Spawn at index');
    const v = getItem(ctx, { collection: 'spawn', index: 0 });
    expect(v.collection).toBe('spawn');
    expect(JSON.parse(JSON.stringify(v))).toEqual(v);
  });

  it('probe reports ground, zone and nearby items', () => {
    const ctx = makeCtx();
    const spawn = ctx.zones[ctx.zone].spawn as unknown as { x: number; z: number };
    const p = probe(ctx, spawn.x, spawn.z);
    expect(Number.isFinite(p.y)).toBe(true);
    expect(p.zone).toBe(ctx.zone);
    expect(p.near.some((n) => n.collection === 'spawn')).toBe(true);
  });

  it('pathBetween reaches a point 3 m east of the spawn', () => {
    const ctx = makeCtx();
    const spawn = ctx.zones[ctx.zone].spawn as unknown as { x: number; z: number };
    const r = pathBetween(ctx, spawn, { x: spawn.x + 3, z: spawn.z });
    expect(r.reached).toBe(true);
  });

  it('reachability returns results including the spawn', () => {
    const ctx = makeCtx();
    const r = reachability(ctx);
    expect(Array.isArray(r)).toBe(true);
    expect(r.some((x) => x.kind === 'spawn')).toBe(true);
  });

  it('prefabCatalog returns at most 20 entries', () => {
    const r = prefabCatalog('bird');
    expect(r.length).toBeLessThanOrEqual(20);
  });

  it('reachability throws for Snigms, which has no Analyze tool', () => {
    const ctx = createContext(snigmsAdapter.createWorld('town'), snigmsAdapter);
    expect(() => reachability(ctx)).toThrow();
  });
});
