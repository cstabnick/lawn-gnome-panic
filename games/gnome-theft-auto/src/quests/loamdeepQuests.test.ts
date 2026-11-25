import { describe, expect, it } from 'vitest';
import { LOAMDEEP_QUESTS } from './loamdeepQuests';
import { SOCIETY_INTERIORS, SOCIETY_PROBES, SOCIETY_QUESTS } from '../societies/config';

const interiorIds = new Set<string>(Object.values(SOCIETY_INTERIORS));
const probeIds = new Set<string>(Object.values(SOCIETY_PROBES));

describe('Loamdeep side quests', () => {
  it('defines the three quests with the SOCIETY_QUESTS ids, in order', () => {
    expect(LOAMDEEP_QUESTS.map((q) => q.id)).toEqual([
      SOCIETY_QUESTS.burrowPost,
      SOCIETY_QUESTS.lamps,
      SOCIETY_QUESTS.underChorus,
    ]);
  });

  it('chains the prerequisites burrowPost -> lamps -> underChorus', () => {
    const [post, lamps, chorus] = LOAMDEEP_QUESTS;
    expect(post.prereq).toBeUndefined();
    expect(lamps.prereq).toBe(post.id);
    expect(chorus.prereq).toBe(lamps.id);
  });

  it('gives every quest a giver, a reward, hoa off and an outro', () => {
    for (const q of LOAMDEEP_QUESTS) {
      expect(q.giver).toBeTruthy();
      expect(q.rewardAcorns).toBeGreaterThan(0);
      expect(q.hoa).toBe('off');
      expect(q.outro).toBeDefined();
      expect(q.doneText.length).toBeGreaterThan(0);
      expect(q.objectives.length).toBeGreaterThan(0);
    }
  });

  it('names a defined interior on every interior visit', () => {
    for (const q of LOAMDEEP_QUESTS) {
      for (const o of q.objectives) {
        if (o.kind === 'visit') {
          expect(o.interior, `${q.id}: ${o.text}`).toBeDefined();
          expect(interiorIds.has(o.interior as string), `${q.id}: ${o.interior}`).toBe(true);
        }
      }
    }
  });

  it('uses only defined probe ids on probe objectives', () => {
    for (const q of LOAMDEEP_QUESTS) {
      for (const o of q.objectives) {
        if (o.kind === 'probe') {
          expect(probeIds.has(o.probe), `${q.id}: ${o.probe}`).toBe(true);
        }
      }
    }
  });
});
