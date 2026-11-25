// E24: ending a workplace shift, the same for every workplace job. Pays through the economy, books the career record
// (gta-jobs-v1, career.ts recordShift), shows the shift card, banners a level-up and unlocks the any-job career achievement.
import { anyJobAtLevel, levelOf, levelProgress, recordShift, sharedJobsStore, type WorkExtra } from '../jobs/career';
import { JOB_ACHIEVEMENTS } from '../jobs/defs';
import type { PayResult, WorkJobId } from '../jobs/types';
import { WORK_JOBS, workPay, workTitle } from '../jobs/workDefs';
import { showShiftCard } from './shiftCard';
import type { WorkDeps } from './types';

/** The player's level (1..6) in a workplace job, from the shared career save. */
export function workLevel(job: WorkJobId): number {
  return levelOf(sharedJobsStore().get().work[job].xp);
}

export interface ShiftEnd {
  /** One entry per ticket served / car handed back / set finished, with its 1..5 stars. Empty = nothing done (no pay). */
  units: readonly { stars: number }[];
  extra?: WorkExtra;
  /** Added to the pay as given (rush bonus, tomato hazard pay). */
  bonus?: number;
  /** Label for the bonus line ("Rush bonus", "Hazard pay"). */
  bonusNote?: string;
  /** One quote under the title on the card (the client's or the booker's verdict). */
  quote?: string;
  /** Called when the player closes the card. */
  onClose?(): void;
}

/** Pay, book and show a finished shift. Returns the pay (total 0 and no booking when `units` is empty). */
export function finishShift(deps: WorkDeps, job: WorkJobId, end: ShiftEnd): PayResult {
  const store = sharedJobsStore();
  const s = store.get();
  const level = levelOf(s.work[job].xp);
  const pay = workPay(job, level, end.units, end.bonus ?? 0, end.bonusNote);
  const def = WORK_JOBS[job];
  let up: number | null = null;
  if (end.units.length > 0) {
    if (pay.total > 0) deps.economy.earn(pay.total, def.employer);
    up = recordShift(s, job, pay, end.extra);
    store.commit();
    if (anyJobAtLevel(s, 5)) deps.unlock(JOB_ACHIEVEMENTS.career);
  }
  const prog = levelProgress(s.work[job].xp);
  showShiftCard(deps.ui, {
    icon: def.icon,
    title: `${def.title} shift: ${def.employer}`,
    quote: end.quote ?? null,
    stars: end.units.length ? pay.stars : 0,
    lines: end.units.length ? pay.notes : ['Nothing done, nothing paid.'],
    total: pay.total,
    level: `${workTitle(job, prog.level)} (level ${prog.level})`,
    xpFrac: prog.need > 0 ? prog.into / prog.need : 1,
    onClose: end.onClose,
  });
  if (up) deps.hud.banner(`${def.title}: ${workTitle(job, up)}`);
  return pay;
}
