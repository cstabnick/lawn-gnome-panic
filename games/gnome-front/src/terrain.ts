// src/terrain.ts: the shape of the battlefield. Everything that stands on the ground asks heightAt(x, z).
// Adapted from games/sample-3d/src/terrain.ts: same rolling lawn, but flat at both bases and every flag.
import * as THREE from 'three';
import { ARENA_HALF, BASES, FLAGS } from './config';
import { ARENA_DOC } from './levelDoc';

/** What shapes the ground: the arena document's mounds and flattening bands, the fence half-size, and where the bases and
 * flags are (the ground stays flat around them). The level editor passes its live, editable copies. */
export interface TerrainSource {
  half: number;
  mounds: readonly { x: number; z: number; r: number; h: number }[];
  flatten: { edge: { inner: number; outer: number }; base: { inner: number; outer: number }; flag: { inner: number; outer: number } };
  bases: readonly { x: number; z: number }[];
  flags: readonly { x: number; z: number }[];
}

function smoothstep(a: number, b: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

/** The ground height function for a terrain source. It reads the source's arrays when it is called, so editing them edits the ground. */
export function makeHeightAt(src: TerrainSource): (x: number, z: number) => number {
  /** 0 where the ground must stay flat (bases, flags, fences), 1 in the open. */
  const flatMask = (x: number, z: number): number => {
    let m = smoothstep(src.flatten.edge.inner, src.flatten.edge.outer, src.half - Math.max(Math.abs(x), Math.abs(z)));
    for (const b of src.bases) m *= smoothstep(src.flatten.base.inner, src.flatten.base.outer, Math.hypot(x - b.x, z - b.z));
    for (const f of src.flags) m *= smoothstep(src.flatten.flag.inner, src.flatten.flag.outer, Math.hypot(x - f.x, z - f.z));
    return m;
  };
  return (x, z) => {
    const m = flatMask(x, z);
    if (m <= 0) return 0;
    let h =
      1.8 * Math.sin(x * 0.03 + 1.3) * Math.cos(z * 0.025 - 0.4) +
      1.0 * Math.sin(x * 0.06 + z * 0.045) +
      0.4 * Math.sin(x * 0.13 - z * 0.11);
    for (const f of src.mounds) {
      const d2 = (x - f.x) * (x - f.x) + (z - f.z) * (z - f.z);
      h += f.h * Math.exp(-d2 / (f.r * f.r));
    }
    return h * m;
  };
}

/** Ground height at (x, z) in the game. 0 on the flat parts; roughly -3..+12 elsewhere. */
export const heightAt = makeHeightAt({ half: ARENA_HALF, mounds: ARENA_DOC.data.mounds, flatten: ARENA_DOC.data.flatten, bases: BASES, flags: FLAGS });

/** Ground normal at (x, z), written into `out` (also returned). */
export function normalAt(x: number, z: number, out: THREE.Vector3 = new THREE.Vector3()): THREE.Vector3 {
  const e = 0.5;
  const dx = heightAt(x + e, z) - heightAt(x - e, z);
  const dz = heightAt(x, z + e) - heightAt(x, z - e);
  return out.set(-dx, 2 * e, -dz).normalize();
}
