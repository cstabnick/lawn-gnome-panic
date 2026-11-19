// Moving several parts as one: each part's at/rot/scale as a matrix, a delta transform applied to all of them
// (around their shared centre), and the result written back as at/rot/scale. Used by the gizmo and the
// "move / rotate selection" fields.
import * as THREE from 'three';
import type { Part, Vec3 } from '@lawn/prefabs';

const DEG = Math.PI / 180;
const r4 = (n: number): number => {
  const r = Math.round(n * 10000) / 10000;
  return Object.is(r, -0) ? 0 : r;
};

export interface PartPose { at: Vec3; rot?: Vec3; scale?: Vec3 }

/** A part's own transform in prefab space (position, XYZ rotation in degrees, scale). */
export function partMatrix(p: Pick<Part, 'at' | 'rot' | 'scale'>, out = new THREE.Matrix4()): THREE.Matrix4 {
  const at = p.at ?? [0, 0, 0];
  const rot = p.rot ?? [0, 0, 0];
  const s = p.scale ?? [1, 1, 1];
  return out.compose(
    new THREE.Vector3(at[0], at[1], at[2]),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(rot[0] * DEG, rot[1] * DEG, rot[2] * DEG, 'XYZ')),
    new THREE.Vector3(s[0], s[1], s[2]),
  );
}

/** The new pose of a part after `delta` (in prefab space) is applied to the transform it had (`start`). */
export function poseAfter(start: THREE.Matrix4, delta: THREE.Matrix4, had: Pick<Part, 'rot' | 'scale'>): PartPose {
  const m = new THREE.Matrix4().multiplyMatrices(delta, start);
  const pos = new THREE.Vector3();
  const quat = new THREE.Quaternion();
  const scl = new THREE.Vector3();
  m.decompose(pos, quat, scl);
  const e = new THREE.Euler().setFromQuaternion(quat, 'XYZ');
  const rot: Vec3 = [r4(e.x / DEG), r4(e.y / DEG), r4(e.z / DEG)];
  const scale: Vec3 = [r4(scl.x), r4(scl.y), r4(scl.z)];
  const pose: PartPose = { at: [r4(pos.x), r4(pos.y), r4(pos.z)] };
  // Keep the fields a part did not have off it, when they are still at their defaults.
  if (had.rot || rot.some((x) => x !== 0)) pose.rot = rot;
  if (had.scale || scale.some((x) => x !== 1)) pose.scale = scale;
  return pose;
}

/** The middle of the selected parts' positions. */
export function centreOf(parts: readonly Part[], indices: readonly number[]): THREE.Vector3 {
  const c = new THREE.Vector3();
  if (!indices.length) return c;
  for (const i of indices) {
    const at = parts[i]?.at ?? [0, 0, 0];
    c.x += at[0];
    c.y += at[1];
    c.z += at[2];
  }
  return c.divideScalar(indices.length);
}

/** A transform that turns (degrees, XYZ) and scales about `pivot`, then moves by `move`. */
export function deltaAbout(pivot: THREE.Vector3, move: Vec3, rotDeg: Vec3 = [0, 0, 0], scale = 1): THREE.Matrix4 {
  const toOrigin = new THREE.Matrix4().makeTranslation(-pivot.x, -pivot.y, -pivot.z);
  const turn = new THREE.Matrix4().compose(
    new THREE.Vector3(),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(rotDeg[0] * DEG, rotDeg[1] * DEG, rotDeg[2] * DEG, 'XYZ')),
    new THREE.Vector3(scale, scale, scale),
  );
  const back = new THREE.Matrix4().makeTranslation(pivot.x + move[0], pivot.y + move[1], pivot.z + move[2]);
  return back.multiply(turn).multiply(toOrigin);
}

/** Applies `delta` to each listed part, as one rigid group. Returns the new pose per index. */
export function transformParts(parts: readonly Part[], indices: readonly number[], delta: THREE.Matrix4): Map<number, PartPose> {
  const out = new Map<number, PartPose>();
  for (const i of indices) {
    const p = parts[i];
    if (p) out.set(i, poseAfter(partMatrix(p), delta, p));
  }
  return out;
}
