import { describe, expect, it } from 'vitest';
import { SKYWAY_SITES } from '../highways/skyways';
import { SOCIETY_ACH, SOCIETY_INTERIORS, SOCIETY_PROBES, SOCIETY_QUESTS, UNDERSPAN, WADERS_REST, type Rect } from '../societies/config';
import { SOCIETY_QUEST_DEFS } from './societyQuests';
import type { ObjectiveDef, QuestDef } from './types';

const inside = (r: Rect, x: number, z: number) => x >= r.minX && x <= r.maxX && z >= r.minZ && z <= r.maxZ;

/** A world point (no interior) a quest sends the player to. */
function worldPoints(q: QuestDef): [number, number][] {
  const pts: [number, number][] = [];
  for (const o of q.objectives as ObjectiveDef[]) {
    if (o.kind === 'visit' && !o.interior) pts.push(o.at);
    if (o.kind === 'steal-deliver') pts.push(o.dropAt);
    if (o.kind === 'probe' && o.at) pts.push(o.at);
    if (o.kind === 'choice') pts.push(o.optionA.at, o.optionB.at);
  }
  return pts;
}

describe('society side quests', () => {
  it('has the four quests with the society ids, in order', () => {
    expect(SOCIETY_QUEST_DEFS.map((q) => q.id)).toEqual([
      SOCIETY_QUESTS.verticality,
      SOCIETY_QUESTS.scrapRun,
      SOCIETY_QUESTS.flockErrands,
      SOCIETY_QUESTS.flockVigil,
    ]);
  });

  it('gives the Underspan quests to Hogweed and the Flock quests to Saxifrage', () => {
    const byId = Object.fromEntries(SOCIETY_QUEST_DEFS.map((q) => [q.id, q]));
    expect(byId[SOCIETY_QUESTS.verticality].giver).toBe('hogweed');
    expect(byId[SOCIETY_QUESTS.scrapRun].giver).toBe('hogweed');
    expect(byId[SOCIETY_QUESTS.flockErrands].giver).toBe('saxifrage');
    expect(byId[SOCIETY_QUESTS.flockVigil].giver).toBe('saxifrage');
  });

  it('chains the prerequisites: verticality -> scrap run, errands -> vigil', () => {
    const byId = Object.fromEntries(SOCIETY_QUEST_DEFS.map((q) => [q.id, q]));
    expect(byId[SOCIETY_QUESTS.verticality].prereq).toBeUndefined();
    expect(byId[SOCIETY_QUESTS.scrapRun].prereq).toBe(SOCIETY_QUESTS.verticality);
    expect(byId[SOCIETY_QUESTS.flockErrands].prereq).toBeUndefined();
    expect(byId[SOCIETY_QUESTS.flockVigil].prereq).toBe(SOCIETY_QUESTS.flockErrands);
  });

  it('uses only probe ids from SOCIETY_PROBES', () => {
    const known = new Set<string>(Object.values(SOCIETY_PROBES));
    for (const q of SOCIETY_QUEST_DEFS) {
      for (const o of q.objectives) if (o.kind === 'probe') expect(known.has(o.probe), q.id).toBe(true);
    }
  });

  it('gives the vigil a choice whose option B carries the sat-down achievement', () => {
    const vigil = SOCIETY_QUEST_DEFS.find((q) => q.id === SOCIETY_QUESTS.flockVigil)!;
    const choice = vigil.objectives.find((o) => o.kind === 'choice');
    expect(choice?.kind).toBe('choice');
    if (choice?.kind === 'choice') {
      expect(choice.optionB.achievement).toBe(SOCIETY_ACH.satDown);
      expect(choice.optionA.achievement).toBeUndefined();
    }
  });

  it('gives the Flock join its achievement and the workshop visit its interior', () => {
    const errands = SOCIETY_QUEST_DEFS.find((q) => q.id === SOCIETY_QUESTS.flockErrands)!;
    expect(errands.achievement).toBe(SOCIETY_ACH.birdsOfAFeather);
    const workshop = SOCIETY_QUEST_DEFS.find((q) => q.id === SOCIETY_QUESTS.verticality)!;
    expect(workshop.objectives.some((o) => o.kind === 'visit' && o.interior === SOCIETY_INTERIORS.workshop)).toBe(true);
    const tent = errands.objectives.some((o) => o.kind === 'visit' && o.interior === SOCIETY_INTERIORS.tent);
    expect(tent).toBe(true);
  });

  it('keeps every world point inside its site or a named Local 404 yard', () => {
    const named: Rect[] = SKYWAY_SITES.map((s) => s.yard);
    for (const q of SOCIETY_QUEST_DEFS) {
      for (const [x, z] of worldPoints(q)) {
        const ok = inside(UNDERSPAN.site, x, z) || inside(WADERS_REST.site, x, z) || named.some((r) => inside(r, x, z));
        expect(ok, `${q.id} point ${x},${z}`).toBe(true);
      }
    }
  });
});
