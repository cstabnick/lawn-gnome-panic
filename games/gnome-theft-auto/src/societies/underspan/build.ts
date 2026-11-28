// The Underspan's static scenery (E17 issue B1): scaffold towers, the Roost deck, hammocks, contraptions, the workshop
// shed's shell, the manifesto wall, vignettes and signs. Built once; everything stays inside UNDERSPAN.site.
import * as THREE from 'three';
import { buildPrefab, getPrefab } from '@lawn/prefabs';
import { buildStaticCells } from '../../cull';
import { addRooftop, rooftopById } from '../../interiors';
import { textPlate, prefabBox } from '../../homes/pieces';
import { addNoticeSpot } from '../../homes/notices';
import { undersideMat } from '../../undersides';
import { heightAt } from '../../terrain';
import type { Box } from '../../types';
import { UNDERSPAN, type Rect } from '../config';

const N = Math.PI, E = Math.PI / 2, W = -Math.PI / 2;
const WOOD = 0x8a6a42;
const PLANK = 0x9a7448;
const SILVER = 0x9aa3a8;
const PAPER = 0xf2e8c8;
const FADED = 0xd8d2c0;
const TOWER = 3;
const TOWER_H = 5.8;

type Placement = Parameters<typeof buildStaticCells>[0][number];

/** A prefab's footprint (the rectangle its rotated box covers) and its absolute top height. */
interface Foot extends Rect { top: number }

function footprint(id: string, x: number, z: number, yaw: number, scale = 1): Foot | null {
  if (!getPrefab(id)) return null;
  const b = prefabBox(id);
  const c = Math.cos(yaw), s = Math.sin(yaw);
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const lx of [b.min.x, b.max.x]) {
    for (const lz of [b.min.z, b.max.z]) {
      const px = lx * scale, pz = lz * scale;
      const wx = x + px * c + pz * s, wz = z - px * s + pz * c;
      minX = Math.min(minX, wx); maxX = Math.max(maxX, wx);
      minZ = Math.min(minZ, wz); maxZ = Math.max(maxZ, wz);
    }
  }
  return { minX, maxX, minZ, maxZ, top: heightAt(x, z) + b.max.y * scale };
}

/** World point of a local offset (lx to the prop's right, lz forward) for a prop at (x, z) facing `yaw`. */
function toWorld(x: number, z: number, yaw: number, lx: number, lz: number): { x: number; z: number } {
  const c = Math.cos(yaw), s = Math.sin(yaw);
  return { x: x + lx * c + lz * s, z: z - lx * s + lz * c };
}

