// The Burrow Door on the surface (B7): built into a fresh scene; colliders stay in the site; the door, exit and
// Nubbin spots are free of colliders.
import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import type { Box } from '../../types';
import { BURROW_DOOR } from '../config';
import { buildBurrowDoor } from './door';

function build(): { scene: THREE.Scene; boxes: Box[] } {
  const scene = new THREE.Scene();
  const boxes: Box[] = [];
  buildBurrowDoor(scene, boxes);
  return { scene, boxes };
}

const inside = (b: Box, x: number, z: number): boolean => x >= b.minX && x <= b.maxX && z >= b.minZ && z <= b.maxZ;

describe('buildBurrowDoor', () => {
  it('adds scenery to a fresh scene and pushes at least the mound collider', () => {
    const { scene, boxes } = build();
    expect(scene.children.length).toBeGreaterThan(0);
    expect(boxes.length).toBeGreaterThanOrEqual(1);
  });

  it('keeps every collider inside the site', () => {
    const { boxes } = build();
    const s = BURROW_DOOR.site;
    for (const b of boxes) {
      expect(b.minX).toBeGreaterThanOrEqual(s.minX);
      expect(b.maxX).toBeLessThanOrEqual(s.maxX);
      expect(b.minZ).toBeGreaterThanOrEqual(s.minZ);
      expect(b.maxZ).toBeLessThanOrEqual(s.maxZ);
    }
  });

  it('leaves the door, exit and Nubbin spots free of colliders', () => {
    const { boxes } = build();
    for (const p of [BURROW_DOOR.door, BURROW_DOOR.exit, BURROW_DOOR.nubbin]) {
      for (const b of boxes) expect(inside(b, p.x, p.z)).toBe(false);
    }
  });
});
