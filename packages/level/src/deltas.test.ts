import { describe, expect, it } from 'vitest';
import { bytesToBase64, base64ToBytes } from './math';
import { DeltaGrid, PatchBuilder } from './deltas';
import type { DeltaFile } from './deltas';

describe('DeltaGrid basics', () => {
  it('is empty and samples to 0 when nothing was written', () => {
    const g = new DeltaGrid();
    expect(g.isEmpty()).toBe(true);
    expect(g.sample(3.5, 2)).toBe(0);
    expect(g.bounds()).toBeNull();
  });

  it('reads and writes at negative and chunk-border coordinates', () => {
    const g = new DeltaGrid();
    const coords = [-1, 0, 63, 64, -64, -65];
    coords.forEach((v, i) => g.setUnits(v, v + 3, 1000 + i));
    coords.forEach((v, i) => expect(g.getUnits(v, v + 3)).toBe(1000 + i));
    expect(g.getUnits(-2, 2)).toBe(0);
    expect(g.getUnits(0, 0)).toBe(0);
  });

  it('allocates nothing when writing 0 to a missing chunk', () => {
    const g = new DeltaGrid();
    g.setUnits(500, 500, 0);
    expect(g.isEmpty()).toBe(true);
  });

  it('clamps written values to the Int16 range', () => {
    const g = new DeltaGrid();
    g.setUnits(0, 0, 40000);
    expect(g.getUnits(0, 0)).toBe(32767);
    g.setUnits(0, 0, -40000);
    expect(g.getUnits(0, 0)).toBe(-32767);
  });

  it('converts units to metres with get', () => {
    const g = new DeltaGrid();
    g.setUnits(2, 3, 150);
    expect(g.get(2, 3)).toBeCloseTo(1.5);
  });
});

describe('DeltaGrid.sample', () => {
  it('equals get at integer points', () => {
    const g = new DeltaGrid();
    g.setUnits(2, 3, 150);
    g.setUnits(-7, 9, -40);
    expect(g.sample(2, 3)).toBeCloseTo(g.get(2, 3));
    expect(g.sample(-7, 9)).toBeCloseTo(g.get(-7, 9));
  });

  it('is the bilinear blend of the four corners', () => {
    const g = new DeltaGrid();
    g.setUnits(4, 4, 100);
    g.setUnits(5, 4, 200);
    g.setUnits(4, 5, 300);
    g.setUnits(5, 5, 400);
    expect(g.sample(4.5, 4.5)).toBeCloseTo(2.5);
  });
});

describe('DeltaGrid.applyPatch', () => {
  const patch = { ix: [1, 2], iz: [1, 1], before: [0, 10], after: [50, -20] };

  it('applies forwards and undoes', () => {
    const g = new DeltaGrid();
    g.applyPatch(patch);
    expect(g.getUnits(1, 1)).toBe(50);
    expect(g.getUnits(2, 1)).toBe(-20);
    g.applyPatch(patch, true);
    expect(g.getUnits(1, 1)).toBe(0);
    expect(g.getUnits(2, 1)).toBe(10);
  });
});

describe('DeltaGrid file form', () => {
  function sampleGrid(): DeltaGrid {
    const g = new DeltaGrid();
    g.setUnits(1, 1, 5);
    g.setUnits(-70, 3, -7);
    g.setUnits(100, 100, 32767);
    g.setUnits(200, 200, 9);
    g.setUnits(200, 200, 0);
    return g;
  }

  it('round-trips through JSON with the same values', () => {
    const f = JSON.parse(JSON.stringify(sampleGrid().toJSON())) as DeltaFile;
    const back = DeltaGrid.fromJSON(f);
    expect(back.getUnits(1, 1)).toBe(5);
    expect(back.getUnits(-70, 3)).toBe(-7);
    expect(back.getUnits(100, 100)).toBe(32767);
    expect(back.getUnits(200, 200)).toBe(0);
  });

  it('drops all-zero chunks and writes non-zero chunks as 8192-byte base64', () => {
    const f = sampleGrid().toJSON();
    expect(Object.keys(f.chunks).sort()).toEqual(['-2,0', '0,0', '1,1']);
    expect(base64ToBytes(f.chunks['0,0']).length).toBe(8192);
  });

  it('throws when a chunk has the wrong size', () => {
    const f: DeltaFile = {
      format: 'lawn-deltas',
      version: 1,
      chunk: 64,
      unit: 0.01,
      chunks: { '0,0': bytesToBase64(new Uint8Array(10)) },
    };
    expect(() => DeltaGrid.fromJSON(f)).toThrow(/wrong size/);
  });

  it('reports the covered box from bounds()', () => {
    const g = new DeltaGrid();
    g.setUnits(5, 5, 1);
    g.setUnits(70, -1, 1);
    expect(g.bounds()).toEqual({ minX: 0, maxX: 128, minZ: -64, maxZ: 64 });
  });
});

describe('PatchBuilder', () => {
  it('merges two dabs on the same vertex into first before and last after', () => {
    const b = new PatchBuilder();
    b.add({ ix: [1], iz: [1], before: [0], after: [10] });
    b.add({ ix: [1], iz: [1], before: [10], after: [25] });
    expect(b.build()).toEqual({ ix: [1], iz: [1], before: [0], after: [25] });
  });

  it('drops a vertex that returns to its starting value', () => {
    const b = new PatchBuilder();
    b.add({ ix: [2], iz: [2], before: [7], after: [9] });
    b.add({ ix: [2], iz: [2], before: [9], after: [7] });
    expect(b.build().ix).toEqual([]);
  });

  it('has no bounds when empty and a 1 m reach around touched vertices otherwise', () => {
    const empty = new PatchBuilder();
    expect(empty.bounds()).toBeNull();
    const b = new PatchBuilder();
    b.add({ ix: [3, 10], iz: [4, -2], before: [0, 0], after: [1, 1] });
    expect(b.bounds()).toEqual({ minX: 2, maxX: 12, minZ: -3, maxZ: 6 });
  });
});

describe('PatchBuilder.bounds on a very large stroke', () => {
  it('does not overflow the call stack', () => {
    const b = new PatchBuilder();
    const n = 300_000;
    const ix = new Array<number>(n), iz = new Array<number>(n), zero = new Array<number>(n).fill(0), one = new Array<number>(n).fill(1);
    for (let i = 0; i < n; i++) { ix[i] = i % 600 - 300; iz[i] = Math.floor(i / 600); }
    b.add({ ix, iz, before: zero, after: one });
    expect(b.bounds()).toEqual({ minX: -301, maxX: 301, minZ: -1, maxZ: 501 });
  });
});
