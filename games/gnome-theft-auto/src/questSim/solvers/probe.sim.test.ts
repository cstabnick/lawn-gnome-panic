import '../globals';
import { describe, expect, it } from 'vitest';
import { buildSimWorld } from '../harness';
import { objectiveSession, TEST_QUEST } from '../testkit';
import { stepDone } from '../util';
import { SimFail } from '../types';
import { NEWCOMER_QUESTS } from '../../quests/newcomerQuests';
import type { ObjectiveDef } from '../../quests/types';
import { probeSolver, PROBE_ACTIONS } from './probe';

type ProbeObj = Extract<ObjectiveDef, { kind: 'probe' }>;

const sim = buildSimWorld();

/** Every newcomer probe objective, grouped by quest id (party-on is online only, tested on its own). */
const BY_QUEST = NEWCOMER_QUESTS.flatMap((q): [string, ProbeObj[]][] => {
  const objs = q.objectives.filter((o): o is ProbeObj => o.kind === 'probe' && o.probe !== 'party-on');
  return objs.length > 0 ? [[q.id, objs]] : [];
});

describe('probe solver: newcomer activity probes', () => {
  it('has an action for every newcomer probe id', () => {
    const ids = NEWCOMER_QUESTS.flatMap((q) => q.objectives.filter((o) => o.kind === 'probe').map((o) => o.probe));
    const missing = ids.filter((id) => !PROBE_ACTIONS[id]);
    expect(missing).toEqual([]);
  });

  it.each(BY_QUEST)('%s: every probe objective is done through its activity', async (_questId, objs) => {
    for (const obj of objs) {
      const s = await objectiveSession(sim, obj);
      try {
        // The purse the runner grants at open (harness.ts headlessHost); objectiveSession opens without it.
        if (s.cheats.freeAcorns) s.economy.earn(100000, 'Quest sim: freeAcorns');
        await probeSolver.solve(obj, s, { questId: TEST_QUEST, step: 0, budget: 120 });
        expect(stepDone(s, TEST_QUEST, 0), `probe ${obj.probe}`).toBe(true);
      } finally {
        s.dispose();
      }
    }
  }, 60_000);

  it('party-on rejects as blocked (no relay server headless)', async () => {
    const party = NEWCOMER_QUESTS.find((q) => q.id === 'nc-party')!;
    const obj = party.objectives.find((o): o is ProbeObj => o.kind === 'probe' && o.probe === 'party-on')!;
    const s = await objectiveSession(sim, obj);
    try {
      let caught: unknown = null;
      try {
        await probeSolver.solve(obj, s, { questId: TEST_QUEST, step: 0, budget: 120 });
      } catch (e) {
        caught = e;
      }
      expect(caught).toBeInstanceOf(SimFail);
      expect((caught as SimFail).failClass).toBe('blocked');
    } finally {
      s.dispose();
    }
  }, 60_000);
});
