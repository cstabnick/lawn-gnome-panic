import { describe, expect, it } from 'vitest';
import { LEVEL_ORDER, LEVELS, type GsrLevelId } from '../levels/loader';
import { ARCHIPELAGO_NODES } from './archipelago';
import { GOLDEN_VINYLS } from './vinyls';

describe('Broadcast Archipelago connectivity & gate placement', () => {
  it('defines all 9 areas with strictly ascending altitudes', () => {
    let prevElev = -Infinity;
    for (const id of LEVEL_ORDER) {
      const node = ARCHIPELAGO_NODES[id];
      expect(node).toBeDefined();
      expect(node.elevationM).toBeGreaterThan(prevElev);
      prevElev = node.elevationM;
    }
  });

  it('connects all 9 islands in one traversable graph from velvet-keys', () => {
    const visited = new Set<GsrLevelId>();
    const queue: GsrLevelId[] = ['velvet-keys'];
    while (queue.length > 0) {
      const cur = queue.shift()!;
      if (visited.has(cur)) continue;
      visited.add(cur);
      for (const link of ARCHIPELAGO_NODES[cur].links) {
        if (!visited.has(link.targetId)) queue.push(link.targetId);
      }
    }
    expect(visited.size).toBe(LEVEL_ORDER.length);
  });

  it('places every transit gate inside level bounds and clear of building footprints', () => {
    for (const id of LEVEL_ORDER) {
      const node = ARCHIPELAGO_NODES[id];
      const doc = LEVELS[id];
      const halfW = doc.bounds.w * 0.5;
      const halfD = doc.bounds.d * 0.5;
      for (const link of node.links) {
        const [gx, , gz] = link.gatePos;
        expect(Math.abs(gx), `${link.id} x in bounds`).toBeLessThan(halfW - 2);
        expect(Math.abs(gz), `${link.id} z in bounds`).toBeLessThan(halfD - 2);
        for (const b of doc.data.buildings) {
          const insideX = Math.abs(gx - b.x) < b.w * 0.5 + 2.0;
          const insideZ = Math.abs(gz - b.z) < b.d * 0.5 + 2.0;
          expect(insideX && insideZ, `Gate ${link.id} overlaps ${b.id}`).toBe(false);
        }
      }
    }
  });

  it('defines 27 unique Golden Vinyls (3 per area) inside level bounds', () => {
    expect(GOLDEN_VINYLS).toHaveLength(27);
    const ids = new Set<string>();
    for (const id of LEVEL_ORDER) {
      const doc = LEVELS[id];
      const list = GOLDEN_VINYLS.filter((v) => v.levelId === id);
      expect(list).toHaveLength(3);
      for (const v of list) {
        expect(ids.has(v.id)).toBe(false);
        ids.add(v.id);
        expect(Math.abs(v.x)).toBeLessThan(doc.bounds.w * 0.5);
        expect(Math.abs(v.z)).toBeLessThan(doc.bounds.d * 0.5);
      }
    }
  });
});
