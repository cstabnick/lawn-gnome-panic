import { describe, expect, it } from 'vitest';
import { createHomeVisits, VISITS_KEY } from './visits';
import { homeOf } from './data';

function memoryStorage(): { getItem(k: string): string | null; setItem(k: string, v: string): void; data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
  };
}

describe('home visits', () => {
  it('counts the first visit at a front door once, and puts a home blip on the map', () => {
    const storage = memoryStorage();
    const increments: [string, number][] = [];
    const toasts: string[] = [];
    const visits = createHomeVisits({
      increment: (id, by) => increments.push([id, by]),
      toast: (t) => toasts.push(t),
      storage,
    });
    const door = homeOf('juniper')!.door!;
    expect(visits.blips()).toEqual([]);

    visits.update(door[0], door[1]);
    visits.update(door[0], door[1]);
    expect(increments).toEqual([['gta-house-call', 1]]);
    expect(toasts).toHaveLength(1);
    expect(visits.visited()).toEqual(['juniper']);

    const blips = visits.blips();
    expect(blips).toHaveLength(1);
    expect(blips[0]).toMatchObject({ x: door[0], z: door[1], kind: 'home' });
    expect(blips[0].label?.[0]).toBe(blips[0].label?.[0].toUpperCase());
  });

  it('ignores a player standing far from every door', () => {
    const visits = createHomeVisits({ increment: () => {}, toast: () => {}, storage: memoryStorage() });
    visits.update(1e4, 1e4);
    expect(visits.visited()).toEqual([]);
  });

  it('remembers a visit in the save across a new instance on the same storage', () => {
    const storage = memoryStorage();
    const door = homeOf('juniper')!.door!;
    createHomeVisits({ increment: () => {}, toast: () => {}, storage }).update(door[0], door[1]);
    expect(JSON.parse(storage.data.get(VISITS_KEY)!)).toEqual(['juniper']);

    const increments: string[] = [];
    const again = createHomeVisits({ increment: (id) => increments.push(id), toast: () => {}, storage });
    expect(again.visited()).toEqual(['juniper']);
    again.update(door[0], door[1]);
    expect(increments).toEqual([]);
    expect(again.blips().map((b) => b.kind)).toEqual(['home']);
  });

  it('treats a bad save as no visits', () => {
    const storage = memoryStorage();
    storage.setItem(VISITS_KEY, '{not json');
    const visits = createHomeVisits({ increment: () => {}, toast: () => {}, storage });
    expect(visits.visited()).toEqual([]);
  });
});
