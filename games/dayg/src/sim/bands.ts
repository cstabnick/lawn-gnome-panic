// Target bands for the headless sim (docs/design/dayg/evaluation.md, "Metrics and target bands").
// Each metric reads one world's daily rows (or one seed's bot rows) and returns a value, or null when it cannot be measured.
import type { BotRow } from './bots';
import type { DailyRow, FactionId } from './types';

/** Fields every band has; the scorecard reads only these. */
export interface BandBase {
  id: string; label: string; lo: number; hi: number; share: number; weight: number;
}
export interface Band extends BandBase {
  day: number;
  metric: (rows: readonly DailyRow[]) => number | null; // null = not measurable (too few days)
}
/** A player-experience band: one value per seed, from that seed's bot rows (all bots, all days). */
export interface BotBand extends BandBase {
  metric: (bots: readonly BotRow[]) => number | null;
}

const at = (rows: readonly DailyRow[], day: number): DailyRow | undefined => rows.find((r) => r.day === day);

/** Value of f on the row for `day`, or null when that day was not simulated or f has no value. */
function onDay(day: number, f: (r: DailyRow) => number | null): (rows: readonly DailyRow[]) => number | null {
  return (rows) => {
    const r = at(rows, day);
    return r ? f(r) : null;
  };
}

const perAlive = (n: number, r: DailyRow): number | null => (r.alive > 0 ? n / r.alive : null);

/** Smallest havensUp over the rows from day 2 on. */
function minHavensUp(rows: readonly DailyRow[]): number | null {
  let min: number | null = null;
  for (const r of rows) {
    if (r.day < 2 || r.havensUp === undefined) continue;
    min = min === null ? r.havensUp : Math.min(min, r.havensUp);
  }
  return min;
}

/** Number of haven-holder changes between consecutive rows (a change from or to no holder counts). */
function handoverCount(rows: readonly DailyRow[]): number | null {
  let n = 0;
  let seen = false;
  for (let i = 1; i < rows.length; i++) {
    const a = rows[i - 1].havenHolders as Record<string, FactionId | null | undefined> | undefined;
    const b = rows[i].havenHolders as Record<string, FactionId | null | undefined> | undefined;
    if (!a || !b) continue;
    seen = true;
    for (const h of [...new Set([...Object.keys(a), ...Object.keys(b)])].sort()) {
      if ((a[h] ?? null) !== (b[h] ?? null)) n++;
    }
  }
  return seen ? n : null;
}

/** The last bot row of each bot (by day). */
function lastPerBot(bots: readonly BotRow[]): BotRow[] {
  const last = new Map<string, BotRow>();
  for (const b of bots) {
    const prev = last.get(b.bot);
    if (!prev || b.day >= prev.day) last.set(b.bot, b);
  }
  return [...last.values()];
}

export const BANDS: readonly Band[] = [
  { id: 'pop-d60', label: 'Population day 60 / start', lo: 0.35, hi: 0.8, share: 0.9, weight: 2, day: 60,
    metric: onDay(60, (r) => (r.start > 0 ? r.alive / r.start : null)) },
  { id: 'extinction', label: 'Alive above 5% at day 60', lo: 0.05, hi: 1, share: 0.99, weight: 2, day: 60,
    metric: onDay(60, (r) => (r.start > 0 ? r.alive / r.start : null)) },
  { id: 'cause-max', label: 'No death cause above 45%', lo: 0, hi: 0.45, share: 0.9, weight: 2, day: 60,
    metric: onDay(60, (r) => {
      const counts = Object.values(r.deaths);
      const total = counts.reduce((a, b) => a + b, 0);
      return total > 0 ? Math.max(...counts) / total : null;
    }) },
  { id: 'alone-d60', label: 'Alone at day 60', lo: 0.1, hi: 0.35, share: 0.85, weight: 2, day: 60,
    metric: onDay(60, (r) => perAlive(r.modes.alone, r)) },
  { id: 'pack-d60', label: 'Packs (2-8) at day 60', lo: 0.25, hi: 0.6, share: 0.85, weight: 2, day: 60,
    metric: onDay(60, (r) => perAlive(r.modes.pack, r)) },
  { id: 'band-d60', label: 'Bands and settlements (9+) at day 60', lo: 0.05, hi: 0.45, share: 0.85, weight: 2, day: 60,
    metric: onDay(60, (r) => perAlive(r.modes.band + r.modes.settlement, r)) },
  { id: 'hatless-d60', label: 'Hatless day 60 / start', lo: 0.5, hi: 2.0, share: 0.85, weight: 1, day: 60,
    metric: onDay(60, (r) => (r.hatlessStart > 0 ? r.hatless / r.hatlessStart : null)) },
  { id: 'sinks', label: 'Horde share in NEST/PIT, days 20-60', lo: 0.3, hi: 0.6, share: 0.8, weight: 1, day: 60,
    metric: (rows) => {
      const span = rows.filter((r) => r.day >= 20 && r.day <= 60);
      if (span.length === 0 || !at(rows, 60)) return null;
      return span.reduce((a, r) => a + r.hordeInSinks, 0) / span.length;
    } },
  { id: 'food-d20', label: 'Food loot left day 20', lo: 0.55, hi: 0.75, share: 0.85, weight: 1, day: 20,
    metric: onDay(20, (r) => r.lootLeft.food) },
  { id: 'food-d50', label: 'Food loot left day 50', lo: 0.15, hi: 0.35, share: 0.85, weight: 1, day: 50,
    metric: onDay(50, (r) => r.lootLeft.food) },
  { id: 'price-vol', label: 'Food price volatility', lo: 0.02, hi: 0.1, share: 0.85, weight: 1, day: 60,
    metric: (rows) => {
      const logs: number[] = [];
      for (let d = 2; d <= 60; d++) {
        const a = at(rows, d - 1), b = at(rows, d);
        if (!a || !b) return null;
        const p0 = a.prices.food, p1 = b.prices.food;
        if (!(p0 > 0) || !(p1 > 0)) return null;
        logs.push(Math.log(p1 / p0));
      }
      const mean = logs.reduce((s, x) => s + x, 0) / logs.length;
      return Math.sqrt(logs.reduce((s, x) => s + (x - mean) ** 2, 0) / logs.length);
    } },
  { id: 'story', label: 'Chronicle lines per day', lo: 0.5, hi: 4, share: 0.8, weight: 1, day: 1,
    metric: (rows) => {
      const last = rows[rows.length - 1];
      return last && last.day > 0 ? last.chronicleLines / last.day : null;
    } },
  // ---- society (phases 4-6): factions, havens, quests
  { id: 'factions-d60', label: 'Live factions at day 60', lo: 3, hi: 9, share: 0.9, weight: 2, day: 60,
    metric: onDay(60, (r) => r.factions ?? null) },
  { id: 'hhi-d60', label: 'Faction concentration (HHI) at day 60', lo: 0, hi: 0.4, share: 0.85, weight: 2, day: 60,
    metric: onDay(60, (r) => r.hhiNorm ?? null) },
  { id: 'top-share-d60', label: 'Top faction share at day 60', lo: 0, hi: 0.5, share: 0.9, weight: 2, day: 60,
    metric: onDay(60, (r) => r.topShare ?? null) },
  { id: 'havens-up', label: 'Fewest havens up, days 2+', lo: 2, hi: 99, share: 0.95, weight: 2, day: 2,
    metric: minHavensUp },
  { id: 'handovers', label: 'Haven handovers by day 120', lo: 1, hi: 4, share: 0.7, weight: 1, day: 120,
    metric: handoverCount },
  { id: 'quests-open-d10', label: 'Open quests at day 10', lo: 3, hi: 1000, share: 0.9, weight: 1, day: 10,
    metric: onDay(10, (r) => r.questsOpen ?? null) },
];

