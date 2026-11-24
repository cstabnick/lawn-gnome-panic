// Quest sim: the vehicle solvers on real objectives (steal-deliver, chase-follow, convoy-ambush).
import '../globals';
import { describe, expect, it } from 'vitest';
import { questById } from '../../quests/defs';
import type { ObjectiveDef } from '../../quests/types';
import { buildSimWorld } from '../harness';
import { objectiveSession, TEST_QUEST } from '../testkit';
import { SimFail } from '../types';
import { stepDone } from '../util';
import { chaseFollowSolver, convoyAmbushSolver, stealDeliverSolver } from './drive';

/** The objective of `kind` at `index` in a real quest (the first of that kind when index is omitted). */
function objOf<K extends ObjectiveDef['kind']>(questId: string, kind: K, index?: number): Extract<ObjectiveDef, { kind: K }> {
  const q = questById(questId);
  if (!q) throw new Error(`no quest ${questId}`);
  const obj = index !== undefined ? q.objectives[index] : q.objectives.find((o) => o.kind === kind);
  if (!obj || obj.kind !== kind) throw new Error(`${questId} has no ${kind} objective${index !== undefined ? ` at ${index}` : ''}`);
  return obj as Extract<ObjectiveDef, { kind: K }>;
}

describe('vehicle solvers', () => {
  const sim = buildSimWorld();

  it('steal-deliver: ch1-mowers-keepers drives the target to the drop', async () => {
    const obj = objOf('ch1-mowers-keepers', 'steal-deliver');
    const s = await objectiveSession(sim, obj);
    try {
      await stealDeliverSolver.solve(obj, s, { questId: TEST_QUEST, step: 0, budget: 600 });
      expect(stepDone(s, TEST_QUEST, 0)).toBe(true);
    } finally {
      s.dispose();
    }
  }, 60_000);

  it('chase-follow: prologue-fresh-kiln objective 0 keeps up with the leader', async () => {
    const obj = objOf('prologue-fresh-kiln', 'chase-follow', 0);
    const s = await objectiveSession(sim, obj);
    try {
      await chaseFollowSolver.solve(obj, s, { questId: TEST_QUEST, step: 0, budget: 600 });
      expect(stepDone(s, TEST_QUEST, 0)).toBe(true);
    } finally {
      s.dispose();
    }
  }, 60_000);

  it('convoy-ambush: ch2-dew-run clears the escorts and delivers, or reports a game bug', async () => {
    const obj = objOf('ch2-dew-run', 'convoy-ambush');
    const s = await objectiveSession(sim, obj);
    try {
      let rejected: unknown = null;
      try {
        await convoyAmbushSolver.solve(obj, s, { questId: TEST_QUEST, step: 0, budget: 600 });
      } catch (e) {
        rejected = e;
      }
      if (rejected === null) {
        console.log('convoy-ambush: solved');
        expect(stepDone(s, TEST_QUEST, 0)).toBe(true);
      } else {
        console.log(`convoy-ambush: rejected: ${(rejected as Error).message}`);
        expect(rejected).toBeInstanceOf(SimFail);
        expect((rejected as SimFail).failClass).toBe('bug');
      }
    } finally {
      s.dispose();
    }
  }, 60_000);
});
