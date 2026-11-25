import { describe, expect, it } from 'vitest';
import { installFakeDom } from './testing/fakeDom';
import { drawPlaceIcon, isPlace, layoutMapLabels, PLACE_STYLE, RIM_PLACES, type MapLabelWish, type PlaceKind } from './mapIcons';
import { placeBlips } from './mapPois';
import type { Blip } from './types';

installFakeDom();

const KINDS = Object.keys(PLACE_STYLE) as PlaceKind[];

describe('map place styles', () => {
  it('has a name and a colour for every place kind, all distinct', () => {
    // Other features add places: at least the 20 this file was written with.
    expect(KINDS.length).toBeGreaterThanOrEqual(20);
    expect(new Set(KINDS.map((k) => PLACE_STYLE[k].color)).size).toBe(KINDS.length);
    expect(new Set(KINDS.map((k) => PLACE_STYLE[k].name)).size).toBe(KINDS.length);
    for (const k of KINDS) expect(PLACE_STYLE[k].name.length).toBeGreaterThan(0);
  });

  it('pins only the services to the rim', () => {
    expect([...RIM_PLACES].sort()).toEqual(['exchange', 'glaze', 'hospital', 'salvage', 'shop']);
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
  it('returns the fixed places: distinct labels, and each kind once unless it repeats by design', () => {
    const blips = placeBlips();
    // 10 original places + 4 services/bent pin + 4 road ramps + the Unfinished Span + East Beltway + 2 work sites
    // + the Kerbside Exchange + 7 parks + 4 city edges.
    // At least these 32; other features add more (one line each in mapPois.ts).
    expect(blips.length).toBeGreaterThanOrEqual(32);
    expect(new Set(blips.map((b) => b.label)).size).toBe(blips.length);
    const repeats = new Set<string>(['onramp', 'works', 'skyway', 'park', 'edge', 'town']);
    const counts = new Map<string, number>();
    for (const b of blips) counts.set(b.kind as string, (counts.get(b.kind as string) ?? 0) + 1);
    for (const [kind, n] of counts) if (!repeats.has(kind)) expect(n).toBe(1);
    expect(counts.get('onramp')).toBe(5);
    expect(counts.get('works')).toBe(2);
    expect(counts.get('skyway')).toBe(5); // 2 + the Hatwheel, Trellis Cross and the Anthill Ring (E28)
    expect(counts.get('park')).toBe(10); // the 6 parks + Founders' Green (one blip for its two added blocks) + 3 E28 (Unmown, ranger station, basin)
    expect(counts.get('edge')).toBe(7); // 4 city edges + 3 E28 wickets
    expect(counts.get('town')).toBe(2); // Pebblewick + Pardonlin (E28)
    for (const b of blips) {
      expect(isPlace(b)).toBe(true);
      expect(b.color).toBe(PLACE_STYLE[b.kind as PlaceKind].color);
      expect(Number.isFinite(b.x) && Number.isFinite(b.z)).toBe(true);
    }
  });

  it('draws every place kind without throwing', () => {
    const g = document.createElement('canvas').getContext('2d')!;
    for (const k of KINDS) expect(() => drawPlaceIcon(g, 10, 10, 8, k)).not.toThrow();
  });
});

describe('big-map label layout', () => {
  // 6 px per character stands in for canvas text measuring.
  const measure = (text: string): number => text.length * 6;
  const overlaps = (a: number[], b: number[]): boolean => !(a[2] < b[0] || a[0] > b[2] || a[3] < b[1] || a[1] > b[3]);

  it('gives a contested spot to the active quest, then the nearest quest, then places', () => {
    const wishes: MapLabelWish[] = [
      { text: 'Clay-Mart', x: 100, y: 100, side: 'below', size: 11, prio: 1000 },
      { text: 'The Mulch Club', x: 104, y: 120, side: 'above', size: 12, prio: 1.2, pad: 2 },
      { text: 'Pip Potsworth', x: 98, y: 122, side: 'above', size: 12, prio: 1.1, pad: 2 },
    ];
    let spots = layoutMapLabels(wishes, measure, 300, 300);
    expect(spots.map((s) => s.text)).toEqual(['Pip Potsworth']);
    spots = layoutMapLabels([...wishes, { text: 'Objective', x: 100, y: 121, side: 'above', size: 12, prio: 0, pad: 2 }], measure, 300, 300);
    expect(spots.map((s) => s.text)).toEqual(['Objective']);
  });

  it('never overlaps two names, and keeps names apart that have room', () => {
    const wishes: MapLabelWish[] = [];
    for (let i = 0; i < 30; i++) wishes.push({ text: `Place ${i}`, x: 40 + (i % 6) * 18, y: 40 + Math.floor(i / 6) * 9, side: i % 2 ? 'above' : 'below', size: 11, prio: i });
    const spots = layoutMapLabels(wishes, measure, 300, 300);
    expect(spots.length).toBeGreaterThan(1);
    for (let i = 0; i < spots.length; i++) for (let j = i + 1; j < spots.length; j++) expect(overlaps(spots[i].box, spots[j].box)).toBe(false);
  });

  it('keeps a name by the edge inside the map: slides in from the sides, flips at the top and bottom', () => {
    const W = 366; // a 390 px wide phone's big map
    const left = layoutMapLabels([{ text: 'Lost & Found Speedway', x: 6, y: 150, side: 'below', size: 11, prio: 1 }], measure, W, W)[0];
    expect(left.box[0]).toBeGreaterThanOrEqual(0);
    const right = layoutMapLabels([{ text: 'Lost & Found Speedway', x: W - 4, y: 150, side: 'below', size: 11, prio: 1 }], measure, W, W)[0];
    expect(right.box[2]).toBeLessThanOrEqual(W);
    const bottom = layoutMapLabels([{ text: 'Airfield', x: 100, y: W - 5, side: 'below', size: 11, prio: 1 }], measure, W, W)[0];
    expect(bottom.y).toBeLessThan(W - 5);
    expect(bottom.box[3]).toBeLessThanOrEqual(W);
    const top = layoutMapLabels([{ text: 'Tessie', x: 100, y: 4, side: 'above', size: 12, prio: 1, pad: 2 }], measure, W, W)[0];
    expect(top.y).toBeGreaterThan(4);
    expect(top.box[1]).toBeGreaterThanOrEqual(0);
  });
});
