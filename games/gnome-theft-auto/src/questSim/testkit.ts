// Quest sim: a kit for solver tests. Plays ONE objective in a one-quest table, so a solver is tested without the
// solvers for the other kinds. Import ./globals first.
//
//   import './globals';
//   const sim = buildSimWorld();                                            // once per file
//   const obj = questById('first-contract')!.objectives[0];                // a real objective
//   const s = await objectiveSession(sim, obj);                             // quest taken, step 0 running
//   await crackSolver.solve(obj as never, s, { questId: TEST_QUEST, step: 0, budget: 300 });
//   expect(stepDone(s, TEST_QUEST, 0)).toBe(true);
import { SAVE_KEY } from '../quests/quests';
import type { GiverDef, ObjectiveDef, QuestDef } from '../quests/types';
import { resetSimStorage, simStorage } from './globals';
import { openSession, type SimSession, type SimWorld } from './harness';
import type { Cheats } from './types';
import { ALL_CHEATS } from './types';
import { waitFor } from './util';

export const TEST_QUEST = 'questsim-test';
const GIVER: GiverDef = { id: 'questsim-giver', name: 'Test giver', label: 'Test', x: 0, z: -14, exit: { x: 0, z: -12, yaw: 0 }, room: 'street' };

/** A session whose only quest is `objectives` (default: one objective); it is taken and its step 0 is running. */
export async function objectiveSession(sim: SimWorld, obj: ObjectiveDef | ObjectiveDef[], cheats: Cheats = ALL_CHEATS): Promise<SimSession> {
  resetSimStorage();
  simStorage.setItem(SAVE_KEY, '{}');
  const quest: QuestDef = { id: TEST_QUEST, title: 'Quest sim test', giver: GIVER.id, objectives: Array.isArray(obj) ? obj : [obj], doneText: 'Done.', rewardAcorns: 1 };
  const s = openSession(sim, cheats, { quests: [quest], givers: { [GIVER.id]: GIVER } });
  if (cheats.freeAcorns) s.economy.earn(100000, 'Quest sim: freeAcorns');
  s.teleport(GIVER.x, GIVER.z);
  await s.step();
  if (!s.quests.interact(GIVER.x, GIVER.z)) throw new Error('testkit: the test giver did not offer the quest');
  const ok = await waitFor(s, () => s.quests.getJournal().activeId === TEST_QUEST, 30);
  if (!ok) throw new Error('testkit: quest not taken');
  return s;
}
