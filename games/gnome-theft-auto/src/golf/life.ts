// Hedgeworth's life (E15 A8): hole signs and yardage posts, jokes on signs and posters, small vignettes in each of the
// four areas (first tee and clubhouse, the course, the groundskeeper's shed, the broken fence), Peony, Basil and Thrift
// doing their own thing at their spots, two members putting, a mole, sprinklers that tick round and the place's sounds.
// Prefabs are looked up by id and skipped while missing (getPrefab), so the course reads without any one of them.
import * as THREE from 'three';
import { LAYER, flatLayer } from '@lawn/depth';
import { buildPrefab, getPrefab } from '@lawn/prefabs';
import { DEFAULT_LOOK } from '../config';
import { gnomeState, makeGnome } from '../gnomes';
import { buildPieces, prefabBox, textPlate, type HomePiece } from '../homes/pieces';
import { playAt } from '../sound/bus';
import { heightAt } from '../terrain';
import type { Box } from '../types';
import {
  CLUBHOUSE, GOLF_ORIGIN, HEDGEWORTH_CAST, HOLES, KICKED_BOARD, MOLEHILLS, PEOPLE_SPOTS, POTTING_SHED, TEE_HALF_M, YD,
} from './types';

export interface HedgeworthLife {
  boxes: Box[];
  /** t = seconds since start; px, pz = the player. */
  update(dt: number, t: number, px: number, pz: number): void;
}

const HALF_PI = Math.PI / 2;
const PLATE_BG = 0xf2e8c8;
/** Past this distance from the course nothing animates. */
const FAR = 250;
/** Ambient sound plays only this close to the course centre. */
const SOUND_RANGE = 120;

const ground = (x: number, z: number): number => heightAt(x, z);
const firstOf = (ids: readonly string[]): string | null => ids.find((id) => getPrefab(id)) ?? null;

interface PutOpts { yaw?: number; scale?: number; y?: number; pitch?: number; roll?: number; tint?: number; on?: number }

