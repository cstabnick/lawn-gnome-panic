// Pure chip wagering math for Gnome Billiards (up to 50% of current chips).
export const MAX_WAGER_FRACTION = 0.5;

export function maxWager(chips: number): number {
  if (!Number.isFinite(chips) || chips <= 0) return 0;
  return Math.floor(chips * MAX_WAGER_FRACTION);
}

export function clampWager(amount: number, chips: number): number {
  const cap = maxWager(chips);
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  return Math.min(cap, Math.floor(amount));
}

export function wagerPreset(chips: number, fraction: number): number {
  if (!Number.isFinite(fraction) || fraction <= 0) return 0;
  return clampWager(Math.floor(Math.max(0, chips) * fraction), chips);
}

export function wagerPayout(wager: number, mult: number): { totalReturn: number; profit: number } {
  const w = Math.max(0, Math.floor(wager));
  const profit = Math.round(w * Math.max(0, mult));
  return { totalReturn: w + profit, profit };
}
