import { describe, expect, it, vi } from 'vitest';
import type { Vehicle } from '../types';
import { crashKind, hornFor, loopKindFor, wrapAngle } from './watchVehicles';

// bus.ts -> audio.ts touches `window` at import time; the pure helpers under test need none of it.
vi.hoisted(() => {
  if (typeof window === 'undefined') Object.assign(globalThis, { window: { addEventListener() {} } });
});

describe('watchVehicles helpers', () => {
  it('wrapAngle folds angles into -PI..PI', () => {
    expect(wrapAngle(0)).toBeCloseTo(0, 9);
    expect(wrapAngle(Math.PI + 0.1)).toBeCloseTo(-Math.PI + 0.1, 9);
    expect(wrapAngle(-Math.PI - 0.1)).toBeCloseTo(Math.PI - 0.1, 9);
    // +PI and -PI are the same heading; either end of the range is fine.
    expect(Math.abs(wrapAngle(5 * Math.PI))).toBeCloseTo(Math.PI, 9);
    expect(Math.abs(wrapAngle(3 * Math.PI))).toBeCloseTo(Math.PI, 9);
  });

  it('crashKind separates heavy, light and no crash', () => {
    expect(crashKind(20, 2, 1 / 60)).toBe('crash-heavy');
    expect(crashKind(8, 0, 1 / 60)).toBe('crash-light');
    expect(crashKind(20, 19, 1 / 60)).toBeNull();
    expect(crashKind(3, 0, 1 / 60)).toBeNull();
    expect(crashKind(20, 2, 0)).toBeNull();
  });

  it('hornFor picks the horn by kind', () => {
    expect(hornFor('push-bike', false)).toBe('horn-bike');
    expect(hornFor('walnut-dinghy', true)).toBe('horn-boat');
    expect(hornFor('hoa-patrol-boat', true)).toBe('horn-boat');
    expect(hornFor('combine', false)).toBe('horn-truck');
    expect(hornFor('snail-coach', false)).toBe('horn-truck');
    expect(hornFor('hoa-van', false)).toBe('horn-hoa');
    expect(hornFor('lowrider', false)).toBe('horn-car');
  });

  it('loopKindFor maps vehicles to engine loops and skips push bikes and Tessie', () => {
    const v = (kind: string, spec: Partial<Vehicle['spec']>) =>
      ({ kind, spec: { maxSpeed: 10, flies: false, ...spec } }) as unknown as Pick<Vehicle, 'kind' | 'spec'>;
    expect(loopKindFor(v('plane', { flies: true }))).toBe('propeller');
    expect(loopKindFor(v('walnut-dinghy', { boat: true }))).toBe('boat-motor');
    expect(loopKindFor(v('combine', {}))).toBe('engine-heavy');
    expect(loopKindFor(v('lowrider', {}))).toBe('engine');
    expect(loopKindFor(v('push-bike', {}))).toBeNull();
    expect(loopKindFor(v('tessie', { boat: true }))).toBeNull();
  });
});
