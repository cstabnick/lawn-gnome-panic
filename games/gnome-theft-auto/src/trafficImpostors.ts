import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { buildPrefab, getPrefab } from '@lawn/prefabs';
import { VEHICLES } from './config';
import type { VehicleKind } from './types';

/** Most distant cars of one kind that one impostor mesh can draw in a frame. */
export const IMPOSTOR_CAPACITY = 64;

/** One far-away car: where it is and which tint its paint takes (the prefab's 'tint' parts). */
export interface ImpostorPose { kind: VehicleKind; tint: number; x: number; y: number; z: number; yaw: number }

/** Cheap stand-ins for distant traffic cars: one or two InstancedMeshes per vehicle kind. */
export interface TrafficImpostors {
  /** Holds every impostor mesh; already added to the scene. */
  readonly object: THREE.Group;
  /** Draw exactly these cars this frame; every other impostor is hidden. */
  update(poses: readonly ImpostorPose[]): void;
  /** How many InstancedMeshes are visible with count > 0 after the last update (= draw calls). */
  drawCalls(): number;
  /** Remove the group from the scene and dispose the merged geometries and materials (never the prefab's own geometry). */
  dispose(): void;
}

/** One kind's built impostor meshes. `tint` is only there when the prefab has paint parts. */
interface KindEntry {
  body: THREE.InstancedMesh;
  tint?: THREE.InstancedMesh;
}

const UP = new THREE.Vector3(0, 1, 0);
const ONE = new THREE.Vector3(1, 1, 1);
const WHITE = new THREE.Color(0xffffff);

/** Keep only position and normal, and make the geometry non-indexed so it can be merged with the others. */
function plainGeometry(geo: THREE.BufferGeometry): THREE.BufferGeometry {
  const out = geo.index ? geo.toNonIndexed() : geo;
  if (out !== geo) geo.dispose();
  for (const name of Object.keys(out.attributes)) {
    if (name !== 'position' && name !== 'normal') out.deleteAttribute(name);
  }
  out.morphAttributes = {};
  return out;
}

/** Fill a per-vertex colour attribute with one colour. */
function withColour(geo: THREE.BufferGeometry, col: THREE.Color): THREE.BufferGeometry {
  const n = geo.attributes.position.count;
  const colours = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    colours[i * 3] = col.r;
    colours[i * 3 + 1] = col.g;
    colours[i * 3 + 2] = col.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colours, 3));
  return geo;
}

/** A primitive placed at a point in vehicle-object space, plain (position + normal + colour). */
function blob(geo: THREE.BufferGeometry, at: THREE.Vector3, hex: number): THREE.BufferGeometry {
  const g = plainGeometry(geo);
  g.applyMatrix4(new THREE.Matrix4().makeTranslation(at.x, at.y, at.z));
  return withColour(g, new THREE.Color(hex));
}

/** Gathers the prefab's visible meshes into the body list and the paint (tint) list. */
function collectPrefab(kind: VehicleKind, body: THREE.BufferGeometry[], tint: THREE.BufferGeometry[]): void {
  const spec = VEHICLES[kind];
  if (!getPrefab(spec.prefab)) {
    // The prefab is missing (not built yet): a plain box standing on the ground, in the paint group.
    const h = spec.radius * 0.7;
    const box = new THREE.BoxGeometry(spec.radius * 1.1, h, spec.radius * 1.6).translate(0, h / 2, 0);
    tint.push(plainGeometry(box));
    return;
  }
  const root = buildPrefab(spec.prefab, { scale: spec.scale, shadows: false, lights: false, separateTint: true });
  root.updateMatrixWorld(true);
  root.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return;
    const mat = (Array.isArray(o.material) ? o.material[0] : o.material) as THREE.Material & { color?: THREE.Color };
    if (mat.transparent || mat.opacity < 1) return;
    const geo = plainGeometry(o.geometry.clone().applyMatrix4(o.matrixWorld));
    if (o.userData.tint === true) {
      tint.push(geo);
    } else {
      body.push(withColour(geo, mat.color ?? WHITE));
    }
  });
}

/** The merged geometry and material each impostor mesh owns (disposed with the set; the prefab's own are not). */
const owned = new WeakMap<THREE.InstancedMesh, { geo: THREE.BufferGeometry; mat: THREE.Material }>();

