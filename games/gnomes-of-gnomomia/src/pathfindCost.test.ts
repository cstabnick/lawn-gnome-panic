import { describe, expect, it } from 'vitest';
import { TUNING } from './config';
import { findPath3, type Point3 } from './pathfind';
import { heightAt, standY } from './terrain';

type Cost = (x: number, z: number) => number;

/** Cost integrated along the polyline from start through pts, sampled every 0.25 m. */
function integratedCost(start: Point3, pts: Point3[], cost: Cost): number {
  let total = 0;
  let cur = start;
  for (const p of pts) {
    const len = Math.hypot(p.x - cur.x, p.z - cur.z);
    const steps = Math.max(1, Math.ceil(len / 0.25));
    for (let s = 1; s <= steps; s++) {
      const t = (s - 0.5) / steps;
      total += cost(cur.x + (p.x - cur.x) * t, cur.z + (p.z - cur.z) * t) * (len / steps);
    }
    cur = p;
  }
  return total;
}

/** A flat world where every cell can be stood on. */
const flat = (): number => 0;
const stepFlat = (_x: number, _z: number, _fromY: number): number | null => flat();

const strip: Cost = (_x, z) => (z >= 10 && z <= 12 ? 0.5 : 1);

describe('click-to-move road cost', () => {
  it('gives the same path with no opts, and with a cost that is always 1', () => {
    const pairs: Array<[{ x: number; z: number }, { x: number; z: number }]> = [
      [{ x: 3, z: 3 }, { x: 10, z: -88 }],
      [{ x: 3, z: 0 }, { x: 10, z: -70 }],
      [{ x: 10, z: -88 }, { x: 0, z: -240 }],
      [{ x: 3, z: -240 }, { x: 65, z: -195 }],
    ];
    for (const [from, to] of pairs) {
      const f = { x: from.x, y: heightAt(from.x, from.z), z: from.z };
      const g = { x: to.x, y: heightAt(to.x, to.z), z: to.z };
      const plain = findPath3(f, g, standY);
      const ones = findPath3(f, g, standY, undefined, { cost: () => 1 });
      expect(ones).toEqual(plain);
    }
  }, 120000);

  it('prefers a cheap strip when cost is given, and ignores it when not', () => {
    const from = { x: 0, y: 0, z: 0 };
    const goal = { x: 40, y: 0, z: 20 };
    const straight = findPath3(from, goal, stepFlat);
    expect(straight).toEqual([goal]);

    const path = findPath3(from, goal, stepFlat, undefined, { cost: strip });
    expect(path.some((p) => p.z >= 10 && p.z <= 12)).toBe(true);
    expect(integratedCost(from, path, strip)).toBeLessThan(integratedCost(from, straight, strip));
  });

  it('is not worse under the cost function when minCost is lowered to the cheapest cost', () => {
    const from = { x: 0, y: 0, z: 0 };
    const goal = { x: 40, y: 0, z: 20 };
    const admissible = findPath3(from, goal, stepFlat, undefined, { cost: strip, minCost: 0.5 });
    const scaled = findPath3(from, goal, stepFlat, undefined, { cost: strip, minCost: 1 });
    expect(integratedCost(from, admissible, strip)).toBeLessThanOrEqual(integratedCost(from, scaled, strip) + 1e-6);
  });

  it('leaves the default road bias at 1 (no preference)', () => {
    expect(TUNING.roadPathBias).toBe(1);
  });
});
