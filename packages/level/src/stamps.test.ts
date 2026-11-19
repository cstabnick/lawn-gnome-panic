import { describe, expect, it } from 'vitest';
import { applyStamps, stampBounds } from './stamps';
import type { Stamp } from './types';

const flatten: Stamp = { op: 'flatten', x: 0, z: 0, inner: 2, outer: 6, to: 1 };
const gauss: Stamp = { op: 'gauss', x: 0, z: 0, sigma: 2, amount: 3 };

describe('flatten stamp', () => {
  it('sets the centre to exactly `to`', () => {
    expect(applyStamps(5, [flatten], 0, 0)).toBe(1);
  });

  it('leaves the height unchanged at distance >= outer', () => {
    expect(applyStamps(5, [flatten], 6, 0)).toBe(5);
    expect(applyStamps(5, [flatten], 0, 9)).toBe(5);
  });

  it('blends between `to` and the original height halfway through the blend', () => {
    const h = applyStamps(5, [flatten], 4, 0);
    expect(h).toBeGreaterThan(1);
    expect(h).toBeLessThan(5);
    expect(h).toBeCloseTo(3);
  });

  it('is fully flat inside the inner radius', () => {
    expect(applyStamps(5, [flatten], 1, 0)).toBe(1);
    expect(applyStamps(5, [flatten], 0, 2)).toBe(1);
  });
});

describe('gauss stamp', () => {
  it('adds +amount at the centre', () => {
    expect(applyStamps(0, [gauss], 0, 0)).toBeCloseTo(3);
  });

  it('adds about amount * e^-1 at distance sigma', () => {
    expect(applyStamps(0, [gauss], 2, 0)).toBeCloseTo(3 * Math.exp(-1), 6);
  });

  it('leaves the height unchanged beyond 4 * sigma', () => {
    expect(applyStamps(0, [gauss], 8.5, 0)).toBe(0);
    expect(applyStamps(0, [gauss], 0, -9)).toBe(0);
  });

  it('digs a pit for a negative amount', () => {
    const pit: Stamp = { op: 'gauss', x: 0, z: 0, sigma: 2, amount: -2 };
    expect(applyStamps(0, [pit], 0, 0)).toBeCloseTo(-2);
  });
});

describe('stamp order', () => {
  it('applies stamps in list order', () => {
    const f: Stamp = { op: 'flatten', x: 0, z: 0, inner: 0, outer: 10, to: 0 };
    const g: Stamp = { op: 'gauss', x: 0, z: 0, sigma: 2, amount: 2 };
    const flattenThenGauss = applyStamps(5, [f, g], 0, 0);
    const gaussThenFlatten = applyStamps(5, [g, f], 0, 0);
    expect(flattenThenGauss).toBeCloseTo(2);
    expect(gaussThenFlatten).toBeCloseTo(0);
    expect(flattenThenGauss).not.toBe(gaussThenFlatten);
  });
});

describe('stampBounds', () => {
  it('covers the outer radius of a flatten stamp', () => {
    expect(stampBounds({ op: 'flatten', x: 3, z: -2, inner: 1, outer: 4, to: 0 })).toEqual({
      minX: -1,
      maxX: 7,
      minZ: -6,
      maxZ: 2,
    });
  });

  it('covers 4 * sigma for a gauss stamp', () => {
    expect(stampBounds({ op: 'gauss', x: 3, z: -2, sigma: 1.5, amount: 1 })).toEqual({
      minX: -3,
      maxX: 9,
      minZ: -8,
      maxZ: 4,
    });
  });

  it('contains every point the stamp can change', () => {
    const s: Stamp = { op: 'gauss', x: 3, z: -2, sigma: 1.5, amount: 1 };
    const b = stampBounds(s);
    for (let x = b.minX - 2; x <= b.maxX + 2; x += 0.5) {
      for (let z = b.minZ - 2; z <= b.maxZ + 2; z += 0.5) {
        const inside = x >= b.minX && x <= b.maxX && z >= b.minZ && z <= b.maxZ;
        if (!inside) expect(applyStamps(0, [s], x, z)).toBe(0);
      }
    }
  });
});
