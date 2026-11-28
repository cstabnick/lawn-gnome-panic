import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { UNMOWN_HIDES } from '../living/config';
import type { Box } from '../types';
import { buildUnmownHides } from './hides';

describe('Unmown hides', () => {
  const boxes: Box[] = [];
  const scene = new THREE.Scene();
  it('builds under node without throwing', () => {
    expect(() => buildUnmownHides(scene, boxes)).not.toThrow();
    expect(scene.children.length).toBeGreaterThan(0);
  });
  it.each(UNMOWN_HIDES.map((h) => [h.name, h] as const))('%s: centre is free and walls surround it', (_n, h) => {
    const inside = (b: Box, x: number, z: number) => x >= b.minX && x <= b.maxX && z >= b.minZ && z <= b.maxZ;
    expect(boxes.some((b) => inside(b, h.x, h.z))).toBe(false);
    const near = boxes.filter((b) => Math.hypot((b.minX + b.maxX) / 2 - h.x, (b.minZ + b.maxZ) / 2 - h.z) < 4);
    expect(near.length).toBeGreaterThanOrEqual(3);
  });
});
