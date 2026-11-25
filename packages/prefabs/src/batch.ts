// Static prefab batching: bakes an entire set of placed decorative prefabs up front into one merged
// BufferGeometry per (glow, alpha) render bucket (typically 1-3 draw calls total for dozens of props).
// Ideal for non-moving scenery (alley props, bar lounges, procedural room furniture).
import * as THREE from 'three';
import { attachDynamicParts, bakedMaterial, getPrefabTemplate, resolveTintTrim } from './build';
import { colorOf, type Swatch } from './palette';
import { getPrefab } from './registry';
import type { Vec3 } from './types';

export interface StaticPrefabPlacement {
  id: string;
  x: number;
  y?: number;
  z: number;
  /** Y-axis rotation in radians. Default 0. */
  yaw?: number;
  /** Optional full Euler rotation in radians `[rx, ry, rz]`. Overrides `yaw` if set. */
  rot?: Vec3;
  /** Uniform scale. Default 1. */
  scale?: number;
  tint?: Swatch | number;
  trim?: Swatch | number;
}

export interface StaticBatchOptions {
  /** Cast and receive shadows. Default true. */
  shadows?: boolean;
  /** Include point lights defined on placed prefabs. Default true. */
  lights?: boolean;
  /** Name for the returned group. Default 'prefab-batch'. */
  name?: string;
}

interface PackedInstance {
  pos: Float32Array;
  nrm: Float32Array;
  col: Float32Array;
  r00: number; r01: number; r02: number;
  r10: number; r11: number; r12: number;
  r20: number; r21: number; r22: number;
  s: number;
  px: number;
  py: number;
  pz: number;
}

interface BucketAccum {
  glow: boolean;
  alpha: number;
  floatCount: number;
  items: PackedInstance[];
}

const _pos = new THREE.Vector3();
const _euler = new THREE.Euler(0, 0, 0, 'XYZ');
const _quat = new THREE.Quaternion();
const _scale = new THREE.Vector3();
const _mat4 = new THREE.Matrix4();
const _lightPos = new THREE.Vector3();

/**
 * Bakes a list of static prefab placements into a minimal set of merged meshes (one per render bucket).
 * Uses a direct 2-pass Float32Array packer (zero intermediate BufferGeometry clones or normal-matrix inversions).
 * Static batch meshes have `matrixAutoUpdate = false`. Call `disposeStaticBatch()` if tearing down the scene.
 */
