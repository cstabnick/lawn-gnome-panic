// Checks the map data in maps.ts. The standability rule is written out here on purpose (walk.ts is not imported).
import { describe, expect, it } from 'vitest';
import { getPrefab } from '@lawn/prefabs';
import { GAME_LINKS, MAP_IDS, type MapDef, type MapId, type Rect } from './config';
import { MAPS } from './maps';

const WALL_CLEARANCE = 0.35; // a gnome stands at least this far from a building or blocker
const EDGE_CLEARANCE = 0.8; // and at least this far inside the map bounds
/** Prefabs that another worker is adding right now: not checked for existence. */
const PENDING_PREFABS = new Set<string>();
/** Prefabs a gnome must not walk through: each needs a blocker rect containing its centre. */
const SOLID_PREFABS = new Set([
  'stone-fountain', 'hq-tent', 'garden-shed', 'golf-cart', 'bar-counter', 'cocktail-table', 'arcade-cabinet',
  'vending-machine', 'blackjack-table', 'slot-machine-classic', 'slot-machine-deluxe', 'slot-machine-mushroom',
]);
/** Props that stand for a spot: each needs a spot within r - 0.2. */
const SPOT_PREFABS = new Set(['arcade-cabinet', 'blackjack-table']);

const inflated = (r: Rect, margin: number, x: number, z: number) =>
  Math.abs(x - r.x) < r.w / 2 + margin && Math.abs(z - r.z) < r.d / 2 + margin;

function standable(map: MapDef, x: number, z: number): boolean {
  if (Math.abs(x) > map.w / 2 - EDGE_CLEARANCE || Math.abs(z) > map.d / 2 - EDGE_CLEARANCE) return false;
  const solid: Rect[] = [...map.blockers, ...map.buildings];
  return !solid.some((r) => inflated(r, WALL_CLEARANCE, x, z));
}

const dist = (ax: number, az: number, bx: number, bz: number) => Math.hypot(ax - bx, az - bz);

describe.each(MAP_IDS)('map %s', (id: MapId) => {
  const map = MAPS[id];

  it('has an id that matches its key', () => {
    expect(map.id).toBe(id);
  });

  it('has unique ids within the map', () => {
    const ids = [...map.buildings, ...map.portals, ...map.spots].map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has a standable spawn', () => {
    expect(standable(map, map.spawn.x, map.spawn.z)).toBe(true);
  });

  it('links every building to a portal or spot on the same map', () => {
    const targets = new Set([...map.portals, ...map.spots].map((e) => e.id));
    for (const b of map.buildings) {
      if (b.link !== undefined) expect(targets.has(b.link), `${b.id} -> ${b.link}`).toBe(true);
    }
  });

  it('has portal and spot centres that are standable', () => {
    for (const p of map.portals) expect(standable(map, p.x, p.z), `portal ${p.id}`).toBe(true);
    for (const s of map.spots) expect(standable(map, s.x, s.z), `spot ${s.id}`).toBe(true);
  });

  it('only uses spot games that exist in GAME_LINKS', () => {
    for (const s of map.spots) expect(s.game in GAME_LINKS, `spot ${s.id}`).toBe(true);
  });

  it('only uses prefabs that exist (except pending ones)', () => {
    for (const p of map.props) {
      if (PENDING_PREFABS.has(p.prefab)) continue;
      expect(getPrefab(p.prefab), `prop ${p.prefab} at (${p.x}, ${p.z})`).toBeDefined();
    }
  });

  it('gives solid props a blocker rect that contains them', () => {
    for (const p of map.props) {
      if (!SOLID_PREFABS.has(p.prefab)) continue;
      const covered = map.blockers.some((r) => inflated(r, 0, p.x, p.z));
      expect(covered, `${p.prefab} at (${p.x}, ${p.z}) needs a blocker`).toBe(true);
    }
  });

  it('keeps spot-standing props within their spot radius', () => {
    for (const p of map.props) {
      if (!SPOT_PREFABS.has(p.prefab)) continue;
      const near = map.spots.some((s) => dist(p.x, p.z, s.x, s.z) <= s.r - 0.2);
      expect(near, `${p.prefab} at (${p.x}, ${p.z}) has no spot in reach`).toBe(true);
    }
  });
});

describe('portals across maps', () => {
  for (const id of MAP_IDS) {
    for (const p of MAPS[id].portals) {
      it(`portal ${id}/${p.id} leads to a standable spawn that does not re-trigger`, () => {
        const dest = MAPS[p.to];
        expect(dest, `portal ${p.id} destination`).toBeDefined();
        expect(standable(dest, p.spawnX, p.spawnZ), `spawn of ${p.id} in ${p.to}`).toBe(true);
        for (const q of dest.portals) {
          expect(dist(p.spawnX, p.spawnZ, q.x, q.z), `spawn of ${p.id} vs ${q.id} in ${p.to}`)
            .toBeGreaterThanOrEqual(p.r + 0.5);
        }
      });
    }
  }
});
