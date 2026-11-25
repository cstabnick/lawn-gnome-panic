// Flat 3B, Saucer Court (E05 showcase interior): the player's loaned flat on move-in day. Empty shell with three small
// vignettes (sleeping bag and lamp, moving day, the bank's letters), the bank's signs and a neighbour through the wall.
// E10 furnishes it (FLAT_3B_FURNISH_SLOTS), locks it behind the loan and may move the door when it rebuilds the block.
import * as THREE from 'three';
import { defineInterior } from '../registry';
import type { InteriorKit } from '../types';

export const FLAT_3B_INTERIOR = 'flat-3b';

/**
 * Free floor spots E10 may fill with furniture (local coordinates, metres from the room centre). E10 replaces the bedroll
 * and the crates of the move-in vignettes (below) with furniture in these spots.
 */
export const FLAT_3B_FURNISH_SLOTS: readonly { id: string; x: number; z: number; yaw: number }[] = [
  { id: 'bed', x: -3.8, z: -2.6, yaw: Math.PI / 2 },
  { id: 'sofa', x: 2.5, z: 0.5, yaw: -Math.PI / 2 },
  { id: 'table', x: -1, z: 1.5, yaw: 0 },
  { id: 'wardrobe', x: -5.3, z: -0.8, yaw: Math.PI / 2 },
  { id: 'shelf', x: 5.3, z: -2.5, yaw: -Math.PI / 2 },
  { id: 'rug', x: 0, z: -0.5, yaw: 0 },
];

const NEIGHBOUR_LINES = [
  'Wipe your feet. I can hear when you do not wipe your feet.',
  'Welcome to Saucer Court. Nobody sweeps the courtyard. That is a tradition now.',
  'If you are the bank, I paid. If you are not the bank, I also paid.',
];

/** Height of a prefab placed on the floor, from its bounds (used to stack and to set things on a crate's top). */
function topOf(obj: THREE.Object3D, fallback: number): number {
  const top = new THREE.Box3().setFromObject(obj).max.y;
  return Number.isFinite(top) && top > 0 ? top : fallback;
}

defineInterior({
  id: FLAT_3B_INTERIOR,
  name: 'Flat 3B, Saucer Court',
  door: { x: 30, z: 112.6, yaw: Math.PI },
  exit: { x: 30, z: 114, yaw: 0 },
  size: { w: 12, d: 10, h: 3 },
  theme: 'flat',
  ambience: 'city',
  build(kit: InteriorKit) {
    kit.room();
    kit.door(0, 4.8, Math.PI);

    // Two windows on the north wall (0.05 m in front of it).
    kit.window(-3, -4.95, 0, 1.6, 1.2, 1.0);
    kit.window(3, -4.95, 0, 1.6, 1.2, 1.0);

    // Vignette 1: sleeping on the floor. A bedroll and one lamp on the floor, no table.
    kit.put('bedroll', -3.8, -2.6, Math.PI / 2);
    kit.put('lamp', -2.6, -3.6, 0);

    // Vignette 2: moving day. Boxes by the east wall, a parcel, and a chair turned to the window.
    const boxLow = kit.put('crate', 4.6, 2.8, 0);
    kit.put('crate', 4.6, 1.6, 0);
    kit.put('crate', 4.6, 2.8, 0, { y: topOf(boxLow, 0.6), solid: false });
    kit.put('parcel-box', 3.6, 3.4, 0.4, { solid: false });
    kit.put('chair', 1.5, -2.6, Math.PI);

    // Vignette 3: the bank's letters. A crate used as a table, with a ledger and a sealed letter on its top,
    // and post piling up by the door.
    const table = kit.put('crate', -0.5, 0.8, 0);
    const tableTop = topOf(table, 0.6);
    kit.put('ledger', -0.5, 0.8, 0, { y: tableTop, solid: false });
    kit.put('sealed-letter', -0.5, 0.8, 0, { y: tableTop, solid: false });
    kit.put('sealed-letter', -0.6, 3.9, 0.5, { solid: false });
    kit.put('sealed-letter', 0.4, 4.1, 0.5, { solid: false });

    // Signage. West wall: the bank's notice. East wall: a sticky note.
    kit.sign('PROPERTY OF THE FIRST KILN BANK.\nPLEASE DO NOT ENJOY THE WALLS.', -5.95, 1.6, 0, Math.PI / 2, {
      w: 2.2, h: 0.6, bg: 0xf5f0e1, fg: 0x263238,
    });
    kit.sign('FLAT 3B: 1,500 ACORNS\n(PLUS FEELINGS)', 5.95, 1.5, -1, -Math.PI / 2, {
      w: 1.0, h: 0.45, bg: 0xfff176, fg: 0x263238,
    });

    // The neighbour through the wall (flat 3A, Hyssop Doormat): each knock gets the next line, in turn.
    let next = 0;
    kit.spot({
      id: 'wall-3a',
      x: -5.3,
      z: 2.5,
      prompt: 'Knock on the wall (flat 3A)',
      run() {
        const line = NEIGHBOUR_LINES[next % NEIGHBOUR_LINES.length];
        next += 1;
        window.dispatchEvent(new CustomEvent('gta:interior-say', {
          detail: { name: 'Hyssop Doormat (through the wall)', line },
        }));
      },
    });
    // No resident inside: it is the player's flat.
  },
});
