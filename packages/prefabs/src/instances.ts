// Many copies of one prefab as InstancedMeshes: one draw call per part instead of one per part per copy.
// For forests, fences and other scatter where hundreds of copies stand still.
import * as THREE from 'three';
import { buildPrefab } from './build';
import type { BuildOptions } from './types';

export interface InstanceOptions extends Pick<BuildOptions, 'tint' | 'trim' | 'shadows'> {
  /** Per-copy colour for the prefab's 'tint' parts (same length as the matrices). Overrides `tint`. */
  tints?: readonly (number | THREE.Color)[];
}

/**
 * Builds `matrices.length` copies of a prefab. Each matrix places one copy (position, rotation, scale of the
 * prefab's root). Returns a group of InstancedMeshes, one per part; add it to the scene as is.
 * Geometry is the prefab's shared cache: never dispose it. Point lights are skipped.
 */
export function buildPrefabInstances(id: string, matrices: readonly THREE.Matrix4[], opts: InstanceOptions = {}): THREE.Group {
  const proto = buildPrefab(id, { tint: opts.tint, trim: opts.trim, shadows: opts.shadows, lights: false, separateTint: !!opts.tints });
  proto.updateMatrixWorld(true);
  const out = new THREE.Group();
  out.name = `${id}:instances`;
  out.userData.prefab = id;
  const m = new THREE.Matrix4();
  const colour = new THREE.Color();
  proto.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    const perCopy = !!opts.tints && mesh.userData.tint === true;
    const material = perCopy
      ? new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.78 })
      : mesh.material;
    const inst = new THREE.InstancedMesh(mesh.geometry, material, matrices.length);
    inst.name = mesh.name;
    inst.userData.part = mesh.userData.part;
    inst.castShadow = mesh.castShadow;
    inst.receiveShadow = mesh.receiveShadow;
    inst.renderOrder = mesh.renderOrder;
    matrices.forEach((mat, i) => {
      inst.setMatrixAt(i, m.multiplyMatrices(mat, mesh.matrixWorld));
      if (perCopy) inst.setColorAt(i, colour.set(opts.tints![i] ?? 0xffffff));
    });
    inst.instanceMatrix.needsUpdate = true;
    if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
    inst.computeBoundingSphere();
    out.add(inst);
  });
  return out;
}
