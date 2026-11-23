// Season patches: tuning.seasonal[season] is deep-merged over the base tuning (roadmap 9.9).
import type { DailyRow, Season, Tuning } from './types';
import { withOverrides } from './tuning';

export function withSeason(t: Tuning, season: Season): Tuning {
  return withOverrides(t, t.seasonal[season] ?? {});
}
export function seasonalReport(runs: readonly (readonly DailyRow[])[], t: Tuning): string { return ''; }
