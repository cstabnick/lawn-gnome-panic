// Wader's Rest's static scenery (E17 issue B4): the Standing Lady on her mound, the big tent's shell, the ring of
// tents, the ritual circle, banners, the grey washing, the rota board, reeds, vignettes and signs.
// Everything placed by planWadersRest() goes in one static batch ('waders-rest'); signs live in 'waders-rest-signs'
// and the flat ground marks (worn earth, footprints, the tea puddle) in 'waders-rest-ground'.
import * as THREE from 'three';
import { LAYER, flatLayer } from '@lawn/depth';
import { buildPrefab, getPrefab } from '@lawn/prefabs';
import { buildStaticCells } from '../../cull';
import { prefabBox, textPlate } from '../../homes/pieces';
import { heightAt } from '../../terrain';
import type { Box } from '../../types';
import { WADERS_REST } from '../config';

const N = Math.PI, E = Math.PI / 2, W = -Math.PI / 2;
const WOOD = 0x8a6a42;
const PAPER = 0xf2e8c8;
const { site, centre, lady, circle, bigTent, gate, tentRing, washingLine, teaUrn, rotaBoard, tuesdayBench, saxifrage } =
  WADERS_REST;

/** One static placement (absolute y). Matches StaticPrefabPlacement in cull.ts. */
export interface WadersPlacement { id: string; x: number; y: number; z: number; yaw: number; tint?: number }

const dist = (ax: number, az: number, bx: number, bz: number): number => Math.hypot(ax - bx, az - bz);
/** Distance from (px, pz) to the segment a..b. */
function segDist(px: number, pz: number, ax: number, az: number, bx: number, bz: number): number {
  const dx = bx - ax, dz = bz - az;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / (dx * dx + dz * dz)));
  return Math.hypot(px - (ax + t * dx), pz - (az + t * dz));
}
/** Deterministic scatter in 0..1 (the same every load). */
const hash = (i: number, k: number): number => {
  const s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return s - Math.floor(s);
};
/** The yaw that faces from (x0, z0) toward (x1, z1): facing vector is (sin yaw, cos yaw). */
const yawTo = (x0: number, z0: number, x1: number, z1: number): number => Math.atan2(x1 - x0, z1 - z0);

const rotaYaw = yawTo(rotaBoard.x, rotaBoard.z, circle.x, circle.z);
const benchYaw = yawTo(tuesdayBench.x, tuesdayBench.z, circle.x, circle.z);
const urnYaw = yawTo(teaUrn.x, teaUrn.z, circle.x, circle.z);
const trailYaw = yawTo(circle.x, circle.z, teaUrn.x, teaUrn.z);

/** Prefab ids whose footprint is a solid collider. */
const SOLID_IDS: ReadonlySet<string> = new Set(['flock-tent', 'grey-washing-line', 'reed-tea-urn', 'rota-board', 'tuesday-bench']);

/** Where the reed-bed and clumps must not go (within 10 m). */
const reedBlocked = (x: number, z: number): boolean =>
  dist(x, z, circle.x, circle.z) < 10 || dist(x, z, lady.x, lady.z) < 10 || dist(x, z, bigTent.x, bigTent.z) < 10 ||
  dist(x, z, gate.x, gate.z) < 10 || segDist(x, z, centre.x, centre.z, gate.x, gate.z) < 10;

/** Where a ring tent must not go. */
const ringBlocked = (x: number, z: number): boolean =>
  segDist(x, z, centre.x, centre.z, gate.x, gate.z) < 8 ||
  [washingLine, teaUrn, rotaBoard, tuesdayBench].some((p) => dist(x, z, p.x, p.z) < 8) ||
  dist(x, z, bigTent.x, bigTent.z) < 14 || dist(x, z, lady.x, lady.z) < 12;

/**
 * Every static placement of Wader's Rest, pure (no scene). Ids that the catalogue lacks are kept here and skipped by
 * buildStaticCells. Positions stay inside WADERS_REST.site.
 */
