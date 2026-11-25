// Saltbucket Boardwalk and Long Spoon Pier (E11 issue 2A). The plank promenade (deck, south railing, stairs, six stalls,
// lamps, benches, joke signs, beach dressing) and the walkable spoon-shaped pier (spur, handle, bowl, posts, rails,
// Marram's hut). Geometry is merged per material and per 60 m chunk along x so the cull system can drop far parts.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { buildPrefab, getPrefab } from '@lawn/prefabs';
import type { Box } from '../types';
import { heightAt } from '../terrain';
import { placeOnGround } from '../terrainMesh';
import { waterBedAt } from '../water';
import { addRooftop, rooftopById } from '../interiors/rooftops';
import { COAST } from './config';
import { coastSign, type CoastSignOpts } from './sign';

const CHUNK = 60;
const PLANK = 1.2;
const DECK_THICK = 0.3;
const PIER_THICK = 0.4;
/** Stairs down to the sand (x centres), their width, and the south railing's z. */
const STAIR_X = [-120, 0, 120] as const;
const STAIR_W = 4;
const RAIL_INSET = 0.7;

/**
 * Planks painted across a slab: `n` boards of two wood tones with a dark seam, along u (stripes = x on a box's top face)
 * or along v (stripes = z). Null without a DOM (tests), then the slab is plain wood.
 */
function plankTexture(n: number, a: number, b: number, alongV: boolean): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = alongV ? 8 : 1024;
  c.height = alongV ? 1024 : 8;
  const g = c.getContext('2d');
  if (!g) return null;
  const hex = (v: number): string => '#' + v.toString(16).padStart(6, '0');
  const step = 1024 / n;
  for (let i = 0; i < n; i++) {
    g.fillStyle = hex(i % 2 === 0 ? a : b);
    if (alongV) g.fillRect(0, i * step, 8, step); else g.fillRect(i * step, 0, step, 8);
    g.fillStyle = '#3b2a1a';
    if (alongV) g.fillRect(0, i * step, 8, Math.max(1, step * 0.06)); else g.fillRect(i * step, 0, Math.max(1, step * 0.06), 8);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const deckMat = (n: number, a: number, b: number, alongV: boolean): THREE.MeshStandardMaterial => {
  const map = plankTexture(n, a, b, alongV);
  return map ? new THREE.MeshStandardMaterial({ map, roughness: 0.92 }) : new THREE.MeshStandardMaterial({ color: a, roughness: 0.92 });
};

const MATS: Record<string, THREE.MeshStandardMaterial> = {
  woodA: deckMat(25, 0x9c7248, 0x86603a, false),
  pierWoodZ: deckMat(25, 0x8f6b45, 0x7c5a38, true),
  woodB: new THREE.MeshStandardMaterial({ color: 0x86603a, roughness: 0.92 }),
  rail: new THREE.MeshStandardMaterial({ color: 0xe6dcc6, roughness: 0.85 }),
  step: new THREE.MeshStandardMaterial({ color: 0x7a5a3a, roughness: 0.95 }),
  skirt: new THREE.MeshStandardMaterial({ color: 0x4f3a27, roughness: 0.95 }),
  steel: new THREE.MeshStandardMaterial({ color: 0x7f8a94, roughness: 0.4, metalness: 0.6 }),
  silver: new THREE.MeshStandardMaterial({ color: 0xc3ced6, roughness: 0.25, metalness: 0.7 }),
  pierWood: deckMat(22, 0x8f6b45, 0x7c5a38, false),
  pierWoodB: new THREE.MeshStandardMaterial({ color: 0x7c5a38, roughness: 0.92 }),
};

const STALL_TINTS = [0xe8453c, 0x4fa3d9, 0x6bbf59, 0xf2a93b, 0x9b6bd1, 0x2fb8a8];

/** Merged-geometry bins: material key + chunk -> geometries. */
class Bins {
  private readonly bins = new Map<string, THREE.BufferGeometry[]>();

  add(mat: string, geo: THREE.BufferGeometry, x: number): void {
    const key = `${mat}|${Math.floor((x + 210) / CHUNK)}`;
    const list = this.bins.get(key);
    if (list) list.push(geo); else this.bins.set(key, [geo]);
  }

  /** An axis-aligned box from min to max corners. */
  box(mat: string, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number): void {
    const g = new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0).translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    this.add(mat, g, (x0 + x1) / 2);
  }

  /** A box run along x, cut at chunk boundaries so each piece lands in one chunk. */
  boxRunX(mat: string, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number): void {
    let a = x0;
    while (a < x1 - 1e-6) {
      const edge = (Math.floor((a + 210) / CHUNK + 1e-9) + 1) * CHUNK - 210;
      const b = Math.min(x1, edge);
      this.box(mat, a, b, y0, y1, z0, z1);
      a = b;
    }
  }

  flush(scene: THREE.Scene): void {
    for (const [key, geos] of this.bins) {
      const mesh = new THREE.Mesh(mergeGeometries(geos), MATS[key.split('|')[0]]);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.name = 'boardwalk-' + key;
      scene.add(mesh);
    }
    this.bins.clear();
  }
}

