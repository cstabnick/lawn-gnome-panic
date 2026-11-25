import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import type { Box } from '../types';
import { STATION } from '../living/config';
import { interiorById } from '../interiors/registry';
import { buildRangerStation } from './station';

describe('ranger station', () => {
  it('builds without throwing, adds colliders on the site, defines its interior', () => {
    const scene = new THREE.Scene();
    const boxes: Box[] = [];
    expect(() => buildRangerStation(scene, boxes)).not.toThrow();
    expect(boxes.length).toBeGreaterThanOrEqual(5);
    for (const b of boxes) {
      expect(b.minX).toBeGreaterThanOrEqual(STATION.x - STATION.hw - 6);
      expect(b.maxX).toBeLessThanOrEqual(STATION.x + STATION.hw + 6);
      expect(b.minZ).toBeGreaterThanOrEqual(STATION.z - STATION.hd - 6);
      expect(b.maxZ).toBeLessThanOrEqual(STATION.z + STATION.hd + 6);
    }
    expect(interiorById('unmown-ranger-station')).toBeDefined();
  });
});
