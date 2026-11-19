import { describe, expect, it } from 'vitest';
import type { MutableZone } from '../context';
import { COLLECTIONS, collection } from '../profile';
import { pickItem } from './selectMath';

function zone(parts: Partial<Record<'regions' | 'lakes' | 'stamps', unknown[]>>): MutableZone {
  return { regions: [], lakes: [], houses: [], exits: [], spawn: { x: 9999, z: 9999 }, shrine: { x: 9999, z: 9999, name: '' }, ...parts } as unknown as MutableZone;
}

describe('pickItem', () => {
  it('picks the nearest item', () => {
    const def = zone({ lakes: [{ x: 0, z: 0, r: 2 }, { x: 0, z: 6, r: 2 }] });
    const lakes = [collection('lakes')];
    expect(pickItem(def, lakes, 0, 1, 0)).toEqual({ collection: 'lakes', index: 0 });
    expect(pickItem(def, lakes, 0, 5)).toEqual({ collection: 'lakes', index: 1 });
  });

  it('picks a small lake near its centre and the big region near its edge', () => {
    const def = zone({
      regions: [{ id: 'big', name: 'Big', x: 0, z: 0, r: 20 }],
      lakes: [{ x: 8, z: 0, r: 3 }],
    });
    expect(pickItem(def, COLLECTIONS, 8.5, 0)).toEqual({ collection: 'lakes', index: 0 });
    expect(pickItem(def, COLLECTIONS, 17, 0)).toEqual({ collection: 'regions', index: 0 });
  });

  it('gives a tie to the later collection', () => {
    const def = zone({
      regions: [{ id: 'r', name: 'R', x: 0, z: 0, r: 10 }],
      lakes: [{ x: 0, z: 0, r: 4 }],
    });
    expect(pickItem(def, COLLECTIONS, 0, 0)).toEqual({ collection: 'lakes', index: 0 });
  });

  it('ignores items the collection does not accept, and returns the raw array index', () => {
    const def = zone({
      stamps: [
        { op: 'gauss', x: 0, z: 0, sigma: 6, amount: 3 },
        { op: 'flatten', x: 0, z: 0, inner: 6, outer: 16, to: 1 },
      ],
    });
    expect(pickItem(def, [collection('stamp-flatten')], 0, 0)).toEqual({ collection: 'stamp-flatten', index: 1 });
    expect(pickItem(def, [collection('stamp-gauss')], 0, 0)).toEqual({ collection: 'stamp-gauss', index: 0 });
  });

  it('minPick lets a tiny item be hit', () => {
    const def = zone({ lakes: [{ x: 0, z: 0, r: 0.2 }] });
    const lakes = [collection('lakes')];
    expect(pickItem(def, lakes, 1.2, 0)).toEqual({ collection: 'lakes', index: 0 });
    expect(pickItem(def, lakes, 1.2, 0, 0.5)).toBeNull();
  });

  it('returns null far away', () => {
    const def = zone({ lakes: [{ x: 0, z: 0, r: 5 }] });
    expect(pickItem(def, COLLECTIONS, 100, 100)).toBeNull();
  });
});
