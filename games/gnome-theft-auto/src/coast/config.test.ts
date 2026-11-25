// The coast's numbers agree with the ground: Driftwood's tow loop stays in water and drives through the whole slalom.
import { describe, expect, it } from 'vitest';
import { OCEAN_GATES, newRun, stepRun } from '../tubing/course';
import { waterDepthAt } from '../water';
import { heightAt } from '../terrain';
import { COAST } from './config';

describe('the coast config', () => {
  heightAt(0, 0); // builds the terrain grid, which carves the water
  it("keeps Driftwood's tow loop in water and clear of the Bathtub Queen", () => {
    const loop = COAST.towLoop;
    for (let i = 0; i < loop.length; i++) {
      const [ax, az] = loop[i];
      const [bx, bz] = loop[(i + 1) % loop.length];
      for (let t = 0; t <= 1; t += 0.1) {
        const x = ax + (bx - ax) * t, z = az + (bz - az) * t;
        expect(waterDepthAt(x, z), `leg ${i} at ${x.toFixed(0)},${z.toFixed(0)}`).toBeGreaterThan(0.8);
        const d = COAST.ship.deck;
        expect(x >= d.minX - 4 && x <= d.maxX + 4 && z >= d.minZ - 4 && z <= d.maxZ + 4, `leg ${i} hits the ship`).toBe(false);
      }
    }
  });

  it('passes every slalom gate in order and finishes in one lap', () => {
    const loop = COAST.towLoop;
    const run = newRun();
    let finished = false;
    for (let i = 0; i < loop.length && !finished; i++) {
      const [ax, az] = loop[i];
      const [bx, bz] = loop[(i + 1) % loop.length];
      const n = Math.ceil(Math.hypot(bx - ax, bz - az) / 1.7); // samples are nudged 13 mm east so none lands exactly on a gate line
      for (let k = 0; k < n; k++) {
        const x0 = ax + ((bx - ax) * k) / n + 0.013, z0 = az + ((bz - az) * k) / n;
        const x1 = ax + ((bx - ax) * (k + 1)) / n + 0.013, z1 = az + ((bz - az) * (k + 1)) / n;
        if (stepRun(run, x0, z0, x1, z1, 0.15, OCEAN_GATES) === 'finish') finished = true;
      }
    }
    expect(run.next, `gates passed`).toBe(OCEAN_GATES.length);
    expect(finished).toBe(true);
  });
});
