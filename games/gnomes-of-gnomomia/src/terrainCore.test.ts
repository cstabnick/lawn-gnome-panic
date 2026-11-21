// createTerrain: a fresh instance behaves like the game's, and the layers (stamps, deltas, authored roads, walk grid)
// and invalidate() do what terrainCore.ts says. Parity with the original world is terrain.golden.test.ts.
import { describe, expect, it } from 'vitest';
import { DeltaGrid, WALK_CELL, WalkGrid, bakeTile } from '@lawn/level';
import { WORLD } from './config';
import { OBJECTS, ZONES } from './content';
import { checkCondition } from './quests';
import { terrain as game } from './terrain';
import { derivedRoadPaths } from './terrainCore';
import { PaintGrid } from '@lawn/level';
import { PAINT_SURFACES } from './config';
import { createTerrain } from './terrainCore';
import { loadWorldDeltas } from './worldDeltas';
import { loadWorldPaint } from './worldPaint';

const input = { zones: ZONES, objects: OBJECTS, checkCondition };
const mb = ZONES.mossbottom;
const at = (dx: number, dz: number) => ({ x: mb.origin!.x + dx, z: mb.origin!.z + dz });

function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe('createTerrain', () => {
  it('a fresh instance (given the shipped brush edits) matches the game instance', () => {
    const t = createTerrain(input);
    const shipped = loadWorldDeltas();
    if (shipped) t.setDeltas(shipped);
    const paint = loadWorldPaint();
    if (paint) t.setPaint(paint);
    const r = rng(5);
    let sameBlocked = 0;
    const N = 300;
    for (let i = 0; i < N; i++) {
      const p = at((r() * 2 - 1) * 150, (r() * 2 - 1) * 150);
      expect(t.heightAt(p.x, p.z)).toBe(game.heightAt(p.x, p.z));
      expect(t.groundColourAt(p.x, p.z)).toBe(game.groundColourAt(p.x, p.z));
      // The game's own instance has the baked 0.25 m grid installed, so a collider's edge can differ by one cell.
      if (t.isBlocked(p.x, p.z) === game.isBlocked(p.x, p.z)) sameBlocked++;
    }
    expect(sameBlocked / N).toBeGreaterThan(0.99);
  });

  it('opens every pass when the gate check says yes', () => {
    const t = createTerrain({ ...input, checkCondition: () => true });
    expect(t.passes().length).toBeGreaterThan(0);
    expect(t.passes().every((p) => t.passOpen(p))).toBe(true);
    const closed = createTerrain({ ...input, checkCondition: () => false });
    expect(closed.passes().some((p) => closed.passOpen(p))).toBe(false);
  });

  it('applies zone stamps to the finished height and leaves far points alone', () => {
    const c = at(70, 70);
    const far = at(-90, -90);
    // Mossbottom's own stamps are left out of both, so only the test's stamps differ.
    const plain = createTerrain({ ...input, zones: { ...ZONES, mossbottom: { ...mb, stamps: undefined } } });
    const t = createTerrain({
      ...input,
      zones: { ...ZONES, mossbottom: { ...mb, stamps: [{ op: 'gauss', x: c.x, z: c.z, sigma: 5, amount: 3 }, { op: 'flatten', x: far.x, z: far.z, inner: 4, outer: 9, to: 7 }] } },
    });
    expect(t.heightAt(c.x, c.z)).toBeCloseTo(plain.heightAt(c.x, c.z) + 3, 6);
    expect(t.heightAt(far.x, far.z)).toBeCloseTo(7, 6);
    const elsewhere = at(10, -60);
    expect(t.heightAt(elsewhere.x, elsewhere.z)).toBe(plain.heightAt(elsewhere.x, elsewhere.z));
  });

  it('adds the delta raster, and invalidate() makes flora follow the new ground', () => {
    const t = createTerrain(input);
    const C = WORLD.chunk;
    // A chunk in the Mossbottom meadow that has flora.
    let ci = 0, cj = 0;
    const base = at(40, 20);
    ci = Math.floor(base.x / C);
    cj = Math.floor(base.z / C);
    const before = t.chunkFlora(ci, cj).map((f) => ({ ...f }));
    expect(before.length).toBeGreaterThan(0);
    const grid = new DeltaGrid();
    for (let x = ci * C - 2; x <= (ci + 1) * C + 2; x++) for (let z = cj * C - 2; z <= (cj + 1) * C + 2; z++) grid.setUnits(x, z, 100); // +1 m
    t.setDeltas(grid);
    expect(t.heightAt(base.x, base.z)).toBeCloseTo(createTerrain(input).heightAt(base.x, base.z) + 1, 6);
    // Flora is cached until invalidated: the old y is still served.
    expect(t.chunkFlora(ci, cj)[0].y).toBe(before[0].y);
    t.invalidate({ minX: ci * C, maxX: (ci + 1) * C, minZ: cj * C, maxZ: (cj + 1) * C });
    const after = t.chunkFlora(ci, cj);
    expect(after.length).toBeGreaterThan(0);
    for (const f of after) expect(f.y).toBeCloseTo(t.heightAt(f.x, f.z), 9);
  });

  it('adds authored roads to the road list (and the ground there is road-coloured)', () => {
    const a = at(-30, 60), b = at(30, 60);
    const t = createTerrain({
      ...input,
      zones: { ...ZONES, mossbottom: { ...mb, paths: [...(mb.paths ?? []), { id: 'p', kind: 'road', points: [[a.x, a.z], [b.x, b.z]] }, { id: 'w', kind: 'wall', points: [[0, 0], [5, 5]] }] } },
    });
    const plain = createTerrain(input);
    expect(t.roadSegments().length).toBe(plain.roadSegments().length + 1);
    expect(t.distToRoad(a.x + 10, a.z)).toBeCloseTo(0, 6);
    expect(t.groundColourAt(a.x + 10, a.z)).toBe(0x9b7a4c);
  });

  it('adds solid authored props as colliders', () => {
    const p = at(-60, 70);
    const t = createTerrain({
      ...input,
      zones: { ...ZONES, mossbottom: { ...mb, props: [{ prefab: 'barrel', x: p.x, z: p.z, solidR: 1.5 }] } },
    });
    expect(t.staticSolidAt(p.x, p.z)).toBe(true);
    expect(createTerrain(input).staticSolidAt(p.x, p.z)).toBe(false);
  });
});

