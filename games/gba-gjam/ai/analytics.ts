/**
 * Pure, dependency-free statistics for scoring how fun a ruleset is.
 * Used by the scorecard and sweep runners. Takes plain arrays only.
 */

/** One sample of a match trajectory. diff = home - away. frac in [0,1] of match elapsed. */
export interface TracePoint {
  frac: number;
  diff: number;
}

export interface WinProbModel {
  /** P(home wins) given a score diff (home - away) and match fraction elapsed. */
  predict(diff: number, frac: number): number;
}

const WP_DIFF_LIMIT = 30;
const WP_DIFF_BIN = 2;
const WP_DIFF_BINS = (2 * WP_DIFF_LIMIT) / WP_DIFF_BIN + 1; // 31 bins: -30..30
const WP_FRAC_BINS = 10;

function wpBin(diff: number, frac: number): [number, number] {
  const clamped = Math.max(-WP_DIFF_LIMIT, Math.min(WP_DIFF_LIMIT, diff));
  const d = Math.min(WP_DIFF_BINS - 1, Math.floor((clamped + WP_DIFF_LIMIT) / WP_DIFF_BIN));
  const f = Math.max(0, Math.min(WP_FRAC_BINS - 1, Math.floor(frac * WP_FRAC_BINS)));
  return [d, f];
}

/**
 * Empirical win probability: bin diff (clamped to +-30, bins of 2) x frac (10 bins).
 * Laplace smoothing alpha=1 (so an empty bin falls back to 0.5).
 * traces[i] pairs with homeWon[i].
 */
export function fitWinProb(traces: TracePoint[][], homeWon: boolean[]): WinProbModel {
  const wins: number[][] = [];
  const total: number[][] = [];
  for (let d = 0; d < WP_DIFF_BINS; d++) {
    wins.push(new Array(WP_FRAC_BINS).fill(0));
    total.push(new Array(WP_FRAC_BINS).fill(0));
  }
  const n = Math.min(traces.length, homeWon.length);
  for (let i = 0; i < n; i++) {
    const won = homeWon[i] ? 1 : 0;
    for (const pt of traces[i]) {
      const [d, f] = wpBin(pt.diff, pt.frac);
      total[d][f] += 1;
      wins[d][f] += won;
    }
  }
  return {
    predict(diff: number, frac: number): number {
      const [d, f] = wpBin(diff, frac);
      return (wins[d][f] + 1) / (total[d][f] + 2);
    },
  };
}

/** Game Excitement Index: (regulationSec / durationSec) * sum |p_i - p_{i-1}| over one match's WP path. */
export function gei(wpPath: number[], durationSec: number, regulationSec: number): number {
  if (wpPath.length < 2 || durationSec <= 0) return 0;
  let swing = 0;
  for (let i = 1; i < wpPath.length; i++) swing += Math.abs(wpPath[i] - wpPath[i - 1]);
  return (regulationSec / durationSec) * swing;
}

export function geiBand(g: number): 'dud' | 'average' | 'thriller' | 'heartPounder' {
  if (g < 1) return 'dud';
  if (g <= 4) return 'average';
  if (g <= 8) return 'thriller';
  return 'heartPounder';
}

/** Shannon entropy base 2 of a two-outcome probability. */
export function entropy2(p: number): number {
  if (p <= 0 || p >= 1) return 0;
  return -(p * Math.log2(p) + (1 - p) * Math.log2(1 - p));
}

/** Number of lead flips in a diff series (ties do not flip). */
export function leadChanges(diffs: number[]): number {
  let changes = 0;
  let lastSign = 0;
  for (const d of diffs) {
    const s = Math.sign(d);
    if (s === 0) continue;
    if (lastSign !== 0 && s !== lastSign) changes++;
    lastSign = s;
  }
  return changes;
}

/** Winner's worst deficit: max(0, -min diff from winner's view). homeWon tells the winner. */
export function winnerMaxDeficit(diffs: number[], homeWon: boolean): number {
  if (diffs.length === 0) return 0;
  const sign = homeWon ? 1 : -1;
  let minView = Infinity;
  for (const d of diffs) minView = Math.min(minView, sign * d);
  return Math.max(0, -minView);
}

/**
 * Leverage index per step: |p_{i+1} - p_i| scaled so the mean over ALL steps passed in is 1.
 * Flatten many matches' steps before calling. A zero mean gives all zeros.
 */
export function leverageIndex(absSwings: number[]): number[] {
  if (absSwings.length === 0) return [];
  const mean = absSwings.reduce((s, x) => s + x, 0) / absSwings.length;
  if (mean === 0) return absSwings.map(() => 0);
  return absSwings.map((x) => x / mean);
}

/** Share of values below cutoff (garbage-time share, cutoff default 0.3). */
export function shareBelow(values: number[], cutoff = 0.3): number {
  if (values.length === 0) return 0;
  let below = 0;
  for (const v of values) if (v < cutoff) below++;
  return below / values.length;
}

/** ROC-AUC of a score predicting a binary label (ties count 0.5). Rank-based, O(n log n). */
export function rocAuc(scores: number[], labels: boolean[]): number {
  const n = Math.min(scores.length, labels.length);
  const order = Array.from({ length: n }, (_, i) => i).sort((a, b) => scores[a] - scores[b]);
  const ranks = new Array<number>(n);
  let i = 0;
  while (i < n) {
    let j = i;
    while (j + 1 < n && scores[order[j + 1]] === scores[order[i]]) j++;
    const avgRank = (i + j) / 2 + 1; // 1-based average rank of the tie group
    for (let k = i; k <= j; k++) ranks[order[k]] = avgRank;
    i = j + 1;
  }
  let pos = 0;
  let neg = 0;
  let sumPosRanks = 0;
  for (let k = 0; k < n; k++) {
    if (labels[k]) {
      pos++;
      sumPosRanks += ranks[k];
    } else {
      neg++;
    }
  }
  if (pos === 0 || neg === 0) return 0.5;
  return (sumPosRanks - (pos * (pos + 1)) / 2) / (pos * neg);
}

