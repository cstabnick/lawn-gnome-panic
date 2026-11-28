import * as THREE from 'three';
import { beforeAll, describe, expect, it } from 'vitest';
import { installFakeDom } from '../testing/fakeDom';
import { buildSlopeLife } from './slopeLife';

describe('slope life', () => {
  beforeAll(() => { installFakeDom(); });

  it('builds and updates near and far without throwing; riders stay on the hill', () => {
    const root = new THREE.Group();
    const life = buildSlopeLife(root);
    let seen = 0;
    for (let i = 0; i < 3600; i++) {
      life.update(1 / 60, i / 60, i % 2 ? -400 : 2000, -1100);
      root.traverse((o) => {
        if (o.name !== 'slope-rider' || !o.visible) return;
        seen++;
        expect(o.position.x).toBeGreaterThanOrEqual(-460);
        expect(o.position.x).toBeLessThanOrEqual(-240);
        expect(o.position.z).toBeGreaterThanOrEqual(-1350);
        expect(o.position.z).toBeLessThanOrEqual(-1000);
      });
    }
    life.update(0.1, 1, 5000, 5000);
    expect(seen).toBeGreaterThan(0);
  });
});