/** Builds the Underspan inside UNDERSPAN.site; pushes colliders into `boxes`. Called once by world.ts (via index.ts). */
export function buildUnderspan(scene: THREE.Scene, boxes: Box[]): void {
  const site = UNDERSPAN.site;
  const placements: Placement[] = [];
  const signs = new THREE.Group();
  signs.name = 'underspan-signs';
  const props = new THREE.Group();
  props.name = 'underspan-props';

  const collide = (r: Rect, h: number): void => {
    boxes.push({ minX: r.minX, maxX: r.maxX, minZ: r.minZ, maxZ: r.maxZ, h });
  };
  /** A static prefab in the batch; `solid` adds a collider from its footprint. */
  const place = (id: string, x: number, z: number, yaw: number, o: { scale?: number; solid?: boolean } = {}): void => {
    if (!getPrefab(id)) return;
    const scale = o.scale ?? 1;
    placements.push({ id, x, y: heightAt(x, z), z, yaw, scale });
    if (o.solid) {
      const f = footprint(id, x, z, yaw, scale);
      if (f) collide(f, f.top);
    }
  };
  const plate = (text: string, x: number, y: number, z: number, yaw: number, w: number, h: number, bg = PAPER): void => {
    signs.add(textPlate(text, x, y, z, yaw, { w, h, bg }));
  };
  const arch = (w: number, h: number, d: number, x: number, y: number, z: number, color: number): void => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color }));
    m.position.set(x, heightAt(x, z) + y, z);
    signs.add(m);
  };
  /** A sign on a wooden stake; the plate stands 0.08 m in front of the stake (the way `yaw` faces). */
  const stakeSign = (text: string, x: number, z: number, yaw: number, w: number, h: number): void => {
    const y = 1.4;
    arch(0.1, y + h / 2, 0.1, x, (y + h / 2) / 2, z, WOOD);
    plate(text, x + Math.sin(yaw) * 0.08, heightAt(x, z) + y, z + Math.cos(yaw) * 0.08, yaw, w, h);
  };
  /** A plate on a wall point (wx, wz), 0.15 m proud of a wall whose face points along `yaw`. */
  const wallSign = (text: string, wx: number, wz: number, yaw: number, y: number, w: number, h: number, bg = PAPER): void => {
    plate(text, wx + Math.sin(yaw) * 0.15, heightAt(wx, wz) + y, wz + Math.cos(yaw) * 0.15, yaw, w, h, bg);
  };
  /** A manifesto poster: a plain text, or [text, background colour]. */
  type Poster = string | [string, number];
  /** Manifesto posters on both faces of a free-standing hoarding at (x, z) facing `yaw`: up to two per face, each
   *  2.6 x 1.5 m at the face centre height, 0.03 m off the board. The back faces `yaw + PI`, so its lateral flips. */
  const manifesto = (x: number, z: number, yaw: number, front: Poster[], back: Poster[]): void => {
    const PW = 2.6, PH = 1.5, GAP = 1.45, OFF = 0.03, FACE = 0.1;
    const cy = heightAt(x, z) + 1.45;
    const face = (list: Poster[], depth: number, faceYaw: number, flip: number): void => {
      const lats = list.length === 1 ? [0] : [-GAP, GAP];
      list.forEach((p, i) => {
        const [text, bg]: [string, number] = typeof p === 'string' ? [p, PAPER] : p;
        const q = toWorld(x, z, yaw, flip * lats[i], depth);
        plate(text, q.x, cy, q.z, faceYaw, PW, PH, bg);
      });
    };
    face(front, FACE + OFF, yaw, 1);
    face(back, -(FACE + OFF), yaw + N, -1);
  };
  const posterText = (p: Poster): string => (typeof p === 'string' ? p : p[0]);
  /** A prop placed loose with its own tilt (vignettes). Not batched, so it can lean. */
  const loosePrefab = (id: string, x: number, z: number, yaw: number, o: { size?: number; y?: number; tiltX?: number; tiltZ?: number } = {}): void => {
    if (!getPrefab(id)) return;
    const obj = buildPrefab(id, { lights: false });
    if (o.size) {
      const b = prefabBox(id);
      const longest = Math.max(b.max.x - b.min.x, b.max.y - b.min.y, b.max.z - b.min.z);
      if (longest > 0) obj.scale.setScalar(o.size / longest);
    }
    obj.rotation.set(o.tiltX ?? 0, yaw, o.tiltZ ?? 0, 'YXZ');
    obj.position.set(x, heightAt(x, z) + (o.y ?? 0.02), z);
    props.add(obj);
  };

  // ---- The workshop shed: four walls only (the door is an E05 interior; the player does not walk in) ----------
  place('scrap-shed', 592, -14, W);
  const sh = UNDERSPAN.shed, e = 0.2;
  const shedWalls: Rect[] = [
    { minX: sh.minX - e, maxX: sh.minX + e, minZ: sh.minZ - e, maxZ: sh.maxZ + e },
    { minX: sh.maxX - e, maxX: sh.maxX + e, minZ: sh.minZ - e, maxZ: sh.maxZ + e },
    { minX: sh.minX - e, maxX: sh.maxX + e, minZ: sh.minZ - e, maxZ: sh.minZ + e },
    { minX: sh.minX - e, maxX: sh.maxX + e, minZ: sh.maxZ - e, maxZ: sh.maxZ + e },
  ];
  for (const w of shedWalls) collide(w, heightAt(w.minX, w.minZ) + UNDERSPAN.shedHeight);
  wallSign("HOGWEED'S WORKSHOP\nKNOCK, THEN DUCK", sh.minX, -9, W, 2.2, 1.0, 0.7);
  wallSign('THIS STRUCTURE IS\nNOT A STRUCTURE\n(HOA ruling 44-b)', 592, sh.minZ, N, 2.6, 1.8, 0.9, FADED);

  // ---- The Roost: six scaffold towers and a plank deck at roostY (a walkable rooftop, no collider) ---------------
  const r = UNDERSPAN.roost;
  const mx = (r.minX + r.maxX) / 2;
  const towers: [number, number][] = [
    [r.minX + TOWER / 2, r.minZ + TOWER / 2], [r.maxX - TOWER / 2, r.minZ + TOWER / 2],
    [r.minX + TOWER / 2, r.maxZ - TOWER / 2], [r.maxX - TOWER / 2, r.maxZ - TOWER / 2],
    [mx, r.minZ + TOWER / 2], [mx, r.maxZ - TOWER / 2],
  ];
  const tb = getPrefab('scaffold-tower') ? prefabBox('scaffold-tower') : null;
  const towerScale = tb && tb.max.y > 0 ? (UNDERSPAN.roostY - 0.2) / tb.max.y : 1;
  for (const [tx, tz] of towers) {
    place('scaffold-tower', tx, tz, 0, { scale: towerScale });
    // Legs: one 3 x 3 box each, so the player can walk underneath the deck between towers.
    collide({ minX: tx - TOWER / 2, maxX: tx + TOWER / 2, minZ: tz - TOWER / 2, maxZ: tz + TOWER / 2 }, heightAt(tx, tz) + TOWER_H);
  }
  const deckT = 0.15;
  const deck = new THREE.Mesh(
    new THREE.BoxGeometry(r.maxX - r.minX, deckT, r.maxZ - r.minZ),
    undersideMat(PLANK),
  );
  deck.position.set(mx, UNDERSPAN.roostY - deckT / 2, (r.minZ + r.maxZ) / 2);
  const roost = new THREE.Group();
  roost.name = 'underspan-roost';
  roost.add(deck);
  if (!rooftopById(r.id)) {
    addRooftop({
      id: r.id, name: 'The Roost', minX: r.minX, maxX: r.maxX, minZ: r.minZ, maxZ: r.maxZ,
      y: UNDERSPAN.roostY, solid: false, parapet: ['n', 'w', 's'],
    });
  }
  // The Chute: a tilted half-pipe of three thin segments from the deck (chuteTop) down to the ground (chuteBottom).
  const top = new THREE.Vector3(UNDERSPAN.chuteTop.x, UNDERSPAN.roostY, UNDERSPAN.chuteTop.z);
  const bottom = new THREE.Vector3(UNDERSPAN.chuteBottom.x, heightAt(UNDERSPAN.chuteBottom.x, UNDERSPAN.chuteBottom.z), UNDERSPAN.chuteBottom.z);
  const run = bottom.clone().sub(top);
  const dir = run.clone().normalize();
  const segLen = run.length() / 3;
  const slideMat = new THREE.MeshLambertMaterial({ color: SILVER });
  for (let i = 0; i < 3; i++) {
    const seg = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.08, segLen), slideMat);
    seg.name = `underspan-chute-${i}`;
    seg.position.copy(top.clone().lerp(bottom, (i + 0.5) / 3));
    seg.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
    roost.add(seg);
  }

  // ---- Hammocks (hung from the tower posts under the deck), contraptions and clutter ----------------------------
  place('workshop-hammock', 569.5, -39.5, E);
  place('workshop-hammock', 578.5, -39.5, E);
  place('workshop-hammock', 574, -36.5, N);
  place('pedal-generator', 568, -24, E, { solid: true });
  place('welding-bench', 576, -10, E, { solid: true });
  place('welding-bench', 572, -6, N, { solid: true });
  place('umbrella-glider', 590, -40, E, { solid: true });
  place('spool-table', 578, -22, 0, { solid: true });
  // The scrap heap must not cross z = -1: shift it north by however far its bounds overhang.
  const heapX = UNDERSPAN.scrapHeap.x;
  let heapZ: number = UNDERSPAN.scrapHeap.z;
  const heap = footprint('underspan-scrap-heap', heapX, heapZ, 0);
  if (heap && heap.maxZ > site.maxZ - 0.1) heapZ -= heap.maxZ - (site.maxZ - 0.1);
  place('underspan-scrap-heap', heapX, heapZ, 0, { solid: true });
  place('dewdrop-cradle', 586, -28, 0, { solid: true });
  place('citation-post', 584, -19, W);
  place('manifesto-board', UNDERSPAN.manifestoWall.x, UNDERSPAN.manifestoWall.z, W, { solid: true });
  place('manifesto-board', UNDERSPAN.manifestoWall.x, -34, W, { solid: true });

  // ---- Vignettes ---------------------------------------------------------------------------------------------------
  // (1) A half-built umbrella glider, its blueprints blown downwind.
  [[592, -44], [594.5, -45.5], [596.5, -46.5], [598, -48]].forEach(([x, z], i) => {
    loosePrefab('pl-newspaper', x, z, 0.4 * i, { size: 0.6, tiltX: -Math.PI / 2 + 0.2 * i, y: 0.01 });
  });
  // (2) The pedal generator beside a small scrap heap, a dent knocked in it (the last test).
  place('underspan-scrap-heap', 564.5, -26.5, 0.6, { scale: 0.6, solid: true });
  // (3) A Local 404 hard hat set down politely on a crate by the road, with two cups (the cousins came to talk).
  place('crate', 563, -38.5, W, { solid: true });
  const crateTop = getPrefab('crate') ? prefabBox('crate').max.y : 0.8;
  if (getPrefab('span-hard-hat')) {
    placements.push({ id: 'span-hard-hat', x: 563, y: heightAt(563, -38.5) + crateTop, z: -38.5, yaw: W, scale: 1 });
  }
  if (getPrefab('espresso-cup')) {
    placements.push({ id: 'espresso-cup', x: 562.6, y: heightAt(562.6, -37.9) + crateTop, z: -37.9, yaw: 0, scale: 1 });
    placements.push({ id: 'espresso-cup', x: 563.4, y: heightAt(563.4, -39.1) + crateTop, z: -39.1, yaw: 0, scale: 1 });
  }

  // ---- Signs and posters -------------------------------------------------------------------------------------------
  const manifestoBoards: { z: number; front: Poster[]; back: Poster[] }[] = [
    {
      z: UNDERSPAN.manifestoWall.z,
      front: ['A RULE IS ONLY A\nPROTOTYPE NOBODY\nTESTED', 'PERMITS ARE FOR\nPEOPLE WHO ASK'],
      back: ['THE GROUND IS\nALREADY OBSOLETE', 'UP IS A DIRECTION,\nNOT A CRIME'],
    },
    {
      z: -34,
      front: ['WE BUILT A LIFT.\nTHEY BUILT A FORM.', 'CITATIONS ARE\nA FORM OF PRAISE'],
      back: ['FORM 7 IS A\nSUGGESTION', ['rules are prototypes', 0xf3e9a6]],
    },
  ];
  for (const board of manifestoBoards) {
    manifesto(UNDERSPAN.manifestoWall.x, board.z, W, board.front, board.back);
    // The "Read the manifesto" spot stands 1.4 m in front of the front face, on the approach side.
    const spot = toWorld(UNDERSPAN.manifestoWall.x, board.z, W, 0, 1.4);
    const lines = [...board.front, ...board.back].map((p) => posterText(p).replace(/\n/g, ' '));
    addNoticeSpot({ x: spot.x, z: spot.z, y: heightAt(spot.x, spot.z) }, lines, 'Read the manifesto');
  }
  const cp = getPrefab('citation-post') ? prefabBox('citation-post') : null;
  const cpDepth = cp ? cp.max.z + 0.04 : 0.1;
  const cpAt = toWorld(584, -19, W, 0, cpDepth);
  plate('CITATIONS: PLEASE TAKE ONE', cpAt.x, heightAt(584, -19) + 1.1, cpAt.z, W, 0.8, 0.4);
  stakeSign('THE ROOST. NO STAIRS.\nASK THE UPDRAFT.', 574, -47.5, 0, 1.6, 0.6);
  stakeSign('THE UNDERSPAN\npop. varies\nest. when the Span stopped', 561, -42, W, 1.6, 0.8);

  // ---- Assemble ----------------------------------------------------------------------------------------------------
  const batch = buildStaticCells(placements, { name: 'underspan' });
  scene.add(batch);
  scene.add(roost);
  scene.add(signs);
  scene.add(props);
}
