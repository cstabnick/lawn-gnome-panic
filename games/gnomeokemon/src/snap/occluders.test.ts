import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { buildSightBlockers } from './occluders';

describe('buildSightBlockers', () => {
  it('names every block hedge or wall and keeps them clear of the rail', () => {
    const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 40)]);
    const scene = new THREE.Scene();
    const blocks = buildSightBlockers(scene, curve);
    expect(blocks.length).toBeGreaterThan(0);
    const points: THREE.Vector3[] = [];
    for (let i = 0; i <= 400; i++) points.push(curve.getPointAt(i / 400));
    for (const block of blocks) {
      expect(['hedge', 'wall']).toContain(block.name);
      const nearest = Math.min(...points.map((p) => p.distanceTo(block.position)));
      expect(nearest).toBeGreaterThanOrEqual(2.2);
    }
  });

  it('keeps the lawn path open: no cross-wall centre is within 2.2 of the rail', () => {
    // Same 7 points as createLawnCurve in world.ts.
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 18),
      new THREE.Vector3(-4.5, 0.3, 11),
      new THREE.Vector3(-1.5, 0.9, 2),
      new THREE.Vector3(5.2, 1.6, -6),
      new THREE.Vector3(2.0, 1.2, -15),
      new THREE.Vector3(-5.2, 1.4, -22),
      new THREE.Vector3(0, 0, -29),
    ]);
    const points: THREE.Vector3[] = [];
    for (let i = 0; i <= 400; i++) points.push(curve.getPointAt(i / 400));
    const walls = buildSightBlockers(new THREE.Scene(), curve).filter((b) => b.name === 'wall');
    expect(walls.length).toBeGreaterThan(0);

    let minDistance = Infinity;
    for (const wall of walls) {
      const nearest = Math.min(...points.map((p) => p.distanceTo(wall.position)));
      minDistance = Math.min(minDistance, nearest);
      expect(nearest).toBeGreaterThanOrEqual(2.2);
    }
    console.log(`closest cross-wall centre to the rail: ${minDistance.toFixed(3)}`);
  });
});
