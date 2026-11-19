import { describe, expect, it } from 'vitest';
import { validateLevelDoc } from '@lawn/level';
import { ZONES } from './content';
import { ZONE_DOCS, docToZone, worldZoneToDoc } from './levelDocs';
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
    expect(zone.stamps).toBeUndefined();
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
