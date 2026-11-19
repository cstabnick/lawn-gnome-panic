import { describe, expect, it } from 'vitest';
import { DeltaGrid } from './deltas';
import { applyBrush, type BrushOp } from './brush';

const flatHeight = (grid: DeltaGrid) => (x: number, z: number) => 0 + grid.sample(x, z);

function cloneGrid(g: DeltaGrid): DeltaGrid {
  return DeltaGrid.fromJSON(g.toJSON());
}

function unitsAt(g: DeltaGrid, ix: number, iz: number): number {
  return g.getUnits(ix, iz);
}

describe('applyBrush', () => {
  it('raise adds 20 units at the centre with a monotone falloff to the rim', () => {
    const grid = new DeltaGrid();
    const op: BrushOp = { mode: 'raise', x: 0, z: 0, radius: 2, strength: 0.2 };
    applyBrush(grid, op, flatHeight(grid));

    expect(unitsAt(grid, 0, 0)).toBe(20);
    const edge = unitsAt(grid, 1, 0);
    const diag = unitsAt(grid, 1, 1);
    expect(edge).toBeGreaterThan(0);
    expect(edge).toBeLessThan(20);
    expect(diag).toBeGreaterThan(0);
    expect(diag).toBeLessThan(edge);
    expect(unitsAt(grid, 2, 0)).toBe(0);
    expect(unitsAt(grid, 2, 2)).toBe(0);
  });

  it('lower mirrors raise', () => {
    const up = new DeltaGrid();
    const down = new DeltaGrid();
    const raise = applyBrush(up, { mode: 'raise', x: 0.5, z: 0.5, radius: 3, strength: 0.3 }, flatHeight(up));
    const lower = applyBrush(down, { mode: 'lower', x: 0.5, z: 0.5, radius: 3, strength: 0.3 }, flatHeight(down));

    expect(lower.ix).toEqual(raise.ix);
    expect(lower.iz).toEqual(raise.iz);
    expect(lower.after).toEqual(raise.after.map((v) => -v));
  });

  it('applyPatch(patch, true) restores the grid exactly', () => {
    const grid = new DeltaGrid();
    grid.setUnits(3, 3, 42);
    grid.setUnits(70, -5, -17);
    const before = cloneGrid(grid);
    const patch = applyBrush(grid, { mode: 'raise', x: 3, z: 3, radius: 4, strength: 0.5 }, flatHeight(grid));
    expect(patch.ix.length).toBeGreaterThan(0);

    grid.applyPatch(patch, true);
    for (let ix = -8; ix <= 80; ix++) {
      for (let iz = -10; iz <= 10; iz++) {
        expect(grid.getUnits(ix, iz)).toBe(before.getUnits(ix, iz));
      }
    }
  });

  it('smooth reduces a spike and raises or keeps its neighbours', () => {
    const grid = new DeltaGrid();
    grid.setUnits(0, 0, 200);
    const patch = applyBrush(grid, { mode: 'smooth', x: 0, z: 0, radius: 2, strength: 1 }, flatHeight(grid));

    expect(grid.getUnits(0, 0)).toBeLessThan(200);
    for (const [ix, iz] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ] as const) {
      expect(grid.getUnits(ix, iz)).toBeGreaterThanOrEqual(0);
    }
    expect(grid.getUnits(1, 0)).toBeGreaterThan(0);
    expect(patch.ix.length).toBeGreaterThan(0);
  });

  it('flatten raises the centre to target 5 in one full-strength dab, and clamps to 60 m', () => {
    const grid = new DeltaGrid();
    applyBrush(grid, { mode: 'flatten', x: 0, z: 0, radius: 2, strength: 1, target: 5 }, flatHeight(grid));
    expect(grid.getUnits(0, 0)).toBe(500);

    const far = new DeltaGrid();
    applyBrush(far, { mode: 'flatten', x: 0, z: 0, radius: 2, strength: 1, target: 100 }, flatHeight(far));
    expect(far.getUnits(0, 0)).toBe(6000);
  });

  it('smooth and flatten do not depend on visit order: live heights and a frozen snapshot agree', () => {
    const base = new DeltaGrid();
    base.setUnits(0, 0, 150);
    base.setUnits(1, 0, -80);
    base.setUnits(0, 1, 60);

    const ops: BrushOp[] = [
      { mode: 'smooth', x: 0, z: 0, radius: 3, strength: 0.6 },
      { mode: 'flatten', x: 0.5, z: 0.5, radius: 3, strength: 0.4, target: 2 },
    ];
    for (const op of ops) {
      const a = cloneGrid(base);
      const b = cloneGrid(base);
      const snapshot = new Map<string, number>();
      for (let ix = -4; ix <= 5; ix++) for (let iz = -4; iz <= 5; iz++) snapshot.set(`${ix},${iz}`, b.sample(ix, iz));
      const frozen = (x: number, z: number) => snapshot.get(`${x},${z}`) ?? 0;

      const patchA = applyBrush(a, op, flatHeight(a));
      const patchB = applyBrush(b, op, frozen);
      expect(patchA).toEqual(patchB);
      expect(cloneGrid(a).toJSON()).toEqual(cloneGrid(b).toJSON());
    }
  });

  it('returns an empty patch for strength 0, radius 0 and non-finite inputs', () => {
    const grid = new DeltaGrid();
    const empty = { ix: [], iz: [], before: [], after: [] };
    expect(applyBrush(grid, { mode: 'raise', x: 0, z: 0, radius: 2, strength: 0 }, flatHeight(grid))).toEqual(empty);
    expect(applyBrush(grid, { mode: 'raise', x: 0, z: 0, radius: 0, strength: 0.5 }, flatHeight(grid))).toEqual(empty);
    expect(applyBrush(grid, { mode: 'raise', x: NaN, z: 0, radius: 2, strength: 0.5 }, flatHeight(grid))).toEqual(empty);
    expect(grid.isEmpty()).toBe(true);
  });
});
