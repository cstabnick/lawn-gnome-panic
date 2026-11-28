import * as THREE from 'three';
import { beforeAll, describe, expect, it } from 'vitest';
import { installFakeDom } from '../testing/fakeDom';
import type { Box } from '../types';
import { buildCampusStory } from './story';
import { CAMPUS, CAMPUS_BUILDINGS } from './types';

const inside = (b: Box, x: number, z: number): boolean => x >= b.minX && x <= b.maxX && z >= b.minZ && z <= b.maxZ;

describe('Rootwell story', () => {
  const boxes: Box[] = [];
  const scene = new THREE.Scene();
  beforeAll(() => {
    installFakeDom();
    buildCampusStory(scene, boxes);
  });

  it('keeps every collider on the campus', () => {
    const s = CAMPUS.site;
    for (const b of boxes) {
      expect(b.minX).toBeGreaterThanOrEqual(s.minX);
      expect(b.maxX).toBeLessThanOrEqual(s.maxX);
      expect(b.minZ).toBeGreaterThanOrEqual(s.minZ);
      expect(b.maxZ).toBeLessThanOrEqual(s.maxZ);
    }
  });

  it('keeps colliders off the doors, the buildings and the quad', () => {
    for (const b of boxes) {
      for (const d of CAMPUS_BUILDINGS) {
        const near = Math.max(b.minX - d.door.x, d.door.x - b.maxX, b.minZ - d.door.z, d.door.z - b.maxZ, 0);
        expect(near, `${d.id} door`).toBeGreaterThanOrEqual(2.5);
        const side = d.yaw === 0 || Math.abs(d.yaw) === Math.PI;
        const hx = (side ? d.w : d.d) / 2, hz = (side ? d.d : d.w) / 2;
        const overlap = b.minX < d.x + hx && b.maxX > d.x - hx && b.minZ < d.z + hz && b.maxZ > d.z - hz;
        expect(overlap, `${d.id} footprint`).toBe(false);
      }
      const q = CAMPUS.quad;
      expect(b.minX < q.maxX && b.maxX > q.minX && b.minZ < q.maxZ && b.maxZ > q.minZ, 'quad').toBe(false);
    }
  });

  it('keeps a 3 m circle round the sugar store clear', () => {
    const { x, z } = CAMPUS.sugarStore;
    for (const b of boxes) {
      const dx = Math.max(b.minX - x, x - b.maxX, 0), dz = Math.max(b.minZ - z, z - b.maxZ, 0);
      expect(Math.hypot(dx, dz)).toBeGreaterThanOrEqual(3);
      expect(inside(b, x, z)).toBe(false);
    }
  });

  it('has a dozen signs and posters', () => {
    const group = scene.getObjectByName('rootwell-story');
    expect(group).toBeDefined();
    const plates: THREE.Object3D[] = [];
    group!.traverse((o) => { if (o.name === 'home-plate') plates.push(o); });
    expect(plates.length).toBeGreaterThanOrEqual(12);
  });
});
