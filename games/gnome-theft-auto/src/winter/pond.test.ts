import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { buildPailPond } from './pond';
import { PAIL_POND, SHANTY, SNOWCAP_BEARS } from './types';

const dist = (b: { minX: number; maxX: number; minZ: number; maxZ: number }, x: number, z: number): number => {
  const dx = Math.max(b.minX - x, 0, x - b.maxX), dz = Math.max(b.minZ - z, 0, z - b.maxZ);
  return Math.hypot(dx, dz);
};

describe('Pail Pond scenery', () => {
  const pond = buildPailPond(new THREE.Scene());

  it('has colliders', () => {
    expect(pond.boxes.length).toBeGreaterThan(0);
  });

  it('keeps the pond centre and the shanty front clear', () => {
    for (const b of pond.boxes) {
      expect(dist(b, PAIL_POND.x, PAIL_POND.z)).toBeGreaterThanOrEqual(2);
      // the point 1.5 m west of Theo's shanty: nobody may be walled off from the door
      expect(dist(b, SHANTY.x - 1.5, SHANTY.z)).toBeGreaterThan(0.2);
    }
  });

  it('keeps 3 m round every pond bear', () => {
    for (const bear of SNOWCAP_BEARS.filter((s) => s.id.startsWith('pond-'))) {
      for (const b of pond.boxes) expect(dist(b, bear.x, bear.z)).toBeGreaterThanOrEqual(3);
    }
  });

  it('updates without throwing, near and far', () => {
    expect(() => pond.update(0.1, 1, -630, -1050)).not.toThrow();
    expect(() => pond.update(0.1, 11, 900, 900)).not.toThrow();
  });
});
