import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { installFakeDom } from '../testing/fakeDom';
import { buildLockupMarking } from './marking';

// The Side-Valve Lock-Up's building box (world.ts / the Salvage footprint): no marking collider may sit inside it.
const BUILDING = { minX: -162, maxX: -138, minZ: 78, maxZ: 102 };

describe('lockup marking', () => {
  let restore: () => void = () => {};
  beforeAll(() => { restore = installFakeDom(); });
  afterAll(() => restore());

  it('builds without throwing and returns at most 2 boxes outside the building', () => {
    const boxes = buildLockupMarking(new THREE.Scene());
    expect(boxes.length).toBeLessThanOrEqual(2);
    for (const b of boxes) {
      const inside = b.maxX > BUILDING.minX && b.minX < BUILDING.maxX && b.maxZ > BUILDING.minZ && b.minZ < BUILDING.maxZ;
      expect(inside).toBe(false);
    }
  });
});
