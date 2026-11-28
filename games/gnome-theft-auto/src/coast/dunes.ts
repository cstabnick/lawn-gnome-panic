// Saltbucket's dunes and its bucket (FX11, G3#5 / D14): the rim of the giant sunk Tall-One bucket breaking the sand round
// the coast spur, its handle arching over the spur as the town's gateway, the Tall One's spade stuck in a dune, and the
// dune band (terrain stamps) dressed with marram grass and a weathered picket fence.
import * as THREE from 'three';
import { mulberry32 } from '@lawn/level';
import { buildPrefab, buildPrefabInstances, getPrefab } from '@lawn/prefabs';
import type { Box } from '../types';
import { registerCull } from '../cull';
import { heightAt } from '../terrain';
import { waterDepthAt } from '../water';
import { COAST, type Rect } from './config';
import { shadowed } from './deckKit';

/** The Spokewheel's site (x -300..-220, z 1060..1140): no grass, no fence. */
const WHEEL_SITE: Rect = { minX: -300, maxX: -220, minZ: 1060, maxZ: 1140 };
/** Rim middle height in local units (giant-bucket-rim-arc about: 0.19 at the middle). */
const RIM_TOP = 0.19;
/** The rim arcs are stretched upwards so the bucket's wall shows as a wall, not a kerb, from the road. */
const RIM_STRETCH = 1.8;
const RIM_ARC = Math.PI / 3;

const inRect = (r: Rect, x: number, z: number, m = 0): boolean => x > r.minX - m && x < r.maxX + m && z > r.minZ - m && z < r.maxZ + m;

/** True where nothing may grow or stand: the deck, the wheel site, the sand path to the boardwalk, or water. */
export function dunesBlocked(x: number, z: number, margin = 1.5): boolean {
  if (inRect(COAST.boardwalk.rect, x, z, margin)) return true;
  if (inRect(WHEEL_SITE, x, z, margin)) return true;
  if (Math.abs(x) < COAST.dunes.gapHalf && z > 1030 && z < 1102) return true;
  for (const [dx, dz] of [[0, 0], [4, 0], [-4, 0], [0, 4], [0, -4]]) if (waterDepthAt(x + dx, z + dz) > 0.02) return true;
  return false;
}

/** How far above its surroundings the ground is at (x, z): positive on a crest, negative in a saddle. */
function crestAt(x: number, z: number): number {
  let sum = 0;
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; sum += heightAt(x + Math.cos(a) * 9, z + Math.sin(a) * 9); }
  return heightAt(x, z) - sum / 8;
}

export interface MarramSpot { x: number; z: number; yaw: number; scale: number }

/** Marram tufts in clumps on the dune band (denser on crests and the landward side), deterministic. */
export function marramSpots(): MarramSpot[] {
  const D = COAST.dunes;
  const rnd = mulberry32(0x5a17b0);
  const out: MarramSpot[] = [];
  const clump = (cx: number, cz: number, n: number, spread: number): void => {
    for (let i = 0; i < n && out.length < 500; i++) {
      const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * spread;
      const x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d * 0.8;
      if (dunesBlocked(x, z)) continue;
      out.push({ x, z, yaw: rnd() * Math.PI * 2, scale: 2 + rnd() * 1.8 });
    }
  };
  const tryCentres = (count: number, minX: number, maxX: number): void => {
    for (let tries = 0, got = 0; got < count && tries < count * 40; tries++) {
      const x = minX + rnd() * (maxX - minX), z = D.minZ + rnd() * (D.maxZ - D.minZ);
      if (dunesBlocked(x, z, 3)) continue;
      const landward = 1 - (z - D.minZ) / (D.maxZ - D.minZ);
      const p = Math.min(1, Math.max(0.12, 0.45 + 0.4 * crestAt(x, z) + 0.35 * landward));
      if (rnd() > p) continue;
      clump(x, z, 3 + Math.floor(rnd() * 4), 4.5);
      got++;
    }
  };
  tryCentres(84, -330, 330); // the stretch the player sees
  tryCentres(8, -D.maxX, -330);
  tryCentres(8, 330, D.maxX);
  // A few clumps on the sand along the boardwalk's north edge and by the wheel.
  const B = COAST.boardwalk.rect;
  for (let i = 0; i < 7; i++) {
    const x = B.minX + 14 + rnd() * (B.maxX - B.minX - 28);
    if (Math.abs(x) < D.gapHalf + 3) continue;
    clump(x, B.minZ - 2.6 - rnd() * 1.4, 2, 1.8);
  }
  for (const [cx, cz] of [[-312, 1090], [-314, 1118], [-212, 1098], [-209, 1130], [-306, 1148]]) clump(cx, cz, 3, 3);
  return out;
}