describe('authored roads', () => {
  const key = (r: { ax: number; az: number; bx: number; bz: number }) => [r.ax, r.az, r.bx, r.bz].map((n) => n.toFixed(6)).join(',');

  it('converting the derived roads to paths changes nothing', () => {
    const plain = createTerrain(input);
    const t = createTerrain({ ...input, zones: { ...ZONES, mossbottom: { ...mb, roadMode: 'authored', paths: [...derivedRoadPaths(mb), ...(mb.paths ?? [])] } } });
    expect(t.roadSegments().map(key).sort()).toEqual(plain.roadSegments().map(key).sort());
    const r = rng(21);
    for (let i = 0; i < 400; i++) {
      const p = at((r() * 2 - 1) * 130, (r() * 2 - 1) * 130);
      expect(t.distToRoad(p.x, p.z)).toBeCloseTo(plain.distToRoad(p.x, p.z), 9);
      expect(t.groundColourAt(p.x, p.z)).toBe(plain.groundColourAt(p.x, p.z));
    }
  });

  it('authored mode with no paths drops that zone\'s star but keeps the passes between zones', () => {
    const plain = createTerrain(input);
    const t = createTerrain({ ...input, zones: { ...ZONES, mossbottom: { ...mb, roadMode: 'authored' } } });
    expect(t.roadSegments().length).toBe(plain.roadSegments().length - derivedRoadPaths(mb).length);
    expect(t.passes().length).toBe(plain.passes().length);
  });

  it('derivedRoadPaths lists the shrine-to-region and shrine-to-exit roads as two-point paths', () => {
    const paths = derivedRoadPaths(mb);
    expect(paths.length).toBeGreaterThan(5);
    expect(paths.every((p) => p.kind === 'road' && p.points.length === 2)).toBe(true);
    expect(new Set(paths.map((p) => p.id)).size).toBe(paths.length);
  });
});

