// The Spine Cut (E33 G2): a road through a gorge cut in the Highland Spine. Geometry on the real land, then a drive-along.
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { HIGHWAYS } from '../config';
import { distToPolyline } from '../landforms/noise';
import { TRACKS } from '../raceTrack/tracks';
import { heightAt, naturalHeightAt, resetTerrainOptions, setTerrainOptions } from '../terrain';
import { padDistance } from './pads';
import { ROUTES } from './routes';
import { SPINE_CUT, SPINE_CUT_SPOTS, SPINE_PADS } from './defs/spineCut';

vi.mock('../audio', () => ({ play: () => undefined }));
(globalThis as { location?: { search: string } }).location ??= { search: '' };

const T = ROUTES['spine-cut'];
const half = SPINE_CUT.width / 2;
const hw = (id: string): readonly (readonly [number, number])[] => HIGHWAYS.find((h) => h.id === id)!.points;
const NORTH = hw('north-band-east');
const EAST = hw('east-band-north');

beforeAll(() => {
  resetTerrainOptions();
  setTerrainOptions({ amplitude: 1, testHill: false, landforms: true });
  heightAt(0, 0);
});

/** Depth of the walls at s-index k: how far the lower of the two land heights 10 m out stands above the road top. */
function wallDepth(k: number): number {
  const p = T.samples()[k];
  const top = T.roadTopAt(p, 0);
  const sides = [10, -10].flatMap((l) => [heightAt(p.x + p.nx * l, p.z + p.nz * l), naturalHeightAt(p.x + p.nx * l, p.z + p.nz * l)]);
  return Math.min(...sides) - top;
}

function segDir(points: readonly (readonly [number, number])[], x: number, z: number): { dx: number; dz: number } {
  let best = Infinity, dir = { dx: 1, dz: 0 };
  for (let i = 0; i + 1 < points.length; i++) {
    const [ax, az] = points[i], [bx, bz] = points[i + 1];
    const l2 = (bx - ax) ** 2 + (bz - az) ** 2;
    const t = Math.max(0, Math.min(1, ((x - ax) * (bx - ax) + (z - az) * (bz - az)) / l2));
    const d = Math.hypot(x - (ax + (bx - ax) * t), z - (az + (bz - az) * t));
    if (d < best) { best = d; const l = Math.sqrt(l2); dir = { dx: (bx - ax) / l, dz: (bz - az) / l }; }
  }
  return dir;
}

