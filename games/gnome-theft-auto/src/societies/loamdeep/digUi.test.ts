// Dig a Nook pure helpers: the band, the fill curve and the verdict. No DOM.
import { describe, expect, it } from 'vitest';
import { digBand, digFill, digOpen, judgeDig } from './digUi';

/** Deterministic 0..1 source (LCG), so the 200 draws are the same every run. */
function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

describe('digBand', () => {
  it('keeps lo in 0.50..0.72, hi = lo + 0.18 and hi <= 0.90 over 200 seeded draws', () => {
    const rand = seeded(7);
    for (let i = 0; i < 200; i++) {
      const b = digBand(rand);
      expect(b.lo).toBeGreaterThanOrEqual(0.5);
      expect(b.lo).toBeLessThanOrEqual(0.72 + 1e-9);
      expect(b.hi - b.lo).toBeCloseTo(0.18, 9);
      expect(b.hi).toBeLessThanOrEqual(0.9 + 1e-9);
    }
  });

  it('maps the extremes of the random source to the ends of the range', () => {
    expect(digBand(() => 0).lo).toBeCloseTo(0.5, 9);
    expect(digBand(() => 1).lo).toBeLessThanOrEqual(0.72 + 1e-9);
  });
});

describe('digFill', () => {
  it('is 0 at 0 seconds', () => {
    expect(digFill(0)).toBe(0);
  });

  it('is monotonic over time', () => {
    let prev = digFill(0);
    for (let t = 0.05; t <= 2.5; t += 0.05) {
      const v = digFill(t);
      expect(v).toBeGreaterThanOrEqual(prev);
      prev = v;
    }
  });

  it('reaches 1 by 2.1 s and never exceeds it', () => {
    expect(digFill(2.1)).toBe(1);
    expect(digFill(10)).toBe(1);
    expect(digFill(1.0)).toBeLessThan(1);
  });
});

describe('judgeDig', () => {
  const band = { lo: 0.6, hi: 0.78 };

  it('is collapse at a full meter', () => {
    expect(judgeDig(1, band)).toBe('collapse');
  });

  it('is good inside the band', () => {
    expect(judgeDig(0.7, band)).toBe('good');
  });

  it('counts the band edges as good (inclusive)', () => {
    expect(judgeDig(0.6, band)).toBe('good');
    expect(judgeDig(0.78, band)).toBe('good');
  });

  it('is shallow just below the band', () => {
    expect(judgeDig(0.59, band)).toBe('shallow');
    expect(judgeDig(0, band)).toBe('shallow');
  });

  it('is shallow between the band top and a full meter', () => {
    expect(judgeDig(0.79, band)).toBe('shallow');
    expect(judgeDig(0.95, band)).toBe('shallow');
  });
});

describe('digOpen', () => {
  it('is false before any game opened', () => {
    expect(digOpen()).toBe(false);
  });
});
