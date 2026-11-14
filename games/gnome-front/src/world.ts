// src/world.ts: ground, sky, lights, fences and cover. STUB: filled in by epic 2.
import * as THREE from 'three';
import type { Obstacle } from './config';

/** Builds the static battlefield into the scene and returns every piece of cover for collision and bullets. */
export function buildWorld(scene: THREE.Scene): Obstacle[] {
  scene.add(new THREE.HemisphereLight(0xffffff, 0x446622, 1.5));
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), new THREE.MeshStandardMaterial({ color: 0x4f9a35 }));
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);
  return [];
}
