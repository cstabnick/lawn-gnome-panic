import { describe, expect, it } from 'vitest';
import { validateLevelDoc } from '@lawn/level';
import doc from './pebblecross.level.json';

// The place ids are fixed by docs/roadmaps/pebblecross.md ("Places"). Hard-coded here on purpose:
// the test checks the level file against the roadmap, not against itself.
const PLACE_IDS = [
  'bakery', 'post-office', 'potting-shed', 'yard-shed', 'school', 'inn', 'green', 'green-bench', 'pond', 'oak',
  'home-nettle', 'home-fernwick', 'home-tansy', 'home-hollis', 'home-lou', 'home-marjory', 'home-clem', 'home-doris',
  'home-gertrude',
];

const FORAGE_ITEMS = [
  'dandelion', 'dandelion', 'dandelion', 'clover', 'clover', 'acorn', 'acorn', 'pebble', 'pebble',
  'mushroom', 'mushroom', 'bottlecap', 'bottlecap', 'crumb',
];

interface Marker { id: string; kind: string; x: number; z: number; r?: number; data?: { item?: string; label?: string } }
interface Building { id: string; x: number; z: number; w: number; d: number }

const markers = doc.markers as Marker[];
const buildings = (doc.data as { buildings: Building[] }).buildings;

const MARGIN = 0.3;

/** True when (x, z) is inside the building's footprint grown by MARGIN on every side. */
function insideFootprint(b: Building, x: number, z: number): boolean {
  return Math.abs(x - b.x) <= b.w / 2 + MARGIN && Math.abs(z - b.z) <= b.d / 2 + MARGIN;
}

describe('pebblecross town level', () => {
  it('validates as a level document', () => {
    expect(validateLevelDoc(doc)).toEqual([]);
  });

  it('has exactly one place marker per PlaceId and no others', () => {
    const places = markers.filter((m) => m.kind === 'place');
    const ids = places.map((m) => m.id);
    for (const id of PLACE_IDS) {
      expect(ids.filter((x) => x === id)).toHaveLength(1);
    }
    expect(places).toHaveLength(PLACE_IDS.length);
  });

  it('has the forage patches with the gift ids from the roadmap', () => {
    const forage = markers.filter((m) => m.kind === 'forage');
    expect(forage).toHaveLength(FORAGE_ITEMS.length);
    const items = forage.map((m) => m.data?.item).sort();
    expect(items).toEqual([...FORAGE_ITEMS].sort());
  });

  it('has fifteen buildings with the roadmap ids', () => {
    expect(buildings).toHaveLength(15);
    const ids = buildings.map((b) => b.id);
    expect(new Set(ids).size).toBe(15);
  });

  it('has exactly one spawn marker', () => {
    const spawns = markers.filter((m) => m.kind === 'spawn');
    expect(spawns).toHaveLength(1);
    expect(spawns[0].id).toBe('spawn');
  });

  it('keeps every place and forage patch out of every building footprint', () => {
    const points = markers.filter((m) => m.kind === 'place' || m.kind === 'forage');
    for (const m of points) {
      for (const b of buildings) {
        expect(insideFootprint(b, m.x, m.z), `${m.id} inside ${b.id}`).toBe(false);
      }
    }
  });
});