describe('surface paint', () => {
  it('colours the ground it covers and nothing else', () => {
    const t = createTerrain(input);
    const p = at(-40, 70);
    const before = t.groundColourAt(p.x, p.z);
    const g = new PaintGrid();
    g.set(Math.floor(p.x), Math.floor(p.z), 3);
    t.setPaint(g);
    expect(t.groundColourAt(p.x, p.z)).toBe(PAINT_SURFACES.find((s) => s.id === 3)!.color);
    expect(t.groundColourAt(p.x + 3, p.z)).toBe(createTerrain(input).groundColourAt(p.x + 3, p.z));
    g.set(Math.floor(p.x), Math.floor(p.z), 0);
    expect(t.groundColourAt(p.x, p.z)).toBe(before);
  });

  it('keeps flora off painted ground once the area is invalidated', () => {
    const t = createTerrain(input);
    const C = WORLD.chunk;
    const base = at(40, 20);
    const ci = Math.floor(base.x / C), cj = Math.floor(base.z / C);
    expect(t.chunkFlora(ci, cj).length).toBeGreaterThan(0);
    const g = new PaintGrid();
    for (let x = ci * C; x < (ci + 1) * C; x++) for (let z = cj * C; z < (cj + 1) * C; z++) g.set(x, z, 1);
    t.setPaint(g);
    t.invalidate({ minX: ci * C, maxX: (ci + 1) * C, minZ: cj * C, maxZ: (cj + 1) * C });
    expect(t.chunkFlora(ci, cj).length).toBe(0);
  });
});

describe('walk grid', () => {
  const rect = { minX: at(-60, -60).x, maxX: at(60, 60).x, minZ: at(-60, -60).z, maxZ: at(60, 60).z };

  it('matches the live function exactly at cell centres and closely elsewhere, with gates and run-time props still live', () => {
    const t = createTerrain(input);
    const grid = new WalkGrid();
    const tile = bakeTile('mb', rect, (x, z) => t.staticSolidAt(x, z));
    grid.setTile(tile);
    const live = createTerrain(input);
    t.setWalkGrid(grid);
    const r = rng(11);
    for (let i = 0; i < 3000; i++) {
      const c = Math.floor(r() * tile.cols), row = Math.floor(r() * tile.rows);
      const x = tile.minX + (c + 0.5) * WALK_CELL, z = tile.minZ + (row + 0.5) * WALK_CELL;
      expect(grid.solidAt(x, z)).toBe(live.staticSolidAt(x, z));
      expect(t.isBlocked(x, z)).toBe(live.isBlocked(x, z));
    }
    let same = 0;
    const N = 4000;
    for (let i = 0; i < N; i++) {
      const x = rect.minX + r() * (rect.maxX - rect.minX), z = rect.minZ + r() * (rect.maxZ - rect.minZ);
      if (t.isBlocked(x, z) === live.isBlocked(x, z)) same++;
    }
    expect(same / N).toBeGreaterThan(0.99);
    // Outside every tile the live function answers.
    const out = at(-200, 0);
    expect(grid.solidAt(out.x, out.z)).toBeUndefined();
    expect(t.isBlocked(out.x, out.z)).toBe(live.isBlocked(out.x, out.z));
    // A prop added at run time still blocks, on a cell the grid says is free.
    let free: { x: number; z: number } | null = null;
    for (let i = 0; i < 500 && !free; i++) {
      const x = rect.minX + r() * (rect.maxX - rect.minX), z = rect.minZ + r() * (rect.maxZ - rect.minZ);
      if (!t.isBlocked(x, z)) free = { x, z };
    }
    expect(free).not.toBeNull();
    t.addCollider(free!.x, free!.z, 1);
    expect(t.isBlocked(free!.x, free!.z)).toBe(true);
  });

  it('invalidate(rect) drops the tiles it touches and the live function takes over', () => {
    const t = createTerrain(input);
    const grid = new WalkGrid();
    grid.setTile(bakeTile('mb', rect, (x, z) => t.staticSolidAt(x, z)));
    t.setWalkGrid(grid);
    expect(grid.tileIds).toEqual(['mb']);
    t.invalidate({ minX: rect.minX + 10, maxX: rect.minX + 20, minZ: rect.minZ + 10, maxZ: rect.minZ + 20 });
    expect(grid.tileIds).toEqual([]);
    expect(t.walkGrid).toBe(grid);
  });
});
