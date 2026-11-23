// Building meshes. Step 0 stub: an empty group under the scene (roadmap 10, issues in epic 2 fill it).
import * as THREE from 'three';
import type { BuildingParts } from '../world/buildingTypes';
import type { InteriorState } from '../game/interior';

export interface BuildingsView { root: THREE.Group; update(state: InteriorState, dt: number): void }

export function buildBuildings(scene: THREE.Scene, parts: readonly BuildingParts[]): BuildingsView {
  const root = new THREE.Group();
  scene.add(root);
  return { root, update() {} };
}
