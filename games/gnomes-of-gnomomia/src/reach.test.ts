// computeReachability: the spawn, shrine, regions, exits, houses and decks of each outdoor zone, checked against a flood
// fill over a fresh terrain with every gate open. A lake ring must cut a zone in two.
import { describe, expect, it } from 'vitest';
import type { ZoneDef, ZoneId } from './config';
import { OBJECTS, ZONES } from './content';
import { computeReachability } from './reach';
import { createTerrain } from './terrainCore';

// Targets (`zone:kind:id`) that no walker can reach today. The content may need fixing; an empty list is the goal.
// Regions count as reachable when ground within 60% of their radius is. These three are covered by a building or a castle
// wall (the Granary, the Throne Hall, the Shed): you enter them through a door or a gap, not by walking onto them, so the
// report flags them. Not necessarily content bugs. If this list changes the test fails: update it only when the change is intended.
const KNOWN_UNREACHABLE: string[] = ['cloverfield:region:granary', 'keep:region:throne-hall', 'verge:region:the-shed'];

const open = (zones: Record<ZoneId, ZoneDef> = ZONES) =>
  createTerrain({ zones, objects: OBJECTS, checkCondition: () => true });

const outdoorZones = (): ZoneDef[] => Object.values(ZONES).filter((z) => !z.indoor && !z.interior);

describe('computeReachability', () => {
  it('mossbottom: spawn, shrine and every region are reachable over a large area', () => {
    const t = open();
    const report = computeReachability(t, ZONES.mossbottom);
    expect(report.cells).toBeGreaterThan(10000);
    for (const r of report.results.filter((x) => x.kind === 'spawn' || x.kind === 'shrine' || x.kind === 'region')) {
      expect(r.reachable, `${r.kind} ${r.id}`).toBe(true);
    }
    expect(report.reached(ZONES.mossbottom.spawn.x, ZONES.mossbottom.spawn.z)).toBe(true);
  });

  it('a ring of lakes around the spawn cuts off a region outside it', () => {
    const mb = ZONES.mossbottom;
    const spawn = mb.spawn;
    const ring = Array.from({ length: 12 }, (_, i) => {
      const a = (i / 12) * Math.PI * 2;
      return { x: spawn.x + Math.cos(a) * 30, z: spawn.z + Math.sin(a) * 30, r: 12 };
    });
    const outside = { id: 'beyond-ring', name: 'Beyond the ring', x: spawn.x, z: spawn.z + 60, r: 5 };
    const walled: ZoneDef = { ...mb, lakes: [...mb.lakes, ...ring], regions: [...mb.regions, outside] };
    const report = computeReachability(open({ ...ZONES, mossbottom: walled }), walled);

    const spawnResult = report.results.find((r) => r.kind === 'spawn');
    expect(spawnResult?.reachable).toBe(true);
    expect(report.reached(spawn.x, spawn.z)).toBe(true);
    const beyond = report.results.find((r) => r.kind === 'region' && r.id === 'beyond-ring');
    expect(beyond?.reachable).toBe(false);
  });

  it('every outdoor zone: the unreachable targets match KNOWN_UNREACHABLE', () => {
    const t = open();
    const unreachable: string[] = [];
    for (const zone of outdoorZones()) {
      const report = computeReachability(t, zone);
      for (const r of report.results) {
        if (!r.reachable) unreachable.push(`${zone.id}:${r.kind}:${r.id}`);
      }
    }
    expect(unreachable.sort()).toEqual([...KNOWN_UNREACHABLE].sort());
  }, 120000);
});
