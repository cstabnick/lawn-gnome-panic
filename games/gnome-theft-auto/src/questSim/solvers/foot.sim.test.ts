// Quest sim: the on-foot solvers play real objectives from the quest data (crack, visit, choice).
import '../globals';
import { describe, expect, it, afterEach } from 'vitest';
import { questById } from '../../quests/defs';
import type { ObjectiveDef } from '../../quests/types';
import { buildSimWorld, type SimWorld } from '../harness';
import { objectiveSession, TEST_QUEST } from '../testkit';
import { stepDone } from '../util';
import { crackSolver, visitSolver, choiceSolver } from './foot';
import type { RunSession } from '../types';

const sim: SimWorld = buildSimWorld();
const BUDGET = 300;

function objective<K extends ObjectiveDef['kind']>(questId: string, kind: K, pick = 0): Extract<ObjectiveDef, { kind: K }> {
  const q = questById(questId);
  if (!q) throw new Error(`no quest ${questId}`);
  const found = q.objectives.filter((o): o is Extract<ObjectiveDef, { kind: K }> => o.kind === kind);
  const obj = found[pick];
  if (!obj) throw new Error(`no ${kind} objective ${pick} in ${questId}`);
  return obj;
}

let open: RunSession | null = null;
afterEach(() => {
  open?.dispose();
  open = null;
});

describe('foot solvers', () => {
  it('crack: shoots the three first-contract targets', async () => {
    const obj = objective('first-contract', 'crack');
    const s = await objectiveSession(sim, obj);
    open = s;
    await crackSolver.solve(obj as never, s, { questId: TEST_QUEST, step: 0, budget: BUDGET });
    expect(stepDone(s, TEST_QUEST, 0)).toBe(true);
    expect(s.record.cheats.has('instantTravel')).toBe(true);
  }, 60_000);

  it('visit: reaches the first visit spot of sq-grid-truthers', async () => {
    const obj = objective('sq-grid-truthers', 'visit');
    const s = await objectiveSession(sim, obj);
    open = s;
    await visitSolver.solve(obj as never, s, { questId: TEST_QUEST, step: 0, budget: BUDGET });
    expect(stepDone(s, TEST_QUEST, 0)).toBe(true);
    expect(s.record.cheats.has('instantTravel')).toBe(true);
  }, 60_000);

  it('choice: takes ending A of sq-fescue-fugitive', async () => {
    const obj = objective('sq-fescue-fugitive', 'choice');
    const s = await objectiveSession(sim, obj);
    open = s;
    await choiceSolver.solve(obj as never, s, { questId: TEST_QUEST, step: 0, budget: BUDGET, choice: 'A' });
    expect(stepDone(s, TEST_QUEST, 0)).toBe(true);
    expect(s.record.cheats.has('instantTravel')).toBe(true);
    expect(s.record.log.some((l) => l.includes('choice: ' + obj.optionA.label))).toBe(true);
  }, 60_000);

  it('choice: takes ending B of sq-fescue-fugitive', async () => {
    const obj = objective('sq-fescue-fugitive', 'choice');
    const s = await objectiveSession(sim, obj);
    open = s;
    await choiceSolver.solve(obj as never, s, { questId: TEST_QUEST, step: 0, budget: BUDGET, choice: 'B' });
    expect(stepDone(s, TEST_QUEST, 0)).toBe(true);
    expect(s.record.cheats.has('instantTravel')).toBe(true);
    expect(s.record.log.some((l) => l.includes('choice: ' + obj.optionB.label))).toBe(true);
  }, 60_000);
});