function shadowed<T extends THREE.Object3D>(g: T): T {
  g.traverse((o) => {
    if (o instanceof THREE.Mesh) { o.castShadow = true; o.receiveShadow = true; }
  });
  return g;
}

/** A prefab on the ground at (x, z) (plus lift), turned to yaw and scaled; null when the id is missing. */
function place(scene: THREE.Scene, id: string, x: number, z: number, yaw: number, scale: number, lift = 0, tint?: number): THREE.Group | null {
  if (!getPrefab(id)) return null;
  const obj = buildPrefab(id, { lights: false, scale, ...(tint !== undefined ? { tint } : {}) });
  obj.rotation.y = yaw;
  placeOnGround(obj, x, z, lift);
  scene.add(shadowed(obj));
  return obj;
}

/** A solid collider from a placed object's world bounds. */
function solid(boxes: Box[], obj: THREE.Object3D | null): void {
  if (!obj) return;
  obj.updateMatrixWorld(true);
  const b = new THREE.Box3().setFromObject(obj);
  boxes.push({ minX: b.min.x, maxX: b.max.x, minZ: b.min.z, maxZ: b.max.z, h: b.max.y });
}

/** A painted sign standing at (x, y, z) facing yaw (0 = south, PI = north, -PI/2 = west). */
function signAt(scene: THREE.Scene, text: string, x: number, y: number, z: number, yaw: number, opts: CoastSignOpts): void {
  const s = coastSign(text, opts);
  s.position.set(x, y, z);
  s.rotation.y = yaw;
  scene.add(s);
}

/**
 * A railing along a straight line at world height `baseY`: top and mid rail (merged) and posts every ~3 m. Pushes one
 * collider (the line's bounds, 0.5 m thick) with top `h`.
 */
function railLine(bins: Bins, boxes: Box[], ax: number, az: number, bx: number, bz: number, baseY: number, h: number, colliderTop: number): void {
  const dx = bx - ax, dz = bz - az;
  const len = Math.hypot(dx, dz);
  if (len < 0.01) return;
  const yaw = -Math.atan2(dz, dx);
  const pieces = Math.max(1, Math.ceil(len / 30));
  for (let i = 0; i < pieces; i++) {
    const t0 = i / pieces, t1 = (i + 1) / pieces;
    const l = len / pieces;
    const mx = ax + dx * (t0 + t1) / 2, mz = az + dz * (t0 + t1) / 2;
    for (const [fy, th] of [[h - 0.05, 0.1], [h * 0.5, 0.08]] as const) {
      bins.add('rail', new THREE.BoxGeometry(l, th, 0.1).rotateY(yaw).translate(mx, baseY + fy, mz), mx);
    }
  }
  const posts = Math.max(1, Math.ceil(len / 3));
  for (let i = 0; i <= posts; i++) {
    const px = ax + (dx * i) / posts, pz = az + (dz * i) / posts;
    // The post sinks 5 cm into the deck so its foot never shares the deck's top plane.
    bins.add('rail', new THREE.BoxGeometry(0.14, h + 0.05, 0.14).translate(px, baseY + h / 2 - 0.025, pz), px);
  }
  boxes.push({
    minX: Math.min(ax, bx) - 0.25, maxX: Math.max(ax, bx) + 0.25,
    minZ: Math.min(az, bz) - 0.25, maxZ: Math.max(az, bz) + 0.25, h: colliderTop,
  });
}

