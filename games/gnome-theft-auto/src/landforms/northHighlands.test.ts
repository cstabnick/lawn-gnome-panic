// FX12 (D12): Snowcap Rise is white, with ice on Pail Pond, aprons round the pond and the slope, Capwood and
// Mittenholt's green thawed, and a frost band at the border. The Wasm kernel (assembly/kernel.ts evalRegionPaint)
// must paint the north band exactly as the JS rule does.
import { distToSeg } from '@lawn/level';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { TERRAIN, WORLD_HALF } from '../config';
import { PAINT_KINDS, regionPaintAt, riverDistAt, waterDistAt, type GroundFacts } from './index';
import { regionAt, trails } from '../levels';
import { GRID_N, heightGrid, resetTerrainOptions, setTerrainOptions } from '../terrain';
import { paintAt, paintRawBytes } from '../terrainPaint';
import { initGtaWasm } from '../wasm/gtaWasm';

const C = GRID_N - 1;
const S = TERRAIN.step;
const cellOf = (x: number, z: number): [number, number] => [Math.floor((x + WORLD_HALF) / S), Math.floor((z + WORLD_HALF) / S)];

/** The JS rule for one cell (terrainPaint.ts rawPaint, rules 1-4), or -1 on a trail. */
function jsCell(g: Float32Array, i: number, j: number, facts: GroundFacts): number {
  const x = -WORLD_HALF + (i + 0.5) * S, z = -WORLD_HALF + (j + 0.5) * S;
  for (const t of trails()) {
    const half = (t.width || TERRAIN.trailWidth) / 2;
    for (let q = 0; q + 1 < t.points.length; q++) {
      if (distToSeg(x, z, t.points[q][0], t.points[q][1], t.points[q + 1][0], t.points[q + 1][1]) <= half) return -1;
    }
  }
  const region = regionAt(x, z);
  if (region === 'turfton') return 0;
  const N = GRID_N;
  const h00 = g[j * N + i], h10 = g[j * N + i + 1], h01 = g[(j + 1) * N + i], h11 = g[(j + 1) * N + i + 1];
  const dx = (h10 - h00 + h11 - h01) / (2 * S), dz = (h01 - h00 + h11 - h10) / (2 * S);
  const slope = Math.hypot(dx, dz);
  if (slope >= TERRAIN.rockSlope) return PAINT_KINDS.indexOf('rock') + 1;
  facts.height = (h00 + h10 + h01 + h11) / 4;
  facts.slope = slope;
  facts.riverDist = riverDistAt(x, z);
  facts.waterDist = waterDistAt(x, z);
  facts.region = region;
  const own = regionPaintAt(x, z, facts);
  if (own) return PAINT_KINDS.indexOf(own) + 1;
  return facts.riverDist < TERRAIN.mudReach ? PAINT_KINDS.indexOf('mud') + 1 : 0;
}

describe('Snowcap Rise snow paint (D12)', () => {
  beforeAll(async () => {
    await initGtaWasm();
    setTerrainOptions({ amplitude: 1, testHill: false, landforms: true });
  });
  afterAll(() => resetTerrainOptions());

  it('the kernel paints the north band exactly as the JS rule (4,000 cells)', () => {
    const g = heightGrid()!;
    const raw = paintRawBytes()!;
    const facts: GroundFacts = { height: 0, slope: 0, riverDist: 0, waterDist: 0, region: 'turfton' };
    let checked = 0;
    const kinds = new Set<number>();
    for (let k = 0; checked < 4000 && k < 40000; k++) {
      const x = -1400 + ((k * 7919) % 3200), z = -900 - ((k * 104729) % 900);
      if (regionAt(x, z) !== 'north-highlands') continue;
      const [i, j] = cellOf(x, z);
      const want = jsCell(g, i, j, facts);
      if (want < 0) continue;
      expect(raw[j * C + i], `${x}, ${z}`).toBe(want);
      kinds.add(want);
      checked++;
    }
    expect(checked).toBe(4000);
    // ice, snow, meadow and gravel at least
    expect(kinds.size).toBeGreaterThanOrEqual(4);
  });

  it('is mostly white, with ice on the pond, snow round it, and Capwood and the green thawed', () => {
    heightGrid();
    expect(paintAt(-640, -1060)).toBe('ice');
    expect(paintAt(-640, -985)).toBe('snow'); // the pond's apron, on the road side
    expect(paintAt(-720, -1060)).toBe('snow'); // the apron, west
    expect(paintAt(-350, -1150)).toBe('snow'); // Snowdrop Slope
    expect(paintAt(250, -1180)).toBe('meadow'); // Capwood's thawed hollow
    expect(paintAt(550, -1375)).toBe('meadow'); // Mittenholt's green
    let snow = 0, n = 0;
    for (let x = -1350; x <= 1750; x += 25) {
      for (let z = -1780; z <= -910; z += 25) {
        if (regionAt(x, z) !== 'north-highlands') continue;
        const p = paintAt(x, z);
        if (p === null) continue;
        n++;
        if (p === 'snow' || p === 'ice') snow++;
      }
    }
    expect(snow / n).toBeGreaterThan(0.7);
  });
});
