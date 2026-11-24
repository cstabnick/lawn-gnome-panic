// The race solver on the real Speedway objectives: the bot drives the racing line through the game's vehicle physics.
import '../globals';
import { describe, expect, it } from 'vitest';
import { questById } from '../../quests/defs';
import type { ObjectiveDef } from '../../quests/types';
import { buildSimWorld } from '../harness';
import { objectiveSession, TEST_QUEST } from '../testkit';
import { SimFail } from '../types';
import { stepDone } from '../util';
import { raceSolver } from './race';

const sim = buildSimWorld();
type RaceObj = Extract<ObjectiveDef, { kind: 'race' }>;

describe('race solver', () => {
  it('wins the Fizz Cup Rookie Mow-Down by driving the racing line', async () => {
    const obj = questById('race-rookie-mowdown')!.objectives[0] as RaceObj;
    const s = await objectiveSession(sim, obj);
    const t0 = s.now();
    await raceSolver.solve(obj, s, { questId: TEST_QUEST, step: 0, budget: 900 });
    const took = s.now() - t0;
    console.info(`race-rookie-mowdown: solved in ${took.toFixed(1)} sim seconds`);
    expect(stepDone(s, TEST_QUEST, 0)).toBe(true);
  });

  it('the Fizz Cup Final is solved, or fails as a content problem', async () => {
    const obj = questById('race-fizz-cup-final')!.objectives[0] as RaceObj;
    const s = await objectiveSession(sim, obj);
    const t0 = s.now();
    try {
      await raceSolver.solve(obj, s, { questId: TEST_QUEST, step: 0, budget: 900 });
      console.info(`race-fizz-cup-final: solved in ${(s.now() - t0).toFixed(1)} sim seconds`);
      expect(stepDone(s, TEST_QUEST, 0)).toBe(true);
    } catch (e) {
      expect(e).toBeInstanceOf(SimFail);
      expect((e as SimFail).failClass).toBe('content');
      console.info(`race-fizz-cup-final: content failure after ${(s.now() - t0).toFixed(1)} sim seconds: ${(e as Error).message}`);
    }
  });
});
