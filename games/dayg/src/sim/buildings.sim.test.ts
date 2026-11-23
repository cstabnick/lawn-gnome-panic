// The loot budget covers building containers: they sit in their building's region, and rolling them takes exactly
// what they hold out of that region's stock.
import { describe, it, expect } from 'vitest';
import { BUILDINGS, BUILDING_PARTS } from '../world/buildings/index';
import { MAP } from '../world/blockout';
import { rollContainer } from './loot';
import { REGIONS, regionAt } from './regions';
import { RESOURCES, type ItemStack, type Rect, type RegionId } from './types';
import { createWorld } from './world';

const rectInside = (a: Rect, b: Rect): boolean => a.x0 >= b.x0 && a.x1 <= b.x1 && a.z0 >= b.z0 && a.z1 <= b.z1;
const countItems = (stacks: readonly ItemStack[]): number => stacks.reduce((a, s) => a + s.count, 0);

describe('building loot budget', () => {
  it('keeps the twelve regions', () => {
    expect(REGIONS.length).toBe(12);
  });

  it('places every non-draft building in its region, with containers and spots inside the map lists', () => {
    const mapContainerIds = new Set(MAP.containers.map((c) => c.id));
    const mapSpotIds = new Set(MAP.spots.map((s) => `${s.region}:${s.kind}:${s.id}`));
    for (const def of BUILDINGS) {
      if (def.draft) continue;
      const region = REGIONS.find((r) => r.id === def.region);
      expect(region, `${def.id} region`).toBeDefined();
      expect(rectInside(def.footprint, region!.rect), `${def.id} footprint inside ${def.region}`).toBe(true);
      const parts = BUILDING_PARTS[BUILDINGS.indexOf(def)];
      for (const c of parts.containers) {
        expect(mapContainerIds.has(c.id), `${c.id} in MAP.containers`).toBe(true);
        expect(c.region, `${c.id} region`).toBe(def.region);
        expect(regionAt(c.x, c.z), `${c.id} regionAt`).toBe(def.region);
      }
      for (const s of parts.spots) {
        expect(mapSpotIds.has(`${def.region}:${s.kind}:${s.id}`), `${def.id} spot ${s.kind} ${s.id} in MAP.spots`).toBe(true);
      }
    }
  });

  it('rolling building containers takes exactly their contents out of the region stock', () => {
    const buildingIds = BUILDING_PARTS.filter((p) => !p.def.draft).flatMap((p) => p.containers.map((c) => c.id));
    for (const seed of [1, 2, 3]) {
      const { world: w, streams } = createWorld(seed);
      for (const id of buildingIds) {
        expect(w.containers[id], `${id} in world`).toBeDefined();
        expect(w.containers[id].opened, `${id} not opened`).toBe(false);
      }
      const regions = new Set<RegionId>(BUILDINGS.filter((d) => !d.draft).map((d) => d.region));
      for (const region of regions) {
        const ids = MAP.containers.filter((c) => c.region === region).map((c) => c.id);
        const before = RESOURCES.reduce((a, res) => a + w.loot[region][res], 0);
        let rolled = 0;
        for (const id of ids) {
          const guaranteed = MAP.containers.find((c) => c.id === id)?.guaranteed?.length ?? 0;
          const contents = rollContainer(w, id, streams.loot);
          rolled += countItems(contents) - guaranteed;
        }
        const after = RESOURCES.reduce((a, res) => a + w.loot[region][res], 0);
        expect(before - after, `${seed} ${region} stock taken equals items rolled`).toBe(rolled);
        for (const res of RESOURCES) expect(w.loot[region][res], `${seed} ${region}.${res} >= 0`).toBeGreaterThanOrEqual(0);
        for (const id of ids) expect(w.containers[id].opened, `${id} opened`).toBe(true);
      }
    }
  });
});
