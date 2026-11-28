// Quest sim: the inspect solver plays throwaway steps near the Central Bus Stop: a single press, and a 2 s hold.
import '../globals';
import { describe, expect, it, afterEach } from 'vitest';
import type { ObjectiveDef } from '../../quests/types';
import { buildSimWorld, type SimWorld } from '../harness';
import { objectiveSession, TEST_QUEST } from '../testkit';
import { stepDone } from '../util';
import { inspectSolver } from './inspect';
import type { RunSession } from '../types';

const sim: SimWorld = buildSimWorld();
let open: RunSession | null = null;
afterEach(() => { open?.dispose(); open = null; });

type Inspect = Extract<ObjectiveDef, { kind: 'inspect' }>;
const points = [
  { at: [4, 12] as [number, number], label: 'Timetable' },
  { at: [9, 18] as [number, number], label: 'Shelter lock' },
];

describe('inspect solver', () => {
  it('presses each point in order', async () => {
    const obj: Inspect = { kind: 'inspect', text: 'Check the stop', verb: 'Look', hint: 'the bus stop', ordered: true, points };
    const s = await objectiveSession(sim, obj);
    open = s;
    await inspectSolver.solve(obj as never, s, { questId: TEST_QUEST, step: 0, budget: 120 });
    expect(stepDone(s, TEST_QUEST, 0)).toBe(true);
  }, 60_000);

  it('holds each point for holdSeconds', async () => {
    const obj: Inspect = { kind: 'inspect', text: 'Test the locks', verb: 'Test', hint: 'the bus stop', holdSeconds: 2, points };
    const s = await objectiveSession(sim, obj);
    open = s;
    await inspectSolver.solve(obj as never, s, { questId: TEST_QUEST, step: 0, budget: 120 });
    expect(stepDone(s, TEST_QUEST, 0)).toBe(true);
  }, 60_000);
});
