// The Anthill (E13 A06): a flat summit for the observatory, painted earth, the dirt road up, and Dean's Leap's jump.
import { describe, expect, it, vi } from 'vitest';
import { WORLD_HALF } from '../config';
import { trails } from '../levels';
import { rampContactAt } from '../ramps';
import { RAMP_LAUNCH, STUNT_RAMPS } from '../stunts';
import { heightAt } from '../terrain';
import { paintAt } from '../terrainPaint';
import { OBSERVATORY } from './types';

vi.mock('../audio', () => ({ play: () => undefined }));
// simdrive.ts (pulled in by vehicles.ts) reads location.search when it loads; the test runs in node.
(globalThis as { location?: { search: string } }).location ??= { search: '' };
const { ARCADE_AIR } = await import('../vehicles');

const S = OBSERVATORY.summit;
const ROAD = trails().find((t) => t.id === 'trail/anthill-road');

/** The road's centre line every 2 m of its length. */
function resample(pts: readonly (readonly [number, number])[], step: number): { s: number; x: number; z: number }[] {
  const lens: number[] = [];
  let total = 0;
  for (let k = 0; k + 1 < pts.length; k++) {
    const L = Math.hypot(pts[k + 1][0] - pts[k][0], pts[k + 1][1] - pts[k][1]);
    lens.push(L);
    total += L;
  }
  const out: { s: number; x: number; z: number }[] = [];
  let k = 0;
  let segStart = 0;
  for (let s = 0; s <= total + 1e-9; s += step) {
    while (k + 1 < lens.length && s > segStart + lens[k]) { segStart += lens[k]; k++; }
    const t = Math.min(1, (s - segStart) / lens[k]);
    out.push({ s, x: pts[k][0] + (pts[k + 1][0] - pts[k][0]) * t, z: pts[k][1] + (pts[k + 1][1] - pts[k][1]) * t });
  }
  return out;
}

/** Distance from (x, z) to the nearest point of a polyline. */
function distToLine(pts: readonly (readonly [number, number])[], x: number, z: number): number {
  let best = Infinity;
  for (let k = 0; k + 1 < pts.length; k++) {
    const [ax, az] = pts[k];
    const vx = pts[k + 1][0] - ax, vz = pts[k + 1][1] - az;
    const t = Math.max(0, Math.min(1, ((x - ax) * vx + (z - az) * vz) / (vx * vx + vz * vz || 1e-9)));
    best = Math.min(best, Math.hypot(x - ax - vx * t, z - az - vz * t));
  }
  return best;
}

describe('the Anthill: the summit', () => {
  it('is flat within 28 m of the observatory and well above the plain', () => {
    // The road's own cut (flat across 9 m, blended back over 6 more: terrain.ts trails) dips where it climbs the rim.
    const road = ROAD?.points ?? [];
    let lo = Infinity, hi = -Infinity;
    for (let r = 0; r <= 28; r += 2) {
      for (let a = 0; a < 360; a += 15) {
        const x = S.x + r * Math.cos((a * Math.PI) / 180), z = S.z + r * Math.sin((a * Math.PI) / 180);
        if (distToLine(road, x, z) < 12) continue;
        const h = heightAt(x, z);
        lo = Math.min(lo, h);
        hi = Math.max(hi, h);
      }
    }
    expect(hi - lo, 'summit relief (m)').toBeLessThan(0.3);
    expect(heightAt(S.x, S.z) - heightAt(1240, 300), 'summit above the plain (m)').toBeGreaterThanOrEqual(35);
  });
});

describe('the Anthill: the road up (trail/anthill-road)', () => {
  const pts = ROAD?.points ?? [];
  const line = resample(pts, 2).map((p) => ({ ...p, h: heightAt(p.x, p.z) }));
  const total = line[line.length - 1]?.s ?? 0;

  /** Steepest rise over run between samples 2 m apart, from path length `from` on. */
  function steepest(from: number): number {
    let worst = 0;
    for (let i = 1; i < line.length; i++) {
      if (line[i].s < from) continue;
      worst = Math.max(worst, Math.abs(line[i].h - line[i - 1].h) / (line[i].s - line[i - 1].s));
    }
    return worst;
  }

  it('exists, from the east-band road to the summit', () => {
    expect(ROAD, 'trail/anthill-road').toBeDefined();
    expect(ROAD!.width).toBe(7);
    expect(pts[0]).toEqual([OBSERVATORY.roadStart.x, OBSERVATORY.roadStart.z]);
    expect(pts[pts.length - 1]).toEqual([OBSERVATORY.roadEnd.x, OBSERVATORY.roadEnd.z]);
    expect(total).toBeGreaterThan(450);
    expect(line[line.length - 1].h).toBeGreaterThan(heightAt(S.x, S.z) - 1.5);
  });

  it('is drivable: at most 16 degrees everywhere, at most 10 degrees over its last 30 m', () => {
    expect(Math.atan(steepest(0)) * (180 / Math.PI), 'steepest grade (deg)').toBeLessThanOrEqual(16);
    expect(Math.atan(steepest(total - 30)) * (180 / Math.PI), 'last 30 m (deg)').toBeLessThanOrEqual(10);
  });

  it('keeps clear of the leap landing, the ants, the dome and construction-3, inside the map', () => {
    const L = OBSERVATORY.leapClear;
    const dome = OBSERVATORY.dome;
    for (const p of line) {
      const inside = p.x > L.minX && p.x < L.maxX && p.z > L.minZ && p.z < L.maxZ;
      expect(inside, `(${p.x.toFixed(0)}, ${p.z.toFixed(0)}) is in leapClear`).toBe(false);
      expect(p.x > 1020 && p.x < 1080 && p.z > 220 && p.z < 280, `(${p.x.toFixed(0)}, ${p.z.toFixed(0)}) is in construction-3`).toBe(false);
      expect(Math.abs(p.x), 'x in the map').toBeLessThan(WORLD_HALF);
      expect(Math.abs(p.z), 'z in the map').toBeLessThan(WORLD_HALF);
    }
    for (const d of OBSERVATORY.antDoors) expect(distToLine(pts, d.x, d.z), `door ${d.id}`).toBeGreaterThanOrEqual(6);
    expect(distToLine(pts, dome.x, dome.z) - dome.r, 'gap to the dome (m)').toBeGreaterThanOrEqual(4);
  });
});

