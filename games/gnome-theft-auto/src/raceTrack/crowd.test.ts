import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { createCrowd } from './crowd';
import type { Deck } from './track';

const DECKS: Deck[] = [
  { x: 0, z: 0, y: 2, yaw: 0, w: 20, d: 4 },
  { x: 60, z: 30, y: 3, yaw: Math.PI / 2, w: 10, d: 6 },
];

function instancedMeshes(scene: THREE.Scene): THREE.InstancedMesh[] {
  return scene.children.filter((c): c is THREE.InstancedMesh => c instanceof THREE.InstancedMesh);
}

describe('createCrowd', () => {
  it('fills the decks with three instanced parts of the same spectator count', () => {
    const scene = new THREE.Scene();
    createCrowd(scene, DECKS);
    const meshes = instancedMeshes(scene);
    expect(meshes.length).toBe(3);
    const count = meshes[0].count;
    expect(count).toBeGreaterThanOrEqual(60);
    expect(count).toBeLessThanOrEqual(200);
    for (const mesh of meshes) expect(mesh.count).toBe(count);
  });

  it('is the same crowd on every build (seeded)', () => {
    const a = new THREE.Scene();
    const b = new THREE.Scene();
    createCrowd(a, DECKS);
    createCrowd(b, DECKS);
    const ma = instancedMeshes(a)[0];
    const mb = instancedMeshes(b)[0];
    expect(mb.count).toBe(ma.count);
    expect(Array.from(mb.instanceMatrix.array)).toEqual(Array.from(ma.instanceMatrix.array));
  });

  it('leaves the matrices unchanged when the player is far away', () => {
    const scene = new THREE.Scene();
    const crowd = createCrowd(scene, DECKS);
    const mesh = instancedMeshes(scene)[0];
    const before = Array.from(mesh.instanceMatrix.array);
    crowd.update(0.5, 5000, 5000, 1);
    expect(Array.from(mesh.instanceMatrix.array)).toEqual(before);
    expect(mesh.visible).toBe(false);
  });

  it('animates when the player is near', () => {
    const scene = new THREE.Scene();
    const crowd = createCrowd(scene, DECKS);
    const mesh = instancedMeshes(scene)[0];
    const before = Array.from(mesh.instanceMatrix.array);
    crowd.update(0.5, 10, 10, 1);
    expect(Array.from(mesh.instanceMatrix.array)).not.toEqual(before);
  });

  it('hides the meshes beyond 450 m', () => {
    const scene = new THREE.Scene();
    const crowd = createCrowd(scene, DECKS);
    crowd.update(0.1, 2000, 0, 0);
    for (const mesh of instancedMeshes(scene)) expect(mesh.visible).toBe(false);
  });
});
