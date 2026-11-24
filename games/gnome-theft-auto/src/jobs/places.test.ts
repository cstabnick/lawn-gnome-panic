// Places: every land place dry, water stops deep, air pads flat and dry, drop zones dry, ids unique.
import { describe, expect, it } from 'vitest';
import { waterAt, slopeAt } from '../terrain';
import { AIR_PADS, DROP_ZONES, FERRY_LOOP, LAND_PLACES, SKY_SIGHTS, WATER_STOPS, placeById } from './places';

const dry = (x: number, z: number): boolean => waterAt(x, z) === null;

describe('places', () => {
  it('ids are unique across all tables', () => {
    const all = [...LAND_PLACES, ...WATER_STOPS, ...AIR_PADS, ...SKY_SIGHTS, ...DROP_ZONES];
    const ids = all.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(LAND_PLACES.length).toBeGreaterThanOrEqual(18);
  });

  it('every land place is dry', () => {
    for (const p of LAND_PLACES) expect(dry(p.x, p.z), p.id).toBe(true);
  });

  it('water stops are deep enough', () => {
    for (const p of WATER_STOPS) {
      const w = waterAt(p.x, p.z);
      expect(w, p.id).not.toBeNull();
      expect(w!.depth, p.id).toBeGreaterThanOrEqual(1.0);
    }
  });

  it('the ferry loop uses known water stops', () => {
    const ids = new Set(WATER_STOPS.map((p) => p.id));
    for (const id of FERRY_LOOP) expect(ids.has(id), id).toBe(true);
    expect(FERRY_LOOP.length).toBe(5);
  });

  it('air pads are flat and dry at the centre and 4 points 6 m out', () => {
    for (const p of AIR_PADS) {
      const pts = [[p.x, p.z], [p.x + 6, p.z], [p.x - 6, p.z], [p.x, p.z + 6], [p.x, p.z - 6]];
      for (const [x, z] of pts) {
        expect(dry(x, z), `${p.id} dry at ${x},${z}`).toBe(true);
        expect(slopeAt(x, z), `${p.id} slope at ${x},${z}`).toBeLessThanOrEqual(0.15);
      }
    }
  });

  it('drop zones are dry and gently sloped', () => {
    for (const p of DROP_ZONES) {
      expect(dry(p.x, p.z), p.id).toBe(true);
      expect(slopeAt(p.x, p.z), p.id).toBeLessThanOrEqual(0.2);
    }
  });

  it('placeById finds a place from any table', () => {
    expect(placeById('loch-dock')?.x).toBe(-705);
    expect(placeById('nope')).toBeUndefined();
  });
});
