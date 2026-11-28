import { describe, expect, it } from 'vitest';
import { FRINGE, TEE_HALF, distToPath, featureLie, holeLength, type HoleDef } from './index';

const hole: HoleDef = {
  par: 4,
  tee: { x: 0, z: 0 },
  path: [{ x: 0, z: 0 }, { x: 0, z: 200 }],
  fairwayWidth: 30,
  fairwayStart: 20,
  green: { x: 0, z: 200, r: 10, slopeX: 0, slopeZ: 0 },
  pin: { x: 0, z: 200 },
  bunkers: [{ x: 40, z: 100, r: 8 }],
  ponds: [{ x: -60, z: 100, r: 12 }],
};

describe('featureLie', () => {
  const at = (x: number, z: number) => featureLie([hole], x, z);
  it('picks each lie', () => {
    expect(at(0, 200)).toBe('green');
    expect(at(40, 100)).toBe('sand');
    expect(at(0, 200 + 10 + FRINGE - 0.5)).toBe('fringe');
    expect(at(TEE_HALF - 1, 0)).toBe('tee');
    expect(at(5, 100)).toBe('fairway');
    expect(at(-60, 100)).toBe('water');
    expect(at(100, 100)).toBe('rough');
  });
  it('the first yards past the tee are rough, not fairway', () => {
    expect(at(0, 10)).toBe('rough');
  });
  it('measures along the path', () => {
    expect(holeLength(hole)).toBe(200);
    expect(distToPath(hole, 7, 50)).toEqual({ dist: 7, along: 50 });
  });
});
