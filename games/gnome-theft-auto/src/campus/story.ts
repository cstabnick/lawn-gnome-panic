// Rootwell University's storytelling (E13 issue A13): vignettes (props arranged to tell a story), signs and posters.
// Everything lives in one group, 'rootwell-story'. Colliders only for things a gnome should bump into.
import * as THREE from 'three';
import { LAYER, flatLayer } from '@lawn/depth';
import { buildPrefab, getPrefab } from '@lawn/prefabs';
import { buildPieces, prefabBox, textPlate, type HomePiece } from '../homes/pieces';
import { heightAt } from '../terrain';
import type { Box } from '../types';

const E = Math.PI / 2, W = -Math.PI / 2, N = Math.PI;
const WOOD = 0x8a6a42;
const PAPER = 0xf2e8c8;

/** Small deterministic wobble in -1..1 so the scatter is the same every load. */
const wob = (i: number, k: number): number => (Math.sin(i * 12.9898 + k * 78.233) * 43758.5453) % 1;

/** How far a prefab reaches along its own front (+z), metres (0.1 when it is not in the catalogue yet). */
const front = (id: string): number => (getPrefab(id) ? prefabBox(id).max.z : 0.1);

/** Height of a prefab's top when scaled so its longest side is `size` metres. */
function topOf(id: string, size: number): number {
  if (!getPrefab(id)) return size;
  const b = prefabBox(id);
  const longest = Math.max(b.max.x - b.min.x, b.max.y - b.min.y, b.max.z - b.min.z);
  return longest > 0 ? (b.max.y * size) / longest : size;
}

interface Loose { y?: number; size?: number; tiltX?: number; tiltZ?: number }

