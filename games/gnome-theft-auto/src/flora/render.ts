// Instanced drawing of a PlantStore: one InstancedMesh per prefab part per variant (id + tint + trim) per 64 m cell, each
// cell group registered with the culler as 'prop' (owned). pose() rewrites one plant's instance (height scale and a lean
// about its base) and flags only its 16 floats for upload, so a mow or a regrow frame costs one small buffer update.
import * as THREE from 'three';
import { buildPrefab } from '@lawn/prefabs';
import { registerCull } from '../cull';
import type { PlantStore } from './types';

export interface PlantRender {
  /** Add to the scene. userData.cullCells = true; each cell group is registered with the culler. */
  root: THREE.Group;
  /** Rewrite plant i's instance: its placement with height scale `sy` and a lean (radians) about its base. One instance, zero allocations. */
  pose(i: number, sy: number, leanX?: number, leanZ?: number): void;
  /** How many InstancedMeshes were built (draw calls at most). */
  meshCount(): number;
  dispose(): void;
}

interface Part { geometry: THREE.BufferGeometry; material: THREE.Material | THREE.Material[]; matrix: THREE.Matrix4; castShadow: boolean; receiveShadow: boolean }
interface Batch { index: number; parts: Part[]; meshes: THREE.InstancedMesh[]; plants: number[] }

const _pos = new THREE.Vector3();
const _scale = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _qYaw = new THREE.Quaternion();
const _qLean = new THREE.Quaternion();
const _euler = new THREE.Euler();
const _m = new THREE.Matrix4();
const _t = new THREE.Matrix4();
const _Y = new THREE.Vector3(0, 1, 0);

export function buildPlantRender(store: PlantStore, opts: { cell?: number } = {}): PlantRender {
  const cell = opts.cell ?? 64;
  const root = new THREE.Group();
  root.name = 'flora';
  root.userData.cullCells = true;

  const protos = new Map<string, Part[]>();
  const groups = new Map<string, Batch>();
  const batches: Batch[] = [];
  const batchOf = new Int32Array(store.count).fill(-1);
  const slotOf = new Int32Array(store.count);

  for (let i = 0; i < store.count; i++) {
    const seed = store.seeds[i];
    const p = seed.p;
    const variant = `${p.id}|${p.tint ?? ''}|${p.trim ?? ''}`;
    let parts = protos.get(variant);
    if (!parts) {
      const proto = buildPrefab(p.id, { tint: p.tint, trim: p.trim, lights: false });
      proto.updateMatrixWorld(true);
      parts = [];
      proto.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (!mesh.isMesh) return;
        parts!.push({ geometry: mesh.geometry, material: mesh.material, matrix: mesh.matrixWorld.clone(), castShadow: mesh.castShadow, receiveShadow: mesh.receiveShadow });
      });
      protos.set(variant, parts);
    }
    const key = `${variant}|${Math.floor(seed.x / cell)},${Math.floor(seed.z / cell)}`;
    let b = groups.get(key);
    if (!b) {
      b = { index: batches.length, parts, meshes: [], plants: [] };
      groups.set(key, b);
      batches.push(b);
    }
    batchOf[i] = b.index;
    slotOf[i] = b.plants.length;
    b.plants.push(i);
  }

  const pose = (i: number, sy: number, leanX = 0, leanZ = 0): void => {
    const bi = batchOf[i];
    if (bi < 0) return;
    const b = batches[bi];
    const seed = store.seeds[i];
    _pos.set(seed.x, seed.y, seed.z);
    _qYaw.setFromAxisAngle(_Y, seed.yaw);
    if (leanX !== 0 || leanZ !== 0) {
      _qLean.setFromEuler(_euler.set(leanX, 0, leanZ));
      _q.multiplyQuaternions(_qLean, _qYaw);
    } else {
      _q.copy(_qYaw);
    }
    _scale.set(seed.scale, seed.scale * sy, seed.scale);
    _m.compose(_pos, _q, _scale);
    const slot = slotOf[i];
    for (let j = 0; j < b.meshes.length; j++) {
      const mesh = b.meshes[j];
      mesh.setMatrixAt(slot, _t.multiplyMatrices(_m, b.parts[j].matrix));
      mesh.instanceMatrix.addUpdateRange(slot * 16, 16);
      mesh.instanceMatrix.needsUpdate = true;
    }
  };

  let meshes = 0;
  for (const [key, b] of groups) {
    const g = new THREE.Group();
    g.name = `flora:${key}`;
    for (const part of b.parts) {
      const inst = new THREE.InstancedMesh(part.geometry, part.material, b.plants.length);
      inst.castShadow = part.castShadow;
      inst.receiveShadow = part.receiveShadow;
      b.meshes.push(inst);
      g.add(inst);
      meshes++;
    }
    for (const i of b.plants) pose(i, 1);
    for (const inst of b.meshes) {
      inst.instanceMatrix.clearUpdateRanges();
      inst.instanceMatrix.needsUpdate = true;
      inst.computeBoundingSphere();
      inst.computeBoundingBox();
    }
    root.add(g);
  }
  for (const g of root.children) registerCull(g, 'prop', { owned: true });

  return {
    root,
    pose,
    meshCount: () => meshes,
    dispose() {
      root.removeFromParent();
      for (const b of batches) for (const m of b.meshes) m.dispose();
    },
  };
}
