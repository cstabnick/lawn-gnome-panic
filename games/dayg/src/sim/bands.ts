// Target bands for the headless sim (docs/design/dayg/evaluation.md, "Metrics and target bands").
// Each metric reads one world's daily rows and returns a value, or null when it cannot be measured.
import type { DailyRow } from './types';

export interface Band {
  id: string; label: string; lo: number; hi: number; share: number; weight: number; day: number;
  metric: (rows: readonly DailyRow[]) => number | null; // null = not measurable (too few days)
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
];
