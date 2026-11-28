// The Bottom Garden (batch 3 E32): the strip south of Hedgeworth's old south fence where holes 4 to 8 were finally
// built (R-226). This file dresses it: the potting shed (hole 7's roof tee) with its ladder, the opening nobody held at
// hole 4, the member-eating maze, the giant birdbath and the leaking hosepipe in the Drip, the cabbages and the rhubarb
// patch, the halfway table at the Turn, and signs with jokes. Hedges and fences come from yard.ts; tee mats and greens
// from greens.ts; residents from life.ts. buildBottomGarden draws it and returns its colliders and soft spots.
import * as THREE from 'three';
import { LAYER, flatLayer } from '@lawn/depth';
import { buildPrefab, getPrefab } from '@lawn/prefabs';
import { buildPieces, signBoard, textPlate, type HomePiece } from '../homes/pieces';
import { addRooftop, rooftopById } from '../interiors/rooftops';
import { heightAt } from '../terrain';
import type { Box } from '../types';
import { BOTTOM_GARDEN, HOLES, inPlay, inYard, POTTING_SHED, TURN_GATE } from './types';

export interface BottomGarden {
  /** Solid colliders (fence runs, shed walls, maze hedges, birdbath pedestal, vignette props that block). */
  boxes: Box[];
  /** Giant plants you can drive through (no collider): the runtime slows and rustles inside them. */
  soft: readonly { x: number; z: number; r: number }[];
  update(dt: number, t: number): void;
}

const HALF_PI = Math.PI / 2;
const PLATE_BG = 0xf2e8c8;
const ground = (x: number, z: number): number => heightAt(x, z);
const firstOf = (ids: readonly string[]): string | null => ids.find((id) => getPrefab(id)) ?? null;

interface PutOpts { yaw?: number; scale?: number; y?: number; pitch?: number; roll?: number; tint?: number; on?: number }

/** One prefab stood on the ground (first id that exists); null when none does. `y` lifts it, `on` replaces the ground height. */
function put(parent: THREE.Object3D, ids: readonly string[], x: number, z: number, o: PutOpts = {}): THREE.Group | null {
  const id = firstOf(ids);
  if (!id) return null;
  const obj = buildPrefab(id, o.tint === undefined ? { lights: false } : { lights: false, tint: o.tint });
  obj.rotation.x = o.pitch ?? 0;
  obj.rotation.z = o.roll ?? 0;
  const grp = new THREE.Group();
  grp.add(obj);
  grp.position.set(x, (o.on ?? ground(x, z)) + (o.y ?? 0), z);
  grp.rotation.y = o.yaw ?? 0;
  grp.scale.setScalar(o.scale ?? 1);
  grp.traverse((m) => { if ((m as THREE.Mesh).isMesh) m.castShadow = true; });
  parent.add(grp);
  return grp;
}

const decalMats = new Map<string, THREE.Material>();
function decalMat(color: number, layer: number): THREE.Material {
  const key = `${layer}:${color}`;
  let m = decalMats.get(key);
  if (!m) {
    m = flatLayer(new THREE.MeshStandardMaterial({ color, roughness: 0.95 }), layer);
    decalMats.set(key, m);
  }
  return m;
}

/** A flat rectangle (w along x, d along z before yaw) or disc (round, w = diameter) lying on the ground. `top` lies on another decal. */
function decal(parent: THREE.Object3D, x: number, z: number, w: number, d: number, color: number, yaw = 0, round = false, top = false): void {
  const geo = round ? new THREE.CircleGeometry(w / 2, 14) : new THREE.PlaneGeometry(w, d);
  const mesh = new THREE.Mesh(geo, decalMat(color, top ? LAYER.marker : LAYER.decal));
  mesh.rotation.set(-HALF_PI, 0, 0);
  const grp = new THREE.Group();
  grp.add(mesh);
  grp.position.set(x, ground(x, z) + (top ? 0.03 : 0.02), z);
  grp.rotation.y = yaw;
  grp.name = 'golf-decal';
  parent.add(grp);
}

