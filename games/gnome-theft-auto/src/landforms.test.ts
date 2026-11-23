// The region landforms (Epic 5): with the authored land on (amplitude 1), every region keeps its roads drivable, its
// rivers running, its flat sites flat and its buildings on level ground, and shows the landforms and paint it promises.
// One describe block per region: `npx vitest run src/landforms.test.ts -t dust-flats` checks one region.
import { afterAll, describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { AIRFIELD, BASE, TERRAIN } from './config';
import { installFakeDom } from './testing/fakeDom';
import { REGION_DOCS, highways, markerNum, markersOf, regionAt, trails, waterPaths, type RegionId } from './levels';
import { LANDFORMS, tiltAt, waterDistAt, type PaintKind } from './landforms';
import { heightAt, heightGrid, naturalHeightAt, resetTerrainOptions, setTerrainOptions, slopeAt } from './terrain';
import { paintAt } from './terrainPaint';

installFakeDom();
setTerrainOptions({ amplitude: 1, testHill: false, landforms: true });
const t0 = performance.now();
heightGrid();
const GRID_MS = performance.now() - t0;
const { buildBiomes } = await import('./biomes');
const built = buildBiomes(new THREE.Scene());

afterAll(resetTerrainOptions);

/** The steepest a highway may climb along its length (rise over run), and a trail. */
const MAX_ROAD_GRADE = 0.16;
const MAX_TRAIL_GRADE = 0.3;
/** At most this share of a region's land may be steeper than 0.6 (31 degrees: cliffs, mesa sides, glen walls). */
const MAX_STEEP_SHARE = 0.08;
/** How far a river's natural ground may rise above its lowest point upstream (the water epic carves the rest). */
const MAX_RIVER_RISE = 1.5;
/** How much the ground may vary under one building's footprint. */
const MAX_FOOTPRINT_STEP = 1.2;

/** Paint each region's landforms promise (at least one cell of each). */
const PROMISED_PAINT: Record<Exclude<RegionId, 'turfton'>, PaintKind[]> = {
  'dust-flats': ['dirt', 'rock'],
  'mossy-wood': ['mud', 'forest'],
  'frostbite-fells': ['ice', 'rock'],
  'cloverfield-farms': ['mud', 'farm'],
  'tallgrass-commons': ['meadow'],
  'loch-moss': ['gravel', 'rock'],
};

/** Points of a region on a `step` grid. */
function samples(id: RegionId, step: number): [number, number][] {
  const out: [number, number][] = [];
  for (let z = -900 + step / 2; z < 900; z += step) {
    for (let x = -900 + step / 2; x < 900; x += step) if (regionAt(x, z) === id) out.push([x, z]);
  }
  return out;
}

/** Points every `step` metres along a polyline. */
function along(points: readonly (readonly [number, number])[], step: number): [number, number][] {
  const out: [number, number][] = [];
  for (let k = 0; k + 1 < points.length; k++) {
    const [ax, az] = points[k], [bx, bz] = points[k + 1];
    const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / step));
    for (let s = k === 0 ? 0 : 1; s <= n; s++) out.push([ax + ((bx - ax) * s) / n, az + ((bz - az) * s) / n]);
  }
  return out;
}

function steepestGrade(points: readonly (readonly [number, number])[], id: RegionId): number {
  const pts = along(points, 2);
  let worst = 0;
  for (let k = 0; k + 1 < pts.length; k++) {
    const [ax, az] = pts[k], [bx, bz] = pts[k + 1];
    if (regionAt(ax, az) !== id) continue;
    worst = Math.max(worst, Math.abs(heightAt(bx, bz) - heightAt(ax, az)) / Math.hypot(bx - ax, bz - az));
  }
  return worst;
}

describe('the regional tilt', () => {
  it('falls from the north (the house) to the south (the Puddle Sea), level across Turfton', () => {
    expect(tiltAt(0, -900)).toBeGreaterThan(2);
    expect(tiltAt(0, 900)).toBeLessThan(-2);
    expect(tiltAt(0, TERRAIN.tiltFlatHalf)).toBe(0);
    expect(tiltAt(0, -TERRAIN.tiltFlatHalf)).toBe(0);
  });

  it('leaves Turfton at exactly 0', () => {
    for (const [x, z] of [[0, 0], [215, 215], [-215, -215], [215, -100], [-100, 215]]) expect(heightAt(x, z)).toBe(0);
  });

  it('builds the height grid in reasonable time', () => {
    expect(GRID_MS).toBeLessThan(6000);
  });
});