describe('the Anthill: painted earth', () => {
  it('is dirt on the flank, gravel on the forecourt and grass out on the lawn', () => {
    expect(paintAt(1240, 230)).toBe('dirt');
    expect(paintAt(S.x - 20, S.z)).toBe('gravel');
    expect(paintAt(1100, 150)).toBe('grass');
  });
});

describe("Dean's Leap", () => {
  const ramp = STUNT_RAMPS.find((r) => r.id === OBSERVATORY.rampId)!;

  it('stands on the summit flat, launching north, with its lip at the rim', () => {
    expect(ramp).toBeDefined();
    expect(ramp.yaw).toBeCloseTo(Math.PI, 9);
    const along = ramp.length / 2 - 0.1;
    const lipX = ramp.x + along * Math.sin(ramp.yaw);
    const lipZ = ramp.z + along * Math.cos(ramp.yaw);
    expect(lipX).toBeGreaterThanOrEqual(1234);
    expect(lipX).toBeLessThanOrEqual(1242);
    const c = rampContactAt(lipX, lipZ);
    expect(c, 'a contact at the lip').not.toBeNull();
    expect(c!.surfaceY).toBeGreaterThan(heightAt(S.x, S.z) + ramp.height - 0.3);
    expect(c!.surfaceY).toBeLessThan(heightAt(S.x, S.z) + ramp.height + 0.3);
  });

  /** An arcade launch off the lip: vy from the ramp's slope, then the arcade gravity; forward speed is flat. */
  function launch(speed: number): { air: number; x: number; z: number; dist: number; fall: number } {
    const vy = speed * Math.sin(Math.atan2(ramp.height, ramp.length)) * RAMP_LAUNCH.arcadeBoost;
    const fx = Math.sin(ramp.yaw), fz = Math.cos(ramp.yaw);
    const lipX = ramp.x + (ramp.length / 2) * fx;
    const lipZ = ramp.z + (ramp.length / 2) * fz;
    const y0 = heightAt(lipX, lipZ) + ramp.height;
    const dt = 1 / 120;
    for (let t = dt; t < 12; t += dt) {
      const x = lipX + fx * speed * t;
      const z = lipZ + fz * speed * t;
      if (y0 + vy * t - 0.5 * ARCADE_AIR.gravity * t * t <= heightAt(x, z)) {
        return { air: t, x, z, dist: Math.hypot(x - lipX, z - lipZ), fall: heightAt(x, z) - heightAt(x + fx * 10, z + fz * 10) };
      }
    }
    throw new Error('never landed');
  }

  it('flies a long way north and lands on falling ground inside the landing area', () => {
    const L = OBSERVATORY.leapClear;
    const lipZ = ramp.z + (ramp.length / 2) * Math.cos(ramp.yaw);
    for (const speed of [18, 24, 30]) {
      const r = launch(speed);
      const insideClear = r.x >= L.minX && r.x <= L.maxX && r.z >= L.minZ && r.z <= L.maxZ;
      const northOfIt = r.z < L.minZ && lipZ - r.z <= 140;
      expect(insideClear || northOfIt, `lands at (${r.x.toFixed(0)}, ${r.z.toFixed(0)}) at ${speed} m/s`).toBe(true);
      expect(r.fall, `ground falls away at the landing at ${speed} m/s`).toBeGreaterThan(0);
    }
    // The brief asked for 2.2 s at 24 m/s; with the ramp within 3.5..6 m x 14..22 m and gravity 30 the best is ~1.95 s.
    expect(launch(24).air, 'air time at 24 m/s (s)').toBeGreaterThanOrEqual(1.9);
    expect(launch(30).air, 'air time at 30 m/s (s)').toBeGreaterThanOrEqual(2.2);
    expect(launch(24).dist, 'leap distance at 24 m/s (m)').toBeGreaterThanOrEqual(40);
  });
});