function vignette(root: THREE.Group, name: string): THREE.Group {
  const g = new THREE.Group();
  g.name = name;
  root.add(g);
  return g;
}

/** Deterministic 0..1 noise (hole dressing must look the same every run). */
function rnd(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildBottomGarden(scene: THREE.Scene): BottomGarden {
  const root = new THREE.Group();
  root.name = 'hedgeworth-bottom-garden';
  scene.add(root);
  const pieces: HomePiece[] = [];
  const boxes: Box[] = [];
  const soft: { x: number; z: number; r: number }[] = [];
  const signs = vignette(root, 'bottom-garden-signs');
  const swayers: { obj: THREE.Object3D; phase: number }[] = [];

  /** A garden sign: the `garden-sign` board with its text printed flush on both faces (signBoard). yaw = the way the plate looks. */
  const sign = (text: string, x: number, z: number, yaw: number, w = 1.7, h = 0.85): void => {
    if (!getPrefab('garden-sign')) return;
    const sb = signBoard({ front: text, x, z, yaw, board: 'garden-sign', w, h, bg: PLATE_BG });
    sb.piece.solid = false;
    pieces.push(sb.piece);
    signs.add(sb.plates);
  };

  // ---- Hole 7: the potting shed -----------------------------------------------------------------------------------
  const shed = vignette(root, 'hole7-potting-shed');
  const S = POTTING_SHED;
  const sx0 = S.x - S.w / 2, sx1 = S.x + S.w / 2, sz0 = S.z - S.d / 2, sz1 = S.z + S.d / 2;
  const gS = ground(S.x, S.z);
  const roofY = gS + S.roofY;
  put(shed, ['potting-shed'], S.x, S.z, { yaw: S.yaw });
  boxes.push({ minX: sx0, maxX: sx1, minZ: sz0, maxZ: sz1, h: roofY - 0.02 });
  if (!rooftopById('hedgeworth-potting-shed-roof')) {
    addRooftop({
      id: 'hedgeworth-potting-shed-roof', name: 'the potting shed roof',
      minX: sx0, maxX: sx1, minZ: sz0, maxZ: sz1, y: roofY, solid: false, parapet: false,
    });
  }
  // The ladder leans on the east wall, its top just over the roof edge. Pitch tips its top toward -x (the wall).
  put(shed, ['ladder'], S.ladder.x + 0.05, S.ladder.z, { yaw: HALF_PI, pitch: -0.19, scale: 1.8 });
  // The sign hangs on the wall beside it, on the south side, facing east.
  signs.add(textPlate('HOLE 7 TEE: UP THE LADDER.\nONE GNOME AT A TIME.\nTHE ROOF IS LISTENING.', sx1 + 0.1, gS + 1.55, S.z + 1.7, HALF_PI,
    { w: 1.5, h: 0.8, bg: PLATE_BG }));
  // On the roof, at the west end (the middle 5 x 5 is the tee mat): a deck chair, a flowerpot, a watering can.
  put(shed, ['deck-chair'], sx0 + 1.1, S.z + 0.9, { yaw: HALF_PI - 0.25, scale: 1.2, on: roofY });
  put(shed, ['flower-pot'], sx0 + 0.55, sz1 - 0.6, { scale: 1.9, on: roofY });
  put(shed, ['watering-can'], sx0 + 0.9, sz0 + 1.7, { yaw: 0.6, scale: 1.8, on: roofY });
  // At the foot: a wheelbarrow of pots at the door, and a stack of terracotta under the window.
  put(shed, ['wheelbarrow'], S.x + 1.2, sz1 + 2.4, { yaw: -0.5, scale: 2.0 });
  [[-2.8, 0.3], [-2.4, 0.9], [-3.3, 1.0]].forEach(([dx, dz], i) => put(shed, ['flower-pot'], S.x + dx, sz0 - 0.4 - dz, { scale: 2.1 - i * 0.2 }));
  decal(shed, S.x + 1.6, sz1 + 1.1, 2.2, 1.0, 0x6b5a45, 0);

  // ---- Hole 4: Peony's Promise -------------------------------------------------------------------------------------
  const h4 = vignette(root, 'hole4-peonys-promise');
  const R = { x: -1259, z: 858.2 };
  put(h4, ['opening-ribbon'], R.x, R.z, { yaw: HALF_PI, scale: 1.5 });
  // Peony's scissors on their little table at the ribbon's north post.
  put(h4, ['ceremonial-scissors'], R.x - 0.6, R.z - 7.3, { yaw: HALF_PI, scale: 1.5 });
  // The marquee, a trestle of untouched tea, a cake under a cloche, bunting.
  const M = { x: -1282, z: 836.5 };
  put(h4, ['opening-marquee'], M.x, M.z, { yaw: 0, scale: 1.0 });
  pieces.push({ prefab: 'tea-trestle', x: M.x, z: M.z + 0.2, yaw: 0, scale: 1.25, solid: true });
  const bunting = put(h4, ['bunting-span'], M.x, M.z - 4.4, { yaw: 0, scale: 1.0 });
  if (bunting) swayers.push({ obj: bunting, phase: 0 });
  put(h4, ['folding-chair'], M.x - 2.9, M.z + 1.8, { yaw: 0.4 });
  put(h4, ['folding-chair'], M.x + 3.1, M.z + 1.5, { yaw: -0.3 });
  // The opening nobody held: rows of folding chairs facing the ribbon, one knocked over, programmes on the grass.
  const C = { x: -1250.5, z: 839.6 };
  const [fx4, fz4] = (() => { const dx = R.x - C.x, dz = R.z - C.z, l = Math.hypot(dx, dz); return [dx / l, dz / l] as const; })();
  const yaw4 = Math.atan2(fx4, fz4);
  const lx = fz4, lz = -fx4;
  for (let row = 0; row < 3; row++) {
    for (let j = -2; j <= 2; j++) {
      if (row === 1 && j === 1) continue;
      const x = C.x + lx * j * 0.95 - fx4 * row * 1.35;
      const z = C.z + lz * j * 0.95 - fz4 * row * 1.35;
      if (inPlay(x, z, 0.5)) continue;
      if (row === 0 && j === -1) put(h4, ['folding-chair'], x, z, { yaw: yaw4 + 0.2, roll: 1.35, y: 0.38 });
      else put(h4, ['folding-chair'], x, z, { yaw: yaw4 + (((row * 7 + j * 3) % 5) - 2) * 0.025 });
    }
  }
  [[-1253.2, 843.0, 0.4], [-1247.8, 845.2, 1.9], [-1255.5, 836.6, 2.6], [-1245.0, 838.4, 0.9], [-1249.6, 842.0, 1.2]].forEach(([x, z, yaw], i) => {
    decal(h4, x, z, 0.34, 0.46, 0xf3ead2, yaw);
    decal(h4, x, z, 0.3, 0.07, i % 2 ? 0xc8352f : 0x3466b8, yaw, false, true);
  });
  // A plaque sign by the green.
  sign("HOLE 4. PROMISED: EVERY SEASON.\nDELIVERED: THIS ONE.", -1268, 846.5, 1.2, 1.7, 0.8);
  // Turf rolls by the tee (new turf for a course that was always about to open).
  pieces.push({ prefab: 'turf-roll-stack', x: -1145.6, z: 837.6, yaw: 0.3, scale: 1.3, solid: true });
  pieces.push({ prefab: 'turf-roll-stack', x: -1153, z: 836, yaw: -0.2, scale: 1.3, solid: true });
  pieces.push({ prefab: 'turf-roll-stack', x: -1149.2, z: 833.7, yaw: 0.1, scale: 1.0, solid: true });

  // ---- Hole 5: The Maze --------------------------------------------------------------------------------------------
  const h5 = vignette(root, 'hole5-maze');
  // Breadcrumbs: golf tees along a figure of eight that loops back across itself, a tam where it ends.
  const TRAIL = { x: -1335, z: 918 };
  for (let i = 0; i < 26; i++) {
    const t = (i / 26) * Math.PI * 2 * 1.08 + 0.3;
    pieces.push({ prefab: 'golf-tee', x: TRAIL.x + Math.cos(t) * 5.6, z: TRAIL.z + Math.sin(2 * t) * 3.6, yaw: i * 1.7, scale: 5, solid: false });
  }
  put(h5, ['golf-tam'], TRAIL.x + 0.4, TRAIL.z - 0.2, { yaw: 0.9, scale: 3.4 });
  // A dropped scorecard with a hand-drawn map (it goes in circles).
  const card = { x: -1327.4, z: 911.8 };
  decal(h5, card.x, card.z, 0.7, 1.0, 0xf3ead2, 0.5);
  [[0, 0.22, 0.46, 0.04, 0], [0.12, 0.02, 0.04, 0.36, 0], [-0.1, -0.15, 0.3, 0.04, 0], [-0.2, 0.06, 0.04, 0.3, 0], [0.18, -0.26, 0.2, 0.04, 0]]
    .forEach(([dx, dz, w, d]) => {
      const c = Math.cos(0.5), s = Math.sin(0.5);
      decal(h5, card.x + dx * c + dz * s, card.z - dx * s + dz * c, w, d, 0x26283a, 0.5, false, true);
    });
  decal(h5, card.x + 0.2, card.z - 0.34, 0.08, 0.08, 0xc8352f, 0, true, true);
  // A ball that has come to rest against the hedge (the second wall's north face).
  pieces.push({ prefab: 'golf-ball', x: -1344, z: 896.4, yaw: 0, scale: 3, solid: false });
  decal(h5, -1344.4, 895.9, 0.7, 0.4, 0x4a6a2e, 0.3);
  sign('THE MAZE.\nIF FOUND, PLEASE RETURN MEMBERS TO THE CLUBHOUSE.', -1326.5, 840.2, 1.35, 1.8, 0.85);
  sign('YOU ARE HERE.\nSO IS EVERYONE ELSE.', -1344.5, 925, 1.5, 1.5, 0.7);

  // ---- Hole 6: The Drip --------------------------------------------------------------------------------------------
  const h6 = vignette(root, 'hole6-drip');
  const P = { x: -1248, z: 934 };
  put(h6, ['giant-birdbath'], P.x, P.z, { yaw: 0.5, scale: 1.05 });
  boxes.push({ minX: P.x - 1.2, maxX: P.x + 1.2, minZ: P.z - 1.2, maxZ: P.z + 1.2, h: ground(P.x, P.z) + 4.5, shape: 'round' });
  // Lily pads on the Drip (they sit on the water decal).
  const pad = rnd(61);
  for (let i = 0; i < 9; i++) {
    const a = pad() * Math.PI * 2, d = 4 + pad() * 8.4;
    const x = P.x + Math.cos(a) * d, z = P.z + Math.sin(a) * d;
    decal(h6, x, z, 0.8 + pad() * 0.7, 0, 0x3f8a3a, 0, true, true);
    if (i % 3 === 0) decal(h6, x + 0.95, z, 0.22, 0, 0xf2a3c4, 0, true, true);   // a lily flower beside its pad, not on it
  }
  // The leaking hosepipe: from a tap on the old fence, across the garden, into the pond.
  const tap = new THREE.Vector3(-1232, 0, 833.2);
  const hoseXZ: [number, number][] = [
    [tap.x, tap.z], [-1234, 841], [-1230, 849], [-1236, 858], [-1243, 864], [-1241, 872], [-1233, 878], [-1229, 886],
    [-1236, 891], [-1245, 888], [-1248, 896], [-1241, 903], [-1243, 911], [-1250, 916], [-1251.5, 921.6],
  ];
  const hoseMat = new THREE.MeshStandardMaterial({ color: 0x3f9a3a, roughness: 0.55 });
  const curve = new THREE.CatmullRomCurve3(hoseXZ.map(([x, z]) => new THREE.Vector3(x, ground(x, z) + 0.09, z)));
  const hose = new THREE.Mesh(new THREE.TubeGeometry(curve, 150, 0.09, 6, false), hoseMat);
  hose.name = 'hose';
  hose.castShadow = true;
  h6.add(hose);
  // Tap post at the fence, the brass nozzle at the pond end, and the leak halfway (a puddle).
  put(h6, ['pitchfork'], -1262, 904, { yaw: 0.8, pitch: -1.2, scale: 1.1, y: 0.05 });
  const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.07, 0.4, 8), new THREE.MeshStandardMaterial({ color: 0xc9a23f, metalness: 0.5, roughness: 0.4 }));
  nozzle.position.set(-1251.5, ground(-1251.5, 921.6) + 0.14, 921.6);
  nozzle.rotation.set(HALF_PI * 0.8, 0.0, 0);
  h6.add(nozzle);
  const tapPost = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.7, 8), new THREE.MeshStandardMaterial({ color: 0x8a9097, metalness: 0.4, roughness: 0.5 }));
  tapPost.position.set(tap.x, ground(tap.x, tap.z) + 0.35, tap.z);
  h6.add(tapPost);
  decal(h6, -1243, 864, 2.4, 0, 0x2f6fa0, 0, true);
  decal(h6, -1241.6, 865.2, 1.1, 0, 0x4aa8e8, 0, true, true);
  // Drops: one falls from the nozzle into the Drip, one at the leak.
  const dropGeo = new THREE.SphereGeometry(0.07, 6, 5);
  const dropMat = new THREE.MeshStandardMaterial({ color: 0x4aa8e8, roughness: 0.2 });
  const rippleMat = new THREE.MeshBasicMaterial({ color: 0xe6f6ff, transparent: true, opacity: 0.7, depthWrite: false });
  rippleMat.polygonOffset = true;
  rippleMat.polygonOffsetFactor = -4;
  rippleMat.polygonOffsetUnits = -4;
  const drops = [
    { x: -1251.5, z: 923.4, y0: 1.1, y1: 0.06, period: 1.5, phase: 0.0 },
    { x: -1243, z: 864, y0: 0.7, y1: 0.06, period: 1.1, phase: 0.4 },
  ].map((d) => {
    const mesh = new THREE.Mesh(dropGeo, dropMat);
    h6.add(mesh);
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.1, 0.16, 16), rippleMat.clone());
    ring.rotation.x = -HALF_PI;
    ring.position.set(d.x, ground(d.x, d.z) + 0.06, d.z);
    ring.visible = false;
    h6.add(ring);
    return { ...d, mesh, ring };
  });
  // The wet balls the net fished out, heaped on the bank beside it.
  const bank = { x: -1259.6, z: 920.4 };
  decal(h6, bank.x, bank.z, 3.2, 0, 0x4a5a6a, 0, true);
  const heap = rnd(17);
  for (let layer = 0, n = 7; layer < 4; layer++, n -= 2) {
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2 + layer, r = n > 1 ? 0.13 * n * 0.62 : 0;
      pieces.push({
        prefab: 'golf-ball', x: bank.x + Math.cos(a) * r + (heap() - 0.5) * 0.06, z: bank.z + Math.sin(a) * r + (heap() - 0.5) * 0.06,
        yaw: 0, scale: 3.2, y: 0.12 + layer * 0.12, solid: false,
      });
    }
  }
  put(h6, ['ball-net'], bank.x + 1.6, bank.z + 0.5, { yaw: 0.4, pitch: -1.2, roll: 0.15, scale: 1.1, y: 0.35 });
  sign('THE DRIP.\nFED BY HOSEPIPE POND,\nWHEN THRIFT REMEMBERS.', -1280, 943.2, -2.96, 1.7, 0.85);

  // ---- Hole 7: cabbage rows south of the line of play, a rake in the front bunker ----------------------------------
  const rows7 = [961.8, 965.4, 969.0];
  rows7.forEach((z, r) => {
    for (let x0 = -1170 + r * 2; x0 < -1112; x0 += 12) decal(root, x0 + 5, z, 10.4, 1.9, 0x6b4a30, 0);
    for (let x = -1167 + (r % 2) * 1.4; x < -1114; x += 3.0) {
      const k = Math.round((x + z) * 3);
      if (k % 11 === 0) continue;   // a gap where something has been at it
      pieces.push({ prefab: k % 4 === 0 ? 'crop-cabbage-1' : 'crop-cabbage-2', x, z, yaw: k * 0.7, scale: 1.6, solid: false });
    }
  });
  put(root, ['bunker-rake'], -1101.6, 927.8, { yaw: 2.4, scale: 2.4, y: 0.04 });

  // ---- Hole 8: the rhubarb patch -----------------------------------------------------------------------------------
  const h8 = vignette(root, 'hole8-rhubarb-patch');
  const bedZ = [901.5, 908.5, 915.2];
  bedZ.forEach((z, r) => {
    for (let x0 = -1094; x0 < -1049; x0 += 9.6) {
      decal(h8, x0 + 4.4, z, 8.6, 2.5, 0x6b4a30, 0);
    }
    for (let x = -1092; x < -1049; x += r === 1 ? 4.2 : 3.2) {
      if (r === 0 && Math.abs(x + 1071.6) < 1.2) continue;   // the half-eaten one is placed by hand below
      const id = r === 0 ? 'crop-cabbage-2' : r === 1 ? 'crop-pumpkin-2' : (Math.round(x) % 2 ? 'crop-cabbage-1' : 'crop-cabbage-0');
      pieces.push({ prefab: id, x, z, yaw: x * 0.9, scale: r === 1 ? 1.7 : 1.7, solid: false });
    }
  });
  // The half-eaten cabbage and the slug trails that lead to it.
  pieces.push({ prefab: 'crop-cabbage-2', x: -1071.6, z: 901.5, yaw: 0.4, scale: 1.7, solid: false });
  decal(h8, -1070.7, 900.7, 0.9, 0.7, 0x7fa86a, 0.5, false, true);
  decal(h8, -1072.2, 902.4, 0.5, 0.4, 0xe9f0d8, 0.2, false, true);
  const trailCols = [0xd9e1e6, 0xd9e1e6];   // one colour: crossing trails on one layer must not differ (z-fight)
  [[-1074.6, 912.0, 1], [-1066.4, 911.4, -1], [-1076.0, 922.0, 1]].forEach(([x0, z0, side], i) => {
    for (let k = 0; k < 15; k++) {
      const tt = k / 15;
      decal(h8, x0 + side * tt * 3.6 + Math.sin(tt * 9) * 0.35, z0 - tt * (z0 - 902.6), 0.22, 0.5, trailCols[i % 2], Math.sin(tt * 9) * 0.5, false, true);
    }
  });
  put(h8, ['scarecrow'], -1060.6, 905.0, { yaw: -0.4, scale: 1.35 });
  pieces.push({ prefab: 'cold-frame', x: -1052.5, z: 917.4, yaw: 0.25, scale: 2.2, solid: false });
  put(h8, ['wheelbarrow'], -1086.4, 919.2, { yaw: 0.8, scale: 2.0 });
  put(h8, ['pitchfork'], -1084.6, 921.0, { yaw: -0.5, pitch: -0.25, roll: 0.15, scale: 1.2 });
  put(h8, ['compost-heap'], -1046.5, 898.0, { yaw: 0.6, scale: 1.6 });
  sign('THE RHUBARB PATCH.\nTHE PLANTS WERE HERE FIRST.', -1044.6, 925.2, 1.9, 1.7, 0.8);
  // A ring of giants round the green, just outside the fringe, open toward the fairway (east-south-east).
  const G8 = HOLES[8].green;
  const open = Math.atan2(886 - G8.z, -1026 - G8.x);
  const ring = rnd(88);
  let idx = 0;
  for (const rad of [13.6, 15.2, 16.6]) {
    const count = Math.round((rad * Math.PI * 2) / 4.6);
    for (let k = 0; k < count; k++) {
      const a = (k / count) * Math.PI * 2 + rad * 0.37;
      let da = Math.abs(a - open) % (Math.PI * 2);
      if (da > Math.PI) da = Math.PI * 2 - da;
      if (da < 0.61) continue;
      const jr = rad + (ring() - 0.5) * 0.8, ja = a + (ring() - 0.5) * 0.12;
      const x = G8.x + Math.cos(ja) * jr, z = G8.z + Math.sin(ja) * jr;
      if (inPlay(x, z, 0) || z < BOTTOM_GARDEN.minZ + 2 || z > BOTTOM_GARDEN.maxZ - 2) continue;
      const sun = idx % 3 === 1;
      const s = sun ? 1.5 + ring() * 0.15 : 1.35 + ring() * 0.35;
      const g = put(h8, [sun ? 'giant-sunflower' : 'giant-rhubarb'], x, z, { yaw: sun ? Math.atan2(G8.x - x, G8.z - z) + Math.PI + (ring() - 0.5) * 0.5 : ring() * 6.28, scale: s });
      if (g) soft.push({ x, z, r: (sun ? 0.55 : 1.1) * s * 0.9 + 0.3 });
      idx++;
    }
  }
  // Rhubarb along the patch's far edge too (the patch is theirs, the course just visits).
  [[-1098, 893], [-1044, 911], [-1099.5, 903]].forEach(([x, z], i) => {
    if (inPlay(x, z, 0)) return;
    const s = 1.4 + i * 0.1;
    put(h8, ['giant-rhubarb'], x, z, { yaw: i * 2.1, scale: s });
    soft.push({ x, z, r: 1.1 * s * 0.9 + 0.3 });
  });

  // ---- The Turn: the halfway table, south of the gate ---------------------------------------------------------------
  const turn = vignette(root, 'the-turn');
  pieces.push({ prefab: 'halfway-table', x: TURN_GATE.x + 8.4, z: 838.2, yaw: -HALF_PI, scale: 1.3, solid: true });
  put(turn, ['bench'], TURN_GATE.x + 8.4, 842.8, { yaw: -HALF_PI, scale: 1.3 });
  put(turn, ['watering-can'], TURN_GATE.x + 8.6, 834.7, { yaw: 1.0, scale: 1.8 });
  sign('THE TURN.\nTEA: HONESTY BOX.\nHONESTY: ALSO HONESTY BOX.', TURN_GATE.x + 8.4, 832.4, Math.PI, 1.7, 0.9);

  // ---- Batch the standing pieces; collect their colliders ---------------------------------------------------------------
  boxes.push(...buildPieces(root as unknown as THREE.Scene, pieces, 'hedgeworth-bottom-garden-pieces'));
  // Keep only what stays inside the yard (a safety net for a mistyped coordinate).
  for (let i = boxes.length - 1; i >= 0; i--) {
    const b = boxes[i];
    if (!inYard((b.minX + b.maxX) / 2, (b.minZ + b.maxZ) / 2)) boxes.splice(i, 1);
  }

  return {
    boxes,
    soft,
    update(_dt: number, t: number): void {
      for (const s of swayers) s.obj.rotation.z = Math.sin(t * 0.9 + s.phase) * 0.012;
      for (const d of drops) {
        const u = ((t + d.phase * d.period) % d.period) / d.period;   // 0..1 through one drip
        const fall = 0.55;                                               // the drop falls during the first 55 %
        if (u < fall) {
          const f = u / fall;
          d.mesh.visible = true;
          d.mesh.position.set(d.x, ground(d.x, d.z) + d.y0 + (d.y1 - d.y0) * f * f, d.z);
          d.ring.visible = false;
        } else {
          d.mesh.visible = false;
          const f = (u - fall) / (1 - fall);
          d.ring.visible = true;
          d.ring.scale.setScalar(1 + f * 5);
          (d.ring.material as THREE.MeshBasicMaterial).opacity = 0.7 * (1 - f);
        }
      }
    },
  };
}
