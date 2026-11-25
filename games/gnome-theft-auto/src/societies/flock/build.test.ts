import * as THREE from 'three';
import { beforeAll, describe, expect, it } from 'vitest';
import { installFakeDom } from '../../testing/fakeDom';
import type { Box } from '../../types';
import { WADERS_REST } from '../config';
import { buildWadersRest, planWadersRest } from './build';

const inside = (b: Box, x: number, z: number, r: number): boolean =>
  x + r >= b.minX && x - r <= b.maxX && z + r >= b.minZ && z - r <= b.maxZ;

describe("Wader's Rest scenery", () => {
  const boxes: Box[] = [];
  const scene = new THREE.Scene();
  beforeAll(() => {
    installFakeDom();
    buildWadersRest(scene, boxes);
  });

  it('builds the batch and the signs into the scene', () => {
    expect(scene.getObjectByName('waders-rest')).toBeDefined();
    expect(scene.getObjectByName('waders-rest-signs')).toBeDefined();
  });

  it('keeps every collider inside the site', () => {
    const s = WADERS_REST.site;
    expect(boxes.length).toBeGreaterThan(0);
    for (const b of boxes) {
      expect(b.minX).toBeGreaterThanOrEqual(s.minX);
      expect(b.maxX).toBeLessThanOrEqual(s.maxX);
      expect(b.minZ).toBeGreaterThanOrEqual(s.minZ);
      expect(b.maxZ).toBeLessThanOrEqual(s.maxZ);
    }
  });

  it('leaves the tent door, the saxifrage spot, the circle and the gate clear', () => {
    const { tentDoor, saxifrage, circle, gate } = WADERS_REST;
    for (const b of boxes) {
      expect(inside(b, tentDoor.x, tentDoor.z, 1), 'tent door').toBe(false);
      expect(inside(b, saxifrage.x, saxifrage.z, 0), 'saxifrage').toBe(false);
      expect(inside(b, circle.x, circle.z, 0), 'circle').toBe(false);
      expect(inside(b, gate.x, gate.z, 0.8), 'gate').toBe(false);
    }
  });

  it('places enough tents and stones', () => {
    const plan = planWadersRest();
    expect(plan.filter((p) => p.id === 'flock-tent').length).toBeGreaterThanOrEqual(6);
    expect(plan.filter((p) => p.id === 'one-leg-stone').length).toBe(12);
  });

  it('keeps every placement inside the site', () => {
    const s = WADERS_REST.site;
    for (const p of planWadersRest()) {
      expect(p.x, p.id).toBeGreaterThanOrEqual(s.minX);
      expect(p.x, p.id).toBeLessThanOrEqual(s.maxX);
      expect(p.z, p.id).toBeGreaterThanOrEqual(s.minZ);
      expect(p.z, p.id).toBeLessThanOrEqual(s.maxZ);
    }
  });
});
