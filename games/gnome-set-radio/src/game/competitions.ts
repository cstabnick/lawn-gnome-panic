import type { CompetitionDef, CompetitionMedal } from '../data/competitions';

export interface CompetitionRun {
  def: CompetitionDef;
  timeLeft: number;
  progress: number;
  finished: boolean;
  medal: CompetitionMedal | null;
  collectedRings: Set<number>;
}

const MEDAL_RANK: Record<CompetitionMedal, number> = {
  bronze: 1,
  silver: 2,
  gold: 3,
};

/** Create a fresh runtime state for an Encore Competition. */
export function createCompetitionRun(def: CompetitionDef): CompetitionRun {
  return {
    def,
    timeLeft: def.durationS,
    progress: 0,
    finished: false,
    medal: null,
    collectedRings: new Set<number>(),
  };
}

/** Resolve the highest medal earned for a numeric competition progress value. */
export function computeMedal(def: CompetitionDef, value: number): CompetitionMedal | null {
  if (value >= def.goldTarget) return 'gold';
  if (value >= def.silverTarget) return 'silver';
  if (value >= def.bronzeTarget) return 'bronze';
  return null;
}

/** Advance a competition run by `dt` seconds and apply frame deltas for its kind. */
export function stepCompetitionRun(
  run: CompetitionRun,
  dt: number,
  delta: { scoreDelta?: number; grindAirDt?: number; trickCount?: number; tagCount?: number; ringIndex?: number },
): { finishedNow: boolean; medal: CompetitionMedal | null } {
  if (run.finished) {
    return { finishedNow: false, medal: run.medal };
  }

  run.timeLeft = Math.max(0, run.timeLeft - Math.max(0, dt));

  switch (run.def.kind) {
    case 'score-attack':
      if (delta.scoreDelta && delta.scoreDelta > 0) {
        run.progress += delta.scoreDelta;
      }
      break;
    case 'grind-time':
      if (delta.grindAirDt && delta.grindAirDt > 0) {
        run.progress += delta.grindAirDt;
      }
      break;
    case 'trick-blitz':
      if (delta.trickCount && delta.trickCount > 0) {
        run.progress += delta.trickCount;
      }
      break;
    case 'tag-rush':
      if (delta.tagCount && delta.tagCount > 0) {
        run.progress += delta.tagCount;
      }
      break;
    case 'ring-sprint':
      if (
        delta.ringIndex !== undefined &&
        delta.ringIndex >= 0 &&
        (!run.def.ringPositions || delta.ringIndex < run.def.ringPositions.length) &&
        !run.collectedRings.has(delta.ringIndex)
      ) {
        run.collectedRings.add(delta.ringIndex);
        run.progress = run.collectedRings.size;
      }
      break;
  }

  run.medal = computeMedal(run.def, run.progress);

  const totalRings = run.def.ringPositions?.length ?? 0;
  const allRingsCollected = run.def.kind === 'ring-sprint' && totalRings > 0 && run.collectedRings.size >= totalRings;
  if (run.timeLeft <= 0 || allRingsCollected) {
    run.finished = true;
    return { finishedNow: true, medal: run.medal };
  }

  return { finishedNow: false, medal: run.medal };
}

/** Return true if `next` outranks `prev` (or `prev` is unset and `next` is non-null). */
export function isBetterMedal(next: CompetitionMedal | null, prev?: CompetitionMedal): boolean {
  if (!next) return false;
  if (!prev) return true;
  return MEDAL_RANK[next] > MEDAL_RANK[prev];
}