/**
 * A plank deck from a0 to a1 along `axis` (x or z), b0..b1 across it, top at `top`: one slab per 30 m run, 3 cm apart
 * (touching boxes never share a face). The planks are painted on by the material's texture (plankTexture), not built as
 * separate boxes, so no plank face lies in another's plane.
 */
function deckSlabs(
  bins: Bins, a0: number, a1: number, top: number, b0: number, b1: number,
  mat: string, axis: 'x' | 'z', thick = DECK_THICK,
): void {
  const runs = Math.max(1, Math.ceil((a1 - a0) / 30));
  const len = (a1 - a0) / runs;
  for (let r = 0; r < runs; r++) {
    const s0 = a0 + r * len + (r > 0 ? 0.015 : 0), s1 = a0 + (r + 1) * len - (r < runs - 1 ? 0.015 : 0);
    if (axis === 'x') bins.box(mat, s0, s1, top - thick, top, b0, b1);
    else bins.box(mat, b0, b1, top - thick, top, s0, s1);
  }
}

/** Seabed (or ground) height under (x, z). */
function bedHeight(x: number, z: number): number {
  const bed = waterBedAt(x, z);
  return bed === null ? heightAt(x, z) : Math.min(bed, heightAt(x, z));
}

export function buildBoardwalk(scene: THREE.Scene, boxes: Box[]): void {
  const bw = COAST.boardwalk;
  const R = bw.rect;
  const bins = new Bins();
  const cx = (R.minX + R.maxX) / 2, cz = (R.minZ + R.maxZ) / 2;
  const y0 = heightAt(cx, cz);
  const deckTop = y0 + bw.deckLift;

  // ---- Deck: 0.3 m boxes, top 22 cm proud of the (flat) ground, bottom below it; two wood tones every 1.2 m ----------
  deckSlabs(bins, R.minX, R.maxX, deckTop, R.minZ, R.maxZ, 'woodA', 'x');

  // ---- South railing with stair gaps, and the stairs themselves -----------------------------------------------------
  const railZ = R.maxZ - RAIL_INSET;
  const runs: [number, number][] = [];
  let from = R.minX;
  for (const sx of STAIR_X) {
    runs.push([from, sx - STAIR_W / 2]);
    from = sx + STAIR_W / 2;
  }
  runs.push([from, R.maxX]);
  for (const [a, b] of runs) railLine(bins, boxes, a, railZ, b, railZ, deckTop, 1.0, deckTop + 1.0);
  for (const sx of STAIR_X) {
    for (let i = 0; i < 3; i++) {
      const top = y0 + [0.17, 0.13, 0.09][i];
      const z0 = R.maxZ - 0.05 + i * 0.8;
      bins.box('step', sx - STAIR_W / 2, sx + STAIR_W / 2, top - 0.35, top, z0, R.maxZ + (i + 1) * 0.8);
    }
  }

  // ---- Stalls, with their painted names, and the Tin Shy / candyfloss extras ----------------------------------------
  const stallObjs = new Map<string, THREE.Group>();
  bw.stalls.forEach((s, i) => {
    const obj = place(scene, 'boardwalk-stall', s.x, s.z, s.yaw, 2.4, bw.deckLift, STALL_TINTS[i % STALL_TINTS.length]);
    if (obj) { solid(boxes, obj); stallObjs.set(s.id, obj); }
    else boxes.push({ minX: s.x - 1.9, maxX: s.x + 1.9, minZ: s.z - 1.5, maxZ: s.z + 1.5, h: deckTop + 3.6 });
    // The name board sits on top of the stall's own header board (2.4 x the prefab's 1.84 m top), fixed (no post).
    const lz = -0.6;
    signAt(scene, s.name, s.x + Math.sin(s.yaw) * lz, deckTop + 4.42, s.z + Math.cos(s.yaw) * lz, s.yaw, { w: 3.2, h: 0.7, post: 0 });
  });
  const tin = bw.stalls.find((s) => s.id === 'tin-shy');
  if (tin) solid(boxes, place(scene, 'tin-shy', tin.x, tin.z + 4.6, 0, 2, bw.deckLift));
  const sal = bw.stalls.find((s) => s.id === 'spun-sugar-sal');
  if (sal) solid(boxes, place(scene, 'candyfloss-cart', sal.x + 5, sal.z + 5, 0, 2, bw.deckLift));

  // ---- Lamps (both long edges) and benches (south edge, facing the sea, every second gap) ---------------------------
  const lampXs: number[] = [];
  for (let x = R.minX + bw.lampStep / 2; x < R.maxX; x += bw.lampStep) lampXs.push(x);
  for (const x of lampXs) {
    for (const z of [R.minZ + 2.6, R.maxZ - 2.8]) {
      const lamp = place(scene, 'boardwalk-lamp', x, z, 0, 2.2, bw.deckLift);
      if (lamp) boxes.push({ minX: x - 0.3, maxX: x + 0.3, minZ: z - 0.3, maxZ: z + 0.3, h: deckTop + 5.4 });
    }
  }
  // Benches sit between lamps; stairs are at -120 / 0 / 120 (gap midpoints with an even index), so use the odd ones.
  for (let i = 0; i < lampXs.length - 1; i++) {
    if (i % 2 === 1) continue;
    const bx = (lampXs[i] + lampXs[i + 1]) / 2;
    if (STAIR_X.some((sx) => Math.abs(sx - bx) < STAIR_W)) continue;
    place(scene, 'park-bench', bx, R.maxZ - 2.2, 0, 2, bw.deckLift);
  }

  // ---- Joke signs ---------------------------------------------------------------------------------------------------
  const gY = (x: number, z: number): number => heightAt(x, z);
  const ent = bw.entrance;
  signAt(scene, 'SALTBUCKET BOARDWALK\nEst. the day the bucket sank', ent.x - 6, gY(ent.x - 6, ent.z), ent.z, Math.PI, { w: 5, h: 1.5, post: 1.6 });
  signAt(scene, 'NO GULLS\n(they cannot read, but we live in hope)', -112, deckTop, R.maxZ - 1.5, 0, { w: 3.6, h: 1.1, post: 1.2 });
  signAt(scene, 'THE SALTWATER\nIt is real. Stop asking.', 20, gY(20, 1160), 1160, Math.PI, { w: 3.6, h: 1.1, post: 1.4 });
  signAt(scene, 'LONG SPOON PIER\nWalk it slow. The bowl end sways.', COAST.pier.spur.minX - 5, deckTop, COAST.pier.spur.minZ - 3, -Math.PI / 2, { w: 4, h: 1.2, post: 1.4 });
  const office = bw.stalls.find((s) => s.id === 'boardwalk-office');
  if (office) signAt(scene, 'LOST PROPERTY\nHats, mostly', office.x + 5, deckTop, office.z + 6, 0, { w: 2.6, h: 0.9, post: 1.2 });
  signAt(scene, 'MIND THE STAIRS\nThere are three. We counted.', 6, deckTop, R.maxZ - 1.5, 0, { w: 3.2, h: 1.0, post: 1.2 });
  signAt(scene, 'PLEASE DO NOT FEED THE SEA\nIt is full.', -150, gY(-150, 1176), 1176, Math.PI, { w: 4, h: 1.1, post: 1.4 });
  if (sal) signAt(scene, 'CANDYFLOSS IS A VEGETABLE\n(Sal says so)', sal.x - 14, deckTop, sal.z + 7, 0, { w: 3.6, h: 1.0, post: 1.2 });

  // ---- Long Spoon Pier -----------------------------------------------------------------------------------------------
  buildPier(scene, boxes, bins, deckTop);

  // ---- Beach dressing (z 1145..1185; x 132..168 stays clear for the Last Tube) ----------------------------------------
  const huts: [number, number][] = [[-300, 1158], [-268, 1160], [-236, 1158], [-204, 1160]];
  const hutTints = [0x4fa3d9, 0xf2a93b, 0xe8453c, 0x6bbf59];
  huts.forEach(([x, z], i) => solid(boxes, place(scene, 'beach-hut', x, z, 0, 2.2, 0, hutTints[i])));
  for (const [x, z] of [[-110, 1166], [-70, 1172], [-15, 1160], [75, 1176], [190, 1168]] as const) place(scene, 'beach-umbrella', x, z, 0.3, 2);
  for (const [x, z] of [[-107, 1169], [-67, 1175], [-12, 1163], [78, 1179], [193, 1171]] as const) place(scene, 'deck-chair', x, z, 3.3, 2);
  solid(boxes, place(scene, 'lifeguard-chair', 60, 1170, 0, 2.2));
  for (const [x, z] of [[-200, 1180], [-40, 1168], [100, 1160], [225, 1165]] as const) {
    place(scene, 'sandcastle', x, z, 0.2, 2);
    place(scene, 'bucket-and-spade', x + 3, z + 1.5, 1.1, 2);
  }

  bins.flush(scene);
}

