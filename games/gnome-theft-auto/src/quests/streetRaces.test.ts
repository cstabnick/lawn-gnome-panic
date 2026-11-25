import { getPrefab } from '@lawn/prefabs';
import { describe, expect, it } from 'vitest';
import { STREET_TRACK_IDS } from '../raceTrack/tracks';
import { MEET_CAST } from '../streetRace/cast';
import { MEET_IDS } from '../streetRace/types';
import { STREET_QUESTS, STREET_QUEST_IDS } from './streetRaces';

describe('street racing quests', () => {
  it('ids match STREET_QUEST_IDS in order', () => {
    expect(STREET_QUESTS.map((q) => q.id)).toEqual([...STREET_QUEST_IDS]);
  });
  it('every race objective uses a street track and its raceId follows the quest id', () => {
    for (const q of STREET_QUESTS) {
      const o = q.objectives[0];
      expect(o.kind).toBe('race');
      if (o.kind !== 'race') continue;
      expect(STREET_TRACK_IDS as readonly string[]).toContain(o.trackId);
      expect(o.raceId).toBe(q.id.replace('sr-', ''));
      expect(o.rivals).toHaveLength(3);
    }
  });
  it('is a prereq chain', () => {
    STREET_QUESTS.forEach((q, i) => expect(q.prereq).toBe(i === 0 ? undefined : STREET_QUEST_IDS[i - 1]));
  });
  it('givers are the three meet organisers', () => {
    const givers = new Set(STREET_QUESTS.map((q) => q.giver));
    expect([...givers].sort()).toEqual(['street-pardonlin', 'street-saltbucket', 'street-skyway-foot']);
  });
  it('every vignette prop resolves to a prefab and stays within 4 m', () => {
    for (const id of MEET_IDS) {
      const cast = MEET_CAST[id];
      expect(cast.organiser.id).toBe(`street-${id}`);
      expect(cast.vignettes.length).toBeGreaterThanOrEqual(3);
      for (const v of cast.vignettes) {
        expect(v.props.length).toBeGreaterThanOrEqual(3);
        for (const p of v.props) {
          expect(getPrefab(p.id), p.id).toBeDefined();
          expect(Math.hypot(p.dx, p.dz)).toBeLessThanOrEqual(4);
        }
      }
    }
  });
});
