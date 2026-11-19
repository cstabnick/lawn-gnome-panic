// Static prefab batching: bakes an entire set of placed decorative prefabs up front into one merged
// BufferGeometry per (glow, alpha) render bucket (typically 1-3 draw calls total for dozens of props).
// Ideal for non-moving scenery (alley props, bar lounges, procedural room furniture).
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
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

const _pos = new THREE.Vector3();
const _euler = new THREE.Euler(0, 0, 0, 'XYZ');
const _quat = new THREE.Quaternion();
const _scale = new THREE.Vector3();
const _mat4 = new THREE.Matrix4();
const _lightPos = new THREE.Vector3();

/**
 * Bakes a list of static prefab placements into a minimal set of merged meshes (one per render bucket).
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

  const buckets = new Map<string, { glow: boolean; alpha: number; geos: THREE.BufferGeometry[] }>();

  for (const p of placements) {
    const def = getPrefab(p.id);
    if (!def) throw new Error(`Unknown prefab: ${p.id}`);

    const { tintHex, trimHex } = resolveTintTrim(def, p);
    const template = getPrefabTemplate(def, tintHex, trimHex);

    const s = p.scale ?? 1;
    _pos.set(p.x, p.y ?? 0, p.z);
    if (p.rot) _euler.set(p.rot[0], p.rot[1], p.rot[2], 'XYZ');
    else _euler.set(0, p.yaw ?? 0, 0, 'XYZ');
    _quat.setFromEuler(_euler);
    _scale.set(s, s, s);
    _mat4.compose(_pos, _quat, _scale);

    for (const bucket of template.buckets) {
      const bKey = `${bucket.glow}:${bucket.alpha}`;
      let list = buckets.get(bKey);
      if (!list) {
        list = { glow: bucket.glow, alpha: bucket.alpha, geos: [] };
        buckets.set(bKey, list);
      }
      const g = bucket.geometry.clone();
      g.applyMatrix4(_mat4);
      list.geos.push(g);
    }

    if (template.dynamicParts.length > 0 || (def.pivots && Object.keys(def.pivots).length > 0)) {
      const dyn = new THREE.Group();
      dyn.name = def.id;
      dyn.userData.prefab = def.id;
      dyn.position.copy(_pos);
      dyn.quaternion.copy(_quat);
      if (s !== 1) dyn.scale.setScalar(s);
      attachDynamicParts(dyn, def, template.dynamicParts, tintHex, trimHex, shadows);
      root.add(dyn);
    }

    if (includeLights && def.lights?.length) {
      for (const l of def.lights) {
        _lightPos.set(l.at[0], l.at[1], l.at[2]).applyMatrix4(_mat4);
        const light = new THREE.PointLight(colorOf(l.c), l.intensity, l.distance * s, 1);
        light.position.copy(_lightPos);
        root.add(light);
      }
    }
  }

  for (const { glow, alpha, geos } of buckets.values()) {
    const merged = geos.length === 1 ? geos[0] : mergeGeometries(geos, false);
    if (!merged) throw new Error(`Failed to merge static prefab batch (${root.name})`);
    if (geos.length > 1) {
      for (const g of geos) g.dispose();
    }
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
