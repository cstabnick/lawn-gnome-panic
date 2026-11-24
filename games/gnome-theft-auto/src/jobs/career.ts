// Sim jobs: the career save (levels, XP, counters) under 'gta-jobs-v1', and the quest-facing stats. Pure parsing; the
// store writes localStorage and calls notifySaveChanged() (saveHook.ts) like every save module.
import { notifySaveChanged } from '../saveHook';
import { LEVEL_XP, MAX_LEVEL } from './defs';
import { JOB_IDS, type GigKind, type JobId, type JobRecord, type JobsSave, type JobStats, type PayResult } from './types';

export const JOBS_SAVE_KEY = 'gta-jobs-v1';

const emptyRecord = (): JobRecord => ({ xp: 0, done: 0, failed: 0, earned: 0, bestTip: 0, fiveStars: 0, licensed: false });

export function emptySave(): JobsSave {
  return {
    v: 1, jobs: { taxi: emptyRecord(), courier: emptyRecord(), pilot: emptyRecord(), boat: emptyRecord() }, parcels: 0,
    fragileClean: 0, perfectLandings: 0, ferryLoops: 0, playerFares: 0, tubeSeconds: 0, tubeBest: 0, towedMax: 0, buoyBest: null,
  };
}

const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : null);

/** Never throws; anything bad -> emptySave() fields. */
export function parseSave(raw: string | null): JobsSave {
  const s = emptySave();
  if (!raw) return s;
  let o: unknown;
  try { o = JSON.parse(raw); } catch { return s; }
  if (typeof o !== 'object' || o === null || (o as { v?: unknown }).v !== 1) return s;
  const src = o as Record<string, unknown>;
  const jobs = typeof src.jobs === 'object' && src.jobs !== null ? (src.jobs as Record<string, unknown>) : {};
  for (const id of JOB_IDS) {
    const r = jobs[id];
    if (typeof r !== 'object' || r === null) continue;
    const rr = r as Record<string, unknown>;
    const rec = s.jobs[id];
    for (const k of ['xp', 'done', 'failed', 'earned', 'bestTip', 'fiveStars'] as const) {
      const n = num(rr[k]);
      if (n !== null) rec[k] = k === 'xp' || k === 'earned' || k === 'bestTip' ? n : Math.floor(n);
    }
    if (typeof rr.licensed === 'boolean') rec.licensed = rr.licensed;
  }
  for (const k of ['parcels', 'fragileClean', 'perfectLandings', 'ferryLoops', 'playerFares', 'tubeSeconds', 'tubeBest', 'towedMax'] as const) {
    const n = num(src[k]);
    if (n !== null) s[k] = k === 'tubeSeconds' || k === 'tubeBest' ? n : Math.floor(n);
  }
  const b = num(src.buoyBest);
  s.buoyBest = b !== null && b > 0 ? b : null;
  return s;
}

export function serializeSave(s: JobsSave): string { return JSON.stringify(s); }

/** Level 1..MAX_LEVEL for xp (defs.ts LEVEL_XP). */
export function levelOf(xp: number): number {
  let l = 1;
  for (let i = 0; i < LEVEL_XP.length; i++) if (xp >= LEVEL_XP[i]) l = i + 1;
  return l;
}

/** Progress inside the level: xp into it and xp the level spans (need 0 at the top level). */
export function levelProgress(xp: number): { level: number; into: number; need: number } {
  const level = levelOf(xp);
  return { level, into: xp - LEVEL_XP[level - 1], need: level === MAX_LEVEL ? 0 : LEVEL_XP[level] - LEVEL_XP[level - 1] };
}

/** Extra facts about a finished gig for the counters. */
export interface GigExtra {
  /** Courier: parcels delivered. */
  parcels?: number;
  /** A fragile parcel delivered at condition >= 0.99. */
  fragileClean?: boolean;
  /** A landing scored >= 95 with passengers aboard. */
  perfectLanding?: boolean;
  /** A full ferry loop. */
  ferryLoop?: boolean;
  /** A real online player was the fare. */
  playerFare?: boolean;
}

/** Book a finished gig (mutates s). Returns the new level when it went up, else null. */
export function recordGig(s: JobsSave, job: JobId, kind: GigKind, pay: PayResult, extra: GigExtra = {}): number | null {
  void kind;
  const r = s.jobs[job];
  const before = levelOf(r.xp);
  r.xp += pay.xp;
  r.done++;
  r.earned += pay.total;
  r.bestTip = Math.max(r.bestTip, pay.tip);
  if (pay.stars === 5) r.fiveStars++;
  if (extra.parcels) s.parcels += extra.parcels;
  if (extra.fragileClean) s.fragileClean++;
  if (extra.perfectLanding) s.perfectLandings++;
  if (extra.ferryLoop) s.ferryLoops++;
  if (extra.playerFare) s.playerFares++;
  const after = levelOf(r.xp);
  return after > before ? after : null;
}

export function recordFail(s: JobsSave, job: JobId): void { s.jobs[job].failed++; }

export function statsOf(s: JobsSave, onDuty: JobId | null): JobStats {
  return {
    taxiFares: s.jobs.taxi.done, parcels: s.parcels, flights: s.jobs.pilot.done, boatTrips: s.jobs.boat.done,
    ferryLoops: s.ferryLoops, playerFares: s.playerFares, tubeSeconds: s.tubeSeconds, buoyBest: s.buoyBest,
    earned: JOB_IDS.reduce((a, id) => a + s.jobs[id].earned, 0),
    levels: { taxi: levelOf(s.jobs.taxi.xp), courier: levelOf(s.jobs.courier.xp), pilot: levelOf(s.jobs.pilot.xp), boat: levelOf(s.jobs.boat.xp) },
    onDuty,
  };
}

export interface JobsStore {
  get(): JobsSave;
  /** Write it back (call after a change). */
  commit(): void;
}

type Store = Pick<Storage, 'getItem' | 'setItem'>;

function defaultStorage(): Store | undefined {
  try { return globalThis.localStorage; } catch { return undefined; }
}

export function createJobsStore(storage: Store | undefined = defaultStorage()): JobsStore {
  let raw: string | null = null;
  try { raw = storage?.getItem(JOBS_SAVE_KEY) ?? null; } catch { raw = null; }
  const s = parseSave(raw);
  return {
    get: () => s,
    commit() {
      try {
        storage?.setItem(JOBS_SAVE_KEY, serializeSave(s));
        notifySaveChanged();
      } catch {
        // Quota or private mode: progress stays in memory.
      }
    },
  };
}

let shared: JobsStore | null = null;
/** The one store the jobs and tubing runtimes share (created on first call with the default storage). */
export function sharedJobsStore(): JobsStore {
  if (!shared) shared = createJobsStore();
  return shared;
}

let bound: (() => JobStats) | null = null;
/** Quest-facing counters, readable from anywhere (e.g. city-lore quests): the live runtime once bound, else the save. */
export function jobStats(): JobStats { return bound ? bound() : statsOf(sharedJobsStore().get(), null); }
/** runtime.ts binds its live stats here. */
export function bindJobStats(get: () => JobStats): void { bound = get; }
