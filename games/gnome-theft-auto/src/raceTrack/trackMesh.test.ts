// The Speedway's flat surfaces: built into a scene, every surface is a named, polygon-offset mesh, and the road lies on
// the ground at its draw lift (heightAt + 0.03), following the terrain.
import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { installFakeDom } from '../testing/fakeDom';

installFakeDom();
const { buildTrackSurface } = await import('./trackMesh');
const { heightAt } = await import('../terrain');

const scene = new THREE.Scene();
buildTrackSurface(scene);
const meshes = scene.children.filter(
  (o): o is THREE.Mesh => o instanceof THREE.Mesh && o.name.startsWith('speedway-'),
);

describe('buildTrackSurface', () => {
  it('builds at least 6 speedway-* meshes', () => {
    expect(meshes.length).toBeGreaterThanOrEqual(6);
  });

  it('every surface is polygon-offset (draw layer)', () => {
    for (const m of meshes) {
      expect((m.material as THREE.Material).polygonOffset, m.name).toBe(true);
    }
  });

  it('the road sits on the ground at heightAt + 0.03', () => {
    const road = meshes.find((m) => m.name === 'speedway-road');
    expect(road).toBeDefined();
    const p = road!.geometry.getAttribute('position') as THREE.BufferAttribute;
    let worst = 0;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i);
      worst = Math.max(worst, Math.abs(p.getY(i) - (heightAt(x, z) + 0.03)));
    }
    expect(worst).toBeLessThan(0.2);
  });
});
