import { describe, expect, it } from 'vitest';
import type { OutdoorZoneId, ZoneId } from './config';
import { ZONES } from './content';
import {
  LIFE_LINES,
  TRAVEL_MIN_DIST,
  lifeSpots,
  pickLifeActivity,
  pickTravelDestination,
  restSpot,
  zoneHops,
} from './companionLife';
import { TOWNS } from './towns';

const outdoorIds = (Object.keys(ZONES) as ZoneId[]).filter((id) => {
  const z = ZONES[id];
  return !id.includes('/') && !z.indoor && !z.interior;
}) as OutdoorZoneId[];

describe('lifeSpots', () => {
  const spots = lifeSpots();

  it('has one town spot per town, with townId set', () => {
    const townSpots = spots.filter((s) => s.townId !== null);
    expect(townSpots).toHaveLength(TOWNS.length);
    for (const t of TOWNS) {
      expect(townSpots.some((s) => s.townId === t.id && s.zone === t.zone)).toBe(true);
    }
  });

  it('has one shrine spot per outdoor, non-interior zone', () => {
    const shrineSpots = spots.filter((s) => s.townId === null);
    expect(shrineSpots.map((s) => s.zone).sort()).toEqual([...outdoorIds].sort());
  });

  it('has no spot in the Deeps', () => {
    expect(spots.some((s) => s.zone === 'deeps')).toBe(false);
  });
});

describe('zoneHops', () => {
  it('counts exit hops', () => {
    expect(zoneHops('mossbottom', 'mossbottom')).toBe(0);
    expect(zoneHops('mossbottom', 'thatchford')).toBe(1);
    expect(zoneHops('thatchford', 'cloverfield')).toBe(2);
  });

  it('is Infinity for an unknown zone', () => {
    expect(zoneHops('mossbottom', 'nowhere' as ZoneId)).toBe(Infinity);
    expect(zoneHops('nowhere' as ZoneId, 'mossbottom')).toBe(Infinity);
  });
});

describe('pickTravelDestination', () => {
  const spots = lifeSpots();

  it('finds a trip from every outdoor shrine, within one hop and far enough away', () => {
    for (const id of outdoorIds) {
      const shrine = ZONES[id].shrine;
      const r = pickTravelDestination(id, shrine.x, shrine.z, () => true, () => 0.5);
      expect(r, id).not.toBeNull();
      expect(zoneHops(id, r!.zone)).toBeLessThanOrEqual(1);
      expect(Math.hypot(r!.x - shrine.x, r!.z - shrine.z)).toBeGreaterThanOrEqual(TRAVEL_MIN_DIST);
    }
  });

  it('returns null when no band fits', () => {
    expect(pickTravelDestination('mossbottom', 0, 0, () => false, () => 0.5, spots)).toBeNull();
  });

  it('only picks verge from hedgewood when only high bands fit', () => {
    const fixed = pickTravelDestination('hedgewood', 0, 0, (b) => b[0] >= 25, () => 0.5, spots);
    expect(fixed?.zone).toBe('verge');
  });
});

describe('restSpot', () => {
  it('finds the nearest spot in the same zone', () => {
    const r = restSpot('mossbottom', 0, 0);
    expect(r).not.toBeNull();
    expect(r!.zone).toBe('mossbottom');
  });

  it('is null for a zone with no spots', () => {
    expect(restSpot('deeps', 0, 0)).toBeNull();
  });
});

describe('pickLifeActivity', () => {
  it('picks idle for a low roll and travel for a high roll', () => {
    expect(pickLifeActivity('tryhard', () => 0)).toBe('idle');
    expect(pickLifeActivity('tryhard', () => 0.99)).toBe('travel');
  });

  it('never travels when canTravel is false', () => {
    expect(pickLifeActivity('tryhard', () => 0.99, false)).toBe('idle');
  });
});

describe('LIFE_LINES', () => {
  it('has non-empty lists of short lines', () => {
    for (const lines of Object.values(LIFE_LINES)) {
      for (const list of [lines.rest, lines.travel, lines.arrive]) {
        expect(list.length).toBeGreaterThan(0);
        for (const line of list) expect(line.length).toBeLessThanOrEqual(40);
      }
    }
  });
});
