// The six boardwalk stalls (E11; FX11 moved them out of boardwalk.ts): the kiosks with their name boards, Tin Shy's
// tins, Sal's candyfloss cart and the stall signs. Lore: docs/lore/entries/apocrypha/the-boardwalk-stalls.md.
import * as THREE from 'three';
import type { Box } from '../types';
import type { AmbientGnomeDef } from '../ambientGnomes';
import { COAST } from './config';
import { place, signAt, solid } from './deckKit';

const STALL_TINTS = [0xe8453c, 0x4fa3d9, 0x6bbf59, 0xf2a93b, 0x9b6bd1, 0x2fb8a8];

/** One keeper per stall (life.ts adds them to the coast residents). Sal is already a resident (coast-sal-candyfloss). */
export const STALL_KEEPERS: readonly AmbientGnomeDef[] = [];

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
  });
  const tin = bw.stalls.find((s) => s.id === 'tin-shy');
  if (tin) solid(boxes, place(scene, 'tin-shy', tin.x, tin.z + 4.6, 0, 2, bw.deckLift));
  const sal = bw.stalls.find((s) => s.id === 'spun-sugar-sal');
  if (sal) solid(boxes, place(scene, 'candyfloss-cart', sal.x + 5, sal.z + 5, 0, 2, bw.deckLift));

  const office = bw.stalls.find((s) => s.id === 'boardwalk-office');
  if (office) signAt(scene, 'LOST PROPERTY\nHats, mostly', office.x + 5, deckTop, office.z + 6, 0, { w: 2.6, h: 0.9, post: 1.2 });
  if (sal) signAt(scene, 'CANDYFLOSS IS A VEGETABLE\n(Sal says so)', sal.x - 14, deckTop, sal.z + 7, 0, { w: 3.6, h: 1.0, post: 1.2 });
}
