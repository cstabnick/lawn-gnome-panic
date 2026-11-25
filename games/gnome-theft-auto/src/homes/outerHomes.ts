// The three homes out of town (E10, B4): Sorrel's cottage behind her radio booth in Mossy Wood (home-05), Diggs' tin
// bungalow south of Pebblewick (home-06) and Fence-Post Frank's shack behind the south welcome sign (home-07).
// outerHomePieces() lists the prefabs (and so the colliders); buildOuterHomes() adds them plus plates, lit windows,
// small ground decals and Frank himself. Diggs' walk-in interior (`diggs-bungalow`) is another builder's.
import * as THREE from 'three';
import { makeGnome } from '../gnomes';
import { heightAt } from '../terrain';
import type { Box } from '../types';
import { buildPieces, litWindow, textPlate, type HomePiece } from './pieces';
import { HOME_DOORS } from './types';

const HALF_PI = Math.PI / 2;
const WOOD = 0x6b4a2e;
const SAND = 0xc9a566;

/** A stake with a sign face: the piece for the stake (plates are added by buildOuterHomes). */
const stake = (x: number, z: number): HomePiece => ({ prefab: 'wooden-post', x, z, yaw: 0 });

export function outerHomePieces(): HomePiece[] {
  const p: HomePiece[] = [];

  // ---- Sorrel (home-05, centre -400, 50): thatched cottage, door east toward the booth ----
  p.push({ prefab: 'thatched-cottage', x: -393.5, z: 50, yaw: HALF_PI, scale: 1.2 });
  p.push({ prefab: 'tower-mast', x: -396, z: 44.4, yaw: 0, scale: 1.6 }); // the aerial
  p.push(stake(-391.5, 41.5), stake(-389.2, 39.5)); // cable run toward the booth
  p.push({ prefab: 'crate', x: -387.9, z: 46.6, yaw: 0, scale: 1.4 }); // the porch radio on a crate
  p.push({ prefab: 'dispatch-radio', x: -387.9, z: 46.6, yaw: HALF_PI, scale: 1.2, y: 0.85, solid: false });
  p.push({ prefab: 'wooden-post', x: -388.1, z: 55.6, yaw: 0, scale: 0.8 }); // pledge-drive mug tree
  for (const [i, dy] of [0.7, 0.95, 1.2].entries()) {
    p.push({ prefab: 'espresso-cup', x: -388.1 + (i - 1) * 0.1, z: 55.6, yaw: i, size: 0.2, y: dy, solid: false });
  }
  // thank-you gift tote bags nobody collected
  p.push({ prefab: 'sack', x: -388.4, z: 57.4, yaw: 0.4, solid: false });
  p.push({ prefab: 'sack', x: -387.7, z: 57.7, yaw: 1.2, solid: false });
  p.push({ prefab: 'sack', x: -388.6, z: 58.3, yaw: 2.1, solid: false });
  p.push({ prefab: 'mailbox', x: -386.4, z: 54.8, yaw: HALF_PI });
  // a microphone on a chair, rehearsing to the trees
  p.push({ prefab: 'chair', x: -404.5, z: 44, yaw: -HALF_PI });
  p.push({ prefab: 'tower-mast', x: -404.5, z: 44, yaw: 0, scale: 0.28, y: 0.45, tint: 0x222222, solid: false });
  p.push({ prefab: 'tree-stump', x: -408, z: 55, yaw: 0, solid: false }); // the fallen board leans on this
  p.push(stake(-388.7, 60.5)); // joke sign post

  // ---- Diggs (home-06, centre 615, 220): tin hut in a corrugated yard, door north ----
  p.push({ prefab: 'nissen-hut', x: 615, z: 222, yaw: Math.PI, scale: 1.4 });
  // yard fence: north line with a gate gap at x 613..617, west, east and south sides
  for (const x of [605, 609]) p.push({ prefab: 'corrugated-fence', x, z: 211, yaw: 0 });
  p.push({ prefab: 'corrugated-fence', x: 612, z: 211, yaw: 0, scale: 0.5 });
  p.push({ prefab: 'corrugated-fence', x: 618, z: 211, yaw: 0, scale: 0.5 });
  for (const x of [621, 625]) p.push({ prefab: 'corrugated-fence', x, z: 211, yaw: 0 });
  for (const z of [214, 218, 222, 226, 230]) {
    p.push({ prefab: 'corrugated-fence', x: 603.6, z, yaw: HALF_PI });
    p.push({ prefab: 'corrugated-fence', x: 626.4, z, yaw: HALF_PI });
  }
  for (const x of [605, 609, 613, 617, 621, 625]) p.push({ prefab: 'corrugated-fence', x, z: 231.2, yaw: 0 });
  p.push(stake(612.2, 211.3)); // gate post with the DIGGS plate
  p.push(stake(621.5, 208.6)); // joke sign post
  p.push({ prefab: 'mailbox', x: 617.8, z: 208.2, yaw: Math.PI });
  p.push({ prefab: 'compost-heap', x: 607.5, z: 227.5, yaw: 0.5, scale: 1.4, tint: SAND }); // spoil heap
  p.push({ prefab: 'crate', x: 610.8, z: 228.6, yaw: 0.3, scale: 0.9 }); // finds
  // scrap car up on stone blocks
  for (const [dx, dz] of [[-1.1, -0.6], [1.1, -0.6], [-1.1, 0.6], [1.1, 0.6]]) {
    p.push({ prefab: 'stone-chunk', x: 622 + dx, z: 227 + dz, yaw: 0, size: 0.3, solid: false });
  }
  p.push({ prefab: 'scrap-car', x: 622, z: 227, yaw: 0.2, y: 0.3 });
  // the half-dug hole: a spade standing in it, a deck chair at its edge
  p.push({ prefab: 'ranch-spade', x: 609, z: 215.8, yaw: 0.6, scale: 1.8, solid: false });
  p.push({ prefab: 'deck-chair', x: 611.7, z: 215.8, yaw: -HALF_PI });
  // jars of buried treasure on a table
  p.push({ prefab: 'table', x: 621, z: 215, yaw: 0, scale: 1.4 });
  for (let i = 0; i < 5; i++) p.push({ prefab: 'clay-jar', x: 620.2 + i * 0.4, z: 215, yaw: i, y: 0.84, solid: false });
  // hammock between two posts (cloth bundles), newspaper on it
  p.push({ prefab: 'wooden-post', x: 606, z: 213.5, yaw: 0 }, { prefab: 'wooden-post', x: 606, z: 219, yaw: 0 });
  for (let i = 0; i < 4; i++) p.push({ prefab: 'sack', x: 606, z: 214.5 + i * 1.3, yaw: 1.57, y: 0.7, solid: false });

  // ---- Frank (home-07, centre 45, 260): lean-to shed behind a row of fence posts, door spot west ----
  p.push({ prefab: 'lean-to-shed', x: 47, z: 260, yaw: -HALF_PI, scale: 1.3 });
  for (const z of [252, 254, 256, 258, 262, 264, 266, 268]) p.push({ prefab: 'wooden-post', x: 38, z, yaw: 0 });
  for (const z of [253, 255, 257, 263, 265, 267]) p.push({ prefab: 'wooden-fence', x: 38, z, yaw: HALF_PI });
  for (const z of [252, 254, 256, 258, 262, 264, 266, 268]) {
    p.push({ prefab: 'espresso-cup', x: 38, z, yaw: z, size: 0.18, y: 1.5, solid: false }); // a diner cup on every post
  }
  p.push({ prefab: 'deck-chair', x: 35.5, z: 265, yaw: -HALF_PI }); // faces the highway
  // hitchhiking sign rack
  for (const z of [251, 253, 255]) p.push({ prefab: 'wooden-post', x: 34.3, z, yaw: 0 });
  p.push({ prefab: 'mailbox', x: 32.6, z: 256.4, yaw: -HALF_PI });
  // road maps weighed down by a stone
  p.push({ prefab: 'table', x: 51, z: 253, yaw: 0 });
  p.push({ prefab: 'stone-chunk', x: 51.1, z: 253, yaw: 0, size: 0.18, y: 0.65, solid: false });
  // hubcap garden
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    p.push({ prefab: 'chrome-hubcap-pendant', x: 52 + Math.cos(a) * 1.3, z: 266 + Math.sin(a) * 1.0, yaw: a, size: 0.4, y: 0.25, solid: false });
  }
  p.push({ prefab: 'tyre-pile', x: 54, z: 258, yaw: 0 });
  p.push({ prefab: 'oil-drum', x: 54.5, z: 262, yaw: 0 });
  return p;
}

