// The six boardwalk stalls (E11; FX11 moved them out of boardwalk.ts): the kiosks with their name boards, counter
// dressing, lore signs, Tin Shy's tins, Sal's candyfloss cart. Lore: docs/lore/entries/apocrypha/the-boardwalk-stalls.md.
import * as THREE from 'three';
import type { Box } from '../types';
import type { AmbientGnomeDef } from '../ambientGnomes';
import { COAST } from './config';
import { place, placeAt, signAt, solid } from './deckKit';

const STALL_TINTS = [0xe8453c, 0x4fa3d9, 0x6bbf59, 0xf2a93b, 0x9b6bd1, 0x2fb8a8];

/** One keeper per stall (life.ts adds them to the coast residents). Sal is already a resident (coast-sal-candyfloss). */
export const STALL_KEEPERS: readonly AmbientGnomeDef[] = [
  {
    id: 'coast-keeper-plank-and-pickle', name: 'Gil Brinewater', idle: 'vendor-call',
    x: -97, z: 1109.5, yaw: 0.2, surface: 'rooftop',
    look: { hat: 0xf4f4f8, shirt: 0x3f9b4a },
    bubble: 'Two acorns a cup. Three with a fork. The fork is the expensive part.',
  },
  {
    id: 'coast-keeper-tin-shy', name: 'Tam Tinsley', idle: 'look-around',
    x: -45, z: 1109.5, yaw: -0.2, surface: 'rooftop',
    look: { hat: 0x4fa3d9, shirt: 0x7a7f8c },
    bubble: 'Nobody has won today. I am in a very good mood.',
  },
  {
    id: 'coast-keeper-scoop-and-spade', name: 'Dot Scoopwell', idle: 'vendor-call',
    x: 38, z: 1109.5, yaw: 0.2, surface: 'rooftop',
    look: { hat: 0xf4f4f8, shirt: 0xf08bb4, beard: null, dress: true },
    bubble: 'Vanilla, sand-coloured, or whichever is left. It is usually whichever.',
  },
  {
    id: 'coast-keeper-lucky-limpet', name: 'Madame Limpet', idle: 'look-around',
    x: 93, z: 1109.5, yaw: -0.2, surface: 'rooftop',
    look: { hat: 0x9b6bd1, shirt: 0xd9a21b, beard: null, glasses: true, dress: true },
    bubble: 'Something will turn up. That will be one acorn.',
  },
  {
    id: 'coast-keeper-boardwalk-office', name: 'Penny Stubbs', idle: 'look-around',
    x: 148, z: 1109.5, yaw: 0.2, surface: 'rooftop',
    look: { hat: 0x5c6b7a, shirt: 0xe8e0c8, beard: null, glasses: true },
    bubble: 'Every fare since the bucket sank. I have read them all twice.',
  },
];

/** Counter-top dressing per stall: [prefab id, local x, local z, yaw, scale]. The counter top is deckTop + 1.2. */
const COUNTER_PROPS: Record<string, readonly (readonly [string, number, number, number, number])[]> = {
  'plank-and-pickle': [['pickle-barrel', 0.2, 0.15, 0.3, 2.4]],
  'scoop-and-spade': [['cone-bucket-tray', -0.2, 0.15, -0.1, 2.4]],
  'lucky-limpet': [['fortune-shell', 0, 0.15, 0, 2.4]],
  'boardwalk-office': [['ledger-book', -1.2, 0.15, 0.2, 2.4]],
  'tin-shy': [['rubber-seagull', 1.4, 0.15, -0.3, 2.4]],
};

/** Each stall's lore sign, free-standing on a 1 m post beside the stall (dx from the stall centre). */
const STALL_SIGNS: Record<string, { text: string; w: number; h: number; dx: number }> = {
  'plank-and-pickle': { text: 'Ask about the brine.\nDo not ask what is in the brine.', w: 2.2, h: 0.8, dx: 2.9 },
  'spun-sugar-sal': { text: 'NO DIPPING HATS', w: 1.8, h: 0.5, dx: 2.9 },
  'tin-shy': { text: '3 CHIPPED ACORNS: 1 ACORN\nPrizes: a seagull, a hat (nearly), nothing', w: 2.6, h: 0.8, dx: 2.9 },
  'scoop-and-spade': { text: 'Vanilla. Sand-coloured.\nWhichever is left.', w: 2.2, h: 0.7, dx: 2.9 },
  'lucky-limpet': { text: 'FORTUNES 1 ACORN\nSomething will turn up.', w: 2.2, h: 0.7, dx: 2.9 },
};

/** The stalls on the boardwalk deck (deck top `deckTop`, absolute y). */
export function buildStalls(scene: THREE.Scene, boxes: Box[], deckTop: number): void {
  const bw = COAST.boardwalk;
  bw.stalls.forEach((s, i) => {
    const obj = place(scene, 'boardwalk-stall', s.x, s.z, s.yaw, 2.4, bw.deckLift, STALL_TINTS[i % STALL_TINTS.length]);
    if (obj) solid(boxes, obj);
    else boxes.push({ minX: s.x - 1.9, maxX: s.x + 1.9, minZ: s.z - 1.5, maxZ: s.z + 1.5, h: deckTop + 3.6 });
    // The name board sits on top of the stall's own header board (2.4 x the prefab's 1.84 m top), fixed (no post).
    const lz = -0.6;
    signAt(scene, s.name, s.x + Math.sin(s.yaw) * lz, deckTop + 4.42, s.z + Math.cos(s.yaw) * lz, s.yaw, { w: 3.2, h: 0.7, post: 0 });
    for (const [id, lx, lzp, yaw, scale] of COUNTER_PROPS[s.id] ?? []) placeAt(scene, id, s.x + lx, deckTop + 1.2, s.z + lzp, yaw, scale);
    const sg = STALL_SIGNS[s.id];
    if (sg) signAt(scene, sg.text, s.x + sg.dx, deckTop, s.z + 1.9, 0, { w: sg.w, h: sg.h, post: 1.0 });
    // The ledger shelf stands against the office's back wall, facing the walkway.
    if (s.id === 'boardwalk-office') placeAt(scene, 'stub-shelf', s.x + 1.2, deckTop, s.z - 0.5, 0, 2.4);
  });
  const tin = bw.stalls.find((s) => s.id === 'tin-shy');
  if (tin) solid(boxes, place(scene, 'tin-shy', tin.x, tin.z + 4.6, 0, 2, bw.deckLift));
  const sal = bw.stalls.find((s) => s.id === 'spun-sugar-sal');
  if (sal) solid(boxes, place(scene, 'candyfloss-cart', sal.x + 5, sal.z + 5, 0, 2, bw.deckLift));

  const office = bw.stalls.find((s) => s.id === 'boardwalk-office');
  // G3#22: the sign sits on the office counter front, by the pile of lost hats.
  if (office) signAt(scene, 'LOST PROPERTY\nHats, mostly', office.x, deckTop + 0.3, 1106.65 + 0.04, 0, { w: 1.6, h: 0.55, post: 0 });
  if (sal) signAt(scene, 'CANDYFLOSS IS A VEGETABLE\n(Sal says so)', sal.x - 14, deckTop, sal.z + 7, 0, { w: 3.6, h: 1.0, post: 1.2 });
}
