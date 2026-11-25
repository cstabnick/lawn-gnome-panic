// Reedmere (E31): reed beds round the marsh water, the raised boardwalk and the viewing platform.
import type * as THREE from 'three';
import type { Box } from '../types';
import { buildStaticCells } from '../cull';
import { heightAt, waterAt } from '../terrain';
import { addRooftop, rooftopById } from '../interiors/rooftops';
import { BOARDWALK, BOARDWALK_WIDTH, DECK_Y, PLATFORM } from '../living/config';

/** The marsh water rectangle (water/reedmere). */
const WATER = { minX: -1260, maxX: -1040, minZ: -1705, maxZ: -1605 } as const;
/** The Reedmere Hide: reeds keep 6 m clear of it. */
const HIDE = { x: -1050, z: -1550 } as const;
const SECTION = 2.96;

type Pt = readonly [number, number];

function distToSegment(px: number, pz: number, a: Pt, b: Pt): number {
  const dx = b[0] - a[0], dz = b[1] - a[1];
  const t = Math.max(0, Math.min(1, ((px - a[0]) * dx + (pz - a[1]) * dz) / (dx * dx + dz * dz)));
  return Math.hypot(px - (a[0] + t * dx), pz - (a[1] + t * dz));
}

function platformRect(margin: number) {
  return { minX: PLATFORM.x - PLATFORM.w / 2 - margin, maxX: PLATFORM.x + PLATFORM.w / 2 + margin,
    minZ: PLATFORM.z - PLATFORM.d / 2 - margin, maxZ: PLATFORM.z + PLATFORM.d / 2 + margin };
}

/** Distance from (x, z) to the nearest boardwalk leg or the platform (0 inside the platform). */
export function distToBoardwalk(x: number, z: number): number {
  let best = Infinity;
  for (let i = 0; i + 1 < BOARDWALK.length; i++) best = Math.min(best, distToSegment(x, z, BOARDWALK[i], BOARDWALK[i + 1]));
  const r = platformRect(0);
  const dx = Math.max(r.minX - x, 0, x - r.maxX), dz = Math.max(r.minZ - z, 0, z - r.maxZ);
  return Math.min(best, Math.hypot(dx, dz));
}

function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The reed placements (deterministic): a ring 8 m inside to 6 m outside the water edge, clear of the boardwalk and the hide. */
export function planReeds(): { x: number; z: number; id: string }[] {
  const rand = rng(31031);
  const out: { x: number; z: number; id: string }[] = [];
  const W = WATER;
  for (let tries = 0; tries < 4000 && out.length < 170; tries++) {
    const x = W.minX - 6 + rand() * (W.maxX - W.minX + 12);
    const z = W.minZ - 6 + rand() * (W.maxZ - W.minZ + 12);
    const inner = x > W.minX + 8 && x < W.maxX - 8 && z > W.minZ + 8 && z < W.maxZ - 8;
    const id = rand() < 0.65 ? 'reed-clump' : 'bulrush-clump';
    if (inner) continue;
    if (distToBoardwalk(x, z) < 4) continue;
    if (Math.hypot(x - HIDE.x, z - HIDE.z) < 6) continue;
    out.push({ x, z, id });
  }
  return out;
}

/** The single deck level: highest water surface or ground along every leg, plus DECK_Y. */
function deckTopLevel(): number {
  let top = -Infinity;
  const sample = (x: number, z: number) => { top = Math.max(top, waterAt(x, z)?.surface ?? heightAt(x, z)); };
  for (let i = 0; i + 1 < BOARDWALK.length; i++) {
    const [ax, az] = BOARDWALK[i], [bx, bz] = BOARDWALK[i + 1];
    const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / 2));
    for (let k = 0; k <= n; k++) sample(ax + ((bx - ax) * k) / n, az + ((bz - az) * k) / n);
  }
  sample(PLATFORM.x, PLATFORM.z);
  return top + DECK_Y;
}

