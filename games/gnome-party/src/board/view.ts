// The 3D board: spaces, star, gnome tokens, die, camera. STUB: issue 2B fills it in. Keep the exported signatures.
import * as THREE from 'three';
import type { PartyState } from '../config';

export interface BoardView {
  readonly scene: THREE.Scene;
  render(state: Readonly<PartyState>, dt: number): void;
  dispose(): void;
}

export function createBoardView(camera: THREE.PerspectiveCamera): BoardView {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87c8ff);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x447744, 1.4));
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(40, 30), new THREE.MeshStandardMaterial({ color: 0x5cae4a }));
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);
  return {
    scene,
    render() {
      camera.position.set(0, 16, 14);
      camera.lookAt(0, 0, 0);
    },
    dispose() {
      scene.clear();
    },
  };
}
