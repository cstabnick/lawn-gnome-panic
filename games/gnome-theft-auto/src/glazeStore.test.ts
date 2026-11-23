import { describe, expect, it } from 'vitest';
import { defaultLoadout, encodeLoadout, normalizeLoadout } from '@lawn/glaze';
import {
  GLAZE_SAVE_KEY, clearOwnedLoadout, glazeStorageForTest, onOwnedChange, ownedLoadout, saveOwnedLoadout,
} from './glazeStore';

function fakeStorage(initial: Record<string, string> = {}) {
  const map = new Map<string, string>(Object.entries(initial));
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => { map.set(k, v); },
    map,
  };
}

const LOADOUT = { ...defaultLoadout(0x2255aa), spoiler: 'picket' as const, rideHeight: 0.5 };

describe('glazeStore', () => {
  it('starts empty when storage is empty', () => {
    glazeStorageForTest(fakeStorage());
    expect(ownedLoadout('ride-on')).toBeNull();
  });

  it('saves a loadout, reads it back, and persists it as a code string under GLAZE_SAVE_KEY', () => {
    const store = fakeStorage();
    glazeStorageForTest(store);
    saveOwnedLoadout('ride-on', LOADOUT);
    expect(ownedLoadout('ride-on')).toEqual(normalizeLoadout(LOADOUT));

    const saved = JSON.parse(store.map.get(GLAZE_SAVE_KEY)!) as Record<string, string>;
    expect(saved['ride-on']).toBe(encodeLoadout(LOADOUT));
  });

  it('reloads the saved loadouts from the same storage', () => {
    const store = fakeStorage();
    glazeStorageForTest(store);
    saveOwnedLoadout('ride-on', LOADOUT);
    glazeStorageForTest(store);
    expect(ownedLoadout('ride-on')).toEqual(normalizeLoadout(LOADOUT));
  });

  it('drops garbage JSON, invalid codes and non-glaze kinds on load', () => {
    glazeStorageForTest(fakeStorage({ [GLAZE_SAVE_KEY]: '{not json' }));
    expect(ownedLoadout('ride-on')).toBeNull();

    const valid = encodeLoadout(LOADOUT);
    glazeStorageForTest(fakeStorage({
      [GLAZE_SAVE_KEY]: JSON.stringify({ 'ride-on': 'g1.bad', plane: valid, 'zero-turn': 7 }),
    }));
    expect(ownedLoadout('ride-on')).toBeNull();
    expect(ownedLoadout('plane' as never)).toBeNull();
  });

  it('keeps valid entries when others are dropped', () => {
    glazeStorageForTest(fakeStorage({
      [GLAZE_SAVE_KEY]: JSON.stringify({ 'ride-on': encodeLoadout(LOADOUT), combine: 'g1.bad' }),
    }));
    expect(ownedLoadout('ride-on')).toEqual(normalizeLoadout(LOADOUT));
    expect(ownedLoadout('combine')).toBeNull();
  });

  it('clears a model and writes the clear through', () => {
    const store = fakeStorage();
    glazeStorageForTest(store);
    saveOwnedLoadout('ride-on', LOADOUT);
    clearOwnedLoadout('ride-on');
    expect(ownedLoadout('ride-on')).toBeNull();
    expect(JSON.parse(store.map.get(GLAZE_SAVE_KEY)!)).toEqual({});
  });

  it('notifies listeners on save and clear, and stops after unsubscribe', () => {
    glazeStorageForTest(fakeStorage());
    const seen: string[] = [];
    const off = onOwnedChange((k) => seen.push(k));
    saveOwnedLoadout('hoa-van', LOADOUT);
    clearOwnedLoadout('hoa-van');
    expect(seen).toEqual(['hoa-van', 'hoa-van']);
    off();
    saveOwnedLoadout('hoa-van', LOADOUT);
    expect(seen).toHaveLength(2);
    clearOwnedLoadout('hoa-van');
  });

  it('works with no storage at all', () => {
    glazeStorageForTest(null);
    saveOwnedLoadout('combine', LOADOUT);
    expect(ownedLoadout('combine')).toEqual(normalizeLoadout(LOADOUT));
    clearOwnedLoadout('combine');
  });
});
