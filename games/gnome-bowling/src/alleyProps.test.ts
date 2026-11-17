import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { ALLEY_PROPS, buildAlleyProps } from './alleyProps';
import { buildPinModel } from './pins';

describe('alleyProps', () => {
  it('builds every alley prop from @lawn/prefabs inside room bounds and clear of the main approach', () => {
    const root = new THREE.Group();
    buildAlleyProps(root);
    expect(root.children.length).toBe(ALLEY_PROPS.length);

    for (const p of ALLEY_PROPS) {
      expect(p.x).toBeGreaterThanOrEqual(-8);
      expect(p.x).toBeLessThanOrEqual(8);
      expect(p.z).toBeGreaterThanOrEqual(-12);
      expect(p.z).toBeLessThanOrEqual(0);
      // Keep the playable lane's approach (x in [-0.75, 0.75], z in [-4.6, 0]) clear at floor level.
      if ((p.y ?? 0) < 2) {
        const onMainApproach = Math.abs(p.x) < 0.75 && p.z > -4.6 && p.z <= 0;
        expect(onMainApproach, `${p.id} at (${p.x}, ${p.z})`).toBe(false);
      }
    }
  });

  it('builds pins from the shared bowling-pin prefab', () => {
    const pin = buildPinModel();
    expect(pin.userData.prefab).toBe('bowling-pin');
    const box = new THREE.Box3().setFromObject(pin);
    expect(box.min.y).toBeGreaterThan(-0.02);
    expect(box.min.y).toBeLessThan(0.02);
    expect(box.max.y).toBeGreaterThan(0.35);
  });
});
