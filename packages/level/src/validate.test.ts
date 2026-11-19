import { describe, it, expect } from 'vitest';
import { DeltaGrid } from './deltas';
import { isLevelDoc, validateDeltaFile, validateLevelDoc, validateWalkFile } from './validate';
import { bakeTile, WalkGrid } from './walkgrid';

/** A fresh valid level document as plain JSON, so each test can break one rule. */
function minimal(): Record<string, any> {
  return {
    format: 'lawn-level',
    version: 1,
    game: 'gnomes-of-gnomomia',
    id: 'zone/test_1',
    name: 'Test',
    bounds: { w: 100, d: 80 },
    stamps: [],
    paths: [],
    props: [],
    markers: [],
    data: {},
  };
}

/** Exactly one problem, and it names the path. */
function expectOne(problems: string[], path: string): void {
  expect(problems).toHaveLength(1);
  expect(problems[0]).toContain(path);
}

describe('validateLevelDoc', () => {
  it('accepts a minimal valid document', () => {
    expect(validateLevelDoc(minimal())).toEqual([]);
    expect(isLevelDoc(minimal())).toBe(true);
  });

  it('accepts a base generator with params', () => {
    const d = minimal();
    d.base = { id: 'hills', version: 2, seed: 7, params: { amp: 3.5, name: 'x', on: true } };
    expect(validateLevelDoc(d)).toEqual([]);
  });

  it('flags a wrong format', () => {
    const d = minimal();
    d.format = 'lawn-zone';
    expectOne(validateLevelDoc(d), 'format');
  });

  it('flags a wrong version', () => {
    const d = minimal();
    d.version = 2;
    expectOne(validateLevelDoc(d), 'version');
  });

  it('flags an empty game', () => {
    const d = minimal();
    d.game = '';
    expectOne(validateLevelDoc(d), 'game');
  });

  it('flags an id that does not match the pattern', () => {
    const d = minimal();
    d.id = 'Bad Id';
    expectOne(validateLevelDoc(d), 'id');
  });

  it('flags a non-string name', () => {
    const d = minimal();
    d.name = 42;
    expectOne(validateLevelDoc(d), 'name');
  });

  it('flags a zero bounds width', () => {
    const d = minimal();
    d.bounds.w = 0;
    expectOne(validateLevelDoc(d), 'bounds.w');
  });

  it('flags a negative bounds depth', () => {
    const d = minimal();
    d.bounds.d = -1;
    expectOne(validateLevelDoc(d), 'bounds.d');
  });

  it('flags a non-integer base version', () => {
    const d = minimal();
    d.base = { id: 'hills', version: 1.5, params: {} };
    expectOne(validateLevelDoc(d), 'base.version');
  });

  it('flags a flatten stamp whose outer is not above inner', () => {
    const d = minimal();
    d.stamps = [{ op: 'flatten', x: 0, z: 0, inner: 5, outer: 5, to: 1 }];
    expectOne(validateLevelDoc(d), 'stamps[0].outer');
  });

  it('flags a gauss stamp with sigma 0', () => {
    const d = minimal();
    d.stamps = [{ op: 'gauss', x: 0, z: 0, amount: 1, sigma: 0 }];
    expectOne(validateLevelDoc(d), 'stamps[0].sigma');
  });

  it('flags an unknown stamp op', () => {
    const d = minimal();
    d.stamps = [{ op: 'bulge', x: 0, z: 0 }];
    expectOne(validateLevelDoc(d), 'stamps[0].op');
  });

  it('flags an unknown path kind', () => {
    const d = minimal();
    d.paths = [{ id: 'p', kind: 'river', points: [[0, 0], [1, 1]] }];
    expectOne(validateLevelDoc(d), 'paths[0].kind');
  });

  it('flags a path with one point', () => {
    const d = minimal();
    d.paths = [{ id: 'p', kind: 'road', points: [[0, 0]] }];
    expectOne(validateLevelDoc(d), 'paths[0].points');
  });

  it('flags a zero path width', () => {
    const d = minimal();
    d.paths = [{ id: 'p', kind: 'road', points: [[0, 0], [1, 1]], width: 0 }];
    expectOne(validateLevelDoc(d), 'paths[0].width');
  });

  it('flags a duplicate path id', () => {
    const d = minimal();
    d.paths = [
      { id: 'p', kind: 'road', points: [[0, 0], [1, 1]] },
      { id: 'p', kind: 'wall', points: [[0, 0], [1, 1]] },
    ];
    expectOne(validateLevelDoc(d), 'paths[1].id');
  });

  it('flags an empty prefab id', () => {
    const d = minimal();
    d.props = [{ prefab: '', x: 0, z: 0 }];
    expectOne(validateLevelDoc(d), 'props[0].prefab');
  });

  it('flags a zero prop scale', () => {
    const d = minimal();
    d.props = [{ prefab: 'tree', x: 0, z: 0, scale: 0 }];
    expectOne(validateLevelDoc(d), 'props[0].scale');
  });

  it('flags a negative solid radius', () => {
    const d = minimal();
    d.props = [{ prefab: 'rock', x: 0, z: 0, solidR: -1 }];
    expectOne(validateLevelDoc(d), 'props[0].solidR');
  });

  it('flags a non-string prop tint', () => {
    const d = minimal();
    d.props = [{ prefab: 'rock', x: 0, z: 0, tint: 5 }];
    expectOne(validateLevelDoc(d), 'props[0].tint');
  });

  it('accepts a marker with no data', () => {
    const d = minimal();
    d.markers = [{ id: 'spawn', kind: 'spawn', x: 0, z: 0 }];
    expect(validateLevelDoc(d)).toEqual([]);
  });

  it('flags a marker whose data is not an object', () => {
    const d = minimal();
    d.markers = [{ id: 'spawn', kind: 'spawn', x: 0, z: 0, data: 5 }];
    expectOne(validateLevelDoc(d), 'markers[0].data');
  });

  it('flags a document with no data block, and accepts null as one', () => {
    const d = minimal();
    delete d.data;
    expectOne(validateLevelDoc(d), 'data');
    d.data = null;
    expect(validateLevelDoc(d)).toEqual([]);
  });

  it('flags a negative marker radius', () => {
    const d = minimal();
    d.markers = [{ id: 'spawn', kind: 'spawn', x: 0, z: 0, r: -1, }];
    expectOne(validateLevelDoc(d), 'markers[0].r');
  });

  it('flags a duplicate marker id', () => {
    const d = minimal();
    d.markers = [
      { id: 'm', kind: 'spawn', x: 0, z: 0 },
      { id: 'm', kind: 'flag', x: 1, z: 1, },
    ];
    expectOne(validateLevelDoc(d), 'markers[1].id');
  });

  it('returns problems for junk input without throwing', () => {
    for (const junk of [null, 42, 'x', [], {}]) {
      expect(() => validateLevelDoc(junk)).not.toThrow();
      expect(validateLevelDoc(junk).length).toBeGreaterThan(0);
      expect(isLevelDoc(junk)).toBe(false);
    }
  });
});

