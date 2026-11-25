// Dunelow, the Saltbucket hinterland hamlet (E31): a windblown fishing-and-ice-cream village behind the dunes,
// run, as far as anyone can tell, by its gulls. Houses first, then the green, furniture and three little stories.
import * as THREE from 'three';
import { LAYER, flatLayer } from '@lawn/depth';
import type { Box } from '../types';
import type { AmbientGnomeDef } from '../ambientGnomes';
import { heightAt } from '../terrain';
import { textPlate } from '../homes/pieces';
import { placePieces, pieceBox, type Piece } from './place';

/** The green in the middle of the village. */
const GREEN = { x: -560, z: 950, r: 9 };
/** Where the south-band road runs through the village (z at the village's x range, roughly). */
const ROAD_Z = 1006;

const PASTELS = [0xf2c6cf, 0xbfe3d9, 0xf6e3a1, 0xb9d3ee, 0xe9b99a, 0xcdbfe6];
const TRIMS = [0xffffff, 0xf5f0e0, 0x3b6ea5, 0xd93636];

function face(x: number, z: number, tx: number, tz: number): number {
  return Math.atan2(tx - x, tz - z);
}

/** House ground height: the lowest of the footprint box corners, so nothing floats. */
function lowGround(p: Piece): number {
  const b = pieceBox(p);
  if (!b) return heightAt(p.x, p.z);
  return Math.min(heightAt(b.minX, b.minZ), heightAt(b.minX, b.maxZ), heightAt(b.maxX, b.minZ), heightAt(b.maxX, b.maxZ), heightAt(p.x, p.z));
}

function house(i: number, kind: 'gnome-cottage' | 'stilt-cottage', x: number, z: number, tx: number, tz: number): Piece {
  const p: Piece = {
    id: kind, x, z, yaw: face(x, z, tx, tz), scale: kind === 'gnome-cottage' ? 1.12 : 1.3,
    tint: PASTELS[i % PASTELS.length], trim: TRIMS[i % TRIMS.length], solid: true,
  };
  p.y = lowGround(p);
  return p;
}

/** Ids of the house prefabs (the test counts them). */
export const DUNELOW_HOUSES = ['gnome-cottage', 'stilt-cottage'];

