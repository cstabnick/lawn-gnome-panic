// Checks worn gear against the gnome's head and face, so a collar or scarf that clips into the face is caught by code.
// Run: npm test -w packages/gnome (gear-clearance.test.ts lists every neck item and fails on any that clips).
import * as THREE from 'three';
import { buildPrefab, type PrefabDef, type Vec3 } from '@lawn/prefabs';
import { FACE, HEAD, NECK_ANCHOR } from './anatomy';

/** Gear must stay at least this far (world units) outside the head and face features. */
export const MIN_GEAR_GAP = 0.01;

/** Points sampled per triangle edge. Small gear is small, so this is cheap; it catches faces that cut through a sphere. */
const SAMPLES = 6;

export interface GearClearance {
  /** Smallest gap to the head or a face feature. Negative means the gear is inside it. */
  gap: number;
  /** Which sphere is closest, e.g. "head" or "nose". */
  against: string;
}

/**
 * Measures how far the gear's surface is from the head and face, with the gear worn at `anchor` (default: neck).
 * Samples points across every triangle, so a large flat piece that cuts through the head is still caught.
 */
export function gearClearance(gear: string | PrefabDef, anchor: Vec3 = NECK_ANCHOR): GearClearance {
  const root = buildPrefab(gear);
  root.position.set(anchor[0], anchor[1], anchor[2]);
  const holder = new THREE.Group();
  holder.add(root);
  holder.updateMatrixWorld(true);

  const spheres = [{ name: 'head', center: new THREE.Vector3(...HEAD.center), radius: HEAD.radius }, ...FACE.map((f) => ({
    name: f.name, center: new THREE.Vector3(...f.center), radius: f.radius,
  }))];

  let gap = Infinity;
  let against = '';
  const p = new THREE.Vector3();
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();

  root.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return;
    const pos = o.geometry.attributes.position;
    const index = o.geometry.index;
    const vertex = (out: THREE.Vector3, i: number): THREE.Vector3 =>
      out.fromBufferAttribute(pos, index ? index.getX(i) : i).applyMatrix4(o.matrixWorld);
    const triangles = (index ? index.count : pos.count) / 3;
    for (let t = 0; t < triangles; t++) {
      vertex(a, 3 * t);
      vertex(b, 3 * t + 1);
      vertex(c, 3 * t + 2);
      for (let i = 0; i <= SAMPLES; i++) {
        for (let j = 0; j <= SAMPLES - i; j++) {
          const u = i / SAMPLES;
          const w = j / SAMPLES;
          p.copy(a).multiplyScalar(1 - u - w).addScaledVector(b, u).addScaledVector(c, w);
          for (const s of spheres) {
            const d = p.distanceTo(s.center) - s.radius;
            if (d < gap) {
              gap = d;
              against = s.name;
            }
          }
        }
      }
    }
  });
  return { gap, against };
}
