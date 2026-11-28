// The Unmown's gate (E28): the entrance sign beside the end of the Unmown Lane and the "swallowed mower" vignette 12 m
// off the lane: a rust-tinted reel mower sunk 0.3 m into the ground, with wildflowers and grass growing through and
// round it. The ranger station site (centre (-1560, -1150), x -1585..-1535, z -1170..-1130) is not built on here.
// Filled by issue 2E.
import * as THREE from 'three';
import { buildPrefab, getPrefab } from '@lawn/prefabs';
import type { Box } from './types';
import { placeOnGround } from './terrainMesh';

/** The lane's last segment runs (-1480, -1060) to (-1540, -1120); its normal (0.707, -0.707) points off its north-east side. */
const SIGN = { x: -1505, z: -1095, yaw: -Math.PI / 4 };
/** Lane point (-1440, -1040) on the segment from (-1400, -1020) to (-1480, -1060), 12 m out along the normal (0.447, -0.894). */
const MOWER = { x: -1434.6, z: -1050.7, yaw: 0.6 };
const MOWER_TINT = 0x8a4b2a;
/** Sunk into the ground by this much (metres). */
const MOWER_SINK = 0.3;
/** Growing through and round the mower: offsets from its centre (metres). */
const FLOWERS: readonly (readonly [number, number])[] = [[1.4, 0.6], [-1.2, 1.1], [0.3, -1.5]];
const GRASSES: readonly (readonly [number, number])[] = [[-0.8, -0.9], [1.1, -1.2], [-1.5, -0.2]];

function shadowed(g: THREE.Object3D): THREE.Object3D {
  g.traverse((o) => {
    if (o instanceof THREE.Mesh) { o.castShadow = true; o.receiveShadow = true; }
  });
  return g;
}

/** A solid collider for a placed object: its world footprint and its top. */
function solid(boxes: Box[], obj: THREE.Object3D): void {
  obj.updateMatrixWorld(true);
  const b = new THREE.Box3().setFromObject(obj);
  boxes.push({ minX: b.min.x, maxX: b.max.x, minZ: b.min.z, maxZ: b.max.z, h: b.max.y });
}

/** Build the Unmown's entrance dressing; push colliders into boxes. */
export function buildUnmownGate(scene: THREE.Scene, boxes: Box[]): void {
  // ---- The entrance sign, facing the lane -----------------------------------------------------------------------------
  if (getPrefab('unmown-sign')) {
    const sign = buildPrefab('unmown-sign', { lights: false });
    sign.rotation.y = SIGN.yaw;
    placeOnGround(sign, SIGN.x, SIGN.z);
    scene.add(shadowed(sign));
    solid(boxes, sign);
  }

  // ---- The swallowed mower: sunk into the ground, tinted rust, grown through by wildflowers and grass -------------------
  if (getPrefab('reel-mower')) {
    const mower = buildPrefab('reel-mower', { lights: false, tint: MOWER_TINT });
    mower.rotation.y = MOWER.yaw;
    placeOnGround(mower, MOWER.x, MOWER.z, -MOWER_SINK, true);
    scene.add(shadowed(mower));
    solid(boxes, mower);
  }
  const around = (id: string, offsets: readonly (readonly [number, number])[]): void => {
    if (!getPrefab(id)) return;
    for (const [dx, dz] of offsets) {
      const p = buildPrefab(id, { lights: false });
      placeOnGround(p, MOWER.x + dx, MOWER.z + dz);
      scene.add(shadowed(p));
    }
  };
  around('wildflower-patch', FLOWERS);
  around('ornamental-grass', GRASSES);
}
