import { describe, expect, it } from 'vitest';
import { installFakeDom } from './testing/fakeDom';
import { isPlace, PLACE_STYLE, RIM_PLACES, type PlaceKind } from './mapIcons';
import { placeBlips } from './mapPois';
import type { Blip } from './types';

installFakeDom();

const KINDS = Object.keys(PLACE_STYLE) as PlaceKind[];

describe('map place styles', () => {
  it('has a name and a colour for every place kind, all distinct', () => {
    expect(KINDS).toHaveLength(11);
    expect(new Set(KINDS.map((k) => PLACE_STYLE[k].color)).size).toBe(KINDS.length);
    expect(new Set(KINDS.map((k) => PLACE_STYLE[k].name)).size).toBe(KINDS.length);
    for (const k of KINDS) expect(PLACE_STYLE[k].name.length).toBeGreaterThan(0);
  });

  it('pins only the services to the rim', () => {
    expect([...RIM_PLACES].sort()).toEqual(['glaze', 'hospital', 'salvage', 'shop']);
  });

  it('recognises every place kind and no quest or player kind', () => {
    for (const k of KINDS) expect(isPlace({ x: 0, z: 0, color: '#000', kind: k })).toBe(true);
    for (const kind of ['main', 'side', 'objective', 'taxi'] as const) {
      expect(isPlace({ x: 0, z: 0, color: '#000', kind })).toBe(false);
    }
    expect(isPlace({ x: 0, z: 0, color: '#000' })).toBe(false);
    expect(isPlace({ x: 0, z: 0, color: '#000', kind: 'bogus' as unknown as Blip['kind'] })).toBe(false);
  });
});

describe('placeBlips', () => {
  it('returns the seven fixed places, distinct kinds and labels', () => {
    const blips = placeBlips();
    expect(blips).toHaveLength(7);
    expect(new Set(blips.map((b) => b.kind)).size).toBe(7);
    expect(new Set(blips.map((b) => b.label)).size).toBe(7);
    for (const b of blips) {
      expect(isPlace(b)).toBe(true);
      expect(b.color).toBe(PLACE_STYLE[b.kind as PlaceKind].color);
      expect(Number.isFinite(b.x) && Number.isFinite(b.z)).toBe(true);
    }
  });
});