export interface FenceSpot { x: number; z: number; yaw: number; lean: number }

/** Sections of weathered dune fence along the dunes' south foot, in runs with gaps, deterministic. Each is 4 m long (scale 2). */
export function fenceSpots(): FenceSpot[] {
  const rnd = mulberry32(0xfe7ce5);
  const out: FenceSpot[] = [];
  const LEN = 4;
  let x = -1000 + rnd() * 60;
  while (x < 1000) {
    const near = Math.abs(x) < 420;
    const sections = 4 + Math.floor(rnd() * 7);
    const z0 = 1071 + rnd() * 2.5, drift = (rnd() - 0.5) * 0.04, yaw0 = (rnd() - 0.5) * 0.08;
    for (let i = 0; i < sections; i++) {
      const sx = x + i * LEN;
      const z = z0 + drift * i * LEN + (rnd() - 0.5) * 0.3;
      if (dunesBlocked(sx, z, 3) || dunesBlocked(sx + LEN, z, 3) || Math.abs(sx + LEN / 2) < COAST.dunes.gapHalf + 4) continue;
      out.push({ x: sx + LEN / 2, z, yaw: yaw0 + (rnd() - 0.5) * 0.1, lean: rnd() < 0.2 ? (rnd() - 0.5) * 0.3 : 0 });
    }
    x += sections * LEN + (near ? 10 + rnd() * 30 : 60 + rnd() * 140);
  }
  return out;
}

/** The sampled ground along one rim arc: lowest and highest height. */
function groundRange(cx: number, cz: number, sign: number, r: number): { lo: number; hi: number } {
  let lo = Infinity, hi = -Infinity;
  for (let i = 0; i <= 16; i++) {
    const a = -RIM_ARC + (i / 16) * 2 * RIM_ARC;
    const h = heightAt(cx + sign * r * Math.cos(a) - sign * r, cz + sign * r * Math.sin(a));
    lo = Math.min(lo, h); hi = Math.max(hi, h);
  }
  return { lo, hi };
}

function buildBucket(scene: THREE.Scene, boxes: Box[]): void {
  const { x: bx, z: bz, r } = COAST.bucket;
  const rimTop = RIM_TOP * r * RIM_STRETCH;
  let midGround = 0;
  for (const sign of [1, -1]) {
    if (!getPrefab('giant-bucket-rim-arc')) break;
    const ox = bx + sign * r, { lo, hi } = groundRange(ox, bz, sign, r);
    // Sink the rim so about 2.6 m of it shows over the lowest sand and it never hides under the highest.
    const base = Math.min(lo - 1.2, hi + 1 - rimTop);
    midGround += heightAt(ox, bz);
    const arc = buildPrefab('giant-bucket-rim-arc', { lights: false, scale: r });
    arc.scale.y = r * RIM_STRETCH;
    arc.position.set(ox, base, bz);
    arc.rotation.y = sign > 0 ? 0 : Math.PI;
    scene.add(shadowed(arc));
    registerCull(arc, 'landmark');
    // Four sections along the arc; skip those whose rim barely clears the sand.
    for (let k = 0; k < 4; k++) {
      const a0 = -RIM_ARC + (k / 4) * 2 * RIM_ARC, a1 = -RIM_ARC + ((k + 1) / 4) * 2 * RIM_ARC;
      const am = (a0 + a1) / 2;
      const top = base + rimTop * Math.max(0, 1 - (am / RIM_ARC) ** 2);
      const ground = Math.max(heightAt(bx + sign * r * Math.cos(a0), bz + sign * r * Math.sin(a0)), heightAt(bx + sign * r * Math.cos(a1), bz + sign * r * Math.sin(a1)));
      if (top - ground < 1) continue;
      const xs = [a0, am, a1].map((a) => bx + sign * r * Math.cos(a)), zs = [a0, am, a1].map((a) => bz + sign * r * Math.sin(a));
      boxes.push({ minX: Math.min(...xs) - 0.7, maxX: Math.max(...xs) + 0.7, minZ: Math.min(...zs) - 0.7, maxZ: Math.max(...zs) + 0.7, h: top });
    }
  }
  if (getPrefab('giant-bucket-handle')) {
    // The feet hook onto the lugs at the rims' middles (rim top there is about 2 m over the sand, minus a little).
    const rimMid = (midGround / 2) - 1.2 + rimTop;
    const h = buildPrefab('giant-bucket-handle', { lights: false, scale: r });
    h.position.set(bx, rimMid - 0.05 * r - 0.6, bz);
    scene.add(shadowed(h));
    registerCull(h, 'landmark');
    for (const sign of [1, -1]) boxes.push({ minX: bx + sign * r - 1.1, maxX: bx + sign * r + 1.1, minZ: bz - 1.1, maxZ: bz + 1.1, h: rimMid + 4 });
  }
}

