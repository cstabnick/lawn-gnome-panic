import { describe, expect, it } from 'vitest';
import { PAINT_CHUNK, PaintGrid, PaintPatchBuilder } from './paint';

describe('PaintGrid', () => {
  it('starts empty and unpainted everywhere', () => {
    const g = new PaintGrid();
    expect(g.isEmpty()).toBe(true);
    expect(g.at(10.5, -3.2)).toBe(0);
    expect(g.bounds()).toBeNull();
  });

  it('paints cells, including negative and chunk-border coordinates', () => {
    const g = new PaintGrid();
    for (const [x, z] of [[0, 0], [-1, -1], [63, 63], [64, 64], [-64, -65], [100, -100]]) g.set(x, z, 3);
    for (const [x, z] of [[0, 0], [-1, -1], [63, 63], [64, 64], [-64, -65], [100, -100]]) expect(g.get(x, z)).toBe(3);
    expect(g.get(1, 0)).toBe(0);
  });

  it('at(x, z) reads the cell that contains the point', () => {
    const g = new PaintGrid();
    g.set(5, -3, 2);
    expect(g.at(5.0, -3.0)).toBe(2);
    expect(g.at(5.99, -2.01)).toBe(2);
    expect(g.at(6.0, -3.0)).toBe(0);
    expect(g.at(5.5, -3.01)).toBe(0);
  });

  it('clamps ids to 0..255 and writing 0 to a missing chunk allocates nothing', () => {
    const g = new PaintGrid();
    g.set(1, 1, 0);
    expect(g.isEmpty()).toBe(true);
    g.set(1, 1, 999);
    expect(g.get(1, 1)).toBe(255);
    g.set(1, 1, -4);
    expect(g.get(1, 1)).toBe(0);
  });

  it('applies and undoes patches', () => {
    const g = new PaintGrid();
    const p = { ix: [2, 3], iz: [2, 2], before: [0, 0], after: [4, 4] };
    g.applyPatch(p);
    expect(g.get(2, 2)).toBe(4);
    g.applyPatch(p, true);
    expect(g.get(2, 2)).toBe(0);
  });

  it('round-trips through JSON, dropping unpainted chunks, and rejects a wrong-sized chunk', () => {
    const g = new PaintGrid();
    g.set(10, 20, 5);
    g.set(200, -200, 7);
    g.set(300, 300, 1);
    g.set(300, 300, 0);
    const f = JSON.parse(JSON.stringify(g.toJSON()));
    expect(Object.keys(f.chunks).sort()).toEqual(['0,0', '3,-4']);
    const back = PaintGrid.fromJSON(f);
    expect(back.get(10, 20)).toBe(5);
    expect(back.get(200, -200)).toBe(7);
    expect(back.get(300, 300)).toBe(0);
    expect(() => PaintGrid.fromJSON({ format: 'lawn-paint', version: 1, chunk: 64, chunks: { '0,0': 'AAAA' } })).toThrow();
    expect(PAINT_CHUNK).toBe(64);
  });

  it('copyFrom copies and is independent', () => {
    const a = new PaintGrid();
    a.set(7, 7, 2);
    const b = new PaintGrid();
    b.set(1, 1, 9);
    b.copyFrom(a);
    expect(b.get(7, 7)).toBe(2);
    expect(b.get(1, 1)).toBe(0);
    a.set(7, 7, 1);
    expect(b.get(7, 7)).toBe(2);
  });

  it('bounds covers the allocated chunks', () => {
    const g = new PaintGrid();
    g.set(70, -5, 1);
    expect(g.bounds()).toEqual({ minX: 64, maxX: 128, minZ: -64, maxZ: 0 });
  });
});

describe('PaintPatchBuilder', () => {
  it('keeps the first before and the last after, drops no-ops, and bounds the cells touched', () => {
    const b = new PaintPatchBuilder();
    b.add({ ix: [1, 2], iz: [1, 1], before: [0, 3], after: [4, 4] });
    b.add({ ix: [1, 5], iz: [1, 9], before: [4, 0], after: [6, 0] });
    const p = b.build();
    expect(p.ix).toEqual([1, 2]);
    expect(p.before).toEqual([0, 3]);
    expect(p.after).toEqual([6, 4]);
    expect(b.bounds()).toEqual({ minX: 1, maxX: 6, minZ: 1, maxZ: 10 });
    expect(new PaintPatchBuilder().bounds()).toBeNull();
  });
});
