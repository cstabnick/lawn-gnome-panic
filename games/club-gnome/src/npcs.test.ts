import { describe, it, expect } from 'vitest';
import { MAP_IDS, type NpcDef } from './config';
import { NPCS } from './npcData';
import { npcPose } from './npcs';
import { MAPS } from './maps';
import { isBlocked } from './walk';

/** Every point sampled along a loop's segments (including last back to first), every 0.25 units. */
function loopSamples(def: NpcDef): { x: number; z: number }[] {
  const out: { x: number; z: number }[] = [];
  const n = def.path.length;
  for (let i = 0; i < n; i++) {
    const a = def.path[i];
    const b = def.path[(i + 1) % n];
    const len = Math.hypot(b.x - a.x, b.z - a.z);
    const steps = Math.max(1, Math.ceil(len / 0.25));
    for (let s = 0; s <= steps; s++) {
      out.push({ x: a.x + ((b.x - a.x) * s) / steps, z: a.z + ((b.z - a.z) * s) / steps });
    }
  }
  return out;
}

describe('NPC data', () => {
  it('every NPC is on a real map', () => {
    for (const def of NPCS) {
      expect(MAP_IDS).toContain(def.map);
      expect(MAPS[def.map]).toBeDefined();
    }
  });

  it('ids are unique and names and lines are present', () => {
    const ids = NPCS.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const def of NPCS) {
      expect(def.name.length).toBeGreaterThan(0);
      expect(def.lines.length).toBeGreaterThanOrEqual(3);
      for (const line of def.lines) expect(line.length).toBeLessThan(70);
    }
  });

  it('standing NPCs staff a counter that exists on their map', () => {
    for (const def of NPCS) {
      if (def.path.length !== 1) continue;
      if (def.counter === undefined) continue;
      const counters = MAPS[def.map].counters.map((c) => c.id);
      expect(counters).toContain(def.counter);
    }
  });

  it('shopkeepers and the guide stand (one point), townsfolk walk loops of 3-5 points', () => {
    const walkers = NPCS.filter((d) => d.path.length > 1);
    for (const def of walkers) {
      expect(def.path.length).toBeGreaterThanOrEqual(3);
      expect(def.path.length).toBeLessThanOrEqual(5);
    }
    expect(walkers.length).toBe(7);
  });

  it('every loop waypoint and segment sample is walkable and clear of portals', () => {
    for (const def of NPCS) {
      if (def.path.length <= 1) continue;
      const map = MAPS[def.map];
      for (const p of loopSamples(def)) {
        expect(isBlocked(map, p.x, p.z), `${def.id} at (${p.x}, ${p.z})`).toBe(false);
        for (const portal of map.portals) {
          const d = Math.hypot(p.x - portal.x, p.z - portal.z);
          expect(d, `${def.id} near portal ${portal.id}`).toBeGreaterThanOrEqual(1.5);
        }
      }
    }
  });

  it('every loop stays off the dark road band of the town', () => {
    for (const def of NPCS) {
      if (def.map !== 'town' || def.path.length <= 1) continue;
      for (const p of loopSamples(def)) {
        const bandA = Math.abs(p.z) >= 4.0 && Math.abs(p.z) <= 5.6 && Math.abs(p.x) < 10.3;
        const bandB = Math.abs(p.x) >= 8.7 && Math.abs(p.x) <= 10.3 && Math.abs(p.z) < 5.6;
        expect(bandA || bandB, `${def.id} on the road at (${p.x}, ${p.z})`).toBe(false);
      }
    }
  });
});

describe('npcPose', () => {
  const walker = NPCS.find((d) => d.path.length > 1)!;
  const shopkeeper = NPCS.find((d) => d.path.length === 1)!;

  it('a standing NPC stays put, facing its facing, not moving', () => {
    for (const t of [0, 1234, 99999]) {
      const p = npcPose(shopkeeper, t);
      expect(p.x).toBe(shopkeeper.path[0].x);
      expect(p.z).toBe(shopkeeper.path[0].z);
      expect(p.facing).toBe(shopkeeper.facing);
      expect(p.moving).toBe(false);
      expect(p.busy).toBe(false);
    }
  });

  it('is deterministic: the same input gives the same output', () => {
    for (const t of [0, 5000, 123456]) {
      expect(npcPose(walker, t)).toEqual(npcPose(walker, t));
    }
  });

  it('a walker moves between two times 3 s apart', () => {
    let moved = false;
    for (let t = 0; t < 60000 && !moved; t += 500) {
      const a = npcPose(walker, t);
      const b = npcPose(walker, t + 3000);
      if (a.x !== b.x || a.z !== b.z) moved = true;
    }
    expect(moved).toBe(true);
  });

  it('a walker is seen walking at some moment', () => {
    let walking = false;
    for (let t = 0; t < 60000 && !walking; t += 500) {
      if (npcPose(walker, t).moving) walking = true;
    }
    expect(walking).toBe(true);
  });

  it('different walkers do not all start at the same phase', () => {
    const walkers = NPCS.filter((d) => d.path.length > 1);
    const first = new Set(walkers.map((d) => {
      const p = npcPose(d, 0);
      return `${p.x},${p.z}`;
    }));
    expect(first.size).toBeGreaterThan(1);
  });
});
