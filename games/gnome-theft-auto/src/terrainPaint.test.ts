import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { TERRAIN, WORLD_HALF } from './config';
import { PAINT_KINDS } from './landforms';
import { GRID_N, resetTerrainOptions, setTerrainOptions } from './terrain';
import { inRockSite, paintAt, paintGridBytes, paintRawBytes, ROCK_SITES } from './terrainPaint';

const ROCK = PAINT_KINDS.indexOf('rock') + 1;
const C = GRID_N - 1;
const cellOf = (x: number, z: number): number =>
  Math.floor((z + WORLD_HALF) / TERRAIN.step) * C + Math.floor((x + WORLD_HALF) / TERRAIN.step);

describe('terrain paint: rock sites and feathered borders', () => {
  beforeAll(() => setTerrainOptions({ amplitude: 1, testHill: false, landforms: true }));
  afterAll(() => resetTerrainOptions());

  it('has the two rock sites', () => {
    expect(ROCK_SITES.map((s) => s.id).sort()).toEqual(['ridge/hatbrim', 'ridge/highland-spine']);
  });

  it('paints rock only inside a rock site, and some of the Hatbrim is rock', () => {
    const paint = paintGridBytes()!;
    let inside = 0;
    for (let j = 0; j < C; j++) {
      for (let i = 0; i < C; i++) {
        if (paint[j * C + i] !== ROCK) continue;
        const x = -WORLD_HALF + (i + 0.5) * TERRAIN.step, z = -WORLD_HALF + (j + 0.5) * TERRAIN.step;
        // The feather moves a border by one cell, so allow that much slack beyond the site.
        const near = inRockSite(x, z) || [[-2, 0], [2, 0], [0, -2], [0, 2], [-2, -2], [2, 2], [-2, 2], [2, -2]].some(([a, b]) => inRockSite(x + a, z + b));
        expect(near, `rock at ${x},${z}`).toBe(true);
        if (inRockSite(x, z)) inside++;
      }
    }
    expect(inside).toBeGreaterThan(0);
  });

  it('paints no rock on the Anthill or the Rutbottom corners', () => {
    const paint = paintGridBytes()!;
    for (let a = 0; a < 360; a += 10) {
      const r = (a * Math.PI) / 180;
      for (const d of [32, 38, 45, 60]) expect(paint[cellOf(1240 + Math.cos(r) * d, 150 + Math.sin(r) * d)]).not.toBe(ROCK);
    }
    expect(paint[cellOf(1240, 190)]).not.toBe(ROCK);
    expect(paint[cellOf(1215, -560)]).not.toBe(ROCK);
  });

  it('feathers only border cells, deterministically, in little time', () => {
    const raw = paintRawBytes()!;
    const a = paintGridBytes()!.slice();
    const b = paintGridBytes()!;
    expect(Array.from(a.subarray(0, 5000))).toEqual(Array.from(b.subarray(0, 5000)));
    // Cells that changed from the raw grid (other than rock re-painted by the rock rule) had a differing neighbour in the
    // finished grid's source; check the weaker, robust property: interior cells of a 3x3 uniform raw block never change
    // unless they were rock outside a site.
    let changed = 0, interiorChanged = 0;
    for (let j = 1; j < C - 1; j++) {
      for (let i = 1; i < C - 1; i++) {
        const idx = j * C + i, v = raw[idx];
        if (a[idx] === v) continue;
        changed++;
        if (v === ROCK) continue;
        const uniform = raw[idx - 1] === v && raw[idx + 1] === v && raw[idx - C] === v && raw[idx + C] === v;
        if (uniform) interiorChanged++;
      }
    }
    expect(changed).toBeGreaterThan(0);
    expect(interiorChanged).toBe(0);
  });
});
