import { describe, expect, it } from 'vitest';
import { generateWorld } from '../world';
import { createFlood } from './sim';
import { FLOOD_HILL, FLOOD_SEED, type FlowSample } from './types';

function run(seconds: number) {
  const w = generateWorld(FLOOD_SEED, FLOOD_HILL);
  const f = createFlood(w, FLOOD_SEED);
  f.focus(0);
  f.restart(1);
  const isl = w.islands[0];
  const ra = isl.r * isl.stretch;
  let maxDepth = 0;
  let maxSpeed = 0;
  let maxActive = 0;
  const wetRuns = new Set<number>();
  const s: FlowSample = { depth: 0, vx: 0, vz: 0, bedY: 0, surfaceY: 0 };
  for (let t = 0; t < seconds; t += 1 / 30) {
    // a rider coasting down the run's centre line at 18 m/s
    const al = Math.min(ra - 1, -ra * 0.85 + t * 18);
    f.anchor(isl.cx + isl.dx * al, isl.cz + isl.dz * al, 0);
    f.step(1 / 30);
    if (Math.round(t * 30) % 30 !== 0) continue;
    maxActive = Math.max(maxActive, f.runs.filter((r) => r.active).length);
    for (const r of f.runs) {
      if (!r.active) continue;
      for (let j = 0; j < r.nv; j += 2) {
        for (let k = r.lo; k <= r.hi; k += 2) {
          const d = r.depth[j * r.nu + k];
          if (d > 0.1) wetRuns.add(r.island);
          maxDepth = Math.max(maxDepth, d);
          if (d > 0.1) {
            const x = r.ox + r.fx * k * r.cell + r.sx * j * r.cell;
            const z = r.oz + r.fz * k * r.cell + r.sz * j * r.cell;
            if (f.sample(x, z, r.island, s)) maxSpeed = Math.max(maxSpeed, Math.hypot(s.vx, s.vz));
          }
        }
      }
    }
  }
  return { f, w, maxDepth, maxSpeed, wetRuns, maxActive };
}

describe('flood sim', () => {
  it('floods the runs near the rider, stays finite and bounded', { timeout: 60000 }, () => {
    const r = run(25);
    console.log('flood 60 s', { maxDepth: r.maxDepth, maxSpeed: r.maxSpeed, wet: [...r.wetRuns], volume: r.f.volume() });
    expect(Number.isFinite(r.f.volume())).toBe(true);
    expect(r.maxDepth).toBeGreaterThan(0.3);
    expect(r.maxDepth).toBeLessThan(8);
    expect(r.wetRuns.has(0)).toBe(true);
    expect(r.maxActive).toBeLessThanOrEqual(2);
    expect(r.maxSpeed).toBeGreaterThan(1.5);
    expect(r.maxSpeed).toBeLessThan(40);
  });

  it('only simulates the window around the focus run', () => {
    const w = generateWorld(FLOOD_SEED, FLOOD_HILL);
    const f = createFlood(w, FLOOD_SEED);
    f.focus(4);
    f.step(1);
    const active = f.runs.filter((r) => r.active).map((r) => r.island);
    expect(active).toEqual([4]);
    f.focus(0);
    f.step(0.1);
    expect(f.runs[4].active).toBe(false);
    expect(f.runs[4].depth.every((d) => d === 0)).toBe(true);
  });

  it('is deterministic', { timeout: 60000 }, () => {
    expect(run(20).f.volume()).toBe(run(20).f.volume());
  });
});
