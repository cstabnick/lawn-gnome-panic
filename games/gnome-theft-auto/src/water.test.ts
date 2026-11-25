// The water runs downhill (Wild World Epic 4): every river's surface and bed never rise along its path, the canal is
// level between its locks, each stretch is no higher than the one feeding it, the beds are below the banks, and a road
// bridge stands at every crossing. Checked on the shipped ground and on a synthetic tilted grid.
import { afterAll, describe, expect, it } from 'vitest';
import { WATER } from './config';
import { bedAt, heightAt, resetTerrainOptions, setTerrainOptions, terrainFlat, waterAt } from './terrain';
import {
  BODIES, COURSES, bodyLevel, bridgeDeckAt, bridges, canalLocks, carveWater, courseProfile, onWaterCourse,
} from './water';

afterAll(() => resetTerrainOptions());

function checkDownhill(): void {
  for (const c of COURSES) {
    const p = courseProfile(c.id)!;
    expect(p, c.id).not.toBeNull();
    for (let k = 1; k < p.surface.length; k++) {
      expect(p.surface[k], `${c.id} surface at ${k}`).toBeLessThanOrEqual(p.surface[k - 1] + 1e-9);
      expect(p.bed[k], `${c.id} bed at ${k}`).toBeLessThanOrEqual(p.bed[k - 1] + 1e-9);
    }
  }
  // Each stretch is fed by the one before it in WATER.order.
  const start = (id: string): number => courseProfile(id)?.surface[0] ?? bodyLevel(id)!;
  const end = (id: string): number => { const p = courseProfile(id); return p ? p.surface[p.surface.length - 1] : bodyLevel(id)!; };
  for (let i = 1; i < WATER.order.length; i++) {
    expect(start(WATER.order[i]), `${WATER.order[i]} below ${WATER.order[i - 1]}`).toBeLessThanOrEqual(end(WATER.order[i - 1]) + 1e-9);
  }
  // The canal is level except at its locks.
  const canal = courseProfile('canal')!;
  const steps = canal.surface.filter((h, k) => k > 0 && h !== canal.surface[k - 1]).length;
  expect(steps).toBeLessThanOrEqual(WATER.canalLocks.length);
  expect(canalLocks().length).toBe(WATER.canalLocks.length);
}

describe('water on the shipped ground', () => {
  it('is carved, so the ground is no longer flat', () => {
    resetTerrainOptions();
    expect(terrainFlat()).toBe(false);
  });

  it('runs downhill', () => {
    checkDownhill();
  });

  it('has water in the middle of every course and body, below the banks', () => {
    for (const c of COURSES) {
      const p = courseProfile(c.id)!;
      const k = Math.floor(p.s.length / 2);
      const w = waterAt(p.x[k], p.z[k]);
      expect(w, c.id).not.toBeNull();
      expect(w!.depth).toBeGreaterThan(c.depth * 0.5);
    }
    for (const b of BODIES) {
      const w = waterAt(b.cx, b.cz);
      expect(w, b.id).not.toBeNull();
      expect(w!.depth).toBeCloseTo(b.depth, 1);
    }
    expect(waterAt(0, 0)).toBeNull();
    expect(heightAt(0, 0)).toBe(0);
  });

  it('bridges every road crossing at the road height; boats see the river under the deck', () => {
    const list = bridges();
    expect(list.map((b) => `${b.course} x ${b.road}`).sort()).toEqual(
      ['canal x south', 'river-farm x ring-se', 'river-ravine x ring-sw', 'river-ravine x west', 'river-upper x ring-nw',
        'thymes x pl-pont-neuf', 'thymes x pl-pont-nord', 'thymes x pl-pont-sud', 'thymes x pl-quai-bassin'],
    );
    for (const b of list) {
      expect(bridgeDeckAt(b.x, b.z)).toBe(b.deck);
      expect(heightAt(b.x, b.z)).toBe(b.deck);
      expect(bedAt(b.x, b.z)).toBeLessThan(b.deck - WATER.freeboard);
      const w = waterAt(b.x, b.z);
      expect(w).not.toBeNull();
      expect(w!.surface).toBeLessThan(b.deck);
    }
  });

  it('raises every bridge clear of the water, on earth ramps that climb no steeper than the grade', () => {
    for (const b of bridges()) {
      const surface = waterAt(b.x, b.z)!.surface;
      const clearance = WATER.bridgeClearance[b.course] ?? WATER.bridgeClearance.default;
      expect(b.deck - surface, b.id).toBeGreaterThanOrEqual(clearance - 1e-4); // float32 grid heights
      const s = Math.sin(b.yaw), c = Math.cos(b.yaw);
      const at = (a: number): number => heightAt(b.x + s * a, b.z + c * a);
      const end = b.length / 2;
      for (const sign of [1, -1]) {
        const h = at(sign * (end + 5));
        expect(Math.abs(h - (b.deck - 5 * WATER.bridgeGrade)) <= 0.2 || h > b.deck - 1, `${b.id} ramp ${sign}`).toBe(true);
      }
      for (let a = -end - 40; a < end + 40; a += 2) {
        expect(Math.abs(at(a + 2) - at(a)) / 2, `${b.id} slope at ${a}`).toBeLessThanOrEqual(0.16);
      }
    }
  });

  it('has no dry bar at a junction: the water is at least 0.8 m deep at each course end and 10 m before it', () => {
    for (const c of COURSES) {
      const p = courseProfile(c.id)!;
      const n = p.s.length;
      const k = p.s.findIndex((s) => s >= p.s[n - 1] - 10);
      for (const idx of [n - 1, k]) {
        const w = waterAt(p.x[idx], p.z[idx]);
        expect(w, `${c.id} at ${idx}`).not.toBeNull();
        expect(w!.depth, `${c.id} at ${idx}`).toBeGreaterThanOrEqual(0.8);
      }
    }
  });

  it('onWaterCourse needs no heights', () => {
    expect(onWaterCourse(0, 230)).toBe(true);
    expect(onWaterCourse(-700, -680)).toBe(true);
    expect(onWaterCourse(0, 0)).toBe(false);
    expect(onWaterCourse(0, 238)).toBe(false);
    expect(onWaterCourse(0, 238, 4)).toBe(true);
  });

  it('can be switched off: the old dry, flat world', () => {
    setTerrainOptions({ amplitude: 0, water: false });
    expect(terrainFlat()).toBe(true);
    expect(waterAt(0, 230)).toBeNull();
    expect(heightAt(0, 230)).toBe(0);
    expect(bridges()).toEqual([]);
    resetTerrainOptions();
  });
});

describe('water on a tilted grid (north high, bumpy)', () => {
  it('still runs downhill and never raises the ground', () => {
    const half = 900, step = 4, N = Math.round((2 * half) / step) + 1;
    const g = new Float32Array(N * N);
    for (let j = 0; j < N; j++) {
      for (let i = 0; i < N; i++) {
        const x = -half + i * step, z = -half + j * step;
        g[j * N + i] = -0.006 * z + 2 * Math.sin(x / 37) * Math.cos(z / 53);
      }
    }
    const before = g.slice();
    carveWater(g, N, half, step);
    // Raises are only the bridges' earth ramps, so they sit near a crossing.
    const crossings = bridges();
    for (let k = 0; k < g.length; k++) {
      if (g[k] <= before[k]) continue;
      const x = -half + (k % N) * step, z = -half + Math.floor(k / N) * step;
      expect(crossings.some((b) => Math.hypot(b.x - x, b.z - z) <= 60), `raised at ${x},${z}`).toBe(true);
    }
    checkDownhill();
    resetTerrainOptions();
  });
});
