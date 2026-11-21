import { describe, expect, it } from 'vitest';
import { validateLevelDoc } from '@lawn/level';
import { ZONES } from './content';
import { ZONE_DOCS, compareMarkers, docToZone, worldZoneToDoc } from './levelDocs';
import type { LevelDoc, MarkerDef } from '@lawn/level';
import type { ZoneData } from './levelDocs';
import type { ZoneId } from './config';

const IDS = ['mossbottom', 'thatchford', 'keep', 'deeps', 'cloverfield', 'hedgewood', 'rockery', 'verge'] as const satisfies readonly ZoneId[];

describe('level documents for the eight authored zones', () => {
  for (const id of IDS) {
    it(`${id}: the document is valid`, () => {
      expect(validateLevelDoc(ZONE_DOCS[id])).toEqual([]);
    });

    it(`${id}: the world zone round-trips to the checked-in document`, () => {
      expect(worldZoneToDoc(ZONES[id])).toEqual(ZONE_DOCS[id]);
    });

    it(`${id}: the document loads as a zone with numeric colours`, () => {
      const zone = docToZone(ZONE_DOCS[id]!);
      expect(zone.id).toBe(id);
      expect(typeof zone.theme.ground).toBe('number');
      expect(typeof zone.theme.sky).toBe('number');
    });
  }

  it('mossbottom loads with the values the zone file held', () => {
    const zone = docToZone(ZONE_DOCS.mossbottom!);
    expect(zone.regions).toHaveLength(5);
    expect(zone.lakes).toHaveLength(1);
    expect(zone.houses).toHaveLength(5);
    expect(zone.decks).toHaveLength(1);
    expect(zone.decks?.[0]?.stair).toBe('s');
    expect(zone.exits).toHaveLength(1);
    expect(zone.exits[0]?.to).toBe('thatchford');
    expect(zone.theme.ground).toBe(0x5f9e3f);
    expect(zone.stamps?.length).toBeGreaterThan(0);
  });
});

describe('roadMode', () => {
  it('round-trips through the document and stays absent when derived', () => {
    const mb = ZONES.mossbottom;
    expect(worldZoneToDoc(mb).data.roadMode).toBeUndefined();
    const doc = worldZoneToDoc({ ...mb, roadMode: 'authored' });
    expect(doc.data.roadMode).toBe('authored');
    expect(docToZone(doc).roadMode).toBe('authored');
    expect(docToZone(worldZoneToDoc(mb)).roadMode).toBeUndefined();
  });
});

describe('object markers', () => {
  it('keep their unknown data keys through docToZone and worldZoneToDoc', () => {
    const base = ZONE_DOCS.verge!;
    const doc: LevelDoc<ZoneData> = {
      ...base,
      markers: [{ id: 'test-marker', kind: 'object', x: 1.5, z: -2, data: { v: 1, tint: '#ff0000', extra: { a: 1 } } }],
    };
    const zone = docToZone(doc);
    expect(zone.markers).toEqual(doc.markers);
    // Origin 0 so the positions come back as they went in (content.ts sets a real origin for world zones).
    expect(worldZoneToDoc({ ...zone, origin: { x: 0, z: 0 } }).markers).toEqual(doc.markers);
  });
});

describe('marker order on save', () => {
  const shuffled: MarkerDef[] = [
    { id: 'b-spawn', kind: 'spawn', x: 3, z: 1, data: { v: 1 } },
    { id: 'z-object', kind: 'object', x: 2, z: 2, data: { v: 1 } },
    { id: 'a-object', kind: 'object', x: 5, z: -1, data: { v: 1 } },
    { id: 'a-spawn', kind: 'spawn', x: 0, z: 4, data: { v: 1 } },
    { id: 'a-object', kind: 'object', x: -5, z: 9, data: { v: 1 } },
  ];

  it('saves a shuffled zone with markers sorted by kind, then id (then x, then z)', () => {
    const zone = { ...ZONES.verge, origin: { x: 0, z: 0 }, markers: shuffled };
    const saved = worldZoneToDoc(zone).markers;
    expect(saved.map((m) => `${m.kind}:${m.id}:${m.x}`)).toEqual([
      'object:a-object:-5',
      'object:a-object:5',
      'object:z-object:2',
      'spawn:a-spawn:0',
      'spawn:b-spawn:3',
    ]);
    // Same input, same output every time.
    expect(worldZoneToDoc({ ...zone, markers: [...shuffled].reverse() }).markers).toEqual(saved);
  });

  it('does not mutate the zone\'s own marker array', () => {
    const before = shuffled.map((m) => ({ ...m }));
    const zone = { ...ZONES.verge, origin: { x: 0, z: 0 }, markers: shuffled };
    worldZoneToDoc(zone);
    expect(shuffled).toEqual(before);
    expect(zone.markers).toBe(shuffled);
  });

  it('compareMarkers compares kind, then id, with plain string order', () => {
    const m = (kind: string, id: string, x = 0, z = 0): MarkerDef => ({ id, kind, x, z });
    expect(compareMarkers(m('object', 'x'), m('spawn', 'a'))).toBeLessThan(0);
    expect(compareMarkers(m('spawn', 'a'), m('object', 'x'))).toBeGreaterThan(0);
    // Uppercase sorts before lowercase in code-unit order; localeCompare would put 'a' first.
    expect(compareMarkers(m('object', 'B'), m('object', 'a'))).toBeLessThan(0);
    expect(compareMarkers(m('object', 'a', 1, 0), m('object', 'a', 2, 0))).toBeLessThan(0);
    expect(compareMarkers(m('object', 'a', 1, 1), m('object', 'a', 1, 2))).toBeLessThan(0);
    expect(compareMarkers(m('object', 'a'), m('object', 'a'))).toBe(0);
  });

  it('every checked-in zone already has its markers in that order', () => {
    for (const id of Object.keys(ZONE_DOCS) as ZoneId[]) {
      const markers = ZONE_DOCS[id]!.markers;
      const sorted = [...markers].sort(compareMarkers);
      expect(markers, id).toEqual(sorted);
    }
  });
});
