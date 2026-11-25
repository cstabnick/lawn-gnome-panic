// Mittenholt, the Snowcap Rise hamlet (E31): knitters and woodcutters, everyone with one mitten too many or too few.
import * as THREE from 'three';
import { LAYER, flatLayer } from '@lawn/depth';
import type { Box } from '../types';
import type { AmbientGnomeDef } from '../ambientGnomes';
import { heightAt } from '../terrain';
import { textPlate } from '../homes/pieces';
import { HAMLETS } from './config';
import { placePieces, prefabBounds, roadDist, seeded, type Piece } from './place';

const C = HAMLETS.find((h) => h.id === 'mittenholt')!;
const CX = C.x, CZ = C.z;
const HOUSE_MIN_ROAD = 18;
const HOUSE_MAX_DIST = 68;

/** Yaw that turns a prefab's front (+z) towards (tx, tz) from (x, z). */
const face = (x: number, z: number, tx: number, tz: number): number => Math.atan2(tx - x, tz - z);

/** First z going north from the road (z -1300 up) that is at least `d` metres from every road centre line. */
function northOfRoad(x: number, d: number): number {
  for (let z = -1290; z > -1500; z -= 0.5) if (roadDist(x, z) >= d) return z;
  return -1450;
}

/** Lowest ground height under the four corners of a rotated, scaled footprint. */
function lowestCorner(id: string, x: number, z: number, yaw: number, s: number): number {
  const lb = prefabBounds(id);
  const c = Math.cos(yaw), sn = Math.sin(yaw);
  let y = Infinity;
  for (const x0 of [lb.min.x, lb.max.x]) {
    for (const z0 of [lb.min.z, lb.max.z]) {
      y = Math.min(y, heightAt(x + (x0 * c + z0 * sn) * s, z + (-x0 * sn + z0 * c) * s));
    }
  }
  return y;
}

const ROOFS = [0xb5412f, 0xc9772e, 0xa8382c, 0xd1953a, 0x9c3b2a, 0xc2602b];
const TRIMS = [0xf4f1ea, 0xfaf7f0, 0xe8e2d4];