/** The placed-piece plan (pure, no scene): houses first, then dressing and the three vignettes. */
export function planDunelow(): Piece[] {
  const pieces: Piece[] = [];
  // Houses: eight round the green on the north side, two across the road facing it.
  const north: [number, 'gnome-cottage' | 'stilt-cottage', number, number][] = [
    [0, 'gnome-cottage', -625, 935], [1, 'stilt-cottage', -600, 912], [2, 'gnome-cottage', -562, 903],
    [3, 'stilt-cottage', -524, 912], [4, 'gnome-cottage', -497, 938], [5, 'stilt-cottage', -495, 972],
    [0, 'stilt-cottage', -628, 972], [3, 'gnome-cottage', -598, 976],
  ];
  for (const [i, k, x, z] of north) pieces.push(house(i, k, x, z, GREEN.x, GREEN.z));
  pieces.push(house(1, 'gnome-cottage', -586, 1032, -586, ROAD_Z));
  pieces.push(house(2, 'stilt-cottage', -545, 1032, -545, ROAD_Z));

  // The centre: the pump on the green, with seats, a phone box, the notice board and a shrine.
  pieces.push({ id: 'village-pump', x: GREEN.x, z: GREEN.z, solid: true });
  pieces.push({ id: 'hamlet-picnic-table', x: -571, z: 957, yaw: 0.4, solid: true });
  pieces.push({ id: 'bench', x: -549, z: 944, yaw: face(-549, 944, GREEN.x, GREEN.z), solid: true });
  pieces.push({ id: 'bench', x: -569, z: 942, yaw: face(-569, 942, GREEN.x, GREEN.z), solid: true });
  pieces.push({ id: 'hamlet-phone-box', x: -545, z: 959, yaw: face(-545, 959, GREEN.x, GREEN.z), solid: true });
  pieces.push({ id: 'rules-board', x: -578, z: 936, yaw: 0, solid: true });
  pieces.push({ id: 'wayside-shrine', x: -560, z: 922, yaw: 0, solid: true });
  pieces.push({ id: 'litter-bin', x: -552, z: 958, solid: true });
  pieces.push({ id: 'hamlet-stone-cairn', x: -540, z: 925, solid: true });
  pieces.push({ id: 'flower-bed', x: -560, z: 962, yaw: 0, tint: 0xf2a3b5 });

  // By the road: the bus shelter, a milestone, a mailbox row.
  pieces.push({ id: 'bus-shelter', x: -600, z: 992, yaw: 0, solid: true });
  pieces.push({ id: 'milestone', x: -515, z: 994, yaw: face(-515, 994, -400, 1006), solid: true });
  pieces.push({ id: 'mailbox', x: -612, z: 962, yaw: 0, solid: true });
  pieces.push({ id: 'mailbox', x: -511, z: 960, yaw: Math.PI, solid: true });

  // Garden walls and hedges along plot edges.
  for (let k = 0; k < 4; k++) pieces.push({ id: 'drystone-wall', x: -648 + k * 3.06, z: 952, yaw: 0, solid: true });
  for (let k = 0; k < 3; k++) pieces.push({ id: 'drystone-wall', x: -522 + k * 3.06, z: 955, yaw: 0, solid: true });
  pieces.push({ id: 'hedgerow', x: -584, z: 1022, yaw: 0, solid: true });
  pieces.push({ id: 'hedgerow', x: -580, z: 1022, yaw: 0, solid: true });
  pieces.push({ id: 'hedgerow', x: -540, z: 1021, yaw: 0, solid: true });
  // Garden bits: flowers, washing lines.
  pieces.push({ id: 'flower-bed', x: -603, z: 905, yaw: 0, tint: 0xf6e3a1 });
  pieces.push({ id: 'flower-bed', x: -520, z: 921, yaw: 0, tint: 0xcdbfe6 });
  pieces.push({ id: 'flower-pot', x: -618, z: 929 });
  pieces.push({ id: 'euro-washing-line', x: -632, z: 920, yaw: 0.3 });
  pieces.push({ id: 'euro-washing-line', x: -505, z: 953, yaw: Math.PI / 2 });

  // Fishing gear: a dinghy propped on crates, a rod rack, barrels of lobster pots, a buoy and an anchor.
  pieces.push({ id: 'crate', x: -641, z: 947, solid: true });
  pieces.push({ id: 'crate', x: -641, z: 953, solid: true });
  pieces.push({ id: 'walnut-dinghy', x: -641.5, z: 950, yaw: Math.PI / 2, lift: 0.6, tint: 0x3b6ea5 });
  pieces.push({ id: 'crate', x: -632, z: 959, tint: 0xb98a4a, solid: true });
  pieces.push({ id: 'fish-rod-rack', x: -634, z: 944, yaw: Math.PI / 2, solid: true });
  pieces.push({ id: 'barrel', x: -633, z: 968, solid: true });
  pieces.push({ id: 'barrel', x: -631.6, z: 969.5, tint: 0x8c5a2b, solid: true });
  pieces.push({ id: 'tow-buoy', x: -626, z: 966 });
  pieces.push({ id: 'ship-anchor', x: -619, z: 968, yaw: 0.8 });
  pieces.push({ id: 'gull-sign', x: -538, z: 1012, yaw: Math.PI / 2 });
  pieces.push({ id: 'beach-hut', x: -505, z: 1024, yaw: Math.PI, tint: 0xf2c6cf, solid: true });
  pieces.push({ id: 'beach-hut', x: -499, z: 1024, yaw: Math.PI, tint: 0xbfe3d9, solid: true });

  // The ice cream stand, parked by the green.
  pieces.push({ id: 'candyfloss-cart', x: -542, z: 992, yaw: (Math.PI / 2) * 3, solid: true, tint: 0xf2c6cf });

  // Vignette 1, the Gull Standoff: a chip stall, one paper of chips on the counter, three gulls on the roof edge
  // staring at it, and a hat dropped on the ground by someone who lost the argument.
  pieces.push({ id: 'boardwalk-stall', x: -530, z: 985, yaw: 0, solid: true, tint: 0x3b6ea5 });
  pieces.push({ id: 'gnome-chip', x: -530, z: 985.5, lift: 0.98, scale: 2 });
  for (let g = -1; g <= 1; g++) pieces.push({ id: 'bird-gull', x: -530 + g * 0.55, z: 985.45, yaw: 0, lift: 1.84 });
  pieces.push({ id: 'saltbucket-boater', x: -529.2, z: 987.2, yaw: 0.6, lift: 0.02 });

  // Vignette 2, the Deckchair Collapse: a hire board and a row of chairs going over like dominoes.
  pieces.push({ id: 'signpost', x: -566, z: 1058, yaw: 0, solid: true });
  for (let c = 0; c < 6; c++) {
    pieces.push({ id: 'deck-chair', x: -560 + c * 0.75, z: 1055 + c * 0.1, yaw: 0.15 * c - 0.2 + (c === 5 ? 1.9 : 0), tint: PASTELS[c % PASTELS.length] });
  }

  // Vignette 3, the Sandcastle Judging: three mounds, rosettes, and a bucket still on the winner.
  pieces.push({ id: 'sandcastle', x: -508, z: 1052, scale: 0.8, tint: 0xe8d4a0 });
  pieces.push({ id: 'sandcastle', x: -503, z: 1054, scale: 2, tint: 0xe8d4a0 });
  pieces.push({ id: 'sandcastle', x: -497, z: 1052, scale: 1.2, tint: 0xe8d4a0 });
  pieces.push({ id: 'bucket-and-spade', x: -503, z: 1054, lift: 1.2 });
  pieces.push({ id: 'roundabout-rosette', x: -508, z: 1050.6, lift: 0.05, tint: 0xd93636 });
  pieces.push({ id: 'roundabout-rosette', x: -503, z: 1051.4, lift: 0.05, tint: 0xd4af37 });
  pieces.push({ id: 'roundabout-rosette', x: -497, z: 1050.6, lift: 0.05, tint: 0x3b6ea5 });
  pieces.push({ id: 'beach-umbrella', x: -513, z: 1048, solid: true });
  return pieces;
}

