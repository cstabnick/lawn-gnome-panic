// The Capwood Run (E14, route 2C): a long rally line over the Fells mountain and through Capwood, kept clear of the
// highways, the sites and Capwood's fixed places; a road that follows the land; and fords of Cap-water that never flood
// a car (while deep water elsewhere still does). Real terrain, landforms on.
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { HIGHWAYS, VEHICLES } from '../config';
import { CAP_COUNT_SPOTS, GREAT_RING, ROUTE_CLEARANCE, WARDEN_HUT } from '../capwood/spots';
import { distToPolyline } from '../landforms/noise';
import { SITES, siteRect } from '../sites';
import { heightAt, naturalHeightAt, resetTerrainOptions, setTerrainOptions, waterAt } from '../terrain';
import type { Vehicle } from '../types';
import { WATERLOG, stepWaterlog } from '../waterlog';
import { nearTrack, TRACKS } from './tracks';

vi.mock('../audio', () => ({ play: () => undefined }));

const T = TRACKS['capwood-run'];

beforeAll(() => {
  setTerrainOptions({ amplitude: 1, testHill: false, landforms: true });
  heightAt(0, 0); // build the grid once
});
afterAll(() => resetTerrainOptions());

function car(x: number, z: number, y: number, speed: number): Vehicle {
  return {
    id: 1, kind: 'ride-on', spec: VEHICLES['ride-on'], x, y, z, yaw: 0, speed, vy: 0, driver: 'none', tint: 0,
    object: {} as never, rider: null, riderLook: null, wheelSpin: 0, steerVis: 0, hp: 1, damage: 0, lastHit: 0,
    waterlog: 0, waterlogStalled: false, exploded: false, sunk: false,
  } as unknown as Vehicle;
}

