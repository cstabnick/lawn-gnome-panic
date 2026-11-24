// Set-piece solvers played on real objectives: the Sandpit drop, the Birdbath derby and the Grand Combine.
import '../globals';
import { describe, expect, it } from 'vitest';
import { questById } from '../../quests/defs';
import type { ObjectiveDef } from '../../quests/types';
import { buildSimWorld } from '../harness';
import { SimFail } from '../types';
import { objectiveSession, TEST_QUEST } from '../testkit';
import { stepDone } from '../util';
import { airDropSolver, bossCombineSolver, surviveDerbySolver } from './action';

const sim = buildSimWorld();

/** The objective of `kind` in a real quest. */
function objectiveOf<K extends ObjectiveDef['kind']>(questId: string, kind: K): Extract<ObjectiveDef, { kind: K }> {
  const o = questById(questId)?.objectives.find((x) => x.kind === kind);
  if (!o) throw new Error(`${questId} has no ${kind} objective`);
  return o as Extract<ObjectiveDef, { kind: K }>;
}

describe('set-piece solvers', () => {
  it('air-drop: bails over the zone, lands, and boards the Whirligig', async () => {
    const obj = objectiveOf('ch4-sandpit-drop', 'air-drop');
    const s = await objectiveSession(sim, obj);
    await airDropSolver.solve(obj, s, { questId: TEST_QUEST, step: 0, budget: 600 });
    expect(stepDone(s, TEST_QUEST, 0)).toBe(true);
  }, 60_000);

  it('survive-derby: survives the Birdbath derby', async () => {
    const obj = objectiveOf('ch3-kiln-resin-ice', 'survive-derby');
    const s = await objectiveSession(sim, obj);
    await surviveDerbySolver.solve(obj, s, { questId: TEST_QUEST, step: 0, budget: 600 });
    expect(stepDone(s, TEST_QUEST, 0)).toBe(true);
  }, 60_000);

  it('boss-combine: shoots the guards and jams the combine, or reports the game bug', async () => {
    const obj = objectiveOf('ch5-even-cut', 'boss-combine');
    const s = await objectiveSession(sim, obj);
    let failure: SimFail | null = null;
    try {
      await bossCombineSolver.solve(obj, s, { questId: TEST_QUEST, step: 0, budget: 600 });
    } catch (e) {
      if (!(e instanceof SimFail)) throw e;
      failure = e;
    }
    if (failure) {
      console.log(`boss-combine: ${failure.failClass}: ${failure.message}`);
      expect(failure.failClass).toBe('bug');
    } else {
      console.log('boss-combine: solved');
      expect(stepDone(s, TEST_QUEST, 0)).toBe(true);
    }
  }, 60_000);
});
