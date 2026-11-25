// Activity probes: numbers the 'probe' quest objective (quests/objectivesCity.ts) watches, so the Turfton Newcomers'
// tutorials (quests/newcomerQuests.ts) can check "did the player do the thing" through each activity's own public API,
// without editing the activity. Three sources:
//   - saves: read through each activity's own store (hunting, birding, fishing, mowing), fresh from localStorage;
//   - economy: `spend:<reason>` / `earn:<reason>` count successful spends and earnings by reason (installProbeEconomy);
//   - live: app.ts registers getters (registerProbe) or bumps counters (bumpProbe) at existing hooks.
// A probe that is not registered reads null (the objective shows it is not available). Pure module state, no DOM.
import { createHuntStore } from '../hunting/huntSave';
import { createBirdStore } from '../birding/birdSave';
import { createFishStore } from '../fishing/fishSave';
import { createWinterStore } from '../winter/save';
import { createGolfStore } from '../golf/save';
import { GOLF_PROBES } from '../golf/types';
import { jobStats } from '../jobs/career';
import { createSportsStore } from '../sports/save';
import { COURT_PROBES } from '../court/types';
import { SKATE_LINES, SKATE_PROBES } from '../skate/types';

export type ProbeFn = () => number;

const LIVE = new Map<string, ProbeFn>();
const COUNTS = new Map<string, number>();

function storage(): Storage | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null;
  }
}

/** One row per Gutter Bowls line: 1 once the line has a best time. Key `skate-line-<LineId>`. */
const SKATE_LINE_PROBES: Readonly<Record<string, ProbeFn>> = Object.fromEntries(
  SKATE_LINES.map((l) => [
    `skate-line-${l.id}`,
    () => withStore(() => (createSportsStore(storage() ?? undefined).data().skate.lines[l.id] !== undefined ? 1 : 0)) ?? 0,
  ]),
);

/** Probes read from the activities' own saves (each call re-reads the save). */
const SAVED: Readonly<Record<string, ProbeFn>> = {
  'hunt-licensed': () => (withStore(() => createHuntStore(storage() ?? undefined).licensed()) ? 1 : 0),
  'hunt-combed': () => withStore(() => Object.values(createHuntStore(storage() ?? undefined).data().journal).reduce((n, e) => n + (e?.taken ?? 0), 0)) ?? 0,
  'hunt-sold': () => withStore(() => createHuntStore(storage() ?? undefined).data().sold) ?? 0,
  'bird-optics': () => withStore(() => createBirdStore(storage() ?? undefined).optics()) ?? 0,
  'bird-seen': () => withStore(() => createBirdStore(storage() ?? undefined).seenCount()) ?? 0,
  'bird-heard': () => withStore(() => createBirdStore(storage() ?? undefined).data().heard.length) ?? 0,
  'bird-photos': () => withStore(() => createBirdStore(storage() ?? undefined).photoCount()) ?? 0,
  'fish-rod': () => withStore(() => createFishStore(storage() ?? undefined).data().rods.length) ?? 0,
  'fish-caught': () => withStore(() => createFishStore(storage() ?? undefined).data().caught) ?? 0,
  'fish-sold': () => withStore(() => createFishStore(storage() ?? undefined).data().sold) ?? 0,
  'fish-derby': () => ((withStore(() => createFishStore(storage() ?? undefined).data().derbyBest) ?? 0) > 0 ? 1 : 0),
  // Winter sports (winter/save.ts): gta-winter-v1.
  'winter-sled-runs': () => withStore(() => createWinterStore(storage() ?? undefined).data().runs['tea-tray-run'] ?? 0) ?? 0,
  'winter-ski-runs': () => withStore(() => createWinterStore(storage() ?? undefined).data().runs['wool-run'] ?? 0) ?? 0,
  'ice-holes': () => withStore(() => createWinterStore(storage() ?? undefined).data().holes) ?? 0,
  'ice-catches': () => withStore(() => createWinterStore(storage() ?? undefined).data().iceCatches) ?? 0,
  // Hedgeworth Links (golf/save.ts): gta-golf-v1.
  [GOLF_PROBES.boardBroken]: () => withStore(() => (createGolfStore(storage() ?? undefined).data().boardBroken ? 1 : 0)) ?? 0,
  [GOLF_PROBES.holes]: () => withStore(() => createGolfStore(storage() ?? undefined).data().holesPlayed) ?? 0,
  [GOLF_PROBES.parHoles]: () => withStore(() => createGolfStore(storage() ?? undefined).data().parHoles) ?? 0,
  [GOLF_PROBES.rounds]: () => withStore(() => createGolfStore(storage() ?? undefined).data().rounds) ?? 0,
  [GOLF_PROBES.balls]: () => withStore(() => createGolfStore(storage() ?? undefined).data().ballsFound.length) ?? 0,
  [GOLF_PROBES.molehills]: () => withStore(() => createGolfStore(storage() ?? undefined).data().molehills.length) ?? 0,
  // Founders' Green sports (sports/save.ts): gta-sports-v1. Drainpipe Court, the skateboard, the Gutter Bowls.
  [COURT_PROBES.games]: () => withStore(() => createSportsStore(storage() ?? undefined).data().jam.games) ?? 0,
  [COURT_PROBES.wins]: () => withStore(() => createSportsStore(storage() ?? undefined).data().jam.wins) ?? 0,
  [COURT_PROBES.threes]: () => withStore(() => createSportsStore(storage() ?? undefined).data().jam.threes) ?? 0,
  [COURT_PROBES.dunks]: () => withStore(() => createSportsStore(storage() ?? undefined).data().jam.dunks) ?? 0,
  [COURT_PROBES.swishBeaten]: () => withStore(() => createSportsStore(storage() ?? undefined).data().jam.swishBeaten) ?? 0,
  [COURT_PROBES.shootMakes]: () => withStore(() => createSportsStore(storage() ?? undefined).data().jam.shootMakes) ?? 0,
  [SKATE_PROBES.boardOwned]: () => withStore(() => (createSportsStore(storage() ?? undefined).data().skate.boardOwned ? 1 : 0)) ?? 0,
  [SKATE_PROBES.ollies]: () => withStore(() => createSportsStore(storage() ?? undefined).data().skate.ollies) ?? 0,
  [SKATE_PROBES.bestCombo]: () => withStore(() => createSportsStore(storage() ?? undefined).data().skate.bestCombo) ?? 0,
  [SKATE_PROBES.lines]: () => withStore(() => createSportsStore(storage() ?? undefined).data().skate.linesDone) ?? 0,
  [SKATE_PROBES.fullRails]: () => withStore(() => createSportsStore(storage() ?? undefined).data().skate.fullRails) ?? 0,
  ...SKATE_LINE_PROBES,
  // Sim jobs (jobs/, docs/roadmaps/gta-sim-jobs-and-tubing.md): their own live stats getter.
  'job-gigs': () => withStore(() => { const j = jobStats(); return j.taxiFares + j.parcels + j.flights + j.boatTrips + j.ferryLoops; }) ?? 0,
  'job-taxi': () => withStore(() => jobStats().taxiFares) ?? 0,
  'job-parcels': () => withStore(() => jobStats().parcels) ?? 0,
  'job-flights': () => withStore(() => jobStats().flights) ?? 0,
  'job-boat': () => withStore(() => jobStats().boatTrips + jobStats().ferryLoops) ?? 0,
  'tube-seconds': () => withStore(() => jobStats().tubeSeconds) ?? 0,
  // The mowing tally (flora/, docs/roadmaps/gta-mowable-plants.md): save 'gta-mowing-v1' = { v, total, lawn, byKind }.
  mowed: () => {
    try {
      const raw = storage()?.getItem('gta-mowing-v1');
      const t = raw ? (JSON.parse(raw) as { total?: unknown }).total : 0;
      return typeof t === 'number' && Number.isFinite(t) ? t : 0;
    } catch {
      return 0;
    }
  },
};

