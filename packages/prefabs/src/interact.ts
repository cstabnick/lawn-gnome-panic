// World-space interaction helpers for placed prefabs (sitting on seats, resting by fires).
import * as THREE from 'three';
import { getPrefab } from './registry';
import type { PrefabDef } from './types';

export interface PrefabHit {
  def: PrefabDef;
  root: THREE.Object3D;
}

export interface SitTarget {
  /** World-space position of the seat surface. */
  position: THREE.Vector3;
  /** World-space yaw (0 faces +z) the gnome should face while seated. */
  facing: number;
}

export interface RestTarget {
  /** World-space position on the ground to sit and rest. */
  position: THREE.Vector3;
  /** World-space yaw facing toward the fire/warmth source. */
  facing: number;
  /** World-space warmth radius. */
  radius: number;
}

export interface InteractTarget {
  /** World-space standing spot for a gnome using this prefab. */
  stand: THREE.Vector3;
  /** World-space yaw (0 faces +z) facing from `stand` toward `lookAt`. */
  facing: number;
  /** World-space point the gnome and close-up camera look at. */
  lookAt: THREE.Vector3;
  /** World-space close-up camera position, if defined on the prefab. */
  camera?: THREE.Vector3;
}

const _fwd = new THREE.Vector3();
const _quat = new THREE.Quaternion();
const _scale = new THREE.Vector3();
const _origin = new THREE.Vector3();

/** Finds the placed prefab root (`userData.prefab`) and its definition for any descendant mesh. */
export function prefabFromObject(obj: THREE.Object3D): PrefabHit | null {
  for (let o: THREE.Object3D | null = obj; o; o = o.parent) {
    const id = o.userData.prefab as string | undefined;
    if (id) {
      const def = getPrefab(id);
      return def ? { def, root: o } : null;
    }
  }
  return null;
}

/** World-space seat position and facing yaw for a prefab with `seat` defined, or null. */
export function getPrefabSitTarget(root: THREE.Object3D, def: PrefabDef): SitTarget | null {
  if (!def.seat) return null;
  root.updateMatrixWorld(true);
  const position = new THREE.Vector3(def.seat[0], def.seat[1], def.seat[2]).applyMatrix4(root.matrixWorld);
  root.getWorldQuaternion(_quat);
  _fwd.set(0, 0, 1).applyQuaternion(_quat);
  const facing = Math.atan2(_fwd.x, _fwd.z);
  return { position, facing };
}

/**
 * World-space rest spot and facing yaw for a prefab with `rest` defined (a hearth or campfire), or null.
 * When `rest.at` is omitted (e.g. a 360-degree campfire), picks the point at `rest.radius` toward `fromWorldPos`.
 */
export function getPrefabRestTarget(
  root: THREE.Object3D,
  def: PrefabDef,
  fromWorldPos?: THREE.Vector3,
): RestTarget | null {
  if (!def.rest) return null;
  root.updateMatrixWorld(true);
  root.getWorldPosition(_origin);
  root.getWorldScale(_scale);
  const maxScale = Math.max(_scale.x, _scale.y, _scale.z);
  const radius = def.rest.radius * maxScale;

  let position: THREE.Vector3;
  if (def.rest.at) {
    position = new THREE.Vector3(def.rest.at[0], def.rest.at[1], def.rest.at[2]).applyMatrix4(root.matrixWorld);
  } else {
    let dx = fromWorldPos ? fromWorldPos.x - _origin.x : 0;
    let dz = fromWorldPos ? fromWorldPos.z - _origin.z : 1;
    const len = Math.hypot(dx, dz);
    if (len < 1e-4) {
      dx = 0;
      dz = 1;
    } else {
      dx /= len;
      dz /= len;
    }
    position = new THREE.Vector3(_origin.x + dx * radius, _origin.y, _origin.z + dz * radius);
  }

  const facing = Math.atan2(_origin.x - position.x, _origin.z - position.z);
  return { position, facing, radius };
}

/** Finds a named part mesh or pivot group inside a built prefab, or null. */
export function getPrefabPart(root: THREE.Object3D, name: string): THREE.Object3D | null {
  let found: THREE.Object3D | null = null;
  root.traverse((obj) => {
    if (found || obj === root) return;
    if (obj.name === name || obj.userData.part === name) found = obj;
  });
  return found;
}

/** Finds all named parts/groups whose name starts with `prefix`, sorted naturally by numeric suffix. */
export function getPrefabParts(root: THREE.Object3D, prefix: string): THREE.Object3D[] {
  const out: THREE.Object3D[] = [];
  root.traverse((obj) => {
    if (obj === root) return;
    if (obj.name.startsWith(prefix)) out.push(obj);
  });
  out.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  return out;
}

/** World-space standing spot, facing yaw, look-at point, and optional camera framing for a prefab with `interact` defined. */
export function getPrefabInteractTarget(root: THREE.Object3D, def: PrefabDef): InteractTarget | null {
  if (!def.interact) return null;
  root.updateMatrixWorld(true);
  const s = def.interact.stand ?? [0, 0, 0.8];
  const l = def.interact.lookAt ?? [0, 0.85, 0];
  const stand = new THREE.Vector3(s[0], s[1], s[2]).applyMatrix4(root.matrixWorld);
  const lookAt = new THREE.Vector3(l[0], l[1], l[2]).applyMatrix4(root.matrixWorld);
  const facing = Math.atan2(lookAt.x - stand.x, lookAt.z - stand.z);
  const camera = def.interact.camera
    ? new THREE.Vector3(def.interact.camera[0], def.interact.camera[1], def.interact.camera[2]).applyMatrix4(root.matrixWorld)
    : undefined;
  return { stand, facing, lookAt, camera };
}