export function planWadersRest(): WadersPlacement[] {
  const out: WadersPlacement[] = [];
  const put = (id: string, x: number, z: number, yaw: number, lift = 0, tint?: number): void => {
    const p: WadersPlacement = { id, x, y: heightAt(x, z) + lift, z, yaw };
    if (tint !== undefined) p.tint = tint;
    out.push(p);
  };

  // The Lady on her sand mound (she sits on the mound's top, ~0.9 m up).
  put('sand-mound', lady.x, lady.z, 0);
  put('standing-lady', lady.x, lady.z, lady.yaw, 0.9);

  // The big tent, door toward the circle and the Lady.
  put('flock-big-tent', bigTent.x, bigTent.z, N);

  // The ritual circle: twelve one-leg stones, facing the centre.
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2;
    const x = circle.x + circle.r * Math.cos(a), z = circle.z + circle.r * Math.sin(a);
    put('one-leg-stone', x, z, yawTo(x, z, circle.x, circle.z));
  }

  // The ring of small tents round the centre; each faces the centre, skipping the blocked spots.
  for (let k = 0; k < tentRing.count; k++) {
    const a = (k / tentRing.count) * Math.PI * 2;
    const x = centre.x + tentRing.r * Math.cos(a), z = centre.z + tentRing.r * Math.sin(a);
    if (ringBlocked(x, z)) continue;
    put('flock-tent', x, z, yawTo(x, z, centre.x, centre.z));
  }

  put('grey-washing-line', washingLine.x, washingLine.z, 0);
  // One pink sock (a pink-tinted towel; there is no sock prefab) pegged apart from the grey washing.
  put('caddie-towel', washingLine.x + 2.2, washingLine.z, 0, 1.85, 0xf08ab0);
  put('reed-tea-urn', teaUrn.x, teaUrn.z, urnYaw);
  put('rota-board', rotaBoard.x, rotaBoard.z, rotaYaw);
  put('tuesday-bench', tuesdayBench.x, tuesdayBench.z, benchYaw);

  // Four banners on the diagonals at radius 14 (skipping any that would stand in Mother Saxifrage's spot).
  for (const [dx, dz] of [[-9.9, -9.9], [9.9, -9.9], [-9.9, 9.9], [9.9, 9.9]] as const) {
    const x = circle.x + dx, z = circle.z + dz;
    if (dist(x, z, saxifrage.x, saxifrage.z) < 3) continue;
    put('flock-banner', x, z, 0);
  }

  // The gate: two banner posts either side of the track.
  put('flock-banner', gate.x, gate.z - 2.5, 0);
  put('flock-banner', gate.x, gate.z + 2.5, 0);

  // A tipped-over cup of reed tea beside the stool (the stool itself is built separately, on its side).
  put('reed-tea-cup', -1191, -698, 0);

  // Reeds: a dense band along the west and south edges, clumps elsewhere, none near the set pieces.
  for (let i = 0; i < 150; i++) {
    const u = hash(i, 1), v = hash(i, 2);
    let x: number, z: number;
    if (i % 2 === 0) {
      if (i % 4 === 0) { x = site.minX + 0.6 + u * 9; z = site.minZ + 0.6 + v * 179; }
      else { x = site.minX + 0.6 + u * 179; z = site.maxZ - 0.6 - v * 9; }
    } else {
      x = site.minX + 8 + u * 164; z = site.minZ + 8 + v * 164;
    }
    if (reedBlocked(x, z)) continue;
    put(i % 3 === 0 ? 'bulrush-clump' : 'reed-clump', x, z, hash(i, 3) * Math.PI * 2);
  }
  return out;
}

/** The world box a solid prefab occupies at (x, z, yaw), rotated the way the game rotates it (AABB of the corners). */
function solidBox(id: string, x: number, z: number, yaw: number, boxes: Box[]): void {
  if (!getPrefab(id)) return;
  const b = prefabBox(id);
  const c = Math.cos(yaw), s = Math.sin(yaw);
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const lx of [b.min.x, b.max.x]) {
    for (const lz of [b.min.z, b.max.z]) {
      const wx = lx * c + lz * s, wz = -lx * s + lz * c;
      minX = Math.min(minX, wx); maxX = Math.max(maxX, wx);
      minZ = Math.min(minZ, wz); maxZ = Math.max(maxZ, wz);
    }
  }
  boxes.push({ minX: x + minX, maxX: x + maxX, minZ: z + minZ, maxZ: z + maxZ, h: heightAt(x, z) + b.max.y });
}

/** A flat disc or ellipse on a draw layer (lifted, never flush with the ground). */
function flatDisc(
  group: THREE.Group, r: number, color: number, layer: number, x: number, z: number,
  sx: number, sz: number, yaw: number, lift: number,
): void {
  const geo = new THREE.CircleGeometry(r, 16);
  geo.rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(geo, flatLayer(new THREE.MeshLambertMaterial({ color }), layer));
  m.position.set(x, heightAt(x, z) + lift, z);
  m.scale.set(sx, 1, sz);
  m.rotation.y = yaw;
  group.add(m);
}

