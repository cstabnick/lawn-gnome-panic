// Pebblewick's static town plan: every piece inside the town, colliders off the walking lanes, no two solid pieces
// overlapping, and only Pebblewick's own (not yet drawn) prefabs missing from the catalogue.
import { describe, expect, it } from 'vitest';
import { installFakeDom } from '../testing/fakeDom';
import type { Box } from '../types';

installFakeDom();
const { planTown } = await import('./build');
const { LANES, TOWN, TOWN_PIECES } = await import('./town');

const plan = planTown();
const boxes: Box[] = plan.boxes;
const ids: string[] = plan.boxIds;

const isFence = (id: string): boolean => id.startsWith('fence:');
/** Strict overlap in plan view (touching edges do not count). */
const overlapsXZ = (a: Box, b: Box): boolean =>
  a.minX < b.maxX && b.minX < a.maxX && a.minZ < b.maxZ && b.minZ < a.maxZ;

describe('Pebblewick town plan', () => {
  it('is deterministic', () => {
    const again = planTown();
    expect(again.boxes).toEqual(boxes);
    expect(again.boxIds).toEqual(ids);
    expect(again.placements).toEqual(plan.placements);
  });

  it('keeps every box of every piece inside the town rect (except the old combine)', () => {
    const r = TOWN.rect;
    const outside = boxes
      .map((b, i) => ({ b, id: ids[i] }))
      .filter(({ b, id }) => id !== 'old-combine')
      .filter(({ b }) => b.minX < r.minX || b.maxX > r.maxX || b.minZ < r.minZ || b.maxZ > r.maxZ)
      .map(({ id }) => id);
    expect(outside).toEqual([]);
  });

  it('keeps every collider off the walking lanes', () => {
    const shrink = (r: { minX: number; maxX: number; minZ: number; maxZ: number }): Box => ({
      minX: r.minX + 0.05, maxX: r.maxX - 0.05, minZ: r.minZ + 0.05, maxZ: r.maxZ - 0.05, h: 0,
    });
    const lanes = [shrink(LANES.main), shrink(LANES.cross)];
    const hits: string[] = [];
    boxes.forEach((b, i) => {
      for (const lane of lanes) if (overlapsXZ(b, lane)) hits.push(`${ids[i]} in lane`);
    });
    expect(hits).toEqual([]);
  });

  it('has no two colliders of different non-fence pieces overlapping', () => {
    const overlaps: string[] = [];
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        if (ids[i] === ids[j]) continue;
        if (isFence(ids[i]) && isFence(ids[j])) continue;
        if (overlapsXZ(boxes[i], boxes[j])) overlaps.push(`${ids[i]} overlaps ${ids[j]}`);
      }
    }
    expect(overlaps).toEqual([]);
  });

  it('reports only Pebblewick prefabs as missing', () => {
    const notTown = plan.missing.filter((id) => !id.startsWith('pebblewick-'));
    expect(notTown).toEqual([]);
  });

  it('places every non-missing piece', () => {
    const known = TOWN_PIECES.filter((p) => !plan.missing.includes(p.prefab));
    expect(plan.placements.length + plan.landmarks.length).toBeGreaterThanOrEqual(known.length);
  });
});
