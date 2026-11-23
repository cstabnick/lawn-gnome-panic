// Where fittings go on a vehicle. A game registers hand-tuned mounts per prefab id; anything else gets a guess from the built body.
// STUB (see the issue that owns this file).
import * as THREE from 'three';
import type { GlazeMountsDef, VehicleMounts } from './types';

const defined = new Map<string, GlazeMountsDef>();

/** Register hand-tuned mounts for a prefab id. Registered fields win over derived ones; missing fields fall back to deriveMounts. Calling again for the same id replaces. */
export function defineMounts(prefabId: string, def: GlazeMountsDef): void {
  defined.set(prefabId, def);
}

/** deriveMounts(body) with the registered fields for `prefabId` laid over it. `body` is the built prefab root (any root scale: results are prefab-local). */
export function getMounts(prefabId: string, body: THREE.Object3D): VehicleMounts {
  return { ...deriveMounts(body), ...(defined.get(prefabId) ?? {}) };
}

/** A guess from the body: width/length/height from its bounding box in prefab-local units, wheels from the `wheel-0`..`wheel-3` pivots, steer from a `steer` pivot (grips 0.2 either side of its centre), points and lamps and panels from the box. */
export function deriveMounts(_body: THREE.Object3D): VehicleMounts {
  return { width: 1.2, length: 1.7, height: 0.9, points: {}, lamps: null, steer: null, panels: [], wheels: [] };
}
