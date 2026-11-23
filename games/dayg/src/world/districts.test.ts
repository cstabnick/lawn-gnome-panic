// Every district blockout is checked against the full map (roadmap 4.8). Districts with no blocks yet are skipped.
import { describe, expect, it } from 'vitest';
import { DISTRICT_PREFIX, FULL_BOUNDS, FULL_REGIONS, districtOf } from '../sim/regionsFull';
import { HAVEN_REGION } from '../sim/regions';
import type { RegionDef } from '../sim/types';
import { assembleFullMap, checkFullMap, DISTRICT_MAPS } from './fullMap';
import type { DistrictMap } from './types';

const inRect = (r: RegionDef['rect'], x: number, z: number): boolean => x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1;
const active = DISTRICT_MAPS.filter((d) => d.blocks.length > 0);
const full = assembleFullMap();

describe('district blockouts', () => {
  it('the assembled full map passes the full checks', () => {
    expect(checkFullMap(full)).toEqual([]);
  });

  for (const d of active) {
    describe(d.district, () => {
      const prefix = `${DISTRICT_PREFIX[d.district]}-`;
      const regionsHere = FULL_REGIONS.filter((r) => districtOf(r.id) === d.district);
      const ownIds = (m: DistrictMap): string[] => [
        ...m.blocks.map((b) => b.id), ...m.routes.map((r) => r.id), ...m.spots.map((s) => s.id),
        ...m.containers.map((c) => c.id), ...m.pits.map((p) => p.id), ...m.water.map((w) => w.id), ...m.paths.map((p) => p.id),
      ];

      it('no problem names one of its ids', () => {
        const mine = new Set(ownIds(d));
        const problems = checkFullMap(full).filter((p) => [...mine].some((id) => p.includes(id)));
        expect(problems).toEqual([]);
      });

      it('every id starts with the district prefix', () => {
        for (const id of ownIds(d)) expect(id.startsWith(prefix), id).toBe(true);
      });

      for (const r of regionsHere) {
        it(`${r.id}: hatless, NPC and container spots`, () => {
          if (r.startHatless[1] > 0) {
            const n = d.spots.filter((s) => s.region === r.id && s.kind === 'hatless').length;
            expect(n, `${r.id} hatless spots`).toBeGreaterThanOrEqual(4);
          }
          if (r.startNpcs[1] > 0) {
            const n = d.spots.filter((s) => s.region === r.id && s.kind === 'npc').length;
            expect(n, `${r.id} npc spots`).toBeGreaterThanOrEqual(2);
          }
          const containers = d.containers.filter((c) => c.region === r.id).length;
          expect(containers, `${r.id} containers`).toBeGreaterThanOrEqual(3);
        });

        if (r.traits.includes('HIGH')) {
          it(`${r.id}: has a route up`, () => {
            const up = d.routes.some((route) => {
              const b = full.blocks.find((x) => x.id === route.block);
              return !!b && inRect(r.rect, (b.x0 + b.x1) / 2, (b.z0 + b.z1) / 2);
            });
            expect(up).toBe(true);
          });
        }

        const onEdge = r.rect.x0 === FULL_BOUNDS.x0 || r.rect.x1 === FULL_BOUNDS.x1 || r.rect.z0 === FULL_BOUNDS.z0 || r.rect.z1 === FULL_BOUNDS.z1;
        if (onEdge) {
          it(`${r.id}: fence along the outer edge`, () => {
            const fence = d.blocks.some((b) => b.kind === 'fence' && b.x0 < r.rect.x1 && b.x1 > r.rect.x0 && b.z0 < r.rect.z1 && b.z1 > r.rect.z0);
            expect(fence).toBe(true);
          });
        }
      }
    });
  }

  for (const [haven, regionId] of Object.entries(HAVEN_REGION) as [string, RegionDef['id']][]) {
    const region = FULL_REGIONS.find((r) => r.id === regionId);
    if (!region) continue;
    const owner = active.find((d) => districtOf(regionId) === d.district);
    if (!owner) continue;
    it(`haven ${haven} has a HavenDef, a board and a bed spot`, () => {
      const def = owner.havens.find((h) => h.id === haven);
      expect(def, `${haven} HavenDef`).toBeDefined();
      if (!def) return;
      expect(inRect(region.rect, def.rect.x0, def.rect.z0) && inRect(region.rect, def.rect.x1, def.rect.z1)).toBe(true);
      expect(owner.spots.some((s) => s.region === regionId && s.kind === 'board')).toBe(true);
      expect(owner.spots.some((s) => s.region === regionId && s.kind === 'bed')).toBe(true);
    });
  }
});
