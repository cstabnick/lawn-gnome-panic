import { DeltaGrid } from '@lawn/level';
import { describe, expect, it } from 'vitest';
import { buildDraft, applyDraft } from './draft';
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
});
