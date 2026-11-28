import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { buildPailPond } from './pond';
import { heightAt } from '../terrain';
import { PAIL_POND, SHANTY, SNOWCAP_BEARS } from './types';

const dist = (b: { minX: number; maxX: number; minZ: number; maxZ: number }, x: number, z: number): number => {
  const dx = Math.max(b.minX - x, 0, x - b.maxX), dz = Math.max(b.minZ - z, 0, z - b.maxZ);
  return Math.hypot(dx, dz);
};

describe('Pail Pond scenery', () => {
  const pond = buildPailPond(new THREE.Scene());

  it('has colliders', () => {
    expect(pond.boxes.length).toBeGreaterThan(0);
  });

  it('keeps the pond centre and the shanty front clear', () => {
    for (const b of pond.boxes) {
      expect(dist(b, PAIL_POND.x, PAIL_POND.z)).toBeGreaterThanOrEqual(2);
      // the point 1.5 m west of Theo's shanty: nobody may be walled off from the door
      expect(dist(b, SHANTY.x - 1.5, SHANTY.z)).toBeGreaterThan(0.2);
    }
  });

  it('keeps 3 m round every pond bear', () => {
    for (const bear of SNOWCAP_BEARS.filter((s) => s.id.startsWith('pond-'))) {
      for (const b of pond.boxes) expect(dist(b, bear.x, bear.z)).toBeGreaterThanOrEqual(3);
    }
  });

  it('clusters the shanties within 20 m of Theo and keeps their footprints clear', () => {
    const shanties = pond.boxes.filter((b) => b.maxX - b.minX < 2.5 && Math.hypot((b.minX + b.maxX) / 2 - SHANTY.x, (b.minZ + b.maxZ) / 2 - SHANTY.z) < 40);
    expect(shanties.length).toBeGreaterThanOrEqual(3);
    for (const b of shanties) expect(Math.hypot((b.minX + b.maxX) / 2 - SHANTY.x, (b.minZ + b.maxZ) / 2 - SHANTY.z)).toBeLessThanOrEqual(20);
  });

  it('has a tall rim: at least 1 m above the ground at several points, with three crossings', () => {
    const scene = new THREE.Scene();
    buildPailPond(scene);
    scene.updateMatrixWorld(true);
    const rim = scene.getObjectByName('pail-rim')!;
    expect(rim).toBeTruthy();
    let tall = 0;
    for (const deg of [0, 45, 135, 180, 225, 270, 315]) {
      const a = (deg * Math.PI) / 180;
      const x = PAIL_POND.x + Math.cos(a) * (PAIL_POND.r + 0.6), z = PAIL_POND.z + Math.sin(a) * (PAIL_POND.r + 0.6);
      const ray = new THREE.Raycaster(new THREE.Vector3(x, 50, z), new THREE.Vector3(0, -1, 0));
      const hit = ray.intersectObject(rim, true)[0];
      if (hit && hit.point.y - heightAt(x, z) >= 1) tall++;
    }
    expect(tall).toBeGreaterThanOrEqual(5);
  });

  it('updates without throwing, near and far', () => {
    expect(() => pond.update(0.1, 1, -630, -1050)).not.toThrow();
    expect(() => pond.update(0.1, 11, 900, 900)).not.toThrow();
  });
});
