// STUB (Epic 2 fills this in): one racer on screen = a mower with the gnome riding it, placed from a KartState.
import * as THREE from 'three';
import type { GnomeLook } from '@lawn/gnome';
import type { KartState, VehicleId } from '../config';

export interface Racer {
  object: THREE.Group;
  /** Place and animate from the kart (position, heading, lean on k.st, drift sparks, boost flame, grass spray). */
  update(k: Readonly<KartState>, dt: number): void;
  /** Remove from the scene and dispose its geometries and materials. */
  dispose(): void;
}

export function createRacer(scene: THREE.Scene, look: GnomeLook, vehicle: VehicleId, color: number): Racer {
  void look; void vehicle; void color;
  const object = new THREE.Group();
  scene.add(object);
  return {
    object,
    update(k) { object.position.set(k.x, 0, k.z); object.rotation.y = k.h; },
    dispose() { scene.remove(object); },
  };
}
