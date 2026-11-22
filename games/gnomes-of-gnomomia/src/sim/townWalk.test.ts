import { describe, expect, it } from 'vitest';
import { OBJECTS, SPAWNS, ZONES } from '../content';
import { createTerrain } from '../terrainCore';
import { TOWNS, townById } from '../towns';
import { loadWalkGrid } from '../walkBake';
import { loadWorldDeltas } from '../worldDeltas';
import { loadWorldPaint } from '../worldPaint';
import { simulateTownWalk, townRoute, TOWN_WALK_SCENARIOS, type TownWalkSpec } from './townWalk';

// The game's terrain with every quest done (all passes open), the shipped deltas, paint and baked walk grid.
function shippedTerrain() {
  const t = createTerrain({ zones: ZONES, objects: OBJECTS, checkCondition: () => true });
  const deltas = loadWorldDeltas();
  if (deltas) t.setDeltas(deltas);
  const paint = loadWorldPaint();
  if (paint) t.setPaint(paint);
  const grid = loadWalkGrid();
  if (grid) t.setWalkGrid(grid);
  return t;
}

type Block = { town: string; waypoint: string; reason: string };
// src/townBlocks.ts may not exist yet; the test must work before and after it lands.
const loadBlocks = (): Promise<readonly Block[]> =>
  import('../townBlocks' as string).then((m: { TOWN_BLOCKS?: readonly Block[] }) => m.TOWN_BLOCKS ?? []).catch(() => []);

describe('town walks', () => {
  const t = shippedTerrain();

  it('has a stroller, errand and scripted scenario for every town', () => {
    for (const town of TOWNS) {
      const policies = TOWN_WALK_SCENARIOS.filter((s) => s.townId === town.id).map((s) => s.policy).sort();
      expect(policies).toEqual(['errand', 'scripted', 'stroller']);
    }
  });

  it('scripted route visits every waypoint once and loops back', () => {
    const town = townById('thatchford')!;
    const route = townRoute(town, 'scripted', () => 0, 0);
    const ids = route.map((w) => w.id);
    expect(new Set(ids).size).toBe(ids.length - 1);
    expect(ids[ids.length - 1]).toBe(ids[0]);
  });

  it('a gnome can walk the scripted tour of every town, with no enemy threat inside', { timeout: 180000 }, async () => {
    const blocks = await loadBlocks();
    const report: string[] = [];
    for (const town of TOWNS) {
      const spec: TownWalkSpec = {
        townId: town.id, walkers: 1, legs: 0, policy: 'scripted', seed: 3,
        skip: blocks.filter((b) => b.town === town.id).map((b) => b.waypoint),
      };
      const r = simulateTownWalk(t, spec, SPAWNS);
      report.push(...r.failures);
      expect(r.legs.length, town.id).toBeGreaterThan(0);
      expect(r.okRate, `${town.id}: ${r.failures.join('; ')}`).toBe(1);
      expect(r.threats, town.id).toBe(0);
    }
    if (report.length) console.warn(`town walk failures:\n${report.join('\n')}`);
  });

  it('is deterministic for a seed', () => {
    const spec: TownWalkSpec = { townId: 'mossbottom', walkers: 2, legs: 6, policy: 'stroller', seed: 42 };
    const a = simulateTownWalk(t, spec, SPAWNS);
    const b = simulateTownWalk(t, spec, SPAWNS);
    expect(b).toEqual(a);
  });
});
