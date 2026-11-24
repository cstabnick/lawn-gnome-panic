// Quest sim: the opt-in sim suites (<suite>.sim.test.ts, vitest.sim.config.ts; not part of npm test). Each builds the world once, plays every quest of its suite (each
// ending of a choice quest) with ALL_CHEATS, and holds the result to the plan's expectation (plans.ts).
import { describe, expect, it } from 'vitest';
import { buildSimWorld, headlessHost } from './harness';
import { QUEST_PLANS } from './plans';
import { runQuest } from './runner';
import type { QuestPlan, QuestResult, SimSuite } from './types';
import { ALL_CHEATS } from './types';

/** Every (quest, variant) run a suite makes, in table order. */
export function suiteRuns(suite: SimSuite): { questId: string; plan: QuestPlan; variant?: 'A' | 'B' }[] {
  const out: { questId: string; plan: QuestPlan; variant?: 'A' | 'B' }[] = [];
  for (const [questId, plan] of Object.entries(QUEST_PLANS)) {
    if (plan.suite !== suite) continue;
    if (plan.variants) for (const variant of plan.variants) out.push({ questId, plan, variant });
    else out.push({ questId, plan });
  }
  return out;
}

/** Does a result meet its plan? Returns null when it does, else why not. */
export function meetsPlan(r: QuestResult, plan: QuestPlan): string | null {
  const e = plan.expect;
  if (e === 'pass') return r.status === 'pass' ? null : `expected pass, got ${r.status}: ${r.reason}`;
  if (r.status === 'pass') return `now passes (expected ${e.status}: ${e.reason}): update plans.ts and the roadmap table`;
  if (r.status !== e.status || !r.reason.startsWith(`${e.class}:`) || !r.reason.includes(e.reason)) return `expected ${e.status} (${e.class}: ${e.reason}), got ${r.status}: ${r.reason}`;
  return null;
}

/** Register the vitest suite for `suite`. */
export function simSuiteTest(suite: SimSuite): void {
  describe(`quest sim: ${suite}`, () => {
    const host = headlessHost(buildSimWorld());
    for (const run of suiteRuns(suite)) {
      it(`${run.questId}${run.variant ? ` (${run.variant})` : ''}`, async () => {
        const r = await runQuest(host, run.questId, { cheats: ALL_CHEATS, variant: run.variant, budget: run.plan.budget });
        const why = meetsPlan(r, run.plan);
        expect(why, `${why}\nsteps: ${r.steps.map((s) => `${s.step}:${s.kind}:${s.status}${s.detail ? ` (${s.detail})` : ''}`).join(' | ')}`).toBeNull();
      }, 60_000);
    }
  });
}