/** The spur, handle and bowl (walkable rooftops + planks), their posts, rails and Marram's hut. */
function buildPier(scene: THREE.Scene, boxes: Box[], bins: Bins, boardwalkTop: number): void {
  const P = COAST.pier;
  const Y = P.deckY;
  const base = Y - PIER_THICK;
  const sp = P.spur, ha = P.handle, bo = P.bowl;
  const ground = heightAt(COAST.boardwalk.rect.maxX - 1, (sp.minZ + sp.maxZ) / 2);

  // Rooftops: box-less walkable decks. Guarded so a second build (tests) does not throw on duplicate ids.
  for (const [id, name, r] of [
    ['long-spoon-spur', 'Long Spoon spur', sp], ['long-spoon-handle', 'Long Spoon handle', ha], ['long-spoon-bowl', 'Long Spoon bowl', bo],
  ] as const) {
    if (!rooftopById(id)) addRooftop({ id, name, minX: r.minX, maxX: r.maxX, minZ: r.minZ, maxZ: r.maxZ, y: Y, solid: false, parapet: false });
  }

  // Ramp: 3 steps at x 210..216 from the boardwalk deck up to the spur.
  const rampX0 = sp.minX, rampX1 = sp.minX + 6;
  for (let i = 0; i < 3; i++) {
    const top = boardwalkTop + ((Y - boardwalkTop) * (i + 1)) / 3;
    bins.box('step', rampX0 + i * 2, rampX0 + (i + 1) * 2, boardwalkTop - 0.2, top, sp.minZ, sp.maxZ);
  }

  // Spur planks (x 216..304, z 1120..1130), alternating tones every 1.2 m, on a dark skirt down to the ground.
  deckSlabs(bins, rampX1, ha.minX - 0.03, Y, sp.minZ, sp.maxZ, 'pierWood', 'x', PIER_THICK);
  for (let x = rampX1; x < sp.maxX - 1e-6; x += 12) {
    const x1 = Math.min(sp.maxX, x + 12);
    const low = Math.min(heightAt(x, sp.minZ), heightAt(x1, sp.minZ), heightAt(x, sp.maxZ), heightAt(x1, sp.maxZ), ground) - 0.4;
    bins.box('skirt', x + 0.3, x1 - 0.3, low, base + 0.05, sp.minZ + 0.3, sp.maxZ - 0.3);
  }

  // Handle planks (z 1130..1238, tucked 2 m under the bowl), then the raised steel spine down its middle.
  const hz0 = sp.maxZ, hz1 = bo.minZ + 2;
  deckSlabs(bins, sp.minZ, hz1, Y, ha.minX, ha.maxX, 'pierWoodZ', 'z', PIER_THICK);
  const cxh = (ha.minX + ha.maxX) / 2;
  bins.box('steel', cxh - 0.6, cxh + 0.6, Y - 0.05, Y + 0.035, hz0 + 1, bo.minZ - 0.6);

  // The bowl: a flattened oval, polished silver-grey, 2 cm above the handle's top plane so they never share a plane.
  const bcx = (bo.minX + bo.maxX) / 2, bcz = (bo.minZ + bo.maxZ) / 2;
  const rx = (bo.maxX - bo.minX) / 2, rz = (bo.maxZ - bo.minZ) / 2;
  const oval = new THREE.CylinderGeometry(1, 1, PIER_THICK, 48).scale(rx, 1, rz).translate(bcx, Y + 0.07 - PIER_THICK / 2, bcz);
  bins.add('silver', oval, bcx);

  // Pier posts (scale 3, a 7.5 m post; stacked where the sea bed is deeper), every 12 m both sides and round the bowl.
  const postSpots: [number, number][] = [];
  for (let z = hz0 + 6; z < bo.minZ - 4; z += 12) postSpots.push([ha.minX, z], [ha.maxX, z]);
  for (let k = 0; k < 6; k++) {
    const a = (k * Math.PI) / 3 + Math.PI / 6;
    postSpots.push([bcx + (rx - 1.2) * Math.cos(a), bcz + (rz - 1.2) * Math.sin(a)]);
  }
  for (const [x, z] of postSpots) {
    let y = bedHeight(x, z) - 0.3;
    for (let n = 0; n < 3 && y + 7.4 < base + 0.05; n++, y += 7) {
      const post = place(scene, 'pier-post', x, z, 0, 3);
      if (post) post.position.y = y;
    }
  }

  // Rails: spur north and south, handle west and east, and the bowl ring with a gap at the handle mouth and the gangplank.
  const h = 1.1, top = Y + h;
  const e = 0.45;
  railLine(bins, boxes, rampX1, sp.minZ + e, ha.maxX - e, sp.minZ + e, Y, h, top);
  railLine(bins, boxes, rampX1, sp.maxZ - e, ha.minX + e, sp.maxZ - e, Y, h, top);
  railLine(bins, boxes, ha.minX + e, sp.maxZ, ha.minX + e, bo.minZ + 0.6, Y, h, top);
  railLine(bins, boxes, ha.maxX - e, sp.minZ + e, ha.maxX - e, bo.minZ + 0.6, Y, h, top);
  const SEG = 36;
  for (let k = 0; k < SEG; k++) {
    const a0 = (k / SEG) * Math.PI * 2, a1 = ((k + 1) / SEG) * Math.PI * 2;
    const p0: [number, number] = [bcx + (rx - e) * Math.cos(a0), bcz + (rz - e) * Math.sin(a0)];
    const p1: [number, number] = [bcx + (rx - e) * Math.cos(a1), bcz + (rz - e) * Math.sin(a1)];
    const mx = (p0[0] + p1[0]) / 2;
    if (mx > ha.minX && mx < ha.maxX) continue; // handle mouth (north) and gangplank gap (south)
    railLine(bins, boxes, p0[0], p0[1], p1[0], p1[1], Y, h, top);
  }

  // Marram's hut (west side of the bowl, door facing the deck) and her sign.
  const m = P.marramHut;
  if (getPrefab('beach-hut')) {
    const hut = buildPrefab('beach-hut', { lights: false, scale: 2.2 });
    hut.rotation.y = m.yaw ?? 0;
    hut.position.set(m.x, Y + 0.07, m.z);
    scene.add(shadowed(hut));
    solid(boxes, hut);
  }
  signAt(scene, "MARRAM'S\nNo refunds, many opinions", m.x + 3, Y + 0.07, m.z + 5.5, m.yaw ?? 0, { w: 2.8, h: 0.9, post: 0.9 });
}