/** Builds the Reedmere boardwalk, platform and reeds. Pushes its colliders into `boxes`. Runs once from living/build.ts during the world build (also in tests: no DOM). */
export function buildReedmere(scene: THREE.Scene, boxes: Box[]): void {
  const deckTop = deckTopLevel();
  const hw = BOARDWALK_WIDTH / 2;
  const walk: { id: string; name: string; minX: number; maxX: number; minZ: number; maxZ: number; y: number }[] = [];
  const deck: { id: string; x: number; y: number; z: number; yaw?: number }[] = [];
  const walkRect = (id: string, name: string, minX: number, maxX: number, minZ: number, maxZ: number, y: number) => walk.push({ id, name, minX, maxX, minZ, maxZ, y });

  const legs = BOARDWALK.length - 1;
  for (let i = 0; i < legs; i++) {
    const [ax, az] = BOARDWALK[i], [bx, bz] = BOARDWALK[i + 1];
    const alongZ = ax === bx;
    const dir = alongZ ? Math.sign(bz - az) : Math.sign(bx - ax);
    const len = alongZ ? Math.abs(bz - az) : Math.abs(bx - ax);
    const lift = i * 0.02; // legs overlap at corners: separate their coplanar tops
    const n = Math.ceil(len / SECTION);
    for (let k = 0; k < n; k++) {
      const d = (k + 0.5) * SECTION * dir;
      deck.push({ id: 'marsh-boardwalk-deck', x: alongZ ? ax : ax + d, y: deckTop - 1.0 + lift, z: alongZ ? az + d : az, yaw: alongZ ? 0 : Math.PI / 2 });
    }
    // Rails: both sides, skipping sections near the joins with the neighbouring legs.
    const openStart = i > 0 ? 2.5 : 0, openEnd = i < legs - 1 ? 2.5 : 0;
    for (const side of [-1, 1]) {
      const off = side * (hw - 0.05);
      for (let k = 0; k < n; k++) {
        const c = (k + 0.5) * SECTION;
        if (c < openStart || c > len - openEnd) continue;
        const d = c * dir;
        deck.push({ id: 'marsh-boardwalk-rail', x: alongZ ? ax + off : ax + d, y: deckTop + lift, z: alongZ ? az + d : az + off, yaw: alongZ ? 0 : Math.PI / 2 });
      }
      const s0 = openStart, s1 = len - openEnd;
      const lo = Math.min(s0 * dir, s1 * dir), hi = Math.max(s0 * dir, s1 * dir);
      if (alongZ) boxes.push({ minX: ax + off - 0.05, maxX: ax + off + 0.05, minZ: az + lo, maxZ: az + hi, h: deckTop + 1.0 });
      else boxes.push({ minX: ax + lo, maxX: ax + hi, minZ: az + off - 0.05, maxZ: az + off + 0.05, h: deckTop + 1.0 });
    }
    // Walkable rectangle: from leg start to end, the last leg runs on into the platform.
    const end = i === legs - 1 ? len + 1 : len;
    const a = dir > 0 ? 0 : -end, b = dir > 0 ? end : 0;
    if (alongZ) walkRect(`reedmere-walk-${i + 1}`, `Reedmere boardwalk ${i + 1}`, ax - hw, ax + hw, az + a, az + b, deckTop);
    else walkRect(`reedmere-walk-${i + 1}`, `Reedmere boardwalk ${i + 1}`, ax + a, ax + b, az - hw, az + hw, deckTop);
  }

  // Steps up from the shore at the start of the first leg (the land side is +z of BOARDWALK[0]).
  const [sx, sz] = BOARDWALK[0];
  const ground = heightAt(sx, sz + 2 * SECTION);
  const nSteps = 4;
  const rise = Math.min(0.3, Math.max(0.05, (deckTop - ground) / (nSteps + 1)));
  for (let k = 1; k <= nSteps; k++) {
    const top = deckTop - k * rise;
    const z0 = sz + (k - 1) * SECTION, z1 = sz + k * SECTION + 0.02 * k;
    deck.push({ id: 'marsh-boardwalk-deck', x: sx, y: top - 1.0, z: sz + (k - 0.5) * SECTION + 0.01 * k, yaw: 0 });
    walkRect(`reedmere-step-${k}`, 'Reedmere step', sx - hw, sx + hw, z0 + 0.02, z1, top);
  }

  // Viewing platform: open side (-z in the prefab) faces the boardwalk, which arrives from the south (+z): yaw PI.
  const platY = deckTop - 1.0 + legs * 0.02 + 0.02;
  deck.push({ id: 'viewing-platform', x: PLATFORM.x, y: platY, z: PLATFORM.z, yaw: Math.PI });
  const pr = platformRect(0);
  walkRect('reedmere-platform', 'Reedmere viewing platform', pr.minX, pr.maxX, pr.minZ, pr.maxZ, deckTop);
  // Vignette: a forgotten flask and a sketchbook on the bench (far side, the prefab's +z becomes -z).
  const vy = deckTop + legs * 0.02 + 0.02;
  deck.push({ id: 'honeydew-flask', x: PLATFORM.x - 0.5, y: vy + 0.45, z: PLATFORM.z - 2.4, yaw: 0.6 });
  deck.push({ id: 'red-book', x: PLATFORM.x + 0.4, y: vy + 0.45, z: PLATFORM.z - 2.4, yaw: Math.PI });

  for (const w of walk) {
    if (!rooftopById(w.id)) addRooftop({ ...w, solid: false, parapet: false });
  }
  scene.add(buildStaticCells(deck, { name: 'reedmere-boardwalk' }));

  const reeds = planReeds().map((p) => ({ id: p.id, x: p.x, y: heightAt(p.x, p.z), z: p.z, yaw: ((p.x * 7 + p.z * 13) % 6.28) }));
  scene.add(buildStaticCells(reeds, { name: 'reedmere-reeds' }));
}
