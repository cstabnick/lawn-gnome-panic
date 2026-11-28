import { describe, expect, it } from 'vitest';
import { BRIDGE_KEEP, distToLine, onOtherRoad, PAVE_OUTER, pavementStrips, ribbonRows, ROAD_HALF, runsOf, thymesDist, townRoads } from './groundPlan';

describe('Pardonlin laid ground (FX09, D9 item 1)', () => {
  const strips = pavementStrips();
  const pave = strips.filter((s) => s.kind === 'flags');
  const kerbs = strips.filter((s) => s.kind === 'kerb');

  it('paves every town road on both sides out to the building fronts', () => {
    const roads = townRoads();
    expect(roads.length).toBeGreaterThan(20);
    for (const r of roads) {
      const mine = pave.filter((s) => s.rows.some((row) => distToLine(row.x, row.z, r.points) < 0.01));
      expect(mine.length, r.id).toBeGreaterThan(0);
      for (const s of mine) expect(Math.max(Math.abs(s.from), Math.abs(s.to)), r.id).toBeCloseTo(PAVE_OUTER);
    }
  });

  it('lays nothing on the Thymes or its bridges', () => {
    for (const s of [...pave, ...kerbs]) {
      for (const r of s.rows) expect(thymesDist(r.x, r.z)).toBeGreaterThanOrEqual(BRIDGE_KEEP - 1e-6);
    }
  });

  it('cuts the kerbs at junction mouths', () => {
    for (const s of kerbs) {
      const road = townRoads().find((r) => s.rows.every((row) => distToLine(row.x, row.z, r.points) < 0.01))!;
      expect(road).toBeTruthy();
      const off = (s.from + s.to) / 2;
      expect(Math.abs(off)).toBeCloseTo(ROAD_HALF + 0.16, 1);
      for (const r of s.rows) expect(onOtherRoad(r.x + r.nx * off, r.z + r.nz * off, road.id)).toBe(false);
    }
  });

  it('ribbon rows follow the line with unit-ish side normals', () => {
    const rows = ribbonRows([[0, 0], [10, 0], [10, 10]], 2);
    expect(rows[0]).toMatchObject({ x: 0, z: 0, s: 0 });
    expect(rows[rows.length - 1].s).toBeCloseTo(20);
    expect(Math.hypot(rows[0].nx, rows[0].nz)).toBeCloseTo(1);
    expect(runsOf(rows, (r) => r.x < 5 || r.z > 5).length).toBe(2);
  });
});