describe('the Capwood Run route', () => {
  it('is 2.6-4 km, passes the summit, finishes at the Capwood clearing, and keeps clear of everything', () => {
    expect(T.length()).toBeGreaterThan(2600);
    expect(T.length()).toBeLessThan(4000);
    const S = T.samples();
    const dist = (x: number, z: number): number => Math.min(...S.map((p) => Math.hypot(p.x - x, p.z - z)));
    expect(dist(300, -900)).toBeLessThan(40);
    const f = T.frame(T.finishS());
    expect(Math.hypot(f.x - 150, f.z + 1300)).toBeLessThan(40);
    expect(dist(WARDEN_HUT.x, WARDEN_HUT.z)).toBeGreaterThanOrEqual(ROUTE_CLEARANCE);
    expect(dist(GREAT_RING.x, GREAT_RING.z)).toBeGreaterThanOrEqual(ROUTE_CLEARANCE);
    for (const c of CAP_COUNT_SPOTS) expect(dist(c.x, c.z), c.label).toBeGreaterThanOrEqual(ROUTE_CLEARANCE);
    for (const h of HIGHWAYS.filter((q) => ['north-outer', 'north-band', 'north-band-east'].includes(q.id))) {
      for (let k = 0; k < S.length; k += 3) {
        expect(distToPolyline(S[k].x, S[k].z, h.points), `${h.id} at s=${S[k].s.toFixed(0)}`).toBeGreaterThanOrEqual(30);
      }
    }
    const reach = T.def.barrierOffset;
    for (const site of SITES) {
      if (site.id === 'rally-route' || site.id === 'toadstool-forest') continue;
      const r = siteRect(site.id);
      for (let k = 0; k < S.length; k += 3) {
        const p = S[k];
        const inside = p.x > r.minX - reach && p.x < r.maxX + reach && p.z > r.minZ - reach && p.z < r.maxZ + reach;
        expect(inside, `${site.id} at s=${p.s.toFixed(0)}`).toBe(false);
      }
    }
    expect(Math.min(...S.map((p) => p.x))).toBeGreaterThan(-200);
  });

  it('has a road grade of at most 0.25 (except over the jump), and cut/fill under 8 m', () => {
    const S = T.samples();
    const jumps = T.def.jumps;
    for (let k = 1; k < S.length; k++) {
      const a = S[k - 1], b = S[k];
      const ds = Math.hypot(b.x - a.x, b.z - a.z);
      const overJump = jumps.some((j) => b.s > j.s - j.up - 2 && b.s < j.s + j.down + 2);
      if (!overJump) {
        expect(Math.abs(T.roadTopAt(b, 0) - T.roadTopAt(a, 0)) / ds, `grade at s=${b.s.toFixed(0)}`).toBeLessThanOrEqual(0.25);
      }
      expect(Math.abs(T.roadTopAt(b, 0) - naturalHeightAt(b.x, b.z)), `cut/fill at s=${b.s.toFixed(0)}`).toBeLessThan(8);
    }
  });

  it('puts Cap-water in both fords, shallow everywhere', () => {
    const fords = T.def.fords ?? [];
    expect(fords).toHaveLength(2);
    for (const f of fords) {
      const c = T.sampleAt(f.s);
      const w = waterAt(c.x, c.z);
      expect(w?.ford, f.id).toBe(true);
      expect(w!.depth).toBeGreaterThan(0.2);
      expect(w!.depth).toBeLessThan(0.5);
      let deepest = 0;
      for (let d = -f.len / 2; d <= f.len / 2; d += 1) {
        const p = T.sampleAt(f.s + d);
        for (let lat = -T.def.width / 2; lat <= T.def.width / 2; lat += 1) {
          const q = waterAt(p.x + p.nx * lat, p.z + p.nz * lat);
          if (q) deepest = Math.max(deepest, q.depth);
        }
      }
      expect(deepest, f.id).toBeLessThan(0.6);
    }
  });

  it('never floods a car in a ford, but deep water still does', () => {
    const v = car(0, 0, 0, 4);
    const fords = T.def.fords ?? [];
    for (const f of fords) {
      for (let s = f.s - f.len / 2 - 20; s <= f.s + f.len / 2 + 20; s += 4 * 0.05) {
        const p = T.sampleAt(s);
        v.x = p.x; v.z = p.z; v.y = heightAt(p.x, p.z);
        stepWaterlog(v, 0.05);
        expect(v.waterlog ?? 0).toBeLessThanOrEqual(WATERLOG.fordCap + 1e-9);
        expect(v.waterlogStalled).toBeFalsy();
      }
    }
    expect(v.waterlog ?? 0).toBeGreaterThan(0.05); // it did soak a little
    let spot: { x: number; z: number } | null = null;
    for (let x = -850; x <= -650 && !spot; x += 10) {
      for (let z = -750; z <= -350 && !spot; z += 10) {
        const w = waterAt(x, z);
        if (w && !w.ford && w.depth > 1) spot = { x, z };
      }
    }
    expect(spot).not.toBeNull();
    const d = car(spot!.x, spot!.z, waterAt(spot!.x, spot!.z)!.surface - 0.1, 0);
    for (let i = 0; i < 400; i++) stepWaterlog(d, 0.05);
    expect(d.waterlogStalled).toBe(true);
  });

  it('is near the track on the centre line and not 60 m to the side at the summit', () => {
    for (const s of [100, 800, 1800, 2400]) {
      const p = T.sampleAt(s);
      expect(nearTrack(p.x, p.z)).toBe(true);
    }
    const p = T.samples().reduce((best, q) => (Math.hypot(q.x - 300, q.z + 900) < Math.hypot(best.x - 300, best.z + 900) ? q : best));
    // Sixty metres to the south-east of the summit pass (away from the road) is open country.
    expect(nearTrack(p.x + p.nx * 60, p.z + p.nz * 60)).toBe(false);
    expect(nearTrack(p.x - p.nx * 60, p.z - p.nz * 60)).toBe(false);
  });
});