/** A name sign at one entrance: board facing the oncoming traffic, name and motto on a plate in front of it. */
function nameSign(scene: THREE.Scene, boxes: Box[], x: number, z: number, yaw: number): void {
  const placed = placePieces(scene, boxes, [{ id: 'hamlet-sign', x, z, yaw, solid: true }], 'dunelow-sign');
  if (!placed.length) return;
  const f = 0.12;
  scene.add(textPlate('DUNELOW\nTwinned with nowhere, by request', x + Math.sin(yaw) * f, heightAt(x, z) + 1.45, z + Math.cos(yaw) * f, yaw,
    { w: 1.7, h: 0.6, bg: 0xf5f0e0, fg: 0x1f4e79 }));
}

/** Builds Dunelow. Pushes its colliders into `boxes`. Runs once from living/build.ts during the world build (also in tests: no DOM). */
export function buildDunelow(scene: THREE.Scene, boxes: Box[]): void {
  // The green: a flat grass disc, lifted and layered so it never z-fights the ground.
  const mat = flatLayer(new THREE.MeshLambertMaterial({ color: 0x7fa65a }), LAYER.area);
  const green = new THREE.Mesh(new THREE.CircleGeometry(GREEN.r, 28), mat);
  green.rotation.x = -Math.PI / 2;
  green.position.set(GREEN.x, heightAt(GREEN.x, GREEN.z) + 0.06, GREEN.z);
  green.name = 'dunelow-green';
  scene.add(green);

  placePieces(scene, boxes, planDunelow(), 'dunelow');

  // Name signs where the road enters: east (traffic heading west) and west (traffic heading east).
  nameSign(scene, boxes, -478, 992, Math.PI / 2);
  nameSign(scene, boxes, -642, 1022, -Math.PI / 2);

  // Notice board plate on the rules board (face centre 0, 1.45, 0.05; 1.4 x 0.9), 0.03 m in front.
  const bx = -578, bz = 936;
  scene.add(textPlate(
    'VILLAGE NOTICES\nGULLS ARE NOT TO BE FED.\nGULLS ARE AWARE OF THIS AND DISAGREE.\nIce cream van Tuesdays\nand whenever it hears you.\nLost: one flip-flop. Left.\nPossibly at sea.',
    bx, heightAt(bx, bz) + 1.45, bz + 0.08, 0, { w: 1.3, h: 0.8, bg: 0xf5f0e0, fg: 0x2b2116 }));
  // Bus shelter timetable, on the inside of the back glass.
  scene.add(textPlate('SNAIL COACH\nMon-Sat: sometimes\nSun: see Mon', -600, heightAt(-600, 992) + 1.5, 992 - 0.7, 0,
    { w: 1.2, h: 0.5, bg: 0xf5f0e0, fg: 0x2f5d46 }));
  // Deckchair hire board.
  scene.add(textPlate('DECKCHAIRS\nHIRE 50p\nFalling over included', -566, heightAt(-566, 1058) + 1.1, 1058.1, 0,
    { w: 1.0, h: 0.5, bg: 0xf6e3a1, fg: 0x3b6ea5 }));
  // Judges' card for the sandcastles.
  scene.add(textPlate('JUDGES: 3 GULLS\nWinner: the tallest\n(bucket stays)', -503, heightAt(-503, 1050) + 0.5, 1049.4, 0,
    { w: 0.9, h: 0.4, bg: 0xf5f0e0, fg: 0x2b2116 }));
}

/** The people of Dunelow (ambient gnomes with a speech bubble). living/runtime.ts shows them. */
export function dunelowPeople(): AmbientGnomeDef[] {
  return [
    {
      id: 'dunelow-netmender', name: 'Old Wrack', x: -634.5, z: 957, yaw: face(-634.5, 957, GREEN.x, GREEN.z),
      look: { hat: 0x3b6ea5, shirt: 0xe9b99a, pants: 0x4a4a3a, skin: 0xd9a47a, boots: 0x2b2116, beard: 0xdddddd, glasses: false },
      bubble: 'Mended this net forty times. The fish have learned where the holes were.',
      idle: 'sit-ground',
    },
    {
      id: 'dunelow-icecream', name: 'Cornet Brindle', x: -545, z: 989.5, yaw: face(-545, 989.5, -560, 975),
      look: { hat: 0xf2c6cf, shirt: 0xffffff, pants: 0x3b6ea5, skin: 0xf0c8a0, boots: 0x8c5a2b, beard: null, glasses: true },
      bubble: 'Ninety-nine flavours. Ninety-eight of them are vanilla.',
      idle: 'hands-on-hips',
    },
  ];
}
