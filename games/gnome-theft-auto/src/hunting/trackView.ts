// Tuft hunting: draws the footprints near the player as flat decals (one InstancedMesh per print shape).
import * as THREE from 'three';
import { flatLayer, LAYER } from '@lawn/depth';
import type { Tracks } from './tracks';
import { HUNT, speciesById, type PrintKind } from './species';

export interface TrackView {
  /** Every frame: show the prints within HUNT.trackRadius of (px, pz), laid on the ground. */
  update(tracks: Tracks, px: number, pz: number, ground: (x: number, z: number) => number): void;
  dispose(): void;
}

/** Plane size per print shape, world units (width, length). */
const SHAPES: Record<PrintKind, readonly [number, number]> = {
  paw: [0.16, 0.2],
  bird: [0.18, 0.18],
  drag: [0.1, 0.4],
};
const KINDS = Object.keys(SHAPES) as PrintKind[];

export function createTrackView(scene: THREE.Scene): TrackView {
  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  const meshes = {} as Record<PrintKind, THREE.InstancedMesh>;

  for (const kind of KINDS) {
    const [w, h] = SHAPES[kind];
    const geometry = new THREE.PlaneGeometry(w, h);
    geometry.rotateX(-Math.PI / 2);
    // One material per kind: flatLayer changes the material in place.
    const material = flatLayer(
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.75, depthWrite: false }),
      LAYER.decal,
    );
    const mesh = new THREE.InstancedMesh(geometry, material, HUNT.maxPrints);
    mesh.count = 0;
    mesh.frustumCulled = false;
    scene.add(mesh);
    meshes[kind] = mesh;
  }

  return {
    update(tracks, px, pz, ground) {
      const used: Record<PrintKind, number> = { paw: 0, bird: 0, drag: 0 };
      const r2 = HUNT.trackRadius * HUNT.trackRadius;
      for (const p of tracks.prints) {
        const dx = p.x - px;
        const dz = p.z - pz;
        if (dx * dx + dz * dz > r2) continue;
        const species = speciesById(p.species);
        if (!species) continue;
        const kind = species.print;
        const i = used[kind];
        if (i >= HUNT.maxPrints) continue;
        const mesh = meshes[kind];

        dummy.position.set(p.x, ground(p.x, p.z) + 0.03, p.z);
        dummy.rotation.set(0, p.yaw, 0);
        dummy.scale.setScalar(1 - 0.6 * (p.age / HUNT.trackLife));
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        mesh.setColorAt(i, color.setHex(species.printColor));
        used[kind] = i + 1;
      }
      for (const kind of KINDS) {
        const mesh = meshes[kind];
        mesh.count = used[kind];
        if (used[kind] > 0) {
          mesh.instanceMatrix.needsUpdate = true;
          if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
        }
      }
    },
    dispose() {
      for (const kind of KINDS) {
        const mesh = meshes[kind];
        scene.remove(mesh);
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
      }
    },
  };
}
