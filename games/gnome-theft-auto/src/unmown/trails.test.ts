import { describe, expect, it } from 'vitest';
import { planTrailDressing, planTrailRibbon } from './trails';
import { heightAt } from '../terrain';
import { regionAt } from '../levels';

type Pt = readonly [number, number];
const LOOP: Pt[] = [
  [-1560, -1172], [-1600, -1350], [-1500, -1500], [-1300, -1460], [-1150, -1470], [-900, -1560],
  [-750, -1460], [-550, -1440], [-330, -1560], [-300, -1460],
];
const BOARDWALK: Pt[] = [[-1300, -1460], [-1200, -1520], [-1100, -1560], [-1000, -1520], [-900, -1560]];

function dist(x: number, z: number, line: Pt[]): number {
  let best = Infinity;
  for (let i = 0; i + 1 < line.length; i++) {
    const [ax, az] = line[i], [bx, bz] = line[i + 1];
    const dx = bx - ax, dz = bz - az, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz)));
    best = Math.min(best, Math.hypot(x - ax - t * dx, z - az - t * dz));
  }
  return best;
}

describe('planTrailDressing', () => {
  const plan = planTrailDressing();
  const count = (id: string) => plan.filter((p) => p.id === id).length;

  it('is deterministic', () => {
    expect(planTrailDressing()).toEqual(plan);
  });
  it('has the expected pieces', () => {
    expect(count('trail-waymarker')).toBeGreaterThanOrEqual(25);
    expect(count('rules-board')).toBe(6);
    expect(plan.filter((p) => p.id === 'rules-board').every((p) => !!p.text)).toBe(true);
    expect(new Set(plan.filter((p) => p.id === 'rules-board').map((p) => p.text)).size).toBe(6);
    expect(count('interpretive-panel')).toBe(4);
    expect(count('log-bench')).toBe(6);
    expect(count('bird-box')).toBe(8);
    expect(count('insect-hotel')).toBe(3);
  });
  it('keeps 2 m off the trail centre lines and inside the Unmown', () => {
    for (const p of plan) {
      expect(dist(p.x, p.z, LOOP), `${p.id} ${p.x},${p.z}`).toBeGreaterThanOrEqual(2);
      expect(dist(p.x, p.z, BOARDWALK), `${p.id} ${p.x},${p.z}`).toBeGreaterThanOrEqual(2);
      expect(regionAt(p.x, p.z), `${p.id} ${p.x},${p.z}`).toBe('the-unmown');
    }
  });
});

describe('planTrailRibbon', () => {
  for (const [name, line, width] of [['loop', LOOP, 4], ['boardwalk', BOARDWALK, 3]] as const) {
    const plan = planTrailRibbon(line, width);
    const tris = plan.index.length / 3;
    const alphaAt = (x: number, z: number): number | null => {
      let best: number | null = null; // overlapping triangles (inside of a bend) composite: the most opaque wins
      for (let t = 0; t < tris; t++) {
        const [i, j, k] = [plan.index[t * 3], plan.index[t * 3 + 1], plan.index[t * 3 + 2]];
        const P = (n: number) => [plan.positions[n * 3], plan.positions[n * 3 + 2]];
        const [a, b, c] = [P(i), P(j), P(k)];
        const det = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1]);
        const l1 = ((b[1] - c[1]) * (x - c[0]) + (c[0] - b[0]) * (z - c[1])) / det;
        const l2 = ((c[1] - a[1]) * (x - c[0]) + (a[0] - c[0]) * (z - c[1])) / det;
        const l3 = 1 - l1 - l2;
        if (l1 >= -1e-6 && l2 >= -1e-6 && l3 >= -1e-6) best = Math.max(best ?? 0, l1 * plan.alphas[i] + l2 * plan.alphas[j] + l3 * plan.alphas[k]);
      }
      return best;
    };
    it(`${name}: opaque core covers width/2 + 0.8 m, outer edge is alpha 0`, () => {
      let n = 0;
      for (let s = 0; s + 1 < line.length; s++) {
        const [ax, az] = line[s], [bx, bz] = line[s + 1];
        const len = Math.hypot(bx - ax, bz - az), nx = -(bz - az) / len, nz = (bx - ax) / len;
        for (let u = 0.5; u < len; u += 3.7) {
          for (const off of [-1, -0.5, 0, 0.5, 1]) {
            const x = ax + ((bx - ax) * u) / len + nx * off * (width / 2 + 0.8), z = az + ((bz - az) * u) / len + nz * off * (width / 2 + 0.8);
            expect(alphaAt(x, z), `${x},${z}`).toBeCloseTo(1, 5);
            n++;
          }
        }
      }
      expect(n).toBeGreaterThan(100);
      expect(plan.alphas.filter((a) => a === 0).length).toBeGreaterThan(10);
    });
    it(`${name}: every vertex hugs the ground`, () => {
      for (let i = 0; i < plan.positions.length; i += 3) {
        expect(Math.abs(plan.positions[i + 1] - (heightAt(plan.positions[i], plan.positions[i + 2]) + 0.03))).toBeLessThan(0.1);
      }
    });
  }
});
