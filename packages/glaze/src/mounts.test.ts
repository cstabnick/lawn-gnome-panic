// deriveMounts / getMounts / defineMounts against real built prefabs. Run: npx vitest run packages/glaze/src/mounts.test.ts
import { buildPrefab } from '@lawn/prefabs';
import { describe, expect, it } from 'vitest';
import { defineMounts, deriveMounts, getMounts } from './mounts';
import type { DecalPanel } from './types';

function finite(v: readonly number[]): boolean {
  return v.every((n) => Number.isFinite(n));
}

function panelsFinite(panels: readonly DecalPanel[]): boolean {
  return panels.every((p) => finite(p.at) && finite(p.size) && finite(p.rot));
}

describe('deriveMounts', () => {
  it('gives the same prefab-local numbers at any root scale', () => {
    const big = deriveMounts(buildPrefab('ride-on-mower', { scale: 1.5 }));
    const unit = deriveMounts(buildPrefab('ride-on-mower', { scale: 1 }));
    expect(big.width).toBeCloseTo(unit.width, 6);
    expect(big.length).toBeCloseTo(unit.length, 6);
    expect(big.height).toBeCloseTo(unit.height, 6);
    expect(big.wheels.length).toBe(unit.wheels.length);
    for (let i = 0; i < unit.wheels.length; i++) {
      const a = big.wheels[i];
      const b = unit.wheels[i];
      expect(a.at[0]).toBeCloseTo(b.at[0], 6);
      expect(a.at[1]).toBeCloseTo(b.at[1], 6);
      expect(a.at[2]).toBeCloseTo(b.at[2], 6);
    }
    expect(big.points.hood?.[2]).toBeCloseTo(unit.points.hood?.[2] ?? NaN, 6);
  });

  it('finds the four wheels and the steer pivot on the mower', () => {
    const m = deriveMounts(buildPrefab('ride-on-mower', { scale: 1 }));
    expect(m.wheels.map((w) => w.index)).toEqual([0, 1, 2, 3]);
    expect(m.wheels.map((w) => w.front)).toEqual([false, false, true, true]);
    expect(m.wheels[0].side).toBe(-1);
    expect(m.wheels[0].pivot).toBe('wheel-0');
    expect(m.steer).not.toBeNull();
    expect(m.steer?.pivot).toBe('steer');
  });

  it('gives a sensible width (the deck is 1.2 wide; the wheel tyres widen the box to about 1.4)', () => {
    const m = deriveMounts(buildPrefab('ride-on-mower', { scale: 1 }));
    expect(m.width).toBeGreaterThan(1.1);
    expect(m.width).toBeLessThan(1.5);
  });

  it('has finite panels and mirrored lamps', () => {
    const m = deriveMounts(buildPrefab('ride-on-mower', { scale: 1 }));
    expect(panelsFinite(m.panels)).toBe(true);
    expect(m.panels.length).toBe(4);
    expect(m.lamps).not.toBeNull();
    const lamps = m.lamps!;
    expect(lamps[0][0]).toBe(-lamps[1][0]);
    expect(lamps[0][1]).toBe(lamps[1][1]);
    expect(lamps[0][2]).toBe(lamps[1][2]);
  });

  it('handles a prefab with no pivots: no wheels, no steer, no NaN', () => {
    const body = buildPrefab('sandbag-wall', { scale: 1 });
    const m = deriveMounts(body);
    expect(m.wheels).toEqual([]);
    expect(m.steer).toBeNull();
    expect(finite([m.width, m.length, m.height])).toBe(true);
    expect(panelsFinite(m.panels)).toBe(true);
    for (const p of Object.values(m.points)) {
      expect(p && finite(p)).toBe(true);
    }
  });
});

describe('getMounts / defineMounts', () => {
  it('lets a game override a field, then restores the derived value when the override is cleared', () => {
    const body = buildPrefab('ride-on-mower', { scale: 1 });
    const derived = deriveMounts(body);

    defineMounts('ride-on-mower', { lamps: null });
    const overridden = getMounts('ride-on-mower', body);
    expect(overridden.lamps).toBeNull();
    expect(overridden.width).toBeCloseTo(derived.width, 6);

    defineMounts('ride-on-mower', {});
    const restored = getMounts('ride-on-mower', body);
    expect(restored.lamps).not.toBeNull();
    expect(restored.lamps).toEqual(derived.lamps);
  });
});