function withStore<T>(f: () => T): T | null {
  try {
    return f();
  } catch {
    return null;
  }
}

/** app.ts: a live getter for `id` (replaces an earlier one). */
export function registerProbe(id: string, fn: ProbeFn): void {
  LIVE.set(id, fn);
}

/** Add `n` to the counter probe `id` (counters start at 0 each session; objectives compare against a baseline). */
export function bumpProbe(id: string, n = 1): void {
  COUNTS.set(id, (COUNTS.get(id) ?? 0) + n);
}

/** Make a counter probe readable (0) before its first bump, so objectives do not show it as unavailable. */
export function declareCounter(id: string): void {
  if (!COUNTS.has(id)) COUNTS.set(id, 0);
}

/** The probe's value now, or null when nothing provides it. */
export function readProbe(id: string): number | null {
  const live = LIVE.get(id);
  if (live) {
    try {
      return live();
    } catch {
      return null;
    }
  }
  const saved = SAVED[id];
  if (saved) return saved();
  if (COUNTS.has(id)) return COUNTS.get(id)!;
  if (id.startsWith('spend:') || id.startsWith('earn:')) return economyWrapped ? (COUNTS.get(id) ?? 0) : null;
  return null;
}

let economyWrapped = false;

/**
 * app.ts, once: count successful spends and earnings by reason (`spend:Sling-Lift`, `earn:Bird photo`). Wraps the two
 * methods on the passed object, like perkEffects.ts does; call it after createPerkEffects so the counts see the final
 * charge.
 */
export function installProbeEconomy(economy: { spend(amount: number, reason?: string): boolean; earn(amount: number, reason?: string): void }): void {
  if (economyWrapped) return;
  economyWrapped = true;
  const spend = economy.spend.bind(economy);
  economy.spend = (amount: number, reason?: string): boolean => {
    const ok = spend(amount, reason);
    if (ok && reason) bumpProbe(`spend:${reason}`);
    return ok;
  };
  const earn = economy.earn.bind(economy);
  economy.earn = (amount: number, reason?: string): void => {
    earn(amount, reason);
    if (reason) bumpProbe(`earn:${reason}`);
  };
}