export function buildStaticPrefabs(
  placements: readonly StaticPrefabPlacement[],
  opts: StaticBatchOptions = {},
): THREE.Group {
  const shadows = opts.shadows ?? true;
  const includeLights = opts.lights ?? true;
  const root = new THREE.Group();
  root.name = opts.name ?? 'prefab-batch';
  root.userData.prefabBatch = true;
  root.userData.prefabCount = placements.length;

  const buckets = new Map<string, BucketAccum>();

  for (let pIdx = 0; pIdx < placements.length; pIdx++) {
    const p = placements[pIdx];
    const def = getPrefab(p.id);
    if (!def) throw new Error(`Unknown prefab: ${p.id}`);

    const { tintHex, trimHex } = resolveTintTrim(def, p);
    const template = getPrefabTemplate(def, tintHex, trimHex);

    const s = p.scale ?? 1;
    const px = p.x;
    const py = p.y ?? 0;
    const pz = p.z;
    if (p.rot) _euler.set(p.rot[0], p.rot[1], p.rot[2], 'XYZ');
    else _euler.set(0, p.yaw ?? 0, 0, 'XYZ');
    _quat.setFromEuler(_euler);

    // Pure orthogonal 3x3 rotation from unit quaternion _quat (unit normals stay unit length without sqrt).
    const qx = _quat.x, qy = _quat.y, qz = _quat.z, qw = _quat.w;
    const x2 = qx + qx, y2 = qy + qy, z2 = qz + qz;
    const xx = qx * x2, xy = qx * y2, xz = qx * z2;
    const yy = qy * y2, yz = qy * z2, zz = qz * z2;
    const wx = qw * x2, wy = qw * y2, wz = qw * z2;

    const r00 = 1 - (yy + zz), r01 = xy - wz,       r02 = xz + wy;
    const r10 = xy + wz,       r11 = 1 - (xx + zz), r12 = yz - wx;
    const r20 = xz - wy,       r21 = yz + wx,       r22 = 1 - (xx + yy);

    const tBuckets = template.buckets;
    for (let bIdx = 0; bIdx < tBuckets.length; bIdx++) {
      const bucket = tBuckets[bIdx];
      const bKey = `${bucket.glow}:${bucket.alpha}`;
      let acc = buckets.get(bKey);
      if (!acc) {
        acc = { glow: bucket.glow, alpha: bucket.alpha, floatCount: 0, items: [] };
        buckets.set(bKey, acc);
      }
      const geo = bucket.geometry;
      const srcPos = (geo.getAttribute('position') as THREE.BufferAttribute).array as Float32Array;
      const srcNrm = (geo.getAttribute('normal') as THREE.BufferAttribute).array as Float32Array;
      const srcCol = (geo.getAttribute('color') as THREE.BufferAttribute).array as Float32Array;
      acc.floatCount += srcPos.length;
      acc.items.push({
        pos: srcPos, nrm: srcNrm, col: srcCol,
        r00, r01, r02, r10, r11, r12, r20, r21, r22,
        s, px, py, pz,
      });
    }

    const hasDyn = template.dynamicParts.length > 0 || (def.pivots && Object.keys(def.pivots).length > 0);
    const hasLights = includeLights && !!def.lights?.length;
    if (hasDyn || hasLights) {
      _pos.set(px, py, pz);
      if (hasDyn) {
        const dyn = new THREE.Group();
        dyn.name = def.id;
        dyn.userData.prefab = def.id;
        dyn.position.copy(_pos);
        dyn.quaternion.copy(_quat);
        if (s !== 1) dyn.scale.setScalar(s);
        attachDynamicParts(dyn, def, template.dynamicParts, tintHex, trimHex, shadows);
        root.add(dyn);
      }
      if (hasLights) {
        _scale.set(s, s, s);
        _mat4.compose(_pos, _quat, _scale);
        for (const l of def.lights!) {
          _lightPos.set(l.at[0], l.at[1], l.at[2]).applyMatrix4(_mat4);
          const light = new THREE.PointLight(colorOf(l.c), l.intensity, l.distance * s, 1);
          light.position.copy(_lightPos);
          root.add(light);
        }
      }
    }
  }

  for (const { glow, alpha, floatCount, items } of buckets.values()) {
    const outPos = new Float32Array(floatCount);
    const outNrm = new Float32Array(floatCount);
    const outCol = new Float32Array(floatCount);
    let dst = 0;

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const sp = it.pos;
      const sn = it.nrm;
      const len = sp.length;
      const { r00, r01, r02, r10, r11, r12, r20, r21, r22, s, px, py, pz } = it;
      outCol.set(it.col, dst);
      const sr00 = s * r00, sr01 = s * r01, sr02 = s * r02;
      const sr10 = s * r10, sr11 = s * r11, sr12 = s * r12;
      const sr20 = s * r20, sr21 = s * r21, sr22 = s * r22;
      for (let k = 0; k < len; k += 3) {
        const vx = sp[k], vy = sp[k + 1], vz = sp[k + 2];
        const nx = sn[k], ny = sn[k + 1], nz = sn[k + 2];
        const o = dst + k;
        outPos[o]     = px + sr00 * vx + sr01 * vy + sr02 * vz;
        outPos[o + 1] = py + sr10 * vx + sr11 * vy + sr12 * vz;
        outPos[o + 2] = pz + sr20 * vx + sr21 * vy + sr22 * vz;
        outNrm[o]     = r00 * nx + r01 * ny + r02 * nz;
        outNrm[o + 1] = r10 * nx + r11 * ny + r12 * nz;
        outNrm[o + 2] = r20 * nx + r21 * ny + r22 * nz;
      }
      dst += len;
    }

    const merged = new THREE.BufferGeometry();
    merged.setAttribute('position', new THREE.BufferAttribute(outPos, 3));
    merged.setAttribute('normal', new THREE.BufferAttribute(outNrm, 3));
    merged.setAttribute('color', new THREE.BufferAttribute(outCol, 3));
    merged.computeBoundingBox();
    merged.computeBoundingSphere();

    const mesh = new THREE.Mesh(merged, bakedMaterial(glow, alpha));
    mesh.userData.prefabBatchMesh = true;
    if (alpha < 1) mesh.renderOrder = 1;
    mesh.castShadow = shadows && !glow;
    mesh.receiveShadow = shadows;
    mesh.matrixAutoUpdate = false;
    mesh.updateMatrix();
    root.add(mesh);
  }

  return root;
}

/** Disposes the merged geometries owned by a `buildStaticPrefabs` group without disposing shared prefab materials. */
export function disposeStaticBatch(batch: THREE.Group): void {
  batch.traverse((obj) => {
    if (obj instanceof THREE.Mesh && obj.userData.prefabBatchMesh) {
      obj.geometry.dispose();
    }
  });
}