/** One prefab stood on the ground (first id that exists); null when none does. `y` lifts it, pitch/roll tip it. */
function put(parent: THREE.Object3D, ids: readonly string[], x: number, z: number, o: PutOpts = {}): THREE.Object3D | null {
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

/** A flat rectangle (w along x, d along z before yaw) or disc (round, w = diameter) lying on the ground. */
function decal(parent: THREE.Object3D, x: number, z: number, w: number, d: number, color: number, yaw = 0, round = false, top = false): void {
  const geo = round ? new THREE.CircleGeometry(w / 2, 14) : new THREE.PlaneGeometry(w, d);
  // A decal lying on another decal goes one layer up (`top`), so the two never fight.
  const mesh = new THREE.Mesh(geo, decalMat(color, top ? LAYER.marker : LAYER.decal));
  mesh.rotation.set(-HALF_PI, 0, 0);
  const grp = new THREE.Group();
  grp.add(mesh);
  grp.position.set(x, ground(x, z) + (top ? 0.03 : 0.02), z);
  grp.rotation.y = yaw;
  grp.name = 'golf-decal';
  parent.add(grp);
}

function vignette(life: THREE.Group, name: string): THREE.Group {
  const g = new THREE.Group();
  g.name = name;
  life.add(g);
  return g;
}

/** A plate in front of a standing piece (its yaw looks the way the plate does), `y` above the ground. */
function plateAt(parent: THREE.Object3D, text: string, x: number, z: number, yaw: number, y: number, w: number, h: number, d = 0.12): void {
  const px = x + Math.sin(yaw) * d, pz = z + Math.cos(yaw) * d;
  parent.add(textPlate(text, px, ground(px, pz) + y, pz, yaw, { w, h, bg: PLATE_BG }));
}

/** Point `s` metres back from the green along a hole's centreline, and the unit normal there (left of play). */
function backFromGreen(path: readonly { x: number; z: number }[], s: number): { x: number; z: number; nx: number; nz: number } {
  let left = s;
  for (let i = path.length - 1; i > 0; i--) {
    const a = path[i], b = path[i - 1];
    const len = Math.hypot(b.x - a.x, b.z - a.z);
    if (left <= len || i === 1) {
      const f = Math.min(1, left / len);
      const dx = (b.x - a.x) / len, dz = (b.z - a.z) / len;
      return { x: a.x + (b.x - a.x) * f, z: a.z + (b.z - a.z) * f, nx: -dz, nz: dx };
    }
    left -= len;
  }
  return { x: path[0].x, z: path[0].z, nx: 0, nz: 1 };
}

function pathLength(path: readonly { x: number; z: number }[]): number {
  let n = 0;
  for (let i = 1; i < path.length; i++) n += Math.hypot(path[i].x - path[i - 1].x, path[i].z - path[i - 1].z);
  return n;
}

const HOLE_JOKES: Record<number, string> = {
  1: 'The Mortgage: pay it off in four.',
  2: "Vesper's Patience: short, and gone before you know it.",
  3: 'The Long Week: mind the pond. It minds you.',
  4: "Peony's Promise: kept, eventually.",
  5: 'The Maze: the hedges know the way.',
  6: 'The Drip: the birds are judging.',
  7: 'The Potting Shed: mind the gutter.',
  8: 'The Rhubarb Patch: it was here first.',
  9: 'The Ninth: it really is, now.',
};

const SPRINKLERS: readonly { x: number; z: number; off: number }[] = [
  { x: -1250, z: 456, off: 0 }, { x: -1313, z: 595, off: 7 }, { x: -1155, z: 800, off: 14 }, { x: -1088, z: 618, off: 21 },
  // Hole 8's fairway side (E32).
  { x: -1012, z: 920, off: 5 },
];
const SPRAY_N = 30;
const SPRAY_R = 4;
const SPRAY_ON = 12;
const SPRAY_PERIOD = 30;

export function buildHedgeworthLife(scene: THREE.Scene): HedgeworthLife {
  const life = new THREE.Group();
  life.name = 'hedgeworth-life';
  const pieces: HomePiece[] = [];

  // ---- Hole signs and yardage posts ------------------------------------------------------------------------------
  const teeSignId = firstOf(['tee-sign', 'signpost']);
  const postId = firstOf(['yardage-post', 'site-cone']);
  const plates = new THREE.Group();
  plates.name = 'hedgeworth-signs';
  life.add(plates);
  for (const h of HOLES) {
    const dx = h.path[1].x - h.tee.x, dz = h.path[1].z - h.tee.z;
    const l = Math.hypot(dx, dz) || 1;
    // Left of the player who stands behind the tee looking down the hole: (dz, -dx).
    // An elevated tee (the potting shed roof) has its sign on the ground beside the ladder (north of it, clear of the climb).
    const sx = h.teeY !== undefined ? POTTING_SHED.ladder.x + 1.8 : h.tee.x + (dz / l) * (TEE_HALF_M + 2.5);
    const sz = h.teeY !== undefined ? POTTING_SHED.ladder.z - 3.2 : h.tee.z + (-dx / l) * (TEE_HALF_M + 2.5);
    const yaw = Math.atan2(-dx, -dz);
    if (teeSignId) pieces.push({ prefab: teeSignId, x: sx, z: sz, yaw });
    const yards = Math.round(pathLength(h.path) / YD);
    const top = teeSignId ? Math.max(1.1, prefabBox(teeSignId).max.y * 0.75) : 1.5;
    const front = teeSignId ? Math.max(0.1, prefabBox(teeSignId).max.z) + 0.05 : 0.15;
    plateAt(plates, `${h.number} · ${h.name}\nPar ${h.par} · ${yards} yd\n${HOLE_JOKES[h.number] ?? ''}`, sx, sz, yaw, top, 1.9, 1.0, front);
    if (postId && (h.number === 1 || h.number === 3)) {
      [[100, 0xc0392b], [150, 0xf5f5f5], [200, 0xf2c230]].forEach(([yd, tint]) => {
        const p = backFromGreen(h.path, yd * YD);
        pieces.push({ prefab: postId, x: p.x + p.nx, z: p.z + p.nz, yaw: yaw, tint, solid: false });
      });
    }
  }

  // ---- Signs and posters -------------------------------------------------------------------------------------------
  const signs = (text: string, x: number, z: number, yaw: number, w = 1.5, h = 0.7): void => {
    const id = firstOf(['signpost']);
    if (id) pieces.push({ prefab: id, x, z, yaw, solid: false });
    plateAt(plates, text, x, z, yaw, 1.7, w, h, id ? Math.max(0.1, prefabBox(id).max.z) + 0.05 : 0.12);
  };
  signs('PRIVATE COURSE.\nIF YOU CAN READ THIS YOU ARE ON\nTHE WRONG SIDE OF IT.', KICKED_BOARD.x - 5, KICKED_BOARD.z + 5, HALF_PI, 1.9, 0.9);
  signs('QUIET PLEASE.\nTHE GRASS IS GROWING.', -1040, 614, -HALF_PI, 1.4, 0.55);
  signs('HOSEPIPE POND.\nNO PADDLING.\nTHE MOWER IS WORKING.', -1234, 748, Math.atan2(-16, -13), 1.5, 0.8);
  signs('CARTS ON PATHS.\nGNOMES ON GRASS.\nMOLES: WE DO NOT HAVE MOLES.', -1036, 480, HALF_PI, 1.9, 0.8);
  // The fixture poster on the clubhouse wall, facing the terrace.
  plates.add(textPlate("MEMBERS' CUP\nFIRST OF THE MONTH\nDRESS: TWEED", -1050, ground(-1050, 453) + 1.8, CLUBHOUSE.z + CLUBHOUSE.d / 2 + 0.08, 0,
    { w: 1.3, h: 0.8, bg: PLATE_BG }));

  // ---- Vignettes: the first tee and the clubhouse -----------------------------------------------------------------
  const tee1 = vignette(life, 'vignette-tee-temper');
  put(tee1, ['golf-bag'], -1112, 456, { pitch: -1.35, yaw: 0.6 });
  [[-1109.5, 454.6, 0.4], [-1110.6, 458, 1.2], [-1114, 457.5, 2.3]].forEach(([x, z, yaw]) => put(tee1, ['golf-club', 'stick'], x, z, { yaw, pitch: -1.5, y: 0.1 }));
  put(tee1, ['yardage-post', 'site-cone'], -1106, 460, {});
  put(tee1, ['golf-club', 'stick'], -1106, 460, { pitch: -0.3, roll: 1.2, y: 0.35, scale: 1.1 });
  const tee2 = vignette(life, 'vignette-tee-picnic');
  put(tee2, ['picnic-basket', 'chore-basket'], -1070, 463.6, { yaw: 0.4 });
  put(tee2, ['teacup', 'espresso-cup'], -1067.4, 464.1, { roll: 1.4, scale: 0.5 });
  decal(tee2, -1066.6, 464.6, 0.7, 0.5, 0x7a5236, 0.5, true);
  decal(tee2, -1068.4, 462.2, 0.34, 0.24, 0xf1ede2, 0.2);
  decal(tee2, -1068.1, 462.0, 0.34, 0.24, 0xf1ede2, -0.5, false, true);
  const tee3 = vignette(life, 'vignette-tee-basil');
  for (let row = 0; row < 3; row++) {
    for (let k = 0; k < 3 - row; k++) put(tee3, ['golf-ball'], -1089 + k * 0.28 + row * 0.14, 462 + row * 0.02, { y: row * 0.2, scale: 0.9 });
  }
  put(tee3, ['golf-tee'], -1085, 462.4, {});
  put(tee3, ['golf-ball'], -1085, 462.4, { y: 0.1 });
  decal(tee3, -1090.2, 463.2, 0.4, 0.4, 0x3f9a3a, 0, true);
  decal(tee3, -1090.2, 463.2, 0.1, 0.1, 0xcfd8dc, 0, true, true);

  // ---- Vignettes: the course -------------------------------------------------------------------------------------
  const course1 = vignette(life, 'vignette-course-hosta-ball');
  const hosta = put(course1, ['giant-hosta', 'fern-clump'], -1200, 506, { yaw: 0.3 });
  const hostaId = firstOf(['giant-hosta', 'fern-clump']);
  put(course1, ['golf-ball'], -1200, 506, { y: hosta && hostaId ? prefabBox(hostaId).max.y * 0.85 : 0, scale: 1 });
  const course2 = vignette(life, 'vignette-course-rake-prints');
  put(course2, ['bunker-rake'], -1181, 462.4, { yaw: 2.2, y: 0.05 });
  for (let k = 0; k < 6; k++) {
    const side = k % 2 === 0 ? -0.3 : 0.3;
    decal(course2, -1181.5 + side + k * 0.12, 459.4 - k * 2.0, 0.28, 0.46, 0x7a6a48, 0.1);
  }
  const course3 = vignette(life, 'vignette-course-pond-mower');
  put(course3, ['ride-on-mower', 'reel-mower', 'lost-ball-bucket'], -1234, 723, { yaw: -HALF_PI });
  put(course3, ['bunker-rake'], -1233, 727.4, { yaw: 0.9, y: 0.05 });
  for (let k = 0; k < 10; k++) {
    put(course3, ['golf-ball'], -1236.4 + Math.cos(k * 2.4) * (0.2 + k * 0.05), 718.4 + Math.sin(k * 2.4) * (0.2 + k * 0.05), { scale: 0.9 });
  }
  decal(course3, -1236.4, 718.6, 1.3, 1.3, 0x4a5a6a, 0, true);

  // ---- Vignettes: the groundskeeper's shed -----------------------------------------------------------------------
  const shed1 = vignette(life, 'vignette-shed-cans');
  [0.7, 0.85, 1.0, 1.15, 1.3].forEach((s, i) => put(shed1, ['watering-can'], -1054 + i * 2.4, 598.5, { yaw: 0.15, scale: s }));
  const shed2 = vignette(life, 'vignette-shed-deck-chair');
  const chairYaw = Math.atan2(-9, 18);
  put(shed2, ['deck-chair'], -1056, 622, { yaw: chairYaw });
  put(shed2, ['thermos'], -1057.6, 622.6, { scale: 0.6 });
  put(shed2, ['red-book', 'bookshelf'], -1057.2, 621.2, { yaw: 0.5, scale: 0.7 });
  const shed3 = vignette(life, 'vignette-shed-mole-tea');
  put(shed3, ['mole-hill'], -1046, 632, { scale: 0.8 });
  put(shed3, ['teacup', 'espresso-cup'], -1048.4, 628.9, { scale: 0.35 });
  decal(shed3, -1048.4, 628.9, 0.35, 0.35, 0xe8e4d8, 0, true);
  decal(shed3, -1044.4, 628.4, 1.0, 0.8, 0x5d8a3f, 0.4);
  decal(shed3, -1044.4, 628.9, 0.3, 0.3, 0x151210, 0, true, true);

  // ---- Vignettes: the broken fence -------------------------------------------------------------------------------
  const kx = KICKED_BOARD.x, kz = KICKED_BOARD.z;
  const fence1 = vignette(life, 'vignette-fence-bucket');
  put(fence1, ['lost-ball-bucket'], kx + 8, kz + 6, { yaw: HALF_PI });
  plateAt(fence1, "BALLS FROM OVER THE FENCE\nHELP YOURSELF. DON'T.", kx + 8, kz + 6, HALF_PI, 1.5, 1.7, 0.6, 0.8);
  put(fence1, ['fence-plank-pile', 'woodpile'], kx + 5, kz - 6, { yaw: 0.3 });
  const fence2 = vignette(life, 'vignette-fence-verge-balls');
  for (let k = 0; k < 12; k++) {
    put(fence2, ['golf-ball'], kx + 2 + ((k * 37) % 41) * 0.9, kz - 14 + ((k * 53) % 29), { scale: 0.9 });
  }
  const fence3 = vignette(life, 'vignette-fence-prop');
  put(fence3, ['stick'], kx - 2.6, kz - 1.2, { yaw: 0.4, pitch: -1.3 });
  put(fence3, ['brick-stack'], kx - 2.2, kz + 1.6, { yaw: 0.2, scale: 0.35 });
  decal(fence3, kx - 2.2, kz + 1.6, 0.5, 0.3, 0x9a4a3a, 0.2);
  const fence4 = vignette(life, 'vignette-fence-arrow');
  const arrowPost = firstOf(['signpost']);
  if (arrowPost) put(fence4, [arrowPost], -956, 640, { yaw: HALF_PI });
  plateAt(fence4, 'THIS WAY TO THE\nKICKED BOARD  <--', -956, 640, HALF_PI, 1.7, 1.5, 0.6, arrowPost ? Math.max(0.1, prefabBox(arrowPost).max.z) + 0.05 : 0.12);

  // Everything above the tee-sign plates: the standing pieces (tee signs, posts, signposts) with colliders.
  const boxes = buildPieces(scene, pieces, 'hedgeworth-life');

  // ---- Residents ---------------------------------------------------------------------------------------------------
  const resident = (key: 'peony' | 'basil' | 'thrift') => {
    const p = HEDGEWORTH_CAST[key];
    const hand = p.held && getPrefab(p.held) ? p.held : undefined;
    const model = makeGnome(life, { ...DEFAULT_LOOK, ...p.look, equipment: { ...p.look.equipment, ...(hand ? { hand } : {}) } });
    model.object.name = `hedgeworth-${key}`;
    const s = PEOPLE_SPOTS[key];
    model.object.position.set(s.x, ground(s.x, s.z), s.z);
    model.object.rotation.y = s.yaw;
    return { model, spot: s, yaw: s.yaw };
  };
  const peony = resident('peony');
  const basil = resident('basil');
  const thrift = resident('thrift');
  const memberLook = (hat: number, shirt: number, hand?: string) => ({
    ...DEFAULT_LOOK, hat, shirt, pants: 0x4a4436, beard: 0xcfcfcf,
    ...(hand && getPrefab(hand) ? { equipment: { hand } } : {}),
  });
  const members = [
    { model: makeGnome(life, memberLook(0x6b5a3a, 0x8a7a58)), x: -1295, z: 573.2, yaw: 0.2, crouch: true },
    { model: makeGnome(life, memberLook(0x3f5a3a, 0x7a6a48, 'golf-flagstick')), x: -1290.6, z: 573.6, yaw: -0.4, crouch: false },
  ];
  // The Bottom Garden residents (E32): a member lost in the maze, one fishing a ball out of the Drip.
  const lostMember = { model: makeGnome(life, memberLook(0x5a3f3f, 0x6a7a58, 'golf-scorecard')), x: -1350, z: 925, yaw: 0.6, crouch: false };
  const fisher = { model: makeGnome(life, memberLook(0x3f4a6b, 0x8a7a58, 'stick')), x: -1262, z: 918, yaw: Math.atan2(14, 16), crouch: true };
  members.push(lostMember, fisher);
  members.forEach((m, i) => { m.model.object.name = `hedgeworth-member-${i}`; m.model.object.position.set(m.x, ground(m.x, m.z), m.z); m.model.object.rotation.y = m.yaw; });

  // The mole (only when a mole prefab exists): pops from a molehill (cycling) every 25-35 s when the player is near,
  // rises in 0.4 s, looks left and right for 2 s, ducks back in 0.4 s. Hidden the rest of the time.
  const moleId = firstOf(['mole']);
  const mole = moleId ? put(life, [moleId], MOLEHILLS[0].x, MOLEHILLS[0].z, { scale: 1.6, y: -0.4 }) : null;
  if (mole) { mole.visible = false; mole.name = 'hedgeworth-mole'; }
  let molePopAt = -1;
  let moleGround = 0;
  let moleYaw = 0;
  let moleNextAt = 25 + Math.random() * 10;
  let moleIdx = 0;

  // Birds on the giant birdbath's rim (hole 6; the bath is built by bottomGarden.ts, so the height is a guess).
  const BATH = { x: -1248, z: 934, rim: 2.3, y: 4.2 };
  const birdIds = ['bird-songbird', 'bird-robin', 'bird-songbird'];
  const birds = birdIds.map((id, i) => {
    const a = 0.9 + i * 0.7;
    const x = BATH.x + Math.sin(a) * BATH.rim, z = BATH.z + Math.cos(a) * BATH.rim;
    const grp = put(life, [id], x, z, { scale: 1.6, yaw: a + Math.PI / 2, y: BATH.y });
    if (grp) grp.name = 'hedgeworth-bird';
    return { grp, base: BATH.y + ground(x, z), phase: 3 + i * 2.3, yaw: a + Math.PI / 2 };
  });

  // ---- Sprinklers -------------------------------------------------------------------------------------------------
  const sprinklerHead = firstOf(['sprinkler-head']);
  const sprays = SPRINKLERS.map((sp) => {
    if (sprinklerHead) put(life, [sprinklerHead], sp.x, sp.z, {});
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(SPRAY_N * 3), 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({
      color: 0xbfe6ff, size: 0.14, transparent: true, opacity: 0.75, depthWrite: false,
    }));
    pts.frustumCulled = false;
    pts.visible = false;
    pts.name = 'hedgeworth-sprinkler-spray';
    pts.position.set(sp.x, ground(sp.x, sp.z) + 0.1, sp.z);
    life.add(pts);
    return { sp, pts, hiss: 0 };
  });

  scene.add(life);

  let tockT = 8 + Math.random() * 10;
  let birdT = 12 + Math.random() * 15;

  return {
    boxes,
    update(dt, t, px, pz) {
      if (Math.hypot(px - GOLF_ORIGIN.x, pz - GOLF_ORIGIN.z) > FAR) return;

      // Peony surveys the course every 6 s and lifts her driver-cane to point.
      {
        const target = peony.spot.yaw + [0, -0.7, 0.5, -0.25][Math.floor(t / 6) % 4];
        peony.yaw += (target - peony.yaw) * Math.min(1, dt * 2);
        peony.model.update(gnomeState(peony.spot.x, ground(peony.spot.x, peony.spot.z), peony.spot.z, peony.yaw, 0), dt);
        if (t % 6 > 3.4) peony.model.arms.right.rotation.x = -1.6 + Math.sin(t * 6) * 0.05;
      }
      // Basil swings slowly, and pats his sock every ~20 s.
      {
        basil.model.update(gnomeState(basil.spot.x, ground(basil.spot.x, basil.spot.z), basil.spot.z, basil.spot.yaw, 0), dt);
        if (t % 20 < 2.2) {
          basil.model.arms.right.rotation.x = 0.5 + Math.sin(t * 9) * 0.25;
        } else {
          const swing = Math.sin(t * 1.4);
          basil.model.arms.right.rotation.x = -0.9 + swing * 0.9;
          basil.model.arms.left.rotation.x = -0.9 + swing * 0.9;
        }
      }
      // Thrift crouches and pats the ground, then lifts the can (a 12 s loop).
      {
        const ph = t % 12;
        const crouch = ph < 4;
        thrift.model.update(gnomeState(thrift.spot.x, ground(thrift.spot.x, thrift.spot.z), thrift.spot.z, thrift.spot.yaw, 0, crouch), dt);
        if (crouch) thrift.model.arms.left.rotation.x = -0.9 + Math.sin(t * 8) * 0.3;
        else if (ph < 8) thrift.model.arms.right.rotation.x = -1.5;
      }
      // The members: one crouched to read the line, one standing with the flag.
      lostMember.yaw = 0.6 + Math.sin(t * 0.45) * 2.4;
      fisher.yaw = Math.atan2(14, 16) + Math.sin(t * 0.7) * 0.15;
      for (const m of members) m.model.update(gnomeState(m.x, ground(m.x, m.z), m.z, m.yaw, 0, m.crouch), dt);
      // The lost member turns on the spot, scorecard up; the fisher sweeps the net across the water.
      lostMember.model.arms.right.rotation.x = -1.1 + Math.sin(t * 1.3) * 0.1;
      fisher.model.arms.right.rotation.x = -1.3 + Math.sin(t * 1.6) * 0.45;
      fisher.model.arms.left.rotation.x = -1.1 + Math.sin(t * 1.6) * 0.3;

      // Birds on the birdbath hop now and then.
      for (const b of birds) {
        if (!b.grp) continue;
        const hop = (t + b.phase) % 7;
        b.grp.position.y = b.base + (hop < 0.35 ? Math.sin((hop / 0.35) * Math.PI) * 0.25 : 0);
        b.grp.rotation.y = b.yaw + (hop > 3 && hop < 3.5 ? 0.6 : 0);
      }

      if (mole && moleId) {
        const age = t - molePopAt;
        if (molePopAt >= 0 && age < 2.8) {
          const up = age < 0.4 ? age / 0.4 : age < 2.4 ? 1 : 1 - (age - 2.4) / 0.4;
          mole.visible = true;
          mole.position.y = moleGround - 0.4 + (up * up * (3 - 2 * up)) * 0.42;
          mole.rotation.y = moleYaw + (age > 0.4 && age < 2.4 ? Math.sin(((age - 0.4) / 2) * Math.PI * 2) * 0.7 : 0);
        } else {
          mole.visible = false;
          molePopAt = -1;
          if (t >= moleNextAt) {
            const h = MOLEHILLS[moleIdx % MOLEHILLS.length];
            if (Math.hypot(px - h.x, pz - h.z) < 60) {
              moleIdx++;
              molePopAt = t;
              moleNextAt = t + 25 + Math.random() * 10;
              moleGround = ground(h.x, h.z);
              moleYaw = Math.atan2(px - h.x, pz - h.z);
              mole.position.set(h.x + Math.sin(moleYaw) * 0.3, moleGround - 0.4, h.z + Math.cos(moleYaw) * 0.3);
            }
          }
        }
      }

      // Sprinklers sweep for 12 s, rest 18 s; spray stays under 1.2 m and within 4 m.
      for (const s of sprays) {
        const ph = (t + s.sp.off) % SPRAY_PERIOD;
        const on = ph < SPRAY_ON;
        s.pts.visible = on;
        if (!on) continue;
        const arm = ph * 1.4;
        const pos = s.pts.geometry.getAttribute('position') as THREE.BufferAttribute;
        for (let i = 0; i < SPRAY_N; i++) {
          const f = (i + 1) / SPRAY_N;
          const a = arm - f * 0.7;
          const r = f * SPRAY_R;
          pos.setXYZ(i, Math.cos(a) * r, 0.05 + 4 * f * (1 - f) * 1.0, Math.sin(a) * r);
        }
        pos.needsUpdate = true;
        s.hiss -= dt;
        if (s.hiss <= 0 && Math.hypot(px - s.sp.x, pz - s.sp.z) < 40) {
          s.hiss = 3;
          playAt('sprinkler-hiss', s.sp, { bus: 'ambience' });
        }
      }

      // Ambient sound near the course: a distant tock now and then, birds.
      if (Math.hypot(px - GOLF_ORIGIN.x, pz - GOLF_ORIGIN.z) <= SOUND_RANGE) {
        tockT -= dt;
        if (tockT <= 0) {
          tockT = 15 + Math.random() * 15;
          const h = HOLES[Math.floor(Math.random() * HOLES.length)];
          playAt('golf-tock', { x: h.green.x + (Math.random() - 0.5) * 20, z: h.green.z + (Math.random() - 0.5) * 20 }, { bus: 'ambience' });
        }
        birdT -= dt;
        if (birdT <= 0) {
          birdT = 20 + Math.random() * 25;
          playAt('bird-song', { x: px + (Math.random() - 0.5) * 60, z: pz + (Math.random() - 0.5) * 60 }, { bus: 'ambience' });
        }
      }
    },
  };
}
