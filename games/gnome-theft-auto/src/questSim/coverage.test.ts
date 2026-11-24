// Quest sim coverage: every quest in the game has a sim plan (so a new quest must be simulated), every plan names a real
// quest, every choice quest runs both endings, and every objective kind in use has a solver.
import './globals';
import { describe, expect, it } from 'vitest';
import { QUESTS } from '../quests/defs';
import { QUEST_PLANS } from './plans';
import { SOLVERS } from './solvers';
import { neverOffered } from './prereqs';

describe('quest sim coverage', () => {
  it('has a plan for every quest, and only for quests', () => {
    const ids = QUESTS.map((q) => q.id);
    expect(ids.filter((id) => !QUEST_PLANS[id]), 'quests with no sim plan (add them to questSim/plans.ts)').toEqual([]);
    expect(Object.keys(QUEST_PLANS).filter((id) => !ids.includes(id)), 'plans for quests that do not exist').toEqual([]);
  });

  it('runs both endings of every choice quest', () => {
    for (const q of QUESTS) {
      if (q.objectives.some((o) => o.kind === 'choice')) expect(QUEST_PLANS[q.id]?.variants, q.id).toEqual(['A', 'B']);
    }
  });

  it('has a solver for every objective kind in use', () => {
    for (const q of QUESTS) for (const o of q.objectives) expect(SOLVERS[o.kind], `${q.id}: ${o.kind}`).toBeDefined();
  });

  it('offers every quest at some point of the story (no unlock that can never happen)', () => {
    expect(neverOffered(QUESTS)).toEqual([]);
  });
});
