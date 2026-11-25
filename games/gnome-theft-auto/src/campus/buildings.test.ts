import * as THREE from 'three';
import { beforeAll, describe, expect, it } from 'vitest';
import { homeOf } from '../homes/data';
import { installFakeDom } from '../testing/fakeDom';
import type { Box } from '../types';
import { buildCampusBuildings, buildingFootprint } from './buildings';
import { CAMPUS, CAMPUS_BUILDINGS } from './types';

const DRIVE = { minX: 946, maxX: 1080, minZ: -204, maxZ: -196 };
const overlaps = (a: Box, r: { minX: number; maxX: number; minZ: number; maxZ: number }): boolean =>
  a.minX < r.maxX && a.maxX > r.minX && a.minZ < r.maxZ && a.maxZ > r.minZ;
const contains = (b: Box, x: number, z: number, m = 0): boolean =>
  x >= b.minX - m && x <= b.maxX + m && z >= b.minZ - m && z <= b.maxZ + m;

describe('Rootwell buildings', () => {
  beforeAll(() => { installFakeDom(); });

  it('makes fourteen colliders (twelve buildings and the two grandstands), all on the campus', () => {
    const boxes: Box[] = [];
    buildCampusBuildings(new THREE.Scene(), boxes);
    expect(boxes).toHaveLength(14);
    for (const b of boxes) {
      expect(b.minX).toBeGreaterThanOrEqual(CAMPUS.site.minX);
      expect(b.maxX).toBeLessThanOrEqual(CAMPUS.site.maxX);
      expect(b.minZ).toBeGreaterThanOrEqual(CAMPUS.site.minZ);
      expect(b.maxZ).toBeLessThanOrEqual(CAMPUS.site.maxZ);
    }
  });

  it('keeps colliders off the quad, the drive and each other', () => {
    const boxes: Box[] = [];
    buildCampusBuildings(new THREE.Scene(), boxes);
    boxes.forEach((b, i) => {
      expect(overlaps(b, CAMPUS.quad), `collider ${i} on the quad`).toBe(false);
      expect(overlaps(b, DRIVE), `collider ${i} on the drive`).toBe(false);
      boxes.forEach((o, j) => {
        if (j > i) expect(overlaps(b, o), `colliders ${i} and ${j} overlap`).toBe(false);
      });
    });
  });

  it('leaves every front door outside the colliders', () => {
    const boxes: Box[] = [];
    buildCampusBuildings(new THREE.Scene(), boxes);
    for (const b of CAMPUS_BUILDINGS) {
      for (const box of boxes) {
        expect(contains(box, b.door.x, b.door.z, 0.6), `${b.id} door blocked`).toBe(false);
      }
    }
  });

  it('turns the footprint for a building facing east or west', () => {
    const trencher = CAMPUS_BUILDINGS.find((b) => b.id === 'trencher')!;
    expect(buildingFootprint(trencher)).toEqual({ minX: 1233, maxX: 1257, minZ: -230, maxZ: -200 });
  });

  it('registers the Dean\'s door at his lodge', () => {
    buildCampusBuildings(new THREE.Scene(), []);
    expect(homeOf('lovage')!.door).not.toBeNull();
  });
});