/** Houses first (8-12), then everything else. Pure: no scene. */
export function planMittenholt(): Piece[] {
  const r = seeded(31031);
  const pieces: Piece[] = [];

  // Houses: candidate ring spots, kept when clear of the road and inside the hamlet.
  const cands: Array<[number, number]> = [];
  for (const [rad, n, a0] of [[30, 6, 0.15], [48, 8, 0.4]] as const) {
    for (let i = 0; i < n; i++) {
      const a = a0 + (i / n) * Math.PI * 2;
      cands.push([CX + Math.cos(a) * rad * 1.15, CZ + Math.sin(a) * rad * 0.9]);
    }
  }
  let houses = 0;
  for (const [x0, z0] of cands) {
    if (houses >= 11) break;
    const x = x0 + (r() - 0.5) * 3, z = z0 + (r() - 0.5) * 3;
    if (roadDist(x, z) < HOUSE_MIN_ROAD || Math.hypot(x - CX, z - CZ) > HOUSE_MAX_DIST) continue;
    if (Math.hypot(x - CX, z - CZ) < 14) continue;
    const id = houses % 3 === 1 ? 'log-cabin' : 'snow-cottage';
    const lb = prefabBounds(id);
    const w = Math.max(lb.max.x - lb.min.x, lb.max.z - lb.min.z) || 1;
    const scale = Math.max(0.6, Math.min(2.2, (6.5 + r() * 3) / w));
    // Front to the centre, unless the road is closer in that direction: then to the road.
    const yaw = face(x, z, CX, CZ);
    // Keep every corner of the footprint away from the road too.
    if (roadDist(x, z - 6) < HOUSE_MIN_ROAD - 4 && z > CZ) continue;
    pieces.push({
      id, x, z, yaw, scale, y: lowestCorner(id, x, z, yaw, scale), solid: true,
      tint: ROOFS[houses % ROOFS.length], trim: TRIMS[houses % TRIMS.length],
    });
    houses++;
  }
  const hs = pieces.slice();

  // House dressing: woodpile, sled, snow lump, washing line, flowers next to some of them.
  hs.forEach((h, i) => {
    const sx = Math.cos(h.yaw!), sz = -Math.sin(h.yaw!); // house's local +x in the world
    const fx = Math.sin(h.yaw!), fz = Math.cos(h.yaw!);  // house front direction
    const reach = 5.5 * (h.scale ?? 1);
    const side = (m: number, f: number) => ({ x: h.x + sx * m + fx * f, z: h.z + sz * m + fz * f });
    const wp = side(reach, -1);
    pieces.push({ id: 'woodpile', ...wp, yaw: h.yaw!, solid: true });
    if (i % 2 === 0) { const p = side(-reach, 3); pieces.push({ id: 'tea-tray-sled', ...p, yaw: h.yaw! + 0.6 }); }
    if (i % 3 === 0) { const p = side(-reach * 0.8, -2); pieces.push({ id: 'euro-washing-line', ...p, yaw: h.yaw! + Math.PI / 2, solid: true }); }
    const fl = side(1.8, reach * 0.75);
    pieces.push({ id: 'flower-pot', ...fl, yaw: 0 });
    if (i % 2 === 1) { const p = side(-2, reach * 0.8); pieces.push({ id: 'snowman', ...p, yaw: h.yaw!, scale: 0.55, tint: 0xf4f8ff }); }
    // A mailbox at the garden edge, a hedgerow along one plot edge on every third plot.
    const mb = side(3.5, reach * 1.1);
    pieces.push({ id: 'mailbox', ...mb, yaw: h.yaw!, solid: true });
    if (i % 3 === 2) { const hp = side(0, reach * 1.45); pieces.push({ id: 'hedgerow', ...hp, yaw: h.yaw! + Math.PI / 2, solid: true }); }
  });

  // The centre: pump, bench, cairn, phone box, shrine, bin, picnic table.
  pieces.push({ id: 'village-pump', x: CX, z: CZ, solid: true });
  pieces.push({ id: 'bench', x: CX + 6, z: CZ + 1, yaw: face(CX + 6, CZ + 1, CX, CZ), solid: true });   // the knitter's bench
  pieces.push({ id: 'bench', x: CX - 6, z: CZ - 1, yaw: face(CX - 6, CZ - 1, CX, CZ), solid: true });
  pieces.push({ id: 'hamlet-picnic-table', x: CX - 3, z: CZ - 8, yaw: 0.3, solid: true });
  pieces.push({ id: 'hamlet-phone-box', x: CX + 10, z: CZ + 7, yaw: face(CX + 10, CZ + 7, CX, CZ), solid: true });
  pieces.push({ id: 'wayside-shrine', x: CX - 12, z: CZ + 6, yaw: face(CX - 12, CZ + 6, CX, CZ), solid: true });
  pieces.push({ id: 'litter-bin', x: CX + 7.5, z: CZ - 2.5, solid: true });
  pieces.push({ id: 'hamlet-stone-cairn', x: CX - 8, z: CZ + 10, solid: true });
  pieces.push({ id: 'rules-board', x: CX + 2, z: CZ + 9, yaw: face(CX + 2, CZ + 9, CX, CZ), solid: true }); // notice board

  // Road edge: bus shelter, milestone, signs' posts.
  const shx = CX + 18, shz = northOfRoad(shx, 8.5);
  pieces.push({ id: 'bus-shelter', x: shx, z: shz, yaw: Math.PI, solid: true }); // opens south onto the road
  pieces.push({ id: 'wooden-post', x: shx + 4, z: shz, solid: true });
  pieces.push({ id: 'milestone', x: CX - 25, z: northOfRoad(CX - 25, 9), yaw: Math.PI, solid: true });
  for (const sx of [CX - 70, CX + 70]) {
    const z = northOfRoad(sx, 12);
    pieces.push({ id: 'hamlet-sign', x: sx, z, yaw: sx < CX ? -Math.PI / 2 : Math.PI / 2, solid: true });
  }

  // Drystone walls along two plot edges (3.06 m sections).
  for (let i = 0; i < 6; i++) pieces.push({ id: 'drystone-wall', x: CX - 40 + i * 3.06, z: CZ - 24, solid: true });
  for (let i = 0; i < 5; i++) pieces.push({ id: 'drystone-wall', x: CX + 22 + i * 3.06, z: CZ + 22, solid: true });

  // Vignette 1: the Snowman Committee. Half-built snowman, three carrots on a bench, numbered tags (plates, see build).
  pieces.push({ id: 'snowman', x: VIG1.x, z: VIG1.z, yaw: 0.4, scale: 0.8, tint: 0xf4f8ff });
  pieces.push({ id: 'bench', x: VIG1.x + 3.5, z: VIG1.z + 0.5, yaw: -Math.PI / 2, solid: true });
  [0xff8a1f, 0xf26b0f, 0xffa13d].forEach((c, i) =>
    pieces.push({ id: 'wooden-post', x: VIG1.x + 3.5, z: VIG1.z - 0.35 + i * 0.35, scale: 0.12, tint: c, lift: 0.5 }));

  // Vignette 2: the Odd Mitten Line, singles of every colour and one matching pair pegged in the middle.
  pieces.push({ id: 'euro-washing-line', x: VIG2.x, z: VIG2.z, yaw: 0, solid: true });
  const cols = [0xd62828, 0x2a9d8f, 0xf4d35e, 0x6a4c93, 0x1d70b8, 0xe9724c, 0x4caf50];
  cols.forEach((c, i) => {
    const mid = i === 3;
    pieces.push({ id: 'lost-mittens', x: VIG2.x - 1.8 + i * 0.6, z: VIG2.z, yaw: 0, scale: 0.3, tint: mid ? 0xfff2cc : c, lift: 1.25 });
  });
  pieces.push({ id: 'lost-mittens', x: VIG2.x - 1.8 + 3 * 0.6 + 0.25, z: VIG2.z, yaw: 0, scale: 0.3, tint: 0xfff2cc, lift: 1.25 }); // the pair

  // Vignette 3: the Sled That Got Away, nose-first in a drift, scarf trailing back up the hill.
  pieces.push({ id: 'hamlet-stone-cairn', x: VIG3.x, z: VIG3.z, scale: 1.8, tint: 0xf4f8ff });
  pieces.push({ id: 'tea-tray-sled', x: VIG3.x, z: VIG3.z + 0.3, yaw: Math.PI, lift: 0.5 });
  for (let i = 1; i <= 4; i++) pieces.push({ id: 'wool-scarf', x: VIG3.x + 0.3 * i, z: VIG3.z - 2.2 * i, yaw: Math.PI + 0.3, tint: 0xd62828 });

  // Scatter: snow pines on the hill edge, flowers, a few snow lumps.
  for (let i = 0; i < 14; i++) {
    const a = r() * Math.PI * 2, d = 55 + r() * 20;
    const x = CX + Math.cos(a) * d, z = CZ + Math.sin(a) * d * 0.8;
    if (roadDist(x, z) < 12) continue;
    pieces.push({ id: 'snow-pine', x, z, scale: 0.9 + r() * 0.5 });
  }
  for (let i = 0; i < 10; i++) {
    const a = r() * Math.PI * 2, d = 6 + r() * 14;
    pieces.push({ id: 'snowman', x: CX + Math.cos(a) * d, z: CZ + Math.sin(a) * d * 0.7, scale: 0.18, tint: 0xf4f8ff });
  }
  return pieces;
}