describe('validateDeltaFile', () => {
  it('accepts a file written by DeltaGrid', () => {
    const g = new DeltaGrid();
    g.setUnits(3, 4, 100);
    g.setUnits(-70, 2, -5);
    expect(validateDeltaFile(g.toJSON())).toEqual([]);
  });

  it('accepts an empty grid', () => {
    expect(validateDeltaFile(new DeltaGrid().toJSON())).toEqual([]);
  });

  it('flags a chunk that is too short', () => {
    const g = new DeltaGrid();
    g.setUnits(3, 4, 100);
    const f = g.toJSON();
    expectOne(validateDeltaFile({ ...f, chunks: { '0,0': 'AAAA' } }), 'chunks["0,0"]');
  });

  it('flags a bad chunk key', () => {
    const g = new DeltaGrid();
    g.setUnits(3, 4, 100);
    const f = g.toJSON();
    expectOne(validateDeltaFile({ ...f, chunks: { 'a,b': f.chunks['0,0'] } }), 'chunks["a,b"]');
  });

  it('flags a wrong format', () => {
    const g = new DeltaGrid();
    g.setUnits(3, 4, 100);
    expectOne(validateDeltaFile({ ...g.toJSON(), format: 'lawn-walk' }), 'format');
  });

  it('returns problems for junk input without throwing', () => {
    for (const junk of [null, 42, 'x', [], {}]) {
      expect(() => validateDeltaFile(junk)).not.toThrow();
      expect(validateDeltaFile(junk).length).toBeGreaterThan(0);
    }
  });
});

describe('validateWalkFile', () => {
  function walkFile(): ReturnType<WalkGrid['toJSON']> {
    const g = new WalkGrid();
    g.setTile(bakeTile('t', { minX: 0, maxX: 4, minZ: 0, maxZ: 4 }, (x) => x < 2));
    return g.toJSON();
  }

  it('accepts a file written by WalkGrid', () => {
    expect(validateWalkFile(walkFile())).toEqual([]);
  });

  it('flags a tile with zero rows', () => {
    const f = walkFile();
    expectOne(validateWalkFile({ ...f, tiles: [{ ...f.tiles[0], rows: 0 }] }), 'tiles[0].rows');
  });

  it('flags an RLE that covers the wrong number of cells', () => {
    const f = walkFile();
    // One run of a single 0-cell: decodes to 1 cell, the tile needs 16.
    expectOne(validateWalkFile({ ...f, tiles: [{ ...f.tiles[0], rle: 'AQA=' }] }), 'tiles[0].rle');
  });

  it('flags a wrong format', () => {
    expectOne(validateWalkFile({ ...walkFile(), format: 'lawn-deltas' }), 'format');
  });

  it('returns problems for junk input without throwing', () => {
    for (const junk of [null, 42, 'x', [], {}]) {
      expect(() => validateWalkFile(junk)).not.toThrow();
      expect(validateWalkFile(junk).length).toBeGreaterThan(0);
    }
  });
});

describe('validatePaintFile', () => {
  it('accepts what PaintGrid writes and flags the usual mistakes', async () => {
    const { PaintGrid } = await import('./paint');
    const { validatePaintFile } = await import('./validate');
    const g = new PaintGrid();
    g.set(3, 4, 2);
    expect(validatePaintFile(g.toJSON())).toEqual([]);
    expect(validatePaintFile(new PaintGrid().toJSON())).toEqual([]);
    expect(validatePaintFile({ ...g.toJSON(), format: 'x' })).toHaveLength(1);
    expect(validatePaintFile({ ...g.toJSON(), chunks: { '0,0': 'AAAA' } })).toHaveLength(1);
    expect(validatePaintFile({ ...g.toJSON(), chunks: { nope: 'AAAA' } }).length).toBeGreaterThan(0);
    expect(validatePaintFile(null)).toHaveLength(1);
  });
});
