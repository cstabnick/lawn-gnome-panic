import { describe, expect, it } from 'vitest';
import { COAST_ACH, COAST_QUESTS } from '../coast/config';
import { readProbe } from '../city/probes';
import { installCoastProbes } from '../coast/probes';
import { interiorById } from '../interiors/registry';
import { COAST_GIVERS, COAST_QUEST_DEFS } from './coastQuests';
import { GIVERS, QUESTS, questById } from './defs';
import { unlockRule } from './unlocks';

// Dry ground for the giver and visit spots is checked against the built world by the quest-sim static checks
// (src/questSim/checks.sim.test.ts) and the collider test in quests.test.ts.
describe('coast quests', () => {
  it('has the four quests with the coast ids, registered in QUESTS and unlocks', () => {
    expect(COAST_QUEST_DEFS.map((q) => q.id)).toEqual([...COAST_QUESTS]);
    for (const q of COAST_QUEST_DEFS) {
      expect(q.id.startsWith('coast-')).toBe(true);
      expect(QUESTS).toContain(q);
      expect(unlockRule(q.id), q.id).toBeDefined();
      expect(GIVERS[q.giver], q.id).toBeDefined();
    }
  });

  it('puts every giver in the world or in a registered interior', () => {
    for (const g of Object.values(COAST_GIVERS)) {
      if (g.interior) expect(interiorById(g.interior), g.id).toBeDefined();
      else expect(Math.abs(g.z)).toBeGreaterThan(1000);
    }
  });

  it('chains the treasure quest to the tours and carries the achievements', () => {
    expect(questById('coast-queens-treasure')?.prereq).toBe('coast-bathtub-tours');
    expect(questById('coast-bathtub-tours')?.achievement).toBe(COAST_ACH.tours);
    expect(questById('coast-queens-treasure')?.achievement).toBe(COAST_ACH.treasure);
  });

  it('only names probes the coast installs', () => {
    installCoastProbes();
    for (const q of COAST_QUEST_DEFS) {
      for (const o of q.objectives) if (o.kind === 'probe') expect(readProbe(o.probe), o.probe).not.toBeNull();
    }
  });
});
