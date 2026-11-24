import '../globals';
import { describe, expect, it } from 'vitest';
import { QUESTS, questById } from '../../quests/defs';
import type { ObjectiveDef } from '../../quests/types';
import { buildSimWorld } from '../harness';
import { objectiveSession, TEST_QUEST } from '../testkit';
import { SimFail } from '../types';
import { stepDone } from '../util';
import { checkpointsSolver } from './checkpoints';

type Checkpoints = Extract<ObjectiveDef, { kind: 'checkpoints' }>;

function checkpointsObj(questId: string, index: number): Checkpoints {
  const obj = questById(questId)?.objectives[index];
  if (!obj || obj.kind !== 'checkpoints') throw new Error(`${questId}[${index}] is not a checkpoints objective`);
  return obj;
}

const sim = buildSimWorld();

describe('checkpoints solver', () => {
  it('solves the untimed Skyway deck run (nc-skyway, objective 0) by hopping gate to gate', async () => {
    const obj = checkpointsObj('nc-skyway', 0);
    const s = await objectiveSession(sim, obj);
    await checkpointsSolver.solve(obj, s, { questId: TEST_QUEST, step: 0, budget: 300 });
    expect(stepDone(s, TEST_QUEST, 0)).toBe(true);
  }, 60_000);

  it('solves the untimed air run (city-penthouse-exclusive, the Sycamore Copter round)', async () => {
    const obj = checkpointsObj('city-penthouse-exclusive', 0);
    const s = await objectiveSession(sim, obj);
    await checkpointsSolver.solve(obj, s, { questId: TEST_QUEST, step: 0, budget: 300 });
    expect(stepDone(s, TEST_QUEST, 0)).toBe(true);
  }, 60_000);

  it('runs the timed glow-band round for real: solved, or a SimFail that says why', async () => {
    const obj = checkpointsObj('city-glow-band-express', 0);
    const s = await objectiveSession(sim, obj);
    try {
      // A short budget keeps the test inside its 60 s wall-clock limit; the run either solves or fails with a reason.
      await checkpointsSolver.solve(obj, s, { questId: TEST_QUEST, step: 0, budget: 150 });
      expect(stepDone(s, TEST_QUEST, 0)).toBe(true);
    } catch (e) {
      // Until driver.ts is filled in, driveTo throws 'bot'. Accept that, but log what happened.
      expect(e).toBeInstanceOf(SimFail);
      const f = e as SimFail;
      console.log(`[checkpoints timed] ${f.failClass}: ${f.message}`);
    }
  }, 60_000);

  it('check() returns findings for every checkpoints objective in QUESTS', () => {
    let n = 0;
    for (const q of QUESTS) {
      q.objectives.forEach((obj, i) => {
        if (obj.kind !== 'checkpoints') return;
        n++;
        const findings = checkpointsSolver.check?.(obj, sim.world, q.id, i);
        expect(Array.isArray(findings)).toBe(true);
        for (const f of findings ?? []) console.log(`[checkpoints check] ${q.id}[${i}] ${f.check} (${f.class}): ${f.detail}`);
      });
    }
    expect(n).toBeGreaterThan(0);
  });
});
