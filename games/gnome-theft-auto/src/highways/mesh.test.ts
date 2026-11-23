import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { buildSkywayMeshes } from './mesh';

describe('skyway meshes', () => {
  const group = buildSkywayMeshes();

  it('builds a named group with meshes in it', () => {
    expect(group.name).toBe('skyways');
    expect(group.children.length).toBeGreaterThan(0);
  });

  it('every mesh has finite positions', () => {
    let meshes = 0;
    group.traverse((o) => {
      if (!(o instanceof THREE.Mesh)) return;
      meshes++;
      const pos = o.geometry.getAttribute('position');
      expect(pos).toBeDefined();
      for (const v of pos.array) expect(Number.isNaN(v)).toBe(false);
    });
    expect(meshes).toBeGreaterThan(0);
  });

  it('the deck top faces up', () => {
    const deck = group.getObjectByName('turfton-skyway-deck') as THREE.Mesh;
    expect(deck).toBeDefined();
    const geo = deck.geometry as THREE.BufferGeometry;
    const top = geo.groups[0];
    const normals = geo.getAttribute('normal');
    const index = geo.getIndex()!;
    for (let i = top.start; i < top.start + top.count; i++) {
      expect(normals.getY(index.getX(i))).toBeGreaterThan(0.5);
    }
  });

  it('the group bounds cover the Turfton Skyway and contain (300, 7, -60)', () => {
    const box = new THREE.Box3().setFromObject(group);
    expect(box.min.x).toBeLessThanOrEqual(200);
    expect(box.max.x).toBeGreaterThanOrEqual(540);
    expect(box.containsPoint(new THREE.Vector3(300, 7, -60))).toBe(true);
  });
});
