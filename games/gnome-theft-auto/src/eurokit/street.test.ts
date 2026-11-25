import { describe, expect, it } from 'vitest';
import { euroBuilding } from './catalog';
import { PARTY_GAP, planStreetRow } from './street';
import type { StreetRowOpts } from './street';

const base: StreetRowOpts = { x: 0, z: 0, yaw: 0, length: 30, seed: 7 };

function widthOf(id: string): number {
  const b = euroBuilding(id);
  if (!b) throw new Error(`unknown id ${id}`);
  return b.width;
}

describe('planStreetRow', () => {
  it('is deterministic for a seed and varies between seeds', () => {
    const a = planStreetRow({ ...base, seed: 1 });
    const again = planStreetRow({ ...base, seed: 1 });
    const other = planStreetRow({ ...base, seed: 2 });
    expect(JSON.stringify(a)).toBe(JSON.stringify(again));
    expect(JSON.stringify(a)).not.toBe(JSON.stringify(other));
  });

  it('fills the frontage inside [0, length] and packs buildings tight', () => {
    const row = planStreetRow(base);
    expect(row.length).toBeGreaterThan(3);
    for (const p of row) {
      const w = widthOf(p.id);
      expect(p.x - w / 2).toBeGreaterThanOrEqual(-1e-9);
      expect(p.x + w / 2).toBeLessThanOrEqual(base.length + 1e-9);
    }
    for (let i = 1; i < row.length; i++) {
      const prev = row[i - 1];
      const gap = row[i].x - widthOf(row[i].id) / 2 - (prev.x + widthOf(prev.id) / 2);
      expect(gap).toBeGreaterThanOrEqual(PARTY_GAP - 1e-9);
      expect(gap).toBeLessThanOrEqual(PARTY_GAP + 1e-9);
    }
  });

  it('never repeats an id or a wall tint next to a neighbour', () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const row = planStreetRow({ ...base, seed, length: 60 });
      for (let i = 1; i < row.length; i++) {
        expect(row[i].id).not.toBe(row[i - 1].id);
        expect(row[i].tint).not.toBe(row[i - 1].tint);
      }
    }
  });

  it('puts every front between -setback and 0 at yaw 0', () => {
    const row = planStreetRow(base);
    for (const p of row) {
      const depth = euroBuilding(p.id)!.depth;
      const front = p.z + depth / 2;
      expect(front).toBeLessThanOrEqual(1e-9);
      expect(front).toBeGreaterThanOrEqual(-0.35 - 1e-9);
    }
  });

  it('rotates the row with yaw PI/2', () => {
    const r0 = planStreetRow(base);
    const r90 = planStreetRow({ ...base, yaw: Math.PI / 2 });
    expect(r90.length).toBe(r0.length);
    // yaw 0 point (a, c) = (x0, z0); at PI/2 the same point is (c, -a) = (z0, -x0).
    for (let i = 0; i < r0.length; i++) {
      expect(r90[i].x).toBeCloseTo(r0[i].z, 6);
      expect(r90[i].z).toBeCloseTo(-r0[i].x, 6);
      expect(r90[i].yaw).toBeCloseTo(Math.PI / 2, 9);
    }
  });

  it('ends with the corner cafe, right side at length, when asked', () => {
    const row = planStreetRow({ ...base, corner: true, seed: 3 });
    const last = row[row.length - 1];
    expect(last.id).toBe('euro-corner-cafe');
    expect(last.x + euroBuilding('euro-corner-cafe')!.width / 2).toBeCloseTo(base.length, 6);
    expect(row.slice(0, -1).some((p) => p.id === 'euro-corner-cafe')).toBe(false);
  });

  it('returns nothing when the frontage is shorter than every building', () => {
    expect(planStreetRow({ ...base, length: 1 })).toEqual([]);
    expect(planStreetRow({ ...base, length: 3.3, corner: true })).toEqual([]);
  });
});
