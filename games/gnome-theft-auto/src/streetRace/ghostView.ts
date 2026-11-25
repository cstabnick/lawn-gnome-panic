// E26: the ghost car drawn in a time trial: a see-through copy of the vehicle that drove the best run, posed from the
// trace (ghost.ts ghostPose). Never in `vehicles`: nothing collides with it.
import type * as THREE from 'three';
import { createVehicle, removeVehicle, syncVehicleMesh } from '../vehicles';
import { ghostPose, type GhostTrace } from './ghost';

export interface GhostView {
  /** Pose the ghost at race time t (hidden before 0 and after the trace ends). */
  update(t: number): void;
  dispose(): void;
}

export function createGhostView(scene: THREE.Scene, g: GhostTrace): GhostView {
  const first = ghostPose(g, 0) ?? { x: 0, y: 0, z: 0, yaw: 0 };
  const v = createVehicle(scene, g.vehicle, first.x, first.z, first.yaw);
  v.y = first.y;

  // Clone the materials so the fade does not leak into the shared vehicle materials.
  const clones: { dispose(): void }[] = [];
  v.object.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const copies = mats.map((m) => {
      const c = m.clone();
      c.transparent = true;
      c.opacity = 0.35;
      c.depthWrite = false;
      clones.push(c);
      return c;
    });
    mesh.material = Array.isArray(mesh.material) ? copies : copies[0];
  });

  return {
    update(t: number) {
      const pose = ghostPose(g, t);
      if (pose) {
        v.x = pose.x;
        v.y = pose.y;
        v.z = pose.z;
        v.yaw = pose.yaw;
        v.speed = 0;
        syncVehicleMesh(v, 0);
      }
      v.object.visible = pose !== null;
    },
    dispose() {
      removeVehicle(scene, v);
      for (const c of clones) c.dispose();
      clones.length = 0;
    },
  };
}