function buildSpade(scene: THREE.Scene, boxes: Box[]): void {
  if (!getPrefab('giant-spade')) return;
  const S = COAST.spade;
  const g = buildPrefab('giant-spade', { lights: false, scale: 13 });
  const y = heightAt(S.x, S.z) - 1.0;
  g.position.set(S.x, y, S.z);
  g.rotation.set(0, S.yaw, 0.12, 'YXZ');
  scene.add(shadowed(g));
  registerCull(g, 'prop');
  boxes.push({ minX: S.x - 1, maxX: S.x + 1, minZ: S.z - 0.9, maxZ: S.z + 0.9, h: y + 18 });
}

function buildMarram(scene: THREE.Scene): void {
  if (!getPrefab('marram-grass')) return;
  const spots = marramSpots().sort((a, b) => a.x - b.x);
  const groups = 6, per = Math.ceil(spots.length / groups);
  const q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), s = new THREE.Vector3();
  for (let g = 0; g < groups; g++) {
    const part = spots.slice(g * per, (g + 1) * per);
    if (part.length === 0) continue;
    const ms = part.map((m) => {
      e.set(0, m.yaw, 0);
      return new THREE.Matrix4().compose(p.set(m.x, heightAt(m.x, m.z) - 0.03, m.z), q.setFromEuler(e), s.setScalar(m.scale));
    });
    const inst = buildPrefabInstances('marram-grass', ms);
    scene.add(inst);
    registerCull(inst, 'prop');
  }
}

function buildFence(scene: THREE.Scene): void {
  if (!getPrefab('dune-fence')) return;
  const spots = fenceSpots();
  if (spots.length === 0) return;
  const q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), s = new THREE.Vector3(2, 2, 2);
  const groups = 4, per = Math.ceil(spots.length / groups);
  for (let g = 0; g < groups; g++) {
    const part = spots.slice(g * per, (g + 1) * per);
    if (part.length === 0) continue;
    const ms = part.map((f) => {
      const tilt = Math.atan2(heightAt(f.x + 2, f.z) - heightAt(f.x - 2, f.z), 4);
      e.set(f.lean, f.yaw, tilt, 'YXZ');
      return new THREE.Matrix4().compose(p.set(f.x, heightAt(f.x, f.z) - 0.05, f.z), q.setFromEuler(e), s);
    });
    const inst = buildPrefabInstances('dune-fence', ms);
    scene.add(inst);
    registerCull(inst, 'prop');
  }
}

/** Static scenery: the bucket rim, handle and spade, marram grass and the dune fence. */
export function buildDunes(scene: THREE.Scene, boxes: Box[]): void {
  buildBucket(scene, boxes);
  buildSpade(scene, boxes);
  buildMarram(scene);
  buildFence(scene);
}