/** Consequence reach (phase 6): share of finished quests followed by a visible consequence, read on the world's last row. */
export const WORLD_BOT_BANDS: readonly Band[] = [
  { id: 'reach', label: 'Consequence reach (quests followed by a change)', lo: 0.2, hi: 0.6, share: 0.8, weight: 1, day: 1,
    metric: (rows) => {
      const last = rows[rows.length - 1];
      if (!last || last.outcomesMeasured === undefined || last.outcomesMeasured === 0) return null;
      return (last.outcomesReached ?? 0) / last.outcomesMeasured;
    } },
];

/** Player-experience bands (phases 4-6): one value per seed from the bot rows. Only scored when bots ran. */
export const BOT_BANDS: readonly BotBand[] = [
  { id: 'quests-near', label: 'Bot-days with 3+ quests near (after day 2)', lo: 0.9, hi: 1, share: 0.9, weight: 1,
    metric: (bots) => {
      let n = 0, ok = 0;
      for (const b of bots) {
        if (b.day <= 2) continue;
        n++;
        if (b.questsNear >= 3) ok++;
      }
      return n > 0 ? ok / n : null;
    } },
  { id: 'quest-variety', label: 'Bots seeing 6+ quest templates (last session)', lo: 0.8, hi: 1, share: 0.8, weight: 1,
    metric: (bots) => {
      const last = lastPerBot(bots);
      if (last.length === 0) return null;
      return last.filter((b) => b.templatesSeen.length >= 6).length / last.length;
    } },
  { id: 'session-fit', label: 'Bot sessions that finish a quest or trade and get back', lo: 0.7, hi: 1, share: 0.8, weight: 1,
    metric: (bots) => {
      const judged = bots.filter((b) => b.sessionOk !== null);
      if (judged.length === 0) return null;
      return judged.filter((b) => b.sessionOk === true).length / judged.length;
    } },
  { id: 'bot-deaths-cause', label: 'Bot deaths: no cause above 50%', lo: 0, hi: 0.5, share: 0.85, weight: 1,
    metric: (bots) => {
      const counts: Record<string, number> = {};
      let total = 0;
      for (const b of bots) {
        if (b.cause === null) continue;
        counts[b.cause] = (counts[b.cause] ?? 0) + 1;
        total++;
      }
      return total > 0 ? Math.max(...Object.values(counts)) / total : null;
    } },
];

/** Counterfactual divergence (phase 4-6): per seed, value 1 when bot divergence > 2 x null perturbation. */
export const DIVERGENCE_BAND: BandBase = {
  id: 'divergence', label: 'Bot divergence beats 2x null perturbation (day 30)', lo: 1, hi: 1, share: 0.6, weight: 1,
};

/** Performance bands: stepMs is mean milliseconds per stepWorld; snapshot sizes are in MiB. */
export const PERF_BANDS = {
  step: { id: 'perf-step', label: 'Mean stepWorld time (ms)', lo: 0, hi: 4, share: 1, weight: 1 },
  snap30: { id: 'perf-snap-d30', label: 'Packed snapshot day 30 (MiB)', lo: 0, hi: 4, share: 1, weight: 1 },
  snap120: { id: 'perf-snap-d120', label: 'Packed snapshot day 120 (MiB)', lo: 0, hi: 8, share: 1, weight: 1 },
} as const satisfies Record<string, BandBase>;
