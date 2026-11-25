// Quest fuzzer: play a quest with the sim bot, inject ONE disruption at a chosen step and time, report whether the quest
// still finished. A run is fully described by its FuzzPlan; planFuzz makes plans from a seed.
import { questById } from '../../quests/defs';
import { QUEST_PLANS } from '../plans';
import { runQuest } from '../runner';
import type { Cheats, FailClass, QuestResult, RunSession, SessionHost } from '../types';
import { SimFail } from '../types';
import { DISRUPTIONS, DISRUPTION_IDS, type DisruptionId } from './disruptions';
import { mulberry32 } from './rng';

export interface FuzzPlan {
  questId: string;
  variant?: 'A' | 'B';
  disruption: DisruptionId;
  /** The objective index the disruption lands in. */
  step: number;
  /** Frames (steps) after the objective became active; 0 = the first one. idle-wait then waits 120 sim s. */
  at: number;
}

export type FuzzOutcome = 'recovered' | FailClass | 'not-applied';

export type FuzzResult = QuestResult & { plan: FuzzPlan; note: string; outcome: FuzzOutcome; tail: { log: string[]; toasts: string[] } };

export interface FuzzOpts {
  cheats: Cheats;
  budget?: number;
  onStatus?: (line: string) => void;
}

const SOFTLOCK_S = 45;
const CHECK_EVERY = 0.25;

/** Plans for every quest (and ending): every disruption once (`all`), or `perQuest` seeded picks. */
export function planFuzz(rng: () => number, questIds: readonly string[], perQuest: number, all: boolean): FuzzPlan[] {
  const plans: FuzzPlan[] = [];
  for (const questId of questIds) {
    const q = questById(questId);
    if (!q) continue;
    const variants: (('A' | 'B') | undefined)[] = QUEST_PLANS[questId]?.variants ?? [undefined];
    const usable = DISRUPTION_IDS.filter((d) => d !== 'save-reload' || q.objectives.length > 1);
    for (const variant of variants) {
      let chosen: DisruptionId[];
      if (all) chosen = [...usable];
      else {
        const left = [...usable];
        chosen = [];
        for (let i = 0; i < perQuest && left.length > 0; i++) chosen.push(left.splice(Math.floor(rng() * left.length), 1)[0]);
      }
      for (const disruption of chosen) {
        const step = Math.min(q.objectives.length - 1, Math.floor(rng() * q.objectives.length));
        plans.push({ questId, variant, disruption, step, at: Math.floor(rng() * 6) });
      }
    }
  }
  return plans;
}

/** Play one fuzz run. Never throws. */
export async function fuzzRun(host: SessionHost, plan: FuzzPlan, opts: FuzzOpts): Promise<FuzzResult> {
  const d = DISRUPTIONS[plan.disruption];
  const rng = mulberry32(hash(`${plan.questId}/${plan.variant ?? ''}/${plan.disruption}/${plan.step}/${plan.at}`));
  const cheats: Cheats = plan.disruption === 'heat-4' ? { ...opts.cheats, noHeat: false, noWanted: false } : opts.cheats;
  let applied = false;
  let note = '';
  let sessions = 0;
  let softlockT: number | null = null;
  let afterT = 0;
  let frames = 0;
  let lastS: RunSession | null = null;
  let nextCheck = 0;
  let busy = false;
  const reload = plan.disruption === 'save-reload';

  const wrap = (s: RunSession): void => {
    sessions++;
    lastS = s;
    frames = 0;
    const j0 = s.quests.getJournal();
    if (reload && !applied && sessions > 1 && j0.activeId === plan.questId && j0.activeStep === plan.step) {
      applied = true;
      note = `${d.describe} (before step ${plan.step})`;
    }
    const orig = s.step.bind(s);
    s.step = async (dt?: number): Promise<void> => {
      await orig(dt);
      if (busy) return;
      const now = s.now();
      const early = !applied && !reload;
      if (!early && now < nextCheck) return;
      nextCheck = now + CHECK_EVERY;
      const j = s.quests.getJournal();
      const live = j.activeId === plan.questId;
      if (early) {
        if (live && j.activeStep === plan.step && j.activeLines.length > 0) {
          frames++;
          if (frames > plan.at && d.applies(s)) {
            applied = true;
            busy = true;
            try {
              note = await d.apply(s, rng);
            } finally {
              busy = false;
            }
            afterT = s.now();
            nextCheck = 0;
          }
        } else if (!live || j.activeStep !== plan.step) frames = 0;
        return;
      }
      if (!applied) return;
      for (const v of s.quests.pins?.vehicles() ?? []) {
        if (!s.vehicles.includes(v)) throw new SimFail('bug', `pinned vehicle removed (${v.kind}#${v.id}) after ${plan.disruption}`);
      }
      const stuck = live && j.activeLines.length === 0 && !s.quests.blips().some((b) => b.kind === 'objective');
      if (!stuck) softlockT = null;
      else {
        softlockT ??= now;
        if (now - softlockT > SOFTLOCK_S && now - afterT > 0) throw new SimFail('bug', `softlock after ${plan.disruption}`);
      }
    };
  };

  const r = await runQuest(host, plan.questId, {
    cheats, variant: plan.variant, budget: opts.budget, onStatus: opts.onStatus, onSession: wrap, solverRetries: 2,
    reloadBeforeStep: reload ? plan.step : undefined,
  });
  let outcome: FuzzOutcome;
  if (!applied) outcome = 'not-applied';
  else if (r.status === 'pass') outcome = 'recovered';
  else if (r.status === 'blocked') outcome = 'blocked';
  else outcome = failClass(r.reason);
  if (!applied) note = 'step not reached for the delay, or nothing to disrupt';
  const rec = (lastS as RunSession | null)?.record;
  return { ...r, plan, note, outcome, tail: { log: rec?.log.slice(-8) ?? [], toasts: rec?.toasts.slice(-5) ?? [] } };
}

function failClass(reason: string): FailClass {
  const m = /^(bot|bug|content|blocked):/.exec(reason);
  return (m?.[1] as FailClass | undefined) ?? 'bug';
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
