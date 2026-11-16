// Tree placement for the island: the trees world.ts draws and obstacles.ts collides with. Pure data, built once
// at module load from fixed seeds, so drawing and collisions use the same trees. No scene, no three.js objects.
import type { XYZ } from './config';
import { HOLES } from './config';
import { coastRadius, distToCoast, distToPath, heightAt, lieAt } from './course';

export interface Plant { x: number; y: number; z: number; s: number; yaw: number }
export interface BigTree { x: number; z: number; s: number; yaw: number }

/** Seeded RNG (mulberry32): the same seed always gives the same sequence. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Pine tiers: height above the ground (x tree scale), leaf radius and cone height. */
export const PINE_TIER_Y = [10, 15, 20];
export const PINE_TIER_R = [6, 4.5, 3];
export const PINE_TIER_H = [9, 8, 6];
/** Oak side lobes: local offsets (x, y, z) scaled by the tree size; z is along the tree's facing. */
export const OAK_LOBES: [number, number, number][] = [[5, 14, 1], [-5, 12, -1]];

/** World positions of an oak's two side lobes (centres), for drawing and collisions. */
export function lobeCentres(t: BigTree): XYZ[] {
  const gy = heightAt(t.x, t.z);
  const c = Math.cos(t.yaw);
  const sn = Math.sin(t.yaw);
  return OAK_LOBES.map(([lx, ly, lz]) => ({
    x: t.x + (lx * c + lz * sn) * t.s,
    y: gy + ly * t.s,
    z: t.z + (-lx * sn + lz * c) * t.s,
  }));
}

const OAK_N = 70;
const PINE_N = 60;

// ---- Broadleaf trees and palms (seed 7) ----------------------------------
const rand7 = mulberry32(7);

const clearOfHoles = (x: number, z: number): boolean => {
  if (lieAt(x, z) !== 'rough') return false;
  if (distToCoast(x, z) <= 25) return false;
  for (const hole of HOLES) {
    if (distToPath(hole, x, z).dist <= hole.fairwayWidth / 2 + 12) return false;
    if (Math.hypot(x - hole.green.x, z - hole.green.z) <= 30) return false;
    if (Math.hypot(x - hole.tee.x, z - hole.tee.z) <= 30) return false;
  }
  return true;
};

const broadleaf: Plant[] = [];
for (let n = 0; n < 700; n++) {
  const x = -640 + rand7() * 1280;
  const z = -510 + rand7() * 1020;
  if (!clearOfHoles(x, z)) continue;
  broadleaf.push({ x, y: heightAt(x, z), z, s: 0.8 + rand7() * 0.5, yaw: rand7() * Math.PI * 2 });
}

// Palms: pick an angle and a distance in from the coast (4..24 yd), so each one lands in the band.
const palms: Plant[] = [];
for (let n = 0; palms.length < 160 && n < 5000; n++) {
  const th = rand7() * Math.PI * 2;
  const d = 4 + rand7() * 20;
  const r = coastRadius(th) - d;
  const x = r * Math.cos(th);
  const z = r * Math.sin(th);
  if (lieAt(x, z) === 'water') continue;
  palms.push({ x, y: heightAt(x, z), z, s: 0.8 + rand7() * 0.5, yaw: rand7() * Math.PI * 2 });
}

// ---- Big trees: giant oaks and tall pines (seed 21) ----------------------
// Backdrops first (2 per hole, behind each green), then random fill, both drawing from the same 70 oak / 60 pine budget.
const bigRand = mulberry32(21);
const oaks: BigTree[] = [];
const pines: BigTree[] = [];

const bigSpot = (x: number, z: number): boolean => {
  if (lieAt(x, z) !== 'rough') return false;
  if (distToCoast(x, z) <= 40) return false;
  for (const hole of HOLES) {
    if (distToPath(hole, x, z).dist <= hole.fairwayWidth / 2 + 28) return false;
    if (Math.hypot(x - hole.green.x, z - hole.green.z) <= 45) return false;
    if (Math.hypot(x - hole.tee.x, z - hole.tee.z) <= 45) return false;
  }
  for (const t of oaks) if (Math.hypot(x - t.x, z - t.z) < 18) return false;
  for (const t of pines) if (Math.hypot(x - t.x, z - t.z) < 18) return false;
  return true;
};
const pickKind = (): 'oak' | 'pine' => {
  if (oaks.length >= OAK_N) return 'pine';
  if (pines.length >= PINE_N) return 'oak';
  return bigRand() < 0.5 ? 'oak' : 'pine';
};
const addBig = (kind: 'oak' | 'pine', x: number, z: number): void => {
  const t: BigTree = { x, z, s: 0.85 + bigRand() * 0.45, yaw: bigRand() * Math.PI * 2 };
  (kind === 'oak' ? oaks : pines).push(t);
};

// Backdrops: 2 per hole, 55..80 yd beyond the green centre, within 25 deg of the last-corner-to-green direction.
for (const hole of HOLES) {
  const last = hole.path[hole.path.length - 2];
  const g = hole.green;
  const base = Math.atan2(g.x - last.x, g.z - last.z);
  for (let k = 0; k < 2; k++) {
    for (let tries = 0; tries < 60; tries++) {
      const a = base + (bigRand() * 2 - 1) * (25 * Math.PI / 180);
      const d = 55 + bigRand() * 25;
      const x = g.x + Math.sin(a) * d;
      const z = g.z + Math.cos(a) * d;
      if (!bigSpot(x, z)) continue;
      addBig(pickKind(), x, z);
      break;
    }
  }
}

// Random fill over the island until both budgets are full.
for (let n = 0; (oaks.length < OAK_N || pines.length < PINE_N) && n < 20000; n++) {
  const x = -640 + bigRand() * 1280;
  const z = -510 + bigRand() * 1020;
  if (!bigSpot(x, z)) continue;
  addBig(pickKind(), x, z);
}

/** Every tree on the island. Built once; drawing (world.ts) and collisions (obstacles.ts) read these. */
export const TREES: { broadleaf: Plant[]; palms: Plant[]; oaks: BigTree[]; pines: BigTree[] } = {
  broadleaf,
  palms,
  oaks,
  pines,
};
