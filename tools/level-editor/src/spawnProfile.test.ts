import type { MarkerDef } from '@lawn/level';
import { SPAWNS } from '@gnomomia/content';
import { describe, expect, it } from 'vitest';
import type { MutableZone } from './context';
import { collection } from './profile';

// A real pack spawn (its id and pack count and spread come from SPAWNS), placed by a marker in the zone file.
const pack = SPAWNS.find((s) => s.id !== undefined && s.count !== undefined);
if (!pack?.id) throw new Error('the game has no spawn with an id');

function zoneWith(markers: MarkerDef[]): MutableZone {
  return { markers } as unknown as MutableZone;
}

describe('spawns collection', () => {
  it('is fixed, and its ring is the spread', () => {
    const c = collection('spawns');
    expect(c.fixed).toBe(true);
    expect(c.fields.map((f) => f.key)).toEqual(['count', 'spread']);
  });

  it('reads a spawn marker through the view: x and z from the marker, count and spread from its data', () => {
    const def = zoneWith([{ id: pack.id!, kind: 'spawn', x: 5, z: 6, data: { v: 1, count: 3, spread: 4 } }]);
    const c = collection('spawns');
    const items = c.items(def);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ id: pack.id, x: 5, z: 6, count: 3, spread: 4 });
    expect(c.radius(items[0])).toBe(4);
  });

  it('sets count and spread into the marker data and keeps data.v at 1', () => {
    const def = zoneWith([{ id: pack.id!, kind: 'spawn', x: 5, z: 6, data: { v: 1, count: 3, spread: 4 } }]);
    const view = collection('spawns').items(def)[0];
    view.count = 5;
    view.spread = 2.5;
    expect(def.markers?.[0]).toEqual({ id: pack.id, kind: 'spawn', x: 5, z: 6, data: { v: 1, count: 5, spread: 2.5 } });
  });

  it('falls back to the pack value when the marker data has no count or spread', () => {
    const def = zoneWith([{ id: pack.id!, kind: 'spawn', x: 1, z: 2 }]);
    const view = collection('spawns').items(def)[0];
    expect(view.count).toBe(pack.count);
    expect(view.spread).toBe(pack.spread);
    expect(collection('spawns').radius(view)).toBe(pack.spread);
  });

  it('writing one field leaves the other to fall back to the pack', () => {
    const def = zoneWith([{ id: pack.id!, kind: 'spawn', x: 1, z: 2 }]);
    const view = collection('spawns').items(def)[0];
    view.count = 7;
    expect(def.markers?.[0].data).toEqual({ v: 1, count: 7 });
    expect(view.spread).toBe(pack.spread);
  });

  it('ignores markers of other kinds', () => {
    const def = zoneWith([
      { id: 'obj', kind: 'object', x: 0, z: 0 },
      { id: pack.id!, kind: 'spawn', x: 5, z: 6 },
    ]);
    expect(collection('spawns').items(def).map((i) => i.id)).toEqual([pack.id]);
  });
});
