// STUB (Epic 2 fills this in): builds the garden track into a scene (ground, mown track, long grass, start line,
// hedges, props, lights, sky, fog). Used by the full game and the party slice.
import * as THREE from 'three';

export function buildTrack(scene: THREE.Scene): void {
  scene.background = new THREE.Color(0x7cc4f2);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x447744, 1.5));
}
