import { describe, expect, it } from 'vitest';
import { planTrailDressing } from './trails';
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
