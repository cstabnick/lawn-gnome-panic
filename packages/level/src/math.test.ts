import { describe, expect, it } from 'vitest';
import { base64ToBytes, bytesToBase64, clamp, distToSeg, mulberry32, smoothstep } from './math';

function randomBytes(seed: number, n: number): Uint8Array {
  const rng = mulberry32(seed);
  return Uint8Array.from({ length: n }, () => Math.floor(rng() * 256));
}

describe('smoothstep', () => {
  it('is 0 below the range, 1 above it, and 0.5 at the middle', () => {
    expect(smoothstep(0, 1, -1)).toBe(0);
    expect(smoothstep(0, 1, 2)).toBe(1);
    expect(smoothstep(0, 1, 0.5)).toBe(0.5);
  });
});

describe('clamp', () => {
  it('limits a value to the range and leaves inside values alone', () => {
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
    expect(clamp(4, 0, 10)).toBe(4);
  });
});

describe('distToSeg', () => {
  it('measures the perpendicular distance beside a segment', () => {
    expect(distToSeg(5, 3, 0, 0, 10, 0)).toBeCloseTo(3);
  });

  it('measures to the nearest end when the point is past either end', () => {
    expect(distToSeg(-4, 0, 0, 0, 10, 0)).toBeCloseTo(4);
    expect(distToSeg(13, 4, 0, 0, 10, 0)).toBeCloseTo(5);
  });

  it('treats a zero-length segment as a point', () => {
    expect(distToSeg(4, 5, 1, 1, 1, 1)).toBeCloseTo(5);
  });
});

describe('mulberry32', () => {
  it('gives the same first five values for the same seed', () => {
    const a = mulberry32(12345);
    const b = mulberry32(12345);
    const first = [a(), a(), a(), a(), a()];
    const second = [b(), b(), b(), b(), b()];
    expect(first).toEqual(second);
  });

  it('gives different sequences for different seeds', () => {
    const a = mulberry32(1);
    const b = mulberry32(2);
    const first = [a(), a(), a(), a(), a()];
    const second = [b(), b(), b(), b(), b()];
    expect(first).not.toEqual(second);
  });

  it('only yields values in [0, 1)', () => {
    const rng = mulberry32(99);
    for (let i = 0; i < 10000; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('base64', () => {
  it.each([0, 1, 2, 3, 100000])('round-trips %i random-looking bytes', (n) => {
    const bytes = randomBytes(n + 1, n);
    const back = base64ToBytes(bytesToBase64(bytes));
    expect(back.length).toBe(n);
    expect(back).toEqual(bytes);
  });
});