describe('the Spine Cut geometry', () => {
  it('keeps its identity', () => {
    expect(SPINE_CUT.id).toBe('spine-cut');
    expect(SPINE_CUT.kind).toBe('road');
    expect(SPINE_CUT.width).toBe(7);
    expect(SPINE_CUT.surface).toBe('asphalt');
    expect(SPINE_CUT.relief).toBe('ribbon');
    expect(SPINE_CUT.maxGrade ?? 1).toBeLessThanOrEqual(0.08);
  });

  it('joins the north band road and the east band road at an angle', () => {
    const S = T.samples();
    const a = S[0], b = S[S.length - 1];
    expect(a.x).toBeGreaterThanOrEqual(420);
    expect(a.x).toBeLessThanOrEqual(600);
    expect(distToPolyline(a.x, a.z, NORTH)).toBeLessThanOrEqual(1);
    expect(b.z).toBeGreaterThanOrEqual(-1080);
    expect(b.z).toBeLessThanOrEqual(-880);
    expect(distToPolyline(b.x, b.z, EAST)).toBeLessThanOrEqual(1);
    const angle = (k: number, pts: readonly (readonly [number, number])[], x: number, z: number): number => {
      const d = segDir(pts, x, z);
      return (Math.acos(Math.min(1, Math.abs(S[k].tx * d.dx + S[k].tz * d.dz))) * 180) / Math.PI;
    };
    for (let k = 0; k <= 15; k++) expect(angle(k, NORTH, a.x, a.z), `start angle at ${k}`).toBeGreaterThanOrEqual(45);
    for (let k = S.length - 16; k < S.length; k++) expect(angle(k, EAST, b.x, b.z), `end angle at ${k}`).toBeGreaterThanOrEqual(45);
  });

  it('is 0.7-1.3 km with gentle bends and grades, and never an embankment', () => {
    expect(T.length()).toBeGreaterThanOrEqual(700);
    expect(T.length()).toBeLessThanOrEqual(1300);
    const S = T.samples();
    for (let k = 0; k < S.length; k++) {
      expect(Math.abs(S[k].curv), `curv at s=${S[k].s.toFixed(0)}`).toBeLessThanOrEqual(0.05);
      if (k) {
        const ds = Math.hypot(S[k].x - S[k - 1].x, S[k].z - S[k - 1].z);
        expect(Math.abs(T.roadTopAt(S[k], 0) - T.roadTopAt(S[k - 1], 0)) / ds, `grade at s=${S[k].s.toFixed(0)}`).toBeLessThanOrEqual(0.08);
      }
      expect(T.roadTopAt(S[k], 0) - naturalHeightAt(S[k].x, S[k].z), `fill at s=${S[k].s.toFixed(0)}`).toBeLessThanOrEqual(4);
    }
  });

  it('cuts through the Spine: 80+ m of walls 10 m above the road, 16+ m at the deepest', () => {
    const S = T.samples();
    let run = 0, best = 0, deepest = 0, deepK = 0;
    for (let k = 0; k < S.length; k++) {
      const d = wallDepth(k);
      run = d >= 10 ? run + 1 : 0;
      best = Math.max(best, run);
      if (d > deepest) { deepest = d; deepK = k; }
    }
    expect(best).toBeGreaterThanOrEqual(80);
    expect(deepest).toBeGreaterThanOrEqual(16);
    const kh = SPINE_CUT_SPOTS.keyhole;
    expect(Math.hypot(S[deepK].x - kh.x, S[deepK].z - kh.z)).toBeLessThan(6);
    expect(Math.abs(Math.atan2(Math.sin(S[deepK].yaw - kh.yaw), Math.cos(S[deepK].yaw - kh.yaw)))).toBeLessThan(0.1);
  });

  it('keeps clear of Capwood, Pinwheel Ridge, Mittenholt and the Capwood Run', () => {
    const S = T.samples();
    const clear = 20 + half;
    const rectDist = (x: number, z: number, r: { minX: number; maxX: number; minZ: number; maxZ: number }): number =>
      Math.hypot(Math.max(r.minX - x, 0, x - r.maxX), Math.max(r.minZ - z, 0, z - r.maxZ));
    const capwood = { minX: 100, maxX: 400, minZ: -1280, maxZ: -1080 };
    const pinwheel = { minX: 700, maxX: 1000, minZ: -1245, maxZ: -1155 };
    const trails = { minX: 700, maxX: 1000, minZ: -1253, maxZ: -1251 };
    const run = TRACKS['capwood-run'].samples();
    for (let k = 0; k < S.length; k += 2) {
      const p = S[k];
      expect(rectDist(p.x, p.z, capwood), `capwood at s=${p.s.toFixed(0)}`).toBeGreaterThanOrEqual(clear);
      expect(rectDist(p.x, p.z, pinwheel), `pinwheel at s=${p.s.toFixed(0)}`).toBeGreaterThanOrEqual(clear);
      expect(rectDist(p.x, p.z, trails), `pinwheel trails at s=${p.s.toFixed(0)}`).toBeGreaterThanOrEqual(clear);
      expect(Math.hypot(p.x - 550, p.z + 1375) - 75, `Mittenholt at s=${p.s.toFixed(0)}`).toBeGreaterThanOrEqual(clear);
    }
    for (let k = 0; k < S.length; k += 5) for (let j = 0; j < run.length; j += 5) {
      expect(Math.hypot(S[k].x - run[j].x, S[k].z - run[j].z)).toBeGreaterThanOrEqual(30);
    }
  });

  it('names every spot and pad, near the road, the pads off it', () => {
    const names = ['start', 'end', 'keyhole', 'gorgeIn', 'gorgeOut', 'rockfall', 'moorBend', 'surveyor'];
    for (const n of names) {
      const s = SPINE_CUT_SPOTS[n];
      expect(s, n).toBeDefined();
      const loc = T.locate(s.x, s.z, 30);
      expect(loc, `${n} within 30 m`).not.toBeNull();
    }
    const S = T.samples();
    const gi = T.locate(SPINE_CUT_SPOTS.gorgeIn.x, SPINE_CUT_SPOTS.gorgeIn.z, 30)!;
    const go = T.locate(SPINE_CUT_SPOTS.gorgeOut.x, SPINE_CUT_SPOTS.gorgeOut.z, 30)!;
    const kh = T.locate(SPINE_CUT_SPOTS.keyhole.x, SPINE_CUT_SPOTS.keyhole.z, 30)!;
    expect(gi.s).toBeLessThan(kh.s);
    expect(kh.s).toBeLessThan(go.s);
    expect(wallDepth(Math.round(gi.s))).toBeGreaterThanOrEqual(2.9);
    expect(wallDepth(Math.round(go.s))).toBeGreaterThanOrEqual(2.9);
    const rf = T.locate(SPINE_CUT_SPOTS.rockfall.x, SPINE_CUT_SPOTS.rockfall.z, 30)!;
    expect(rf.s).toBeGreaterThan(gi.s);
    expect(rf.s).toBeLessThan(go.s);
    // the pull-in lies just outside the gorge mouth, facing the arch
    const pull = SPINE_PADS.find((p) => p.id === 'keyhole-pullin')!;
    expect(pull.surface).toBe('gravel');
    expect(2 * pull.hw * 2 * pull.hd).toBeGreaterThan(120);
    const pl = T.locate(pull.x, pull.z, 40)!;
    expect(pl.s).toBeLessThan(gi.s);
    expect(gi.s - pl.s).toBeLessThan(40);
    const lay = SPINE_PADS.find((p) => p.id === 'moor-layby')!;
    expect(lay.surface).toBe('gravel');
    expect(2 * lay.hw * 2 * lay.hd).toBeGreaterThan(100);
    for (const pad of SPINE_PADS) {
      expect(pad.route).toBe('spine-cut');
      expect(T.locate(pad.x, pad.z, 30), `${pad.id} within 30 m`).not.toBeNull();
      let nearest = Infinity;
      for (const p of S) nearest = Math.min(nearest, padDistance(pad, p.x, p.z));
      expect(nearest, `${pad.id} off the road`).toBeGreaterThanOrEqual(half + 1);
    }
  });
});

describe('driving the Spine Cut', () => {
  for (const kind of ['ride-on', 'lowrider'] as const) {
    for (const reverse of [false, true]) {
      it(`${kind} ${reverse ? 'back' : 'there'} in the right lane`, async () => {
        const { driveAlong } = await import('./driveAlong');
        const r = driveAlong(T, kind, { lane: 1.75, reverse });
        expect(r.reached).toBe(true);
        expect(r.maxLat).toBeLessThan(3);
        expect(r.maxStall).toBeLessThan(4);
        expect(r.maxSink).toBeLessThan(0.3);
        expect(r.flipped).toBe(false);
      });
    }
  }
});
