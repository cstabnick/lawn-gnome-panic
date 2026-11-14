// src/terrain.ts: the shape of the battlefield. Everything that stands on the ground asks heightAt(x, z).
// Adapted from games/sample-3d/src/terrain.ts: same rolling lawn, but flat at both bases and every flag.
import * as THREE from 'three';
import { ARENA_HALF, BASES, FLAGS } from './config';

/** Landmark mounds (and one dip): centre, radius, height. */
const FEATURES: readonly { x: number; z: number; r: number; h: number }[] = [
  { x: -30, z: 45, r: 22, h: 7 },
  { x: 35, z: -40, r: 24, h: 8 },
  { x: -110, z: 0, r: 30, h: 10 },
  { x: 110, z: 5, r: 28, h: 9 },
  { x: 40, z: 95, r: 18, h: 5 },
  { x: -40, z: -95, r: 18, h: 5 },
  { x: -20, z: -20, r: 14, h: -3 },
];

function smoothstep(a: number, b: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

/** 0 where the ground must stay flat (bases, flags, fences), 1 in the open. */
function flatMask(x: number, z: number): number {
  let m = smoothstep(4, 20, ARENA_HALF - Math.max(Math.abs(x), Math.abs(z)));
  for (const b of BASES) m *= smoothstep(22, 40, Math.hypot(x - b.x, z - b.z));
  for (const f of FLAGS) m *= smoothstep(12, 24, Math.hypot(x - f.x, z - f.z));
  return m;
}

/** Ground height at (x, z). 0 on the flat parts; roughly -3..+12 elsewhere. */
export function heightAt(x: number, z: number): number {
  const m = flatMask(x, z);
  if (m <= 0) return 0;
  let h =
    1.8 * Math.sin(x * 0.03 + 1.3) * Math.cos(z * 0.025 - 0.4) +
    1.0 * Math.sin(x * 0.06 + z * 0.045) +
    0.4 * Math.sin(x * 0.13 - z * 0.11);
  for (const f of FEATURES) {
    const d2 = (x - f.x) * (x - f.x) + (z - f.z) * (z - f.z);
    h += f.h * Math.exp(-d2 / (f.r * f.r));
  }
  return h * m;
}

/** Ground normal at (x, z), written into `out` (also returned). */
export function normalAt(x: number, z: number, out: THREE.Vector3 = new THREE.Vector3()): THREE.Vector3 {
  const e = 0.5;
  const dx = heightAt(x + e, z) - heightAt(x - e, z);
  const dz = heightAt(x, z + e) - heightAt(x, z - e);
  return out.set(-dx, 2 * e, -dz).normalize();
}
