// Quest sim: the driver solvers (walk, drive the road graph, fly) run headless, each in its own session.
import '../globals';
import { describe, expect, it } from 'vitest';
import { planRoute } from '../../errands';
import { nearestRoadNode } from '../../highways/roads';
import { heightAt } from '../../terrain';
import type { RoadNode } from '../../types';
import { buildSimWorld, openSession } from '../harness';
import { ALL_CHEATS } from '../types';
import { driveTo, flyTo, walkTo } from './driver';

const sim = buildSimWorld();
const TIMEOUT = 60_000;
/** Sim-second timings for the report (console output is swallowed under vitest here). */
const out = (msg: string): void => {
  const stdout = (globalThis as { process?: { stdout: { write(s: string): void } } }).process?.stdout;
  stdout?.write(`[driver] ${msg}\n`);
};

describe('driver solvers (headless)', () => {
  // (40, 18) is inside a building collider (x 16.4..43.6, z 15..45), so the walk target is the pavement just south of
  // it at (40, 12); the bot has to go round the building's edge to get there.
  it('walkTo arrives on foot within 60 sim s', async () => {
    const s = openSession(sim, ALL_CHEATS);
    try {
      s.teleport(0, 18);
      const t0 = s.now();
      await walkTo(s, 40, 12, { arrive: 3, why: 'walk test' });
      const secs = s.now() - t0;
      out(`walkTo: ${secs.toFixed(1)} sim s`);
      expect(Math.hypot(s.player.x - 40, s.player.z - 12)).toBeLessThanOrEqual(3);
      expect(secs).toBeLessThan(60);
    } finally {
      s.dispose();
    }
  }, TIMEOUT);

  it('driveTo drives a ride-on about 200 m along the road graph within 120 sim s', async () => {
    const s = openSession(sim, ALL_CHEATS);
    try {
      const nodes = s.world.roads.nodes;
      const start = nearestRoadNode(nodes, 0, 18);
      if (!start) throw new Error('no ground road node near (0, 18)');
      // The ground node nearest (0, -200) that the road graph can reach from the start.
      const far = nodes
        .filter((n: RoadNode) => n.deck === undefined && n.links.length > 0 && n.id !== start.id)
        .sort((a, b) => Math.hypot(a.x, a.z + 200) - Math.hypot(b.x, b.z + 200))
        .find((n) => planRoute(nodes, start.id, n.id) !== null);
      if (!far) throw new Error('no reachable road node near (0, -200)');
      s.spawnVehicle('ride-on', 0, 18, 0);
      const v = s.vehicles[s.vehicles.length - 1];
      s.enter(v);
      const t0 = s.now();
      await driveTo(s, far.x, far.z, { arrive: 5, why: 'drive test' });
      const secs = s.now() - t0;
      out(`driveTo: ${secs.toFixed(1)} sim s, to node (${far.x.toFixed(0)}, ${far.z.toFixed(0)})`);
      expect(Math.hypot(s.player.x - far.x, s.player.z - far.z)).toBeLessThanOrEqual(5);
      expect(secs).toBeLessThan(120);
    } finally {
      s.dispose();
    }
  }, TIMEOUT);

  it('flyTo flies a whirligig to a point at a height', async () => {
    const s = openSession(sim, ALL_CHEATS);
    try {
      const v = s.spawnVehicle('whirligig', 0, 18, 0);
      s.enter(v);
      const ty = heightAt(60, 60) + 25;
      const t0 = s.now();
      await flyTo(s, 60, ty, 60, { arrive: 4, why: 'fly test' });
      const secs = s.now() - t0;
      out(`flyTo: ${secs.toFixed(1)} sim s`);
      expect(Math.hypot(s.player.x - 60, s.player.z - 60)).toBeLessThanOrEqual(4);
      expect(Math.abs(s.player.y - ty)).toBeLessThan(4);
    } finally {
      s.dispose();
    }
  }, TIMEOUT);
});