export function buildCampusStory(scene: THREE.Scene, boxes: Box[]): void {
  const group = new THREE.Group();
  group.name = 'rootwell-story';
  const pieces: HomePiece[] = [];
  const missing = new Set<string>();

  const box = (cx: number, cz: number, hx: number, hz: number, h: number): void => {
    boxes.push({ minX: cx - hx, maxX: cx + hx, minZ: cz - hz, maxZ: cz + hz, h: heightAt(cx, cz) + h });
  };
  /** Architecture: a plain box (pallet, post, stake, scroll, laundry). */
  const arch = (w: number, h: number, d: number, x: number, y: number, z: number, color: number, yaw = 0): void => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color }));
    m.position.set(x, heightAt(x, z) + y, z);
    m.rotation.y = yaw;
    group.add(m);
  };
  /** A tilted or odd-angled prefab dropped on the ground (scatter, tipped chairs, spills). */
  const loose = (id: string, x: number, z: number, yaw: number, o: Loose = {}): void => {
    if (!getPrefab(id)) { missing.add(id); return; }
    const obj = buildPrefab(id, { lights: false });
    if (o.size) {
      const b = prefabBox(id);
      const longest = Math.max(b.max.x - b.min.x, b.max.y - b.min.y, b.max.z - b.min.z);
      if (longest > 0) obj.scale.setScalar(o.size / longest);
    }
    obj.rotation.set(o.tiltX ?? 0, yaw, o.tiltZ ?? 0, 'YXZ');
    obj.position.set(x, heightAt(x, z) + (o.y ?? 0.02), z);
    group.add(obj);
  };
  const piece = (prefab: string, x: number, z: number, yaw: number, o: Partial<HomePiece> = {}): HomePiece => {
    const p: HomePiece = { prefab, x, z, yaw, ...o };
    pieces.push(p);
    return p;
  };
  const plate = (text: string, x: number, y: number, z: number, yaw: number, w: number, h: number, bg = PAPER): THREE.Mesh => {
    const m = textPlate(text, x, y, z, yaw, { w, h, bg });
    group.add(m);
    return m;
  };
  /** A sign on a wooden stake: the plate stands 0.08 m in front (the way yaw faces). */
  const sign = (text: string, x: number, z: number, yaw: number, w = 1.2, h = 0.6, bg = PAPER, y = 1.4): void => {
    arch(0.1, y + h / 2, 0.1, x, (y + h / 2) / 2, z, WOOD);
    plate(text, x + Math.sin(yaw) * 0.08, heightAt(x, z) + y, z + Math.cos(yaw) * 0.08, yaw, w, h, bg);
  };
  /** A plate on a wall face (0.15 proud: the half-size prefabs' trim stands 0.06 off the wall). (wx, wz) is the wall point, yaw the way the wall faces. */
  const wallSign = (text: string, wx: number, wz: number, yaw: number, y: number, w: number, h: number, bg = PAPER): void => {
    plate(text, wx + Math.sin(yaw) * 0.15, heightAt(wx, wz) + y, wz + Math.cos(yaw) * 0.15, yaw, w, h, bg);
  };
  /** A plate on the front of a board prefab, `lateral` metres to its right. */
  const boardPlate = (p: HomePiece, text: string, y: number, w: number, h: number, lateral: number, bg = PAPER): void => {
    const d = front(p.prefab) * (p.scale ?? 1) + 0.04;
    const sn = Math.sin(p.yaw), cs = Math.cos(p.yaw);
    plate(text, p.x + sn * d + cs * lateral, heightAt(p.x, p.z) + y, p.z + cs * d - sn * lateral, p.yaw, w, h, bg);
  };
  /** A flat decal on a draw layer (each call its own material). */
  const flat = (geo: THREE.BufferGeometry, color: number, layer: number, x: number, z: number, yaw = 0): void => {
    geo.rotateX(-Math.PI / 2);
    const m = new THREE.Mesh(geo, flatLayer(new THREE.MeshBasicMaterial({ color }), layer));
    m.position.set(x, heightAt(x, z) + 0.02, z);
    m.rotation.y = yaw;
    group.add(m);
  };

  // ---- 1. Degree day, the morning after (lawn west of Tilth Hall, outside the quad) ------------------------------
  // Two columns of folding chairs facing a lectern against Tilth's west wall (x 1092); half are on their backs.
  for (let i = 0; i < 9; i++) {
    const z = -125 + i * 2;
    for (const [col, x] of [[0, 1079], [1, 1082.5]] as [number, number][]) {
      const k = i * 2 + col;
      if (k % 2 === 1) loose('chair', x + wob(k, 1) * 0.3, z + wob(k, 2) * 0.3, E + wob(k, 3) * 1.2, { y: 0.3, tiltZ: 1.45 });
      else piece('chair', x, z + wob(k, 4) * 0.2, E + wob(k, 5) * 0.15, { solid: false });
    }
  }
  piece('lectern', 1088.4, -116, W);
  for (let i = 0; i < 6; i++) {
    loose('rootwell-mortarboard', 1074 + i * 2.4 + wob(i, 6) * 1.2, -117 + wob(i, 7) * 13, wob(i, 8) * 3,
      { tiltX: wob(i, 9) * 0.25, tiltZ: wob(i, 10) * 0.25 });
  }
  // One hat stuck on top of a pole, with a notice.
  arch(0.1, 2.4, 0.1, 1085, 1.2, -131, WOOD);
  loose('rootwell-mortarboard', 1085, -131, 0.6, { y: 2.4, tiltZ: 0.3 });
  plate('DEGREE DAY\nPLEASE RETURN HATS\nTO TILTH HALL', 1085, heightAt(1085, -131) + 1.5, -130.92, 0, 1.3, 0.7);
  // A rolled scroll on the grass.
  arch(0.9, 0.12, 0.12, 1081, 0.1, -128.5, PAPER, 0.5);

  // ---- 2. The sugar store (between the Trencher's back wall x 1257 and the Cloche's west wall x 1276) ------------
  const sx = 1271, sz = -216;
  arch(1.7, 0.14, 1.3, sx, 0.09, sz, WOOD);
  box(sx, sz, 0.85, 0.65, 0.9);
  piece('sugar-sack', sx - 0.4, sz - 0.25, 0.3, { y: 0.16, solid: false });
  piece('sugar-sack', sx + 0.35, sz - 0.3, -0.2, { y: 0.16, solid: false });
  piece('sugar-sack', sx - 0.1, sz + 0.3, 0.1, { y: 0.16, solid: false });
  piece('sugar-cube-crate', sx + 0.4, sz + 0.3, 0.2, { y: 0.16, solid: false });
  piece('sugar-cube-crate', sx - 0.5, sz + 0.35, 0, { y: 0.16, solid: false });
  loose('sugar-sack', sx - 1.6, sz + 0.9, 1.2, { tiltZ: 1.3, y: 0.25 });
  // The spilled cubes.
  const cubeGeo = new THREE.BoxGeometry(0.1, 0.1, 0.1);
  const cubeMat = new THREE.MeshLambertMaterial({ color: 0xfaf6ee });
  for (let i = 0; i < 12; i++) {
    const cx = sx - 1.7 + wob(i, 11) * 0.8, cz = sz + 1.1 + wob(i, 12) * 0.6;
    const c = new THREE.Mesh(cubeGeo, cubeMat);
    c.position.set(cx, heightAt(cx, cz) + 0.05, cz);
    c.rotation.y = wob(i, 13) * 3;
    group.add(c);
  }
  // The ant line walks south from the spill, toward the Anthill.
  for (let i = 0; i < 12; i++) {
    loose('rootwell-ant', sx - 2.5 + Math.sin(i * 0.8) * 0.4, sz + 1.8 + i * 0.65, Math.cos(i * 0.8) * 0.4, { size: 0.35 });
  }
  wallSign('SUGAR STORE\nRENT (OVERDUE)', 1257, -219, E, 1.6, 0.9, 0.5, 0xe8d9a8);
  sign('NOT TERMITES', 1262.4, -209, W, 0.9, 0.3, 0xf4efe0, 0.6);

  // ---- 3. Physics homework (beside Plumbob Hall's door path) ---------------------------------------------------
  const px = 1191, pz = -270;
  flat(new THREE.RingGeometry(1.85, 2, 40), 0xffffff, LAYER.marking, px, pz);
  flat(new THREE.RingGeometry(0.85, 0.95, 32), 0xffffff, LAYER.marking, px, pz);
  flat(new THREE.PlaneGeometry(7, 0.07), 0xf2c200, LAYER.decal, px + 3, pz + 2.6);
  piece('crate', px, pz, 0.35, { size: 0.8 });
  loose('paper-plane', px, pz, 0.8, { y: topOf('crate', 0.8) + 0.04, tiltX: 0.12 });
  for (let i = 0; i < 6; i++) {
    const a = i * 1.1 + 0.4, r = 3 + wob(i, 14) * 1.4;
    loose('paper-plane', px + Math.cos(a) * r, pz + Math.sin(a) * r, wob(i, 15) * 3, { tiltX: wob(i, 16) * 0.2, tiltZ: wob(i, 17) * 0.2 });
  }
  sign('PLUMBOB HALL\nALL THINGS FALL.\nWE TAKE NOTES.', 1186, -274, 0, 1.3, 0.7);

  // ---- 4. Bodger's Shed's ornithopter, with its plans blowing away downwind -----------------------------------
  piece('ornithopter-frame', 1272, -301, 0.4, { size: 4 });
  for (let i = 0; i < 5; i++) {
    loose('essay-page', 1277 + i * 3.4 + wob(i, 18), -299 + i * 1.8 + wob(i, 19), wob(i, 20) * 3, { tiltX: wob(i, 21) * 0.3, tiltZ: wob(i, 22) * 0.3 });
  }
  piece('bench', 1294, -290, N, { size: 1.8 });
  loose('essay-page', 1294, -289.3, N, { y: 0.55, tiltX: -1.2 });
  sign("BODGER'S SHED\nTHE ORNITHOPTER IS NOT A BIRD\n(IT KNOWS)", 1280, -306, 0.2, 1.4, 0.6);

  // ---- 5. Bedstraw House: the sofa on the lawn, a laundry line -------------------------------------------------
  piece('couch', 1044, -298, -0.5, { size: 2.2 });
  loose('book-pile', 1041.5, -296, 0.4, { size: 0.5 });
  loose('cocoa-mug', 1046.2, -295.4, 0, { size: 0.15 });
  arch(0.12, 2, 0.12, 1014, 1, -298, WOOD);
  arch(0.12, 2, 0.12, 1024, 1, -298, WOOD);
  box(1014, -298, 0.1, 0.1, 2);
  box(1024, -298, 0.1, 0.1, 2);
  arch(10, 0.02, 0.02, 1019, 1.9, -298, 0xcccccc);
  [0xd94f4f, 0x4f8fd9, 0xf2d24f, 0xffffff, 0x6bbf6b].forEach((c, i) => {
    arch(0.5, 0.7, 0.04, 1015.6 + i * 1.8, 1.5, -298, c);
  });
  wallSign('BEDSTRAW HOUSE\nLIGHTS OUT WHEN\nTHE ANTS SAY SO', 1038, -307, 0, 3.4, 1.7, 0.8);

  // ---- 6. The Dean's grant (Dean's lodge door path, east of the lodge) ------------------------------------------
  piece('table', 1068.5, -255, E, { size: 1.6 });
  plate('PAY ROOTWELL UNIVERSITY\nONE GRANT\n— V. THORNE, HOA', 1068.1, heightAt(1068.5, -255) + topOf('table', 1.6) + 0.32, -255, W, 0.9, 0.5, 0xf6f1e0)
    .rotation.x = -0.15;
  flat(new THREE.PlaneGeometry(2.4, 0.18), 0xc0392b, LAYER.decal, 1071.5, -257.5, 0.5);
  // The banner across the path: two posts outside it and a long plate between (high enough to walk under).
  arch(0.2, 4.2, 0.2, 1073, 2.1, -250.5, WOOD);
  arch(0.2, 4.2, 0.2, 1073, 2.1, -239.5, WOOD);
  box(1073, -250.5, 0.15, 0.15, 4.2);
  box(1073, -239.5, 0.15, 0.15, 4.2);
  plate('THANK YOU\nMRS THORNE\nFOR OUR GRANT', 1073.12, heightAt(1073, -245) + 3.7, -245, E, 9.4, 1.0, 0xf6f1e0);

  // ---- Signs and posters -----------------------------------------------------------------------------------------
  sign('KEEP OFF THE GRASS\n(THE GRASS IS STUDYING)', 1076.5, -172, W, 1.3, 0.7);
  const boardA = piece('notice-board', 1077, -210, W, { solid: false });
  boardPlate(boardA, 'SOCIETIES FAIR\nTHE FLAT EARTH SOCIETY\nHAS BEEN EVENED OUT', 1.4, 0.9, 0.5, -0.4);
  boardPlate(boardA, 'LOST: ONE ESSAY\nON LEVEL LINES\nREWARD: A PASS', 1.4, 0.8, 0.5, 0.45);
  const boardB = piece('chalk-equation-board', 1077, -192, W, { solid: false });
  boardPlate(boardB, 'OPEN DAY\nTOURS OF THE ANTHILL\nCANCELLED (RENT)', 1.5, 1.0, 0.6, 0);
  wallSign('THE TRENCHER\nSUGAR IS NOT FOR STUDENTS', 1233, -223, W, 2.3, 1.6, 0.6);
  wallSign('LIBRARY FINES\nPAYABLE IN SUGAR', 1100, -279, 0, 2.3, 1.4, 0.6);
  wallSign('THE COLD FRAME CLUB\nMEMBERS AND WARM\nGUESTS ONLY', 1241, -166, W, 2.3, 1.4, 0.7);
  wallSign('THE CLOCHE\nPLEASE DO NOT TAP\nON THE TOMATOES', 1276, -208, W, 2.3, 1.5, 0.7);
  wallSign('HEAP BARN\nSTEAM IS NORMAL\nSMELL IS RESEARCH', 1256, -93, N, 2.5, 1.5, 0.7);
  sign('DIG SAFELY\n(STUDY DIGGING INSTEAD)', 1140, -272, 0, 1.3, 0.6);

  if (missing.size) console.warn(`rootwell story: missing prefabs: ${[...missing].join(', ')}`);
  boxes.push(...buildPieces(scene, pieces, 'rootwell-story-pieces'));
  scene.add(group);
}
