import { describe, expect, it } from 'vitest';
import { ARCHIPELAGO_NODES } from '../data/archipelago';
import { LEVEL_ORDER } from '../levels/loader';
import { buildTransitCableCurve, getNeighborIslandPos } from './transitGates';

describe('buildTransitCableCurve', () => {
  it('connects every transit gate to its neighbor island silhouette with an upward arc', () => {
    for (const id of LEVEL_ORDER) {
      const node = ARCHIPELAGO_NODES[id];
      for (const link of node.links) {
        const curve = buildTransitCableCurve(link);
        const start = curve.getPoint(0);
        const mid = curve.getPoint(0.5);
        const end = curve.getPoint(1);
        const nPos = getNeighborIslandPos(link);

        expect(start.x).toBeCloseTo(link.gatePos[0], 4);
        expect(start.y).toBeCloseTo(link.gatePos[1] + 3.2, 4);
        expect(start.z).toBeCloseTo(link.gatePos[2], 4);

        expect(end.x).toBeCloseTo(nPos.x, 4);
        expect(end.y).toBeCloseTo(nPos.y + 1.5, 4);
        expect(end.z).toBeCloseTo(nPos.z, 4);
        expect(Math.hypot(end.x, end.z)).toBeCloseTo(144, 3);

        const linearMidY = (start.y + end.y) * 0.5;
        expect(mid.y).toBeGreaterThan(linearMidY);
        for (const p of [start, mid, end]) {
          expect(Number.isFinite(p.x)).toBe(true);
          expect(Number.isFinite(p.y)).toBe(true);
          expect(Number.isFinite(p.z)).toBe(true);
        }
      }
    }
  });
});