/** Builds the merged body (and optional tint) InstancedMeshes for one kind and adds them to `group`. */
function buildKind(kind: VehicleKind, group: THREE.Group): KindEntry {
  const spec = VEHICLES[kind];
  const body: THREE.BufferGeometry[] = [];
  const tint: THREE.BufferGeometry[] = [];
  collectPrefab(kind, body, tint);

  // The driver: a red hat, a face and a white beard, at the seat.
  const [sx, sy, sz] = spec.seat;
  const at = (dy: number, dz = 0) => new THREE.Vector3(sx, sy + dy, sz + dz);
  body.push(blob(new THREE.ConeGeometry(0.16, 0.42, 6), at(0.72), 0xc8312b));
  body.push(blob(new THREE.SphereGeometry(0.17, 6, 4), at(0.42), 0xf1c27d));
  body.push(blob(new THREE.SphereGeometry(0.13, 6, 4), at(0.34, 0.1), 0xf4f4f4));

  const bodyGeo = mergeGeometries(body, false);
  if (!bodyGeo) throw new Error(`trafficImpostors: no body geometry for ${kind}`);
  for (const g of body) g.dispose();
  const bodyMat = new THREE.MeshLambertMaterial({ vertexColors: true });
  const entry: KindEntry = { body: new THREE.InstancedMesh(bodyGeo, bodyMat, IMPOSTOR_CAPACITY) };
  owned.set(entry.body, { geo: bodyGeo, mat: bodyMat });

  if (tint.length > 0) {
    const tintGeo = mergeGeometries(tint, false);
    if (tintGeo) {
      const tintMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
      entry.tint = new THREE.InstancedMesh(tintGeo, tintMat, IMPOSTOR_CAPACITY);
      owned.set(entry.tint, { geo: tintGeo, mat: tintMat });
    }
    for (const g of tint) g.dispose();
  }

  for (const mesh of [entry.body, entry.tint]) {
    if (!mesh) continue;
    mesh.count = 0;
    mesh.frustumCulled = false;
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.name = 'impostor:' + kind;
    group.add(mesh);
  }
  return entry;
}

/** Creates the traffic impostor set for a scene. Kinds build lazily on their first pose. */
export function createTrafficImpostors(scene: THREE.Scene): TrafficImpostors {
  const object = new THREE.Group();
  object.name = 'trafficImpostors';
  scene.add(object);

  const kinds = new Map<VehicleKind, KindEntry>();
  const used = new Map<VehicleKind, number>();
  const m = new THREE.Matrix4();
  const pos = new THREE.Vector3();
  const quat = new THREE.Quaternion();
  const colour = new THREE.Color();

  const meshesOf = (e: KindEntry): THREE.InstancedMesh[] => (e.tint ? [e.body, e.tint] : [e.body]);

  return {
    object,
    update(poses) {
      used.clear();
      for (const pose of poses) {
        let entry = kinds.get(pose.kind);
        if (!entry) {
          entry = buildKind(pose.kind, object);
          kinds.set(pose.kind, entry);
        }
        const i = used.get(pose.kind) ?? 0;
        if (i >= IMPOSTOR_CAPACITY) continue;
        used.set(pose.kind, i + 1);
        m.compose(pos.set(pose.x, pose.y, pose.z), quat.setFromAxisAngle(UP, pose.yaw), ONE);
        for (const mesh of meshesOf(entry)) mesh.setMatrixAt(i, m);
        if (entry.tint) entry.tint.setColorAt(i, colour.setHex(pose.tint));
      }
      for (const [kind, entry] of kinds) {
        const n = used.get(kind) ?? 0;
        for (const mesh of meshesOf(entry)) {
          mesh.count = n;
          mesh.visible = n > 0;
          mesh.instanceMatrix.needsUpdate = true;
          if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
        }
      }
    },
    drawCalls() {
      let calls = 0;
      for (const entry of kinds.values()) {
        for (const mesh of meshesOf(entry)) if (mesh.visible && mesh.count > 0) calls++;
      }
      return calls;
    },
    dispose() {
      object.removeFromParent();
      for (const entry of kinds.values()) {
        for (const mesh of meshesOf(entry)) {
          const own = owned.get(mesh);
          own?.geo.dispose();
          own?.mat.dispose();
          mesh.dispose();
        }
      }
      kinds.clear();
    },
  };
}
