import { describe, expect, it } from 'vitest';
import { trails } from '../../levels';
import { districtAt, pathPoints, townLines, type Footprint } from '../layout';
import { buildingFootprint } from '../plan';
import { pardonlinPlans } from '../plans';
import { laneHouses } from './lanes';

type Pt = readonly [number, number];

const plans = pardonlinPlans();
const lanes = trails().filter((t) => t.id.startsWith('trail/pl-'));
const COBBLE_HALF = 1.75;

function samples(pts: readonly Pt[], step: number): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 1; i < pts.length; i++) {
    const [ax, az] = pts[i - 1], [bx, bz] = pts[i];
    const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / step));
    for (let k = 0; k < n; k++) out.push([ax + ((bx - ax) * k) / n, az + ((bz - az) * k) / n]);
  }
  out.push([pts[pts.length - 1][0], pts[pts.length - 1][1]]);
  return out;
}

function lengthOf(pts: readonly Pt[]): number {
  let l = 0;
  for (let i = 1; i < pts.length; i++) l += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return l;
}

/** Distance from a point to a footprint's outline (0 inside). */
function distToFootprint(f: Footprint, x: number, z: number): number {
  const dx = x - f.x, dz = z - f.z;
  const c = Math.cos(f.yaw), s = Math.sin(f.yaw);
  const lx = Math.abs(dx * c - dz * s) - f.w / 2;
  const lz = Math.abs(dx * s + dz * c) - f.d / 2;
  return Math.hypot(Math.max(lx, 0), Math.max(lz, 0));
}

const distTo = (pts: readonly Pt[], x: number, z: number): number => {
  let best = Infinity;
  for (let i = 1; i < pts.length; i++) {
    const [ax, az] = pts[i - 1], [bx, bz] = pts[i];
    const dx = bx - ax, dz = bz - az;
    const l2 = dx * dx + dz * dz || 1;
    const k = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / l2));
    best = Math.min(best, Math.hypot(x - ax - dx * k, z - az - dz * k));
  }
  return best;
};

const footprints = plans.flatMap((p) => p.buildings.map((b) => buildingFootprint(b)!).filter(Boolean));
const thymes = pathPoints('thymes');

describe('Pardonlin lanes', () => {
  it('has lanes in the Old Town, the Left Bank and Teacup Row', () => {
    const by = new Map<string, number>();
    for (const l of lanes) {
      const mid = pathPoints(l.id)[Math.floor(pathPoints(l.id).length / 2)];
      const d = districtAt(mid[0], mid[1]) ?? 'none';
      by.set(d, (by.get(d) ?? 0) + 1);
    }
    expect(by.get('old-town') ?? 0).toBeGreaterThanOrEqual(2);
    expect(by.get('left-bank') ?? 0).toBeGreaterThanOrEqual(2);
    expect(by.get('teacup-quays') ?? 0).toBeGreaterThanOrEqual(2);
  });

  it('stays inside the building budget', () => {
    const total = [...laneHouses.values()].reduce((n, l) => n + l.length, 0);
    expect(total).toBeGreaterThan(60);
    expect(total).toBeLessThanOrEqual(120);
  });

  describe.each(lanes.map((l) => [l.id, l] as const))('%s', (id, lane) => {
    const pts = pathPoints(id);
    const total = lengthOf(pts);

    it('is a 3-4 m wide lane with at least four points', () => {
      expect(lane.width).toBeGreaterThanOrEqual(3);
      expect(lane.width).toBeLessThanOrEqual(4);
      expect(pts.length).toBeGreaterThanOrEqual(4);
    });

    it('keeps 13 m from the Thymes and off every road and vignette spot', () => {
      const roads = townLines().roads;
      const s = samples(pts, 1.5);
      for (const [x, z] of s) {
        expect(distTo(thymes, x, z), `Thymes at (${x.toFixed(1)}, ${z.toFixed(1)})`).toBeGreaterThanOrEqual(13);
      }
      // Never on a road, except where it meets one at its two ends (under the pavement, 5-8 m from the centre line).
      for (const [x, z] of s.slice(3, -3)) {
        const near = roads.reduce((m, r) => Math.min(m, Math.hypot(r.x - x, r.z - z) - r.half), Infinity);
        expect(near, `road at (${x.toFixed(1)}, ${z.toFixed(1)})`).toBeGreaterThan(COBBLE_HALF + 0.8);
      }
      for (const end of [pts[0], pts[pts.length - 1]]) {
        const d = roads.reduce((m, r) => Math.min(m, Math.hypot(r.x - end[0], r.z - end[1])), Infinity);
        expect(d, `lane end (${end[0].toFixed(1)}, ${end[1].toFixed(1)}) from a road centre`).toBeGreaterThanOrEqual(5);
        expect(d).toBeLessThanOrEqual(8.2);
      }
      for (const p of plans) for (const v of p.vignettes) expect(distTo(pts, v.x, v.z), v.id).toBeGreaterThan(6);
    });

    it('has houses within 3 m of its edge along at least half its length', () => {
      const s = samples(pts, 2);
      const built = s.filter(([x, z]) => footprints.some((f) => distToFootprint(f, x, z) <= COBBLE_HALF + 3)).length;
      expect(built / s.length, `${id}: ${built}/${s.length} (length ${total.toFixed(0)} m)`).toBeGreaterThanOrEqual(0.5);
    });

    it('has houses, a courtyard prop and at least one lamp or pot beside it', () => {
      expect(laneHouses.get(id)?.length ?? 0).toBeGreaterThan(4);
      const near = plans.flatMap((p) => p.props).filter((q) => distTo(pts, q.x, q.z) < 9);
      expect(near.length).toBeGreaterThan(3);
    });
  });
});
