import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { installFakeDom } from '../testing/fakeDom';
installFakeDom();
const { placeRect, localToWorld, buildEstates } = await import('./estates');

const inside = (boxes: { minX: number; maxX: number; minZ: number; maxZ: number }[], x: number, z: number): boolean =>
  boxes.some((b) => x >= b.minX && x <= b.maxX && z >= b.minZ && z <= b.maxZ);

describe('placeRect', () => {
  it('moves the rect by (x, z) at yaw 0 and lifts h by baseY', () => {
    const b = placeRect({ minX: 1, maxX: 2, minZ: 3, maxZ: 5, h: 4 }, 10, 20, 0, 1);
    expect(b).toEqual({ minX: 11, maxX: 12, minZ: 23, maxZ: 25, h: 5 });
  });

  it('mirrors x and z at yaw PI', () => {
    const b = placeRect({ minX: 1, maxX: 2, minZ: 3, maxZ: 5, h: 0 }, 10, 20, Math.PI, 0);
    expect(b.minX).toBeCloseTo(8);
    expect(b.maxX).toBeCloseTo(9);
    expect(b.minZ).toBeCloseTo(15);
    expect(b.maxZ).toBeCloseTo(17);
  });

  it('swaps the axes at yaw PI/2', () => {
    const b = placeRect({ minX: 1, maxX: 2, minZ: 3, maxZ: 5, h: 0 }, 0, 0, Math.PI / 2, 0);
    expect(b.minX).toBeCloseTo(3);
    expect(b.maxX).toBeCloseTo(5);
    expect(b.minZ).toBeCloseTo(-2);
    expect(b.maxZ).toBeCloseTo(-1);
  });
});

describe('localToWorld', () => {
  it('turns a point about (x, z) by yaw', () => {
    const p = localToWorld(0, 1, 5, 5, Math.PI / 2);
    expect(p.x).toBeCloseTo(6);
    expect(p.z).toBeCloseTo(5);
  });
});

describe('buildEstates', () => {
  it('returns the 11 colliders and leaves the playable spots open', () => {
    const { boxes } = buildEstates(new THREE.Scene());
    expect(boxes).toHaveLength(11);
    for (const [x, z] of [
      [480, -70], // hangar site
      [480, -64], // hangar floor centre
      [-690, -559], // boathouse back-door shore
      [-690, -566], // slip
      [-690, -578], // open water in front
    ]) {
      expect(inside(boxes, x, z), `(${x}, ${z}) is blocked`).toBe(false);
    }
  });

  it('puts the hangar back wall near z -57', () => {
    const { boxes } = buildEstates(new THREE.Scene());
    const back = boxes.find((b) => b.minZ > -57.5 && b.maxZ < -56.5);
    expect(back).toBeDefined();
  });
});