export function buildWadersRest(scene: THREE.Scene, boxes: Box[]): void {
  const plan = planWadersRest();
  scene.add(buildStaticCells(plan, { name: 'waders-rest' }));

  // Colliders: every solid prefab on the plan, the big tent's shell (its door spot left clear) and the Lady's leg.
  for (const p of plan) if (SOLID_IDS.has(p.id)) solidBox(p.id, p.x, p.z, p.yaw, boxes);
  const bt = bigTent;
  boxes.push({ minX: bt.x - 7.5, maxX: bt.x + 7.5, minZ: bt.z - 7.5, maxZ: bt.z + 7.5, h: heightAt(bt.x, bt.z) + 6 });
  boxes.push({
    minX: lady.x - 0.3, maxX: lady.x + 0.3, minZ: lady.z - 0.3, maxZ: lady.z + 0.3, h: heightAt(lady.x, lady.z) + 7,
  });

  const signs = new THREE.Group();
  signs.name = 'waders-rest-signs';
  const ground = new THREE.Group();
  ground.name = 'waders-rest-ground';
  const mat = (color: number): THREE.MeshLambertMaterial => new THREE.MeshLambertMaterial({ color });

  const frontOf = (id: string): number => (getPrefab(id) ? prefabBox(id).max.z : 0.1);
  const plate = (text: string, x: number, y: number, z: number, yaw: number, w: number, h: number, bg = PAPER): void => {
    signs.add(textPlate(text, x, y, z, yaw, { w, h, bg }));
  };
  /** A sign on a wooden stake; the plate stands 0.08 m in front (the way yaw faces). */
  const stake = (text: string, x: number, z: number, yaw: number, w: number, h: number, bg = PAPER, y = 1.4): void => {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.1, y + h / 2, 0.1), mat(WOOD));
    post.position.set(x, heightAt(x, z) + (y + h / 2) / 2, z);
    signs.add(post);
    plate(text, x + Math.sin(yaw) * 0.08, heightAt(x, z) + y, z + Math.cos(yaw) * 0.08, yaw, w, h, bg);
  };

  // The rota board (front faces the circle).
  {
    const d = frontOf('rota-board') + 0.06;
    plate(
      'ROTA\nMon: tea (Sedge)\nTue: NO SITTING\nWed: washing (Bulrush)\nThu: wobble watch (Plover)\nFri: Godwit owes tea\nSat: Godwit owes tea\nSun: stand',
      rotaBoard.x + Math.sin(rotaYaw) * d, heightAt(rotaBoard.x, rotaBoard.z) + 1.0, rotaBoard.z + Math.cos(rotaYaw) * d,
      rotaYaw, 1.4, 1.6,
    );
  }
  // The bench that nobody sits on on Tuesdays.
  {
    const d = frontOf('tuesday-bench') + 0.04;
    plate('NOT TODAY', tuesdayBench.x + Math.sin(benchYaw) * d, heightAt(tuesdayBench.x, tuesdayBench.z) + 0.5,
      tuesdayBench.z + Math.cos(benchYaw) * d, benchYaw, 0.7, 0.22);
  }
  // By the urn (west side, facing west).
  stake('A WOBBLE IS A THOUGHT.\nA THOUGHT IS A CUP.', teaUrn.x - 1.4, teaUrn.z, W, 1.5, 0.5, PAPER, 1.0);
  // By the Lady, outside her mound (facing east, toward the gate).
  stake('PINK IS\nFOR THE LADY ONLY', lady.x + 6, lady.z + 6, E, 1.3, 0.6);
  // The gate sign, and the weathered HOA notice with a note under it.
  stake("WADER'S REST\nVisitors welcome\nPlease stand on one leg", gate.x + 1.6, gate.z - 2.5, E, 1.4, 0.7);
  stake('NOTICE: ORNAMENTS OVER 2 M REQUIRE A PERMIT (HOA 9-f)', gate.x + 1.6, gate.z + 2.5, E, 1.4, 0.6, 0xd9cfae);
  {
    const x = gate.x + 1.6, z = gate.z + 2.5;
    plate('She is not an ornament.\nShe is standing.', x + 0.08, heightAt(x, z) + 0.9, z, E, 1.0, 0.3, 0xf6f0dc);
  }

  // Worn earth under the circle, drawn on the marking layer.
  flatDisc(ground, circle.r + 1, 0x6b5234, LAYER.marking, circle.x, circle.z, 1, 1, 0, 0.03);

  // Vignette 1: a stool tipped on its side far from the circle (someone sat on a Tuesday and fled).
  if (getPrefab('stool')) {
    const s = buildPrefab('stool', { lights: false });
    s.rotation.set(0, 0.7, E, 'YXZ');
    s.position.set(-1195, heightAt(-1195, -700) + 0.25, -700);
    ground.add(s);
  }
  // Vignette 3: one-footed prints from the circle to the tea urn, ending in a puddle of spilled tea.
  for (let i = 0; i < 8; i++) {
    const t = 0.25 + (i / 7) * 0.6;
    const x = circle.x + (teaUrn.x - circle.x) * t + 0.25, z = circle.z + (teaUrn.z - circle.z) * t;
    flatDisc(ground, 0.11, 0x4a3520, LAYER.decal, x, z, 0.8, 1.4, trailYaw, 0.05);
  }
  flatDisc(ground, 0.7, 0x8a6a3a, LAYER.decal,
    circle.x + (teaUrn.x - circle.x) * 0.9 + 0.25, circle.z + (teaUrn.z - circle.z) * 0.9, 1.2, 1, 0, 0.05);
  // Vignette 2: the grey gap under the pink sock where a grey sock should be.
  flatDisc(ground, 0.25, 0x9c9c9c, LAYER.decal, washingLine.x + 2.2, washingLine.z, 0.5, 1, 0, 0.05);

  scene.add(signs);
  scene.add(ground);
}
