import * as THREE from 'three';
import { beforeAll, describe, expect, it } from 'vitest';
import { installFakeDom } from '../testing/fakeDom';
import { buildSkateLife } from './life';
import { SKATE_ORIGIN, SKATE_SITE } from './types';

describe('Gutter Bowls life', () => {
  beforeAll(() => { installFakeDom(); });

  const build = () => {
    const scene = new THREE.Scene();
    return { scene, life: buildSkateLife(scene) };
  };

  it('has colliders inside the site', () => {
    const { life } = build();
    expect(life.boxes.length).toBeGreaterThan(0);
    for (const b of life.boxes) {
      expect(b.minX).toBeGreaterThanOrEqual(SKATE_SITE.minX);
      expect(b.maxX).toBeLessThanOrEqual(SKATE_SITE.maxX);
      expect(b.minZ).toBeGreaterThanOrEqual(SKATE_SITE.minZ);
      expect(b.maxZ).toBeLessThanOrEqual(SKATE_SITE.maxZ);
    }
  });

  it('keeps colliders off the Long Gutter trough and the kicker-to-rail line', () => {
    const { life } = build();
    const hits = (b: { minX: number; maxX: number; minZ: number; maxZ: number }, u0: number, u1: number, v0: number, v1: number) =>
      b.maxX - SKATE_ORIGIN.x > u0 && b.minX - SKATE_ORIGIN.x < u1 && b.maxZ - SKATE_ORIGIN.z > v0 && b.minZ - SKATE_ORIGIN.z < v1;
    for (const b of life.boxes) {
      expect(hits(b, -16, 12, 8, 16), 'trough').toBe(false);
      expect(hits(b, -2, 12, -1.5, 1.5), 'kicker line').toBe(false);
    }
  });

  it('survives a long update loop near and far, riding or not', () => {
    const { life } = build();
    let t = 0;
    for (let i = 0; i < 3000; i++) {
      t += 0.05;
      life.update(0.05, t, SKATE_ORIGIN.x + 5, SKATE_ORIGIN.z + 2, i % 400 > 200);
    }
    for (let i = 0; i < 100; i++) {
      t += 0.05;
      life.update(0.05, t, 900, 900, false);
    }
  });
});
