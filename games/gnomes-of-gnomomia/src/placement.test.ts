import { describe, expect, it } from 'vitest';
import type { MarkerDef } from '@lawn/level';
import type { WorldObjectSpec } from './config';
import { OBJECTS, ZONES } from './content';
import { ORIGINS } from './data/layout';
import { resolveObject } from './placement';

const spec = (over: Partial<WorldObjectSpec> = {}): WorldObjectSpec => ({
  id: 'test-obj', zone: 'verge', name: 'Test', model: 'chest', verb: 'Open', examine: 'x', ...over,
});
const marker = (data: Record<string, unknown> | undefined, over: Partial<MarkerDef> = {}): MarkerDef => ({
  id: 'test-obj', kind: 'object', x: 3, z: -4, data: data as MarkerDef['data'], ...over,
});

describe('resolveObject', () => {
  it('uses the spec position when there is no marker', () => {
    const { def, errors } = resolveObject(spec({ x: 5, z: 6 }), 'verge');
    expect(errors).toEqual([]);
    expect(def.x).toBe(5);
    expect(def.z).toBe(6);
  });

  it('a marker overrides x and z, rot.y becomes yaw, a uniform scale vector becomes a number', () => {
    const { def, errors } = resolveObject(
      spec({ x: 1, z: 1 }), 'verge',
      marker({ v: 1, rot: { y: 0.5 }, scale: { x: 2, y: 2, z: 2 } }),
    );
    expect(errors).toEqual([]);
    expect(def.x).toBe(3);
    expect(def.z).toBe(-4);
    expect(def.yaw).toBe(0.5);
    expect(def.scale).toBe(2);
  });

  it('reports a marker for another zone', () => {
    const { errors } = resolveObject(spec(), 'keep', marker({ v: 1 }));
    expect(errors.some((e) => e.includes('wrong zone'))).toBe(true);
  });

  it('rejects an unsupported version and applies nothing', () => {
    const { def, errors } = resolveObject(spec({ x: 1, z: 1 }), 'verge', marker({ v: 2 }));
    expect(errors.length).toBeGreaterThan(0);
    expect(def.x).toBe(1);
  });

  it('rejects rot.x, anchor, non-uniform scale and NaN', () => {
    expect(resolveObject(spec(), 'verge', marker({ v: 1, rot: { x: 0.3 } })).errors).toContain('rot x/z not supported yet');
    expect(resolveObject(spec(), 'verge', marker({ v: 1, anchor: 'x' })).errors).toContain('anchor not supported yet');
    expect(resolveObject(spec(), 'verge', marker({ v: 1, scale: { x: 1, y: 2, z: 1 } })).errors).toContain('non-uniform scale not supported yet');
    expect(resolveObject(spec(), 'verge', marker({ v: 1 }, { x: Number.NaN })).errors.length).toBeGreaterThan(0);
  });

  it('ignores unknown data keys', () => {
    expect(resolveObject(spec(), 'verge', marker({ v: 1, tint: '#ff0000' })).errors).toEqual([]);
  });

  it('reports a spec with no position and no marker', () => {
    const { errors } = resolveObject(spec(), 'verge');
    expect(errors.length).toBeGreaterThan(0);
  });

  it('reports a generated id (with #) that has a marker', () => {
    const { errors } = resolveObject(spec({ id: 'house#1' }), 'verge', marker({ v: 1 }, { id: 'house#1' }));
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('verge object markers in the loaded world', () => {
  // Zone-local positions the s13 pack used before the move to level markers: (-58, -10) for the seat.
  it('s13-cart-seat keeps its zone-local (-58, -10) after the marker move', () => {
    const seat = OBJECTS['s13-cart-seat']!;
    const o = ZONES.verge.origin ?? ORIGINS.verge;
    expect(seat.x - o.x).toBeCloseTo(-58, 6);
    expect(seat.z - o.z).toBeCloseTo(-10, 6);
  });
});
