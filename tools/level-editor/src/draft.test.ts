import { DeltaGrid } from '@lawn/level';
import { describe, expect, it } from 'vitest';
import { buildDraft, applyDraft, pruneDraft, type Draft } from './draft';
import type { MarkerKnown } from './markerCheck';
import { gnomomiaAdapter } from './adapters/gnomomia';
import { createContext } from './state';
import { createWorld } from './world';

function makeCtx() {
  const ctx = createContext(createWorld(), gnomomiaAdapter);
  ctx.viewport = { refresh() {} } as never;
  return ctx;
}

describe('draft', () => {
  it('is null when nothing is unsaved', () => {
    expect(buildDraft(makeCtx())).toBeNull();
  });

  it('round-trips a zone edit and a brush stroke through JSON', () => {
    const ctx = makeCtx();
    const houses = ctx.zones.mossbottom.houses.length;
    ctx.editZone('Add house', 'mossbottom', (d) => { d.houses.push({ x: 5, z: 6, r: 3, yaw: 0, style: 'log', id: 'house-test' }); });
    ctx.commitDeltas('Brush', { ix: [3], iz: [4], before: [0], after: [250] }, { minX: 2, maxX: 6, minZ: 3, maxZ: 7 }, false);
    const draft = JSON.parse(JSON.stringify(buildDraft(ctx)));
    expect(Object.keys(draft.zones)).toEqual(['mossbottom']);
    expect(draft.deltas).not.toBeNull();

    // Lose the edits (as a reload would), then recover them from the draft.
    ctx.history.undo();
    ctx.history.undo();
    expect(ctx.zones.mossbottom.houses.length).toBe(houses);
    expect(ctx.deltas.getUnits(3, 4)).toBe(0);
    ctx.dirty.zones.clear();
    ctx.dirty.deltas = false;

    applyDraft(ctx, draft);
    expect(ctx.zones.mossbottom.houses.length).toBe(houses + 1);
    expect(ctx.zones.mossbottom.houses.at(-1)?.id).toBe('house-test');
    expect(ctx.deltas.getUnits(3, 4)).toBe(250);
    expect(ctx.dirty.zones.has('mossbottom')).toBe(true);
    expect(ctx.dirty.deltas).toBe(true);
    // Leave the shared world as we found it.
    (ctx.zones.mossbottom.houses as unknown as unknown[]).pop();
    ctx.deltas.copyFrom(new DeltaGrid());
  });

  it('prunes object and spawn markers the packs no longer know, keeping other kinds', () => {
    const known: MarkerKnown = { object: (id) => id === 'ok-object', spawn: () => false };
    const markers = [
      { kind: 'object', id: 'ok-object', x: 1, z: 2 },
      { kind: 'object', id: 'gone-object', x: 3, z: 4 },
      { kind: 'spawn', id: 'gone-spawn', x: 5, z: 6 },
      { kind: 'sign', id: 'any-sign', x: 7, z: 8 },
    ] as never;
    const d: Draft = { v: 1, at: 0, zones: { mossbottom: { markers } }, deltas: null };
    const before = JSON.stringify(d);
    const { draft, dropped } = pruneDraft(d, known);
    expect(dropped).toEqual(['object "gone-object" in mossbottom', 'spawn "gone-spawn" in mossbottom']);
    expect((draft.zones.mossbottom.markers as unknown as { id: string }[]).map((m) => m.id)).toEqual(['ok-object', 'any-sign']);
    expect(JSON.stringify(d)).toBe(before);
  });

  it('returns no drops for a draft without markers', () => {
    const d: Draft = { v: 1, at: 0, zones: { mossbottom: { houses: [] } }, deltas: null };
    const { draft, dropped } = pruneDraft(d, { object: () => false, spawn: () => false });
    expect(dropped).toEqual([]);
    expect(draft.zones.mossbottom).toEqual({ houses: [] });
  });
});
