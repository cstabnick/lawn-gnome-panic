import { describe, expect, it } from 'vitest';
import {
  cliffsDelta,
  entropy,
  entropy2,
  fitWinProb,
  gei,
  geiBand,
  latinHypercube,
  leadChanges,
  leverageIndex,
  mixedNashRow,
  pooledRate,
  rocAuc,
  shareBelow,
  varghaDelaneyA12,
  wilcoxonSignedRankP,
  winnerMaxDeficit,
} from './analytics';
import { mulberry32 } from '../src/ai/eval';

describe('fitWinProb', () => {
  it('learns that a big home lead late means a home win', () => {
    const traces = [
      [{ frac: 0.95, diff: 12 }],
      [{ frac: 0.95, diff: 12 }],
      [{ frac: 0.95, diff: -12 }],
      [{ frac: 0.95, diff: -12 }],
    ];
    const model = fitWinProb(traces, [true, true, false, false]);
    expect(model.predict(12, 0.95)).toBeGreaterThan(0.5);
    expect(model.predict(-12, 0.95)).toBeLessThan(0.5);
  });

  it('falls back to 0.5 for an unseen bin', () => {
    const model = fitWinProb([], []);
    expect(model.predict(0, 0.5)).toBe(0.5);
  });
});

describe('gei and geiBand', () => {
  it('scales swing by regulation over duration', () => {
    // swing = 0.2 + 0.3 = 0.5; regulation 180 / duration 90 = 2 -> 1
    expect(gei([0.5, 0.7, 0.4], 90, 180)).toBeCloseTo(1, 9);
  });

  it('returns 0 for a flat or degenerate path', () => {
    expect(gei([0.5], 90, 180)).toBe(0);
    expect(gei([0.5, 0.5], 0, 180)).toBe(0);
  });

  it('bands at the documented cut-offs', () => {
    expect(geiBand(0.5)).toBe('dud');
    expect(geiBand(3)).toBe('average');
    expect(geiBand(4)).toBe('average');
    expect(geiBand(6)).toBe('thriller');
    expect(geiBand(9)).toBe('heartPounder');
  });
});

describe('entropy', () => {
  it('entropy2(0.5) is 1 bit and degenerate p is 0', () => {
    expect(entropy2(0.5)).toBeCloseTo(1, 12);
    expect(entropy2(0)).toBe(0);
    expect(entropy2(1)).toBe(0);
  });

  it('entropy of a uniform 4-way vector is 2 bits and ignores zeros', () => {
    expect(entropy([0.25, 0.25, 0.25, 0.25])).toBeCloseTo(2, 12);
    expect(entropy([0.5, 0.5, 0])).toBeCloseTo(1, 12);
  });
});

describe('leadChanges and winnerMaxDeficit', () => {
  it('counts sign flips and ignores ties', () => {
    expect(leadChanges([1, -1, 1, 0, 2])).toBe(2);
    expect(leadChanges([0, 0, 3, 3])).toBe(0);
  });

  it('measures the winner worst deficit from their own view', () => {
    // home wins; home trailed by 6 at its worst
    expect(winnerMaxDeficit([-6, -2, 3, 5], true)).toBe(6);
    // away wins; away's view is -diff, worst is home leading by 4 -> away trailed by 4
    expect(winnerMaxDeficit([4, 1, -2], false)).toBe(4);
    // winner never trailed
    expect(winnerMaxDeficit([1, 2, 3], true)).toBe(0);
  });
});

describe('leverageIndex and shareBelow', () => {
  it('scales so the mean is 1', () => {
    const li = leverageIndex([0.1, 0.3]);
    expect(li[0]).toBeCloseTo(0.5, 12);
    expect(li[1]).toBeCloseTo(1.5, 12);
    expect((li[0] + li[1]) / 2).toBeCloseTo(1, 12);
  });

  it('counts values below the cutoff', () => {
    expect(shareBelow([0.1, 0.2, 0.5, 0.9])).toBeCloseTo(0.5, 12);
    expect(shareBelow([0.1, 0.5], 0.6)).toBeCloseTo(1, 12);
  });
});

describe('rocAuc', () => {
  it('is 1 for a perfect separator', () => {
    expect(rocAuc([0.1, 0.2, 0.8, 0.9], [false, false, true, true])).toBeCloseTo(1, 12);
  });

  it('is 0.5 for fully tied scores', () => {
    expect(rocAuc([0.5, 0.5, 0.5, 0.5], [false, true, false, true])).toBeCloseTo(0.5, 12);
  });

  it('is 0.5 for an alternating, uninformative ranking', () => {
    // pos ranks 2 and 3 of 4 with negatives at 1 and 4 -> (5 - 3) / 4 = 0.5
    expect(rocAuc([1, 2, 3, 4], [false, true, true, false])).toBeCloseTo(0.5, 12);
  });
});

describe('varghaDelaneyA12 and cliffsDelta', () => {
  it('A12 of [1,2,3] vs [4,5,6] is 1', () => {
    expect(varghaDelaneyA12([1, 2, 3], [4, 5, 6])).toBe(1);
    expect(cliffsDelta([1, 2, 3], [4, 5, 6])).toBe(1);
  });

  it('identical samples give 0.5 and delta 0', () => {
    expect(varghaDelaneyA12([1, 2], [1, 2])).toBeCloseTo(0.5, 12);
    expect(cliffsDelta([1, 2], [1, 2])).toBeCloseTo(0, 12);
  });
});

describe('wilcoxonSignedRankP', () => {
  it('returns 1 for identical arrays', () => {
    expect(wilcoxonSignedRankP([1, 2, 3, 4], [1, 2, 3, 4])).toBe(1);
  });

  it('is small for a consistent shift and large for mixed signs', () => {
    const a = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const shifted = a.map((x) => x + 1);
    expect(wilcoxonSignedRankP(a, shifted)).toBeLessThan(0.05);
    const mixed = a.map((x, i) => (i % 2 === 0 ? x + 1 : x - 1));
    expect(wilcoxonSignedRankP(a, mixed)).toBeGreaterThan(0.5);
  });
});

describe('pooledRate', () => {
  it('sums numerators over summed denominators, 0 when empty', () => {
    // pooled 3/4, not mean of (1/1, 0/3) = 0.5
    expect(pooledRate([1, 2], [1, 3])).toBeCloseTo(0.75, 12);
    expect(pooledRate([0], [0])).toBe(0);
  });
});

describe('latinHypercube', () => {
  it('has exactly one point per 1/n stratum in every dimension', () => {
    const n = 10;
    const dims = 3;
    const pts = latinHypercube(n, dims, mulberry32(7));
    expect(pts).toHaveLength(n);
    for (let d = 0; d < dims; d++) {
      const strata = pts.map((p) => Math.floor(p[d] * n));
      expect(new Set(strata).size).toBe(n);
      for (const p of pts) {
        expect(p[d]).toBeGreaterThanOrEqual(0);
        expect(p[d]).toBeLessThan(1);
      }
    }
  });
});

describe('mixedNashRow', () => {
  it('finds the uniform mix for rock-paper-scissors', () => {
    const M = [
      [0.5, 0, 1],
      [1, 0.5, 0],
      [0, 1, 0.5],
    ];
    const s = mixedNashRow(M);
    for (const p of s) expect(Math.abs(p - 1 / 3)).toBeLessThan(0.05);
  });
});
