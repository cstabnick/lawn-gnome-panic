// STUB: the dog rig (mesh + pose animation). Filled in by its own issue; keep these exported signatures.
import * as THREE from 'three';

export type DogPose =
  | 'stand' | 'walk' | 'run' | 'sit' | 'lie' | 'roll' | 'shake' | 'spin' | 'eat' | 'sleep' | 'beg' | 'shakeoff' | 'tilt';

export interface DogRig {
  /** Feet at the origin, facing +z. The caller owns root.position, root.rotation.y and root.scale; animateDog never touches them. */
  root: THREE.Group;
  /** Meshes to raycast against for petting and scrubbing. */
  hit: THREE.Object3D[];
  /** An empty Object3D at the mouth; the caller re-parents the ball to it while carrying. */
  mouth: THREE.Object3D;
  /** 0 = clean, 1 = filthy: shows mud spots. */
  setDirt(level: number): void;
}

export function createDogRig(): DogRig {
  const root = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.1, 2.3), new THREE.MeshStandardMaterial({ color: 0xd97706 }));
  body.position.y = 1.45;
  root.add(body);
  const mouth = new THREE.Object3D();
  mouth.position.set(0, 1.8, 2.1);
  root.add(mouth);
  return { root, hit: [body], mouth, setDirt: () => {} };
}

/**
 * Animate the rig's children toward pose. t = seconds since start, dt = frame seconds,
 * speed = ground speed (units/s) for gait cycle rate, happy = 0..1 (tail wag speed, bounce).
 */
export function animateDog(rig: DogRig, pose: DogPose, t: number, dt: number, speed: number, happy: number): void {
  void rig; void pose; void t; void dt; void speed; void happy;
}
