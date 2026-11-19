import { PaintGrid } from '@lawn/level';
import { describe, expect, it } from 'vitest';
import { paintDab } from './paintMath';

describe('paintDab', () => {
  it('paints a disc of cells and reports exactly what changed', () => {
    const g = new PaintGrid();
    const p = paintDab(g, 10.5, 10.5, 4, 3);
    expect(p.ix.length).toBeGreaterThan(Math.PI * 16 * 0.8);
    expect(p.ix.length).toBeLessThan(Math.PI * 16 * 1.2);
    expect(p.before.every((b) => b === 0) && p.after.every((a) => a === 3)).toBe(true);
    expect(g.get(10, 10)).toBe(3);
    expect(g.get(20, 20)).toBe(0);
  });

  it('changes nothing when the cells already have that surface, and erases with 0', () => {
    const g = new PaintGrid();
    paintDab(g, 0.5, 0.5, 3, 2);
    expect(paintDab(g, 0.5, 0.5, 3, 2).ix).toEqual([]);
    const e = paintDab(g, 0.5, 0.5, 3, 0);
    expect(e.ix.length).toBeGreaterThan(0);
    expect(e.before.every((b) => b === 2)).toBe(true);
    expect(g.at(0.5, 0.5)).toBe(0);
  });

  it('undoes through the patch, and ignores bad input', () => {
    const g = new PaintGrid();
    g.set(1, 1, 5);
    const p = paintDab(g, 1.5, 1.5, 2, 4);
    g.applyPatch(p, true);
    expect(g.get(1, 1)).toBe(5);
    expect(paintDab(g, 0, 0, 0, 1).ix).toEqual([]);
    expect(paintDab(g, NaN, 0, 3, 1).ix).toEqual([]);
  });
});