const VIG1 = { x: CX + 22, z: CZ - 10 };
const VIG2 = { x: CX - 24, z: CZ + 12 };
const VIG3 = { x: CX + 40, z: CZ - 36 };

/** Builds Mittenholt. Pushes its colliders into `boxes`. Runs once from living/build.ts during the world build (also in tests: no DOM). */
export function buildMittenholt(scene: THREE.Scene, boxes: Box[]): void {
  const plan = planMittenholt();
  const houses = plan.filter((p) => p.id === 'snow-cottage' || p.id === 'log-cabin');
  placePieces(scene, boxes, houses, 'mittenholt-houses');
  const placed = placePieces(scene, boxes, plan.filter((p) => !houses.includes(p)), 'mittenholt');

  // The green: a small square in the middle.
  const mat = new THREE.MeshStandardMaterial({ color: 0xdfe8ee, roughness: 1 });
  flatLayer(mat, LAYER.area);
  const green = new THREE.Mesh(new THREE.CircleGeometry(13, 28), mat);
  green.rotation.x = -Math.PI / 2;
  green.position.set(CX, heightAt(CX, CZ) + 0.03, CZ);
  green.name = 'mittenholt-green';
  scene.add(green);

  const on = (id: string) => placed.filter((p) => p.id === id);
  const front = (p: Piece, y: number, off: number, text: string, w: number, h: number, bg: number, fg: number) => {
    const yaw = p.yaw ?? 0;
    const gy = p.y ?? heightAt(p.x, p.z);
    scene.add(textPlate(text, p.x + Math.sin(yaw) * off, gy + y, p.z + Math.cos(yaw) * off, yaw, { w, h, bg, fg }));
  };
  // Name signs (board face centre (0, 1.45, 0.05), 1.8 x 0.7), plate 0.03 m in front.
  for (const s of on('hamlet-sign')) {
    front(s, 1.45, 0.09, 'MITTENHOLT\nTwinned with nowhere, by request', 1.7, 0.6, 0xf4f1ea, 0x3a2418);
  }
  // Notice board (face centre (0, 1.45, 0.05), 1.4 x 0.9).
  for (const b of on('rules-board')) {
    front(b, 1.45, 0.09,
      'FOUND: 41 left mittens.\nRight mittens need not apply.\nHot cocoa on Thursdays.\nOn other days, cold cocoa.\nDo not lick the pump.',
      1.3, 0.8, 0xf7efd9, 0x3a2418);
  }
  // Bus shelter timetable on the post beside it.
  for (const p of on('wooden-post')) {
    if (p.scale) continue;
    front({ ...p, yaw: Math.PI }, 1.6, 0.12, 'BUS: 8:15, 8:15 (later)\nand sometimes 8:15', 0.9, 0.45, 0xfff6c8, 0x2b2116);
  }
  // Snowman Committee tags: numbered, in front of each carrot.
  [1, 2, 3].forEach((n, i) => {
    scene.add(textPlate(String(n), VIG1.x + 2.9, heightAt(VIG1.x + 3.5, VIG1.z) + 0.75, VIG1.z - 0.35 + i * 0.35, -Math.PI / 2, { w: 0.25, h: 0.15, bg: 0xfff6c8 }));
  });
}

/** The people of Mittenholt (ambient gnomes with a speech bubble). living/runtime.ts shows them. */
export function mittenholtPeople(): AmbientGnomeDef[] {
  return [
    {
      id: 'mittenholt-knitter', name: 'Agnes Purl', x: CX + 6, z: CZ + 1, yaw: -Math.PI / 2, idle: 'sit-ground',
      look: { hat: 0xc0392b, shirt: 0x6d8fb3, pants: 0x4a3b32, skin: 0xf1c27d, boots: 0x3a2a20, beard: null, glasses: true },
      bubble: 'Every mitten I knit is a left one. I have stopped asking why.',
    },
    {
      id: 'mittenholt-woodcutter', name: 'Olaf Splitt', x: CX + 30, z: CZ + 12, yaw: Math.PI, idle: 'saw',
      look: { hat: 0x2f6f4f, shirt: 0xb5412f, pants: 0x3b3a4a, skin: 0xe0ac69, boots: 0x222222, beard: 0xd8d8d8, glasses: false },
      bubble: 'Split enough logs for winter. Then winter came early and asked for more.',
    },
  ];
}
