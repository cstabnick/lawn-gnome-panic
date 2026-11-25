import { describe, expect, it } from 'vitest';
import { findShowcaseSite } from './showcase';

describe('findShowcaseSite', () => {
  const flat = () => 0;
  it('returns near on empty flat ground', () => {
    expect(findShowcaseSite([], flat, { x: 5, z: 7 })).toEqual({ x: 5, z: 7 });
  });
  it('moves off a box covering near', () => {
    const s = findShowcaseSite([{ minX: -2, maxX: 2, minZ: -2, maxZ: 2, h: 3 }], flat, { x: 0, z: 0 });
    expect(s).not.toEqual({ x: 0, z: 0 });
  });
});
