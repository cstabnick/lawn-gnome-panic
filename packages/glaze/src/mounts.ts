// Where fittings go on a vehicle. A game registers hand-tuned mounts per prefab id; anything else gets a guess from the built body.
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
export function deriveMounts(body: THREE.Object3D): VehicleMounts {
  body.updateWorldMatrix(true, true);
  const s = body.scale.x || 1;
  const box = new THREE.Box3().setFromObject(body);
  // Convert the world-space box to prefab-local units (undo the root's position and uniform scale).
  const min = new THREE.Vector3().subVectors(box.min, body.position).divideScalar(s);
  const max = new THREE.Vector3().subVectors(box.max, body.position).divideScalar(s);
  if (!Number.isFinite(min.x) || !Number.isFinite(max.x)) {
    min.set(-0.1, 0, -0.1);
    max.set(0.1, 0, 0.1);
  }

  const width = Math.max(0.2, max.x - min.x);
  const length = Math.max(0.2, max.z - min.z);
  const height = Math.max(0.2, max.y);

  const wheels: VehicleMounts['wheels'][number][] = [];
  for (let i = 0; i < 4; i++) {
    const p = body.getObjectByName('wheel-' + i);
    if (!p) continue;
    wheels.push({
      index: i,
      pivot: 'wheel-' + i,
      front: i >= 2,
      side: p.position.x >= 0 ? 1 : -1,
      at: [p.position.x, p.position.y, p.position.z],
    });
  }

  const steerPivot = body.getObjectByName('steer');
  const steer: VehicleMounts['steer'] = steerPivot
    ? {
        pivot: 'steer',
        grips: [
          [steerPivot.position.x + 0.2, steerPivot.position.y, steerPivot.position.z],
          [steerPivot.position.x - 0.2, steerPivot.position.y, steerPivot.position.z],
        ],
      }
    : null;

  const zf = max.z;
  const zr = min.z;
  const h = height;
  const L = length;
  const W = width;
  const points: VehicleMounts['points'] = {
    hood: [0, h * 0.62, zf - L * 0.12],
    front: [0, h * 0.35, zf],
    rear: [0, h * 0.55, zr + L * 0.06],
    seat: [0, h * 0.45, zr + L * 0.3],
    top: [0, h, zr + L * 0.45],
    side: [W / 2, h * 0.35, zr + L * 0.35],
    dash: [0, h * 0.7, zf - L * 0.32],
  };
  const lamps: VehicleMounts['lamps'] = [
    [W * 0.26, h * 0.45, zf],
    [-W * 0.26, h * 0.45, zf],
  ];

  const midZ = (zf + zr) / 2;
  const panels: VehicleMounts['panels'] = [
    { id: 'left', at: [W / 2 + 0.004, h * 0.42, midZ], size: [L * 0.55, h * 0.3], rot: [0, 90, 0] },
    { id: 'right', at: [-W / 2 - 0.004, h * 0.42, midZ], size: [L * 0.55, h * 0.3], rot: [0, -90, 0] },
    { id: 'hood', at: [0, h * 0.74, zf - L * 0.2], size: [W * 0.55, L * 0.28], rot: [-90, 0, 0] },
    { id: 'rear', at: [0, h * 0.5, zr - 0.004], size: [W * 0.6, h * 0.25], rot: [0, 180, 0] },
  ];

  return { width: W, length: L, height: h, points, lamps, steer, panels, wheels };
}
