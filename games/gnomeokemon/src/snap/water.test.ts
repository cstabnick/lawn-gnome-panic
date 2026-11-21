import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { isInTube } from './water';

const curve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0, 1, 0),
  new THREE.Vector3(0, 1, 10),
]);

describe('isInTube', () => {
  it('is true for a point on the rail inside the range', () => {
    expect(isInTube(new THREE.Vector3(0, 1, 5), curve, [0, 1])).toBe(true);
  });

  it('is false for a point well off the rail', () => {
    expect(isInTube(new THREE.Vector3(3, 1, 5), curve, [0, 1])).toBe(false);
  });

  it('is false for an empty [0, 0] range', () => {
    expect(isInTube(new THREE.Vector3(0, 1, 5), curve, [0, 0])).toBe(false);
  });
});