/** Vargha-Delaney A12: P(b > a) + 0.5 P(b == a). 0.5 = no effect. */
export function varghaDelaneyA12(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0) return 0.5;
  let score = 0;
  for (const x of a) {
    for (const y of b) {
      if (y > x) score += 1;
      else if (y === x) score += 0.5;
    }
  }
  return score / (a.length * b.length);
}

/** Cliff's delta in [-1,1] = 2*A12 - 1. */
export function cliffsDelta(a: number[], b: number[]): number {
  return 2 * varghaDelaneyA12(a, b) - 1;
}

/** Abramowitz-Stegun 7.1.26 erf approximation (abs error ~1.5e-7). */
function erf(x: number): number {
  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * ax);
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
      t *
      Math.exp(-ax * ax);
  return sign * y;
}

/**
 * Two-sided Wilcoxon signed-rank p-value for paired samples.
 * Zero differences are dropped, tied |d| get average ranks, normal approximation
 * with tie correction and continuity correction. Returns 1 if all diffs are 0.
 */
export function wilcoxonSignedRankP(a: number[], b: number[]): number {
  const diffs: number[] = [];
  const n0 = Math.min(a.length, b.length);
  for (let i = 0; i < n0; i++) {
    const d = b[i] - a[i];
    if (d !== 0) diffs.push(d);
  }
  const n = diffs.length;
  if (n === 0) return 1;

  const order = diffs.map((_, i) => i).sort((x, y) => Math.abs(diffs[x]) - Math.abs(diffs[y]));
  const ranks = new Array<number>(n);
  let tieTerm = 0;
  let i = 0;
  while (i < n) {
    let j = i;
    while (j + 1 < n && Math.abs(diffs[order[j + 1]]) === Math.abs(diffs[order[i]])) j++;
    const avgRank = (i + j) / 2 + 1;
    const t = j - i + 1;
    if (t > 1) tieTerm += t * t * t - t;
    for (let k = i; k <= j; k++) ranks[order[k]] = avgRank;
    i = j + 1;
  }

  let wPlus = 0;
  for (let k = 0; k < n; k++) if (diffs[k] > 0) wPlus += ranks[k];

  const mean = (n * (n + 1)) / 4;
  const variance = (n * (n + 1) * (2 * n + 1)) / 24 - tieTerm / 48;
  if (variance <= 0) return 1;
  const z = Math.max(0, Math.abs(wPlus - mean) - 0.5) / Math.sqrt(variance);
  const p = 2 * (1 - (1 + erf(z / Math.SQRT2)) / 2);
  return Math.min(1, Math.max(0, p));
}

/** Pooled rate: sum(num)/sum(den), 0 if den is 0. Never a mean of per-match ratios. */
export function pooledRate(nums: number[], dens: number[]): number {
  const den = dens.reduce((s, x) => s + x, 0);
  if (den === 0) return 0;
  return nums.reduce((s, x) => s + x, 0) / den;
}

/** Latin hypercube sample: n points in [0,1]^dims using the given rng (() => number). */
export function latinHypercube(n: number, dims: number, rng: () => number): number[][] {
  const points: number[][] = Array.from({ length: n }, () => new Array<number>(dims).fill(0));
  for (let d = 0; d < dims; d++) {
    // Fisher-Yates shuffle of stratum indices for this dimension.
    const perm = Array.from({ length: n }, (_, k) => k);
    for (let k = n - 1; k > 0; k--) {
      const r = Math.floor(rng() * (k + 1));
      [perm[k], perm[r]] = [perm[r], perm[k]];
    }
    for (let i = 0; i < n; i++) {
      points[i][d] = (perm[i] + rng()) / n;
    }
  }
  return points;
}

/** Shannon entropy base 2 of a probability vector (ignores zeros). */
export function entropy(ps: number[]): number {
  let h = 0;
  for (const p of ps) if (p > 0) h -= p * Math.log2(p);
  return h;
}

/**
 * Solve a symmetric zero-sum matrix game by fictitious play (20000 iterations).
 * M[i][j] = row i's win rate vs column j in [0,1]. Returns the row player's mixed strategy.
 */
export function mixedNashRow(M: number[][]): number[] {
  const rows = M.length;
  if (rows === 0) return [];
  const cols = M[0].length;
  const rowCounts = new Array<number>(rows).fill(0);
  const colCounts = new Array<number>(cols).fill(0);
  rowCounts[0] = 1;
  colCounts[0] = 1;
  const ITER = 20000;
  for (let t = 0; t < ITER; t++) {
    // Row best response to the column player's empirical mix (maximise row win rate).
    let bestRow = 0;
    let bestRowVal = -Infinity;
    for (let i = 0; i < rows; i++) {
      let v = 0;
      for (let j = 0; j < cols; j++) v += M[i][j] * colCounts[j];
      if (v > bestRowVal) {
        bestRowVal = v;
        bestRow = i;
      }
    }
    // Column best response to the row player's empirical mix (minimise row win rate).
    let bestCol = 0;
    let bestColVal = Infinity;
    for (let j = 0; j < cols; j++) {
      let v = 0;
      for (let i = 0; i < rows; i++) v += M[i][j] * rowCounts[i];
      if (v < bestColVal) {
        bestColVal = v;
        bestCol = j;
      }
    }
    rowCounts[bestRow] += 1;
    colCounts[bestCol] += 1;
  }
  const total = rowCounts.reduce((s, x) => s + x, 0);
  return rowCounts.map((x) => x / total);
}
