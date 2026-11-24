// The Tessie solvers, each objective of 'sq-tessie' played alone in its own session.
import '../globals';
import { describe, expect, it } from 'vitest';
import { questById } from '../../quests/defs';
import { buildSimWorld } from '../harness';
import { objectiveSession, TEST_QUEST } from '../testkit';
import { stepDone } from '../util';
import { tessieBuoysSolver, tessieEscortSolver, tessieRideSolver, tessieSightingsSolver } from './tessie';

const sim = buildSimWorld();
const objs = questById('sq-tessie')!.objectives;
const find = (kind: string) => objs.find((o) => o.kind === kind)!;

describe('tessie solvers', () => {
  it('sightings: a boat visits each point and the hump is seen', async () => {
    const obj = find('tessie-sightings');
    const s = await objectiveSession(sim, obj);
    try {
      await tessieSightingsSolver.solve(obj as never, s, { questId: TEST_QUEST, step: 0, budget: 300 });
      expect(stepDone(s, TEST_QUEST, 0)).toBe(true);
    } finally {
      s.dispose();
    }
  }, 60_000);

  it('buoys: every buoy dropped unseen by the patrol boat', async () => {
    const obj = find('tessie-buoys');
    const s = await objectiveSession(sim, obj);
    try {
      await tessieBuoysSolver.solve(obj as never, s, { questId: TEST_QUEST, step: 0, budget: 300 });
      expect(stepDone(s, TEST_QUEST, 0)).toBe(true);
    } finally {
      s.dispose();
    }
  }, 60_000);

  it('escort: the clutch is brought home after the dredger is rammed for real', async () => {
    const obj = find('tessie-escort');
    const s = await objectiveSession(sim, obj);
    try {
      await tessieEscortSolver.solve(obj as never, s, { questId: TEST_QUEST, step: 0, budget: 400 });
      expect(stepDone(s, TEST_QUEST, 0)).toBe(true);
      expect(s.record.toasts.some((t) => t.startsWith('Rammed the dredger'))).toBe(true);
    } finally {
      s.dispose();
    }
  }, 60_000);

  it('ride: Tessie is boarded and ridden to the dock', async () => {
    const obj = find('tessie-ride');
    const s = await objectiveSession(sim, obj);
    try {
      await tessieRideSolver.solve(obj as never, s, { questId: TEST_QUEST, step: 0, budget: 300 });
      expect(stepDone(s, TEST_QUEST, 0)).toBe(true);
    } finally {
      s.dispose();
    }
  }, 60_000);
});
