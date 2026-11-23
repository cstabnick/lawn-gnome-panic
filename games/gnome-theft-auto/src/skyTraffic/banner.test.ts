import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { createBanner } from './banner';
import { SKY } from './config';

describe('createBanner', () => {
  it('is hit by a bullet inside the cloth, misses beside it, and stops being hit once torn', () => {
    const scene = new THREE.Scene();
    const banner = createBanner(scene);
    banner.update(0.1, 0, 100, 0, 0, 30, 0, true);

    expect(banner.hitTest(0, 100 - SKY.bannerDrop - 2, -SKY.ropeLength - 10)).toBe(true);
    expect(banner.hits).toBe(1);
    expect(banner.hitTest(0, 100, 30)).toBe(false);
    expect(banner.hits).toBe(1);

    banner.tearLoose();
    expect(banner.torn).toBe(true);
    expect(banner.hitTest(0, 100 - SKY.bannerDrop - 2, -SKY.ropeLength - 10)).toBe(false);

    banner.dispose();
  });

  it('centres the cloth behind the tow point', () => {
    const scene = new THREE.Scene();
    const banner = createBanner(scene);
    banner.update(0.1, 0, 100, 0, 0, 30, 0, true);

    const c = banner.centre(new THREE.Vector3());
    expect(c.z).toBeCloseTo(-SKY.ropeLength - SKY.bannerLength / 2, 3);
    expect(c.x).toBeCloseTo(0, 6);

    banner.dispose();
  });
});