/** Flat poster or paper lying on a surface at height y (a decal). */
function flatPaper(text: string, x: number, y: number, z: number, yaw: number, w: number, h: number): THREE.Mesh {
  const m = textPlate(text, x, y, z, yaw, { w, h, bg: 0xeee6cc });
  m.rotation.set(-HALF_PI, 0, 0);
  m.rotation.y = 0;
  m.rotateZ(yaw);
  return m;
}

export function buildOuterHomes(scene: THREE.Scene): Box[] {
  const boxes = buildPieces(scene, outerHomePieces(), 'outer-homes');
  const life = new THREE.Group();
  life.name = 'outer-homes-life';
  const g = (x: number, z: number): number => heightAt(x, z);

  // Sorrel
  const [sx, sz, syaw] = HOME_DOORS.sorrel;
  life.add(textPlate('SORREL\nON AIR? KNOCK LATER', -388.7, g(sx, sz) + 1.5, sz + 2.6, syaw, { w: 1.0, h: 0.4 }));
  life.add(litWindow(-388.7, g(-388.7, 46) + 1.7, 46.2, syaw, 1.1, 0.9));
  life.add(litWindow(-388.7, g(-388.7, 54) + 1.7, 53.8, syaw, 1.1, 0.9));
  life.add(textPlate('88.7 FESCUE PUBLIC RADIO\nLISTENER-SUPPORTED HOUSE', -388.9, g(-388.7, 60.5) + 1.1, 60.5, syaw,
    { w: 1.7, h: 0.7, bg: 0x2e4a3a, fg: 0xf2e8c8 }));
  // "QUIET: RECORDING" board, fallen over against a stump
  const board = textPlate('QUIET:\nRECORDING', -407.2, g(-407.2, 55) + 0.5, 55, HALF_PI, { w: 0.9, h: 0.6, bg: 0xf2e8c8 });
  board.rotation.order = 'YXZ';
  board.rotation.set(-1.15, HALF_PI, 0);
  life.add(board);

  // Diggs
  life.add(textPlate('DIGGS', 612.2, g(612.2, 211) + 1.1, 211.3 - 0.12, Math.PI, { w: 0.6, h: 0.25, bg: 0x9a9a92 }));
  life.add(textPlate('NO HOA. NO SURVEYORS.\nNO, NOT EVEN YOU.', 621.5, g(621.5, 208.6) + 1.15, 208.6 - 0.12, Math.PI,
    { w: 1.7, h: 0.7, bg: 0xe8e0c8 }));
  life.add(litWindow(611, g(611, 218) + 1.6, 218.0, Math.PI, 1.0, 0.8));
  life.add(litWindow(619, g(619, 218) + 1.6, 218.0, Math.PI, 1.0, 0.8));
  life.add(flatPaper('GNOME TIMES', 606, g(606, 216) + 1.23, 216.1, 0.3, 0.4, 0.3));
  // the fresh hole
  const hole = new THREE.Mesh(
    new THREE.CircleGeometry(1.1, 20),
    new THREE.MeshBasicMaterial({ color: 0x2a1f14, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }),
  );
  hole.rotation.x = -HALF_PI;
  hole.position.set(609, g(609, 215.8) + 0.05, 215.8);
  hole.name = 'outer-homes-hole';
  life.add(hole);

  // Frank
  life.add(textPlate('FRANK\nNO SOLICITORS\nNO SOLICITING EITHER', 44.85, g(44.85, 260) + 1.6, 260, -HALF_PI,
    { w: 1.3, h: 0.6, bg: 0xe8e0c8 }));
  life.add(litWindow(44.85, g(44.85, 256.6) + 1.5, 256.6, -HALF_PI, 0.9, 0.8));
  for (const [z, text] of [[251, 'SOUTH'], [253, 'NORTH'], [255, 'ANYWHERE\nWITH PIE']] as const) {
    life.add(textPlate(text, 34.15, g(34.3, z) + 1.15, z, -HALF_PI, { w: 0.9, h: 0.32, bg: 0xe8e0c8 }));
  }
  life.add(flatPaper('ROAD MAPS', 51, g(51, 253) + 0.62, 253, 0.2, 0.7, 0.5));
  const frank = makeGnome(life, {
    hat: 0x6b4a2e, shirt: 0x9c2f2f, pants: 0x3b3a4a, skin: 0xe0ac69, boots: 0x222222,
    beard: 0xaaaaaa, hair: null, freckles: false, dress: false, glasses: false, bowlCut: null,
  });
  frank.object.position.set(37.2, g(37.2, 258), 258);
  frank.object.rotation.y = -HALF_PI; // leans on the post, facing the road
  frank.object.name = 'outer-homes-frank';

  scene.add(life);
  return boxes;
}
