import { describe, expect, it } from 'vitest';
import { WALK_CELL, WalkGrid, bakeTile, decodeRle, encodeRle } from './walkgrid';
import type { WalkFile } from './walkgrid';
import { mulberry32 } from './math';

const circle = (x: number, z: number): boolean => (x - 5) * (x - 5) + (z - 5) * (z - 5) < 9;

describe('bakeTile', () => {
  it('agrees with the solid function at every cell centre and is undefined outside the tile', () => {
    const tile = bakeTile('t', { minX: 0, maxX: 10, minZ: 0, maxZ: 10 }, circle);
    const g = new WalkGrid();
    g.setTile(tile);
    let solidCount = 0;
    for (let r = 0; r < tile.rows; r++) {
      for (let c = 0; c < tile.cols; c++) {
        const x = (c + 0.5) * WALK_CELL;
        const z = (r + 0.5) * WALK_CELL;
        const want = circle(x, z);
        if (want) solidCount++;
        expect(g.solidAt(x, z)).toBe(want);
      }
    }
    expect(solidCount).toBeGreaterThan(0);
    expect(g.solidAt(-1, 5)).toBeUndefined();
    expect(g.solidAt(11, 5)).toBeUndefined();
  });

  it('snaps the tile origin to multiples of the cell size', () => {
    const tile = bakeTile('t', { minX: 0.1, maxX: 10.1, minZ: 1.13, maxZ: 10 }, () => false);
    expect(tile.minX % WALK_CELL).toBe(0);
    expect(tile.minZ % WALK_CELL).toBe(0);
  });
});

describe('encodeRle / decodeRle', () => {
  it('round-trips all zeros over more than 65535 cells', () => {
    const count = 300 * 300;
    const bits = new Uint8Array(Math.ceil(count / 8));
    expect(decodeRle(encodeRle(bits, count), count)).toEqual(bits);
  });

  it('round-trips all ones', () => {
    const count = 300 * 300;
    const bits = new Uint8Array(Math.ceil(count / 8)).fill(0xff);
    expect(decodeRle(encodeRle(bits, count), count)).toEqual(bits);
  });

  it('round-trips alternating bits', () => {
    const count = 1000;
    const bits = new Uint8Array(Math.ceil(count / 8)).fill(0xaa);
    expect(decodeRle(encodeRle(bits, count), count)).toEqual(bits);
  });

  it('round-trips random bits', () => {
    const count = 1024;
    const rng = mulberry32(7);
    const bits = Uint8Array.from({ length: count / 8 }, () => Math.floor(rng() * 256));
    expect(decodeRle(encodeRle(bits, count), count)).toEqual(bits);
  });

  it('throws when the run lengths do not add up to the cell count', () => {
    const rle = encodeRle(new Uint8Array(2), 16);
    expect(() => decodeRle(rle, 17)).toThrow(/covers 16 cells, expected 17/);
  });
});

describe('tiles', () => {
  const a = { id: 'a', minX: 0, maxX: 10, minZ: 0, maxZ: 10 };
  const b = { id: 'b', minX: 8, maxX: 18, minZ: 0, maxZ: 10 };

  it('handles overlapping tiles and reports which overlap a rectangle', () => {
    const g = new WalkGrid();
    g.setTile(bakeTile(a.id, a, () => false));
    g.setTile(bakeTile(b.id, b, () => true));
    expect(g.solidAt(9, 5)).toBeDefined();
    expect(g.solidAt(15, 5)).toBe(true);
    expect(g.tilesIn({ minX: 9.5, maxX: 9.6, minZ: 1, maxZ: 2 })).toEqual(['a', 'b']);
    expect(g.tilesIn({ minX: 12, maxX: 13, minZ: 1, maxZ: 2 })).toEqual(['b']);
    expect(g.tilesIn({ minX: -5, maxX: -4, minZ: 0, maxZ: 1 })).toEqual([]);
  });

  it('forgets a deleted tile', () => {
    const g = new WalkGrid();
    g.setTile(bakeTile(a.id, a, () => false));
    g.setTile(bakeTile(b.id, b, () => true));
    g.deleteTile('b');
    expect(g.solidAt(15, 5)).toBeUndefined();
    expect(g.tileIds).toEqual(['a']);
  });

  it('keeps every bit and the input hash through toJSON and fromJSON', () => {
    const g = new WalkGrid();
    g.inputHash = 'abc123';
    g.setTile(bakeTile('t1', { minX: 0, maxX: 10, minZ: 0, maxZ: 10 }, circle));
    g.setTile(bakeTile('t0', { minX: 20, maxX: 30, minZ: 0, maxZ: 10 }, (x) => x > 25));
    const file = JSON.parse(JSON.stringify(g.toJSON())) as WalkFile;
    const back = WalkGrid.fromJSON(file);
    expect(back.inputHash).toBe('abc123');
    expect(back.tileIds.sort()).toEqual(['t0', 't1']);
    for (let r = 0; r < 40; r++) {
      for (let c = 0; c < 40; c++) {
        const x = (c + 0.5) * WALK_CELL;
        const z = (r + 0.5) * WALK_CELL;
        expect(back.solidAt(x, z)).toBe(g.solidAt(x, z));
        expect(back.solidAt(x + 20, z)).toBe(g.solidAt(x + 20, z));
      }
    }
  });
});