describe.each(Object.keys(PROMISED_PAINT) as Exclude<RegionId, 'turfton'>[])('%s', (id) => {
  const land = samples(id, 8);

  it('has its landforms: the document names the generator and the relief is not flat', () => {
    const t = REGION_DOCS[id].data.terrain;
    expect(t, `${id}.level.json needs data.terrain`).toBeDefined();
    expect(t!.relief.id).toBe(LANDFORMS[id]!.id);
    // Relief plus stamps: the natural height without the tilt.
    const r = land.map(([x, z]) => naturalHeightAt(x, z) - tiltAt(x, z));
    const mean = r.reduce((a, b) => a + b, 0) / r.length;
    const sd = Math.sqrt(r.reduce((a, b) => a + (b - mean) ** 2, 0) / r.length);
    expect(sd, 'relief standard deviation (m)').toBeGreaterThan(0.5);
  });

  it('keeps every height within -30 to 100 m', () => {
    for (const [x, z] of land) {
      const h = heightAt(x, z);
      expect(h, `height at ${x}, ${z}`).toBeGreaterThan(-30);
      expect(h, `height at ${x}, ${z}`).toBeLessThan(100);
    }
  });

  it('keeps its highways and trails drivable along their length', () => {
    for (const hw of highways()) expect(steepestGrade(hw.points, id), `highway ${hw.id}`).toBeLessThanOrEqual(MAX_ROAD_GRADE);
    for (const t of trails()) expect(steepestGrade(t.points, id), `trail ${t.id}`).toBeLessThanOrEqual(MAX_TRAIL_GRADE);
  });

  it('keeps most of its land drivable', () => {
    const steep = land.filter(([x, z]) => slopeAt(x, z) > 0.6).length;
    expect(steep / land.length, 'share of land steeper than 0.6').toBeLessThanOrEqual(MAX_STEEP_SHARE);
  });

  it('keeps the rivers running downhill (no more than a small rise the water epic carves)', () => {
    for (const p of waterPaths()) {
      let low = Infinity;
      for (const [x, z] of along(p.points, 2)) {
        const h = naturalHeightAt(x, z);
        low = Math.min(low, h);
        if (regionAt(x, z) === id) expect(h - low, `${p.id} at ${x.toFixed(0)}, ${z.toFixed(0)}`).toBeLessThanOrEqual(MAX_RIVER_RISE);
      }
    }
  });

  it('keeps its flat sites flat', () => {
    const rects = markersOf('reserve')
      // The Speedway's reserve is flat except under the track, which raises its own road (raceTrack/track.test.ts checks the pan).
      .filter((m) => m.region === id && m.id !== 'reserve/speedway')
      .map((m) => ({ minX: m.x - markerNum(m, 'hw'), maxX: m.x + markerNum(m, 'hw'), minZ: m.z - markerNum(m, 'hd'), maxZ: m.z + markerNum(m, 'hd') }));
    if (id === 'dust-flats') {
      rects.push({ minX: BASE.minX, maxX: BASE.maxX, minZ: BASE.minZ, maxZ: BASE.maxZ });
      // The runway's bounds, as terrain.ts measures them.
      const hx = Math.abs(Math.sin(AIRFIELD.yaw)) * AIRFIELD.length / 2 + Math.abs(Math.cos(AIRFIELD.yaw)) * AIRFIELD.width / 2;
      const hz = Math.abs(Math.cos(AIRFIELD.yaw)) * AIRFIELD.length / 2 + Math.abs(Math.sin(AIRFIELD.yaw)) * AIRFIELD.width / 2;
      rects.push({ minX: AIRFIELD.x - hx, maxX: AIRFIELD.x + hx, minZ: AIRFIELD.z - hz, maxZ: AIRFIELD.z + hz });
    }
    for (const r of rects) {
      // Sites on the water (the Basin is the river's source, the canal banks hold the canal) are the water epic's.
      if (waterDistAt((r.minX + r.maxX) / 2, (r.minZ + r.maxZ) / 2) < Math.max(r.maxX - r.minX, r.maxZ - r.minZ) / 2 + 2) continue;
      const hs: number[] = [];
      for (let a = 0; a <= 4; a++) for (let b = 0; b <= 4; b++) hs.push(heightAt(r.minX + ((r.maxX - r.minX) * a) / 4, r.minZ + ((r.maxZ - r.minZ) * b) / 4));
      expect(Math.max(...hs) - Math.min(...hs), `site at ${r.minX}, ${r.minZ}`).toBeLessThanOrEqual(0.05);
    }
  });

  it('keeps its buildings on level ground', () => {
    for (const b of built.boxes) {
      const w = b.maxX - b.minX, d = b.maxZ - b.minZ;
      if (Math.min(w, d) < 2.5) continue;
      const cx = (b.minX + b.maxX) / 2, cz = (b.minZ + b.maxZ) / 2;
      if (regionAt(cx, cz) !== id) continue;
      // Old scatter standing on the river course is the water epic's to clear.
      if (waterDistAt(cx, cz) < Math.max(w, d) / 2 + 4) continue;
      const hs = [heightAt(cx, cz), heightAt(b.minX, b.minZ), heightAt(b.maxX, b.minZ), heightAt(b.minX, b.maxZ), heightAt(b.maxX, b.maxZ)];
      expect(Math.max(...hs) - Math.min(...hs), `box at ${cx.toFixed(0)}, ${cz.toFixed(0)} (${w.toFixed(0)} x ${d.toFixed(0)})`).toBeLessThanOrEqual(MAX_FOOTPRINT_STEP);
    }
  });

  it('shows the paint it promises', () => {
    const seen = new Set<PaintKind>();
    for (const [x, z] of samples(id, 2)) {
      const p = paintAt(x, z);
      if (p) seen.add(p);
    }
    for (const k of PROMISED_PAINT[id]) expect([...seen], `paint "${k}" somewhere in ${id}`).toContain(k);
  });
});
