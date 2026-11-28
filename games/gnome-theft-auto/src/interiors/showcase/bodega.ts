// Bodega & Sons (E05 showcase interior): a furnished walk-in corner shop. Lore: docs/lore/entries/apocrypha/bodega-and-sons.md.
import * as THREE from 'three';
import { defineInterior } from '../registry';

export const BODEGA_INTERIOR = 'bodega';

/** Top of an object's bounding box (world height in the room's local frame). */
function topOf(obj: THREE.Object3D): number {
  return new THREE.Box3().setFromObject(obj).max.y;
}

let johnLine = 0;
const JOHN_LINES = [
  'We are open. We are always open. We lost the key in the first week.',
  'Cola is lukewarm. That is not a fault, that is the house style.',
  'Spark plugs are behind the pickled clover. Do not ask why.',
];

defineInterior({
  id: BODEGA_INTERIOR,
  name: 'Bodega & Sons',
  door: { x: -79.5, z: 92, yaw: -Math.PI / 2 },
  exit: { x: -78, z: 92, yaw: Math.PI / 2 },
  size: { w: 12, d: 10, h: 3.6 },
  theme: 'shop',
  ambience: 'city',
  build(kit) {
    kit.room();
    kit.door(5.8, 0, -Math.PI / 2);

    // Doormat.
    kit.put('rug', 4.6, 0, Math.PI / 2, { solid: false, size: 1.6, tint: 0x6b8e23 });

    // Counter along the north side, with the register, the sleeping cat and the lamp on top.
    kit.block(5, 1.0, 1.0, -1, -3, { color: 0x6d4c41 });
    kit.put('gsr-barcode-register', -2.2, -3, 0, { y: 1.0, solid: false, size: 0.6 });
    kit.put('asphalt-cat', 0.6, -3, 0.6, { y: 1.0, solid: false, size: 0.7 });
    kit.sign('SHH. CAT ASLEEP.', 0.6, 0.7, -2.45, 0, { w: 0.9, h: 0.3 });
    kit.put('lamp', -3.2, -3, 0, { y: 1.0, solid: false });

    kit.npc({
      id: 'john',
      name: 'John Bodega',
      x: -1,
      z: -4.2,
      yaw: 0,
      look: { hat: 0x7c4a2d, shirt: 0x3b7a57, beard: 0x8b5a2b },
      line: 'Keep your voice down. If Asphalt wakes up, prices go up.',
    });

    kit.spot({
      id: 'counter-bell',
      x: -1,
      z: -2.2,
      prompt: 'Ring the counter bell',
      run() {
        const line = JOHN_LINES[johnLine % JOHN_LINES.length];
        johnLine += 1;
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('gta:interior-say', { detail: { name: 'John Bodega', line } }));
        }
      },
    });

    // Big sign above the counter.
    kit.sign('BODEGA & SONS\n(NO SONS, JUST JOHN)\nCASH OR ACORNS.', -1, 2.6, -4.95, 0, { w: 3, h: 1 });

    // West wall: drinks machines and shop shelving.
    kit.put('gta-vending-cola', -5.3, -3.8, Math.PI / 2);
    kit.put('gta-vending-fizz', -5.3, -2.3, Math.PI / 2);
    kit.put('bookshelf', -5.4, 1.2, Math.PI / 2, { tint: 0xa1887f });
    kit.put('bookshelf', -5.4, 3.4, Math.PI / 2, { tint: 0xa1887f });

    // Vignette 2: the Acorn-Cola tower that fell.
    const base = kit.put('crate', 3.6, 3.9, 0);
    const second = kit.put('crate', 3.6, 3.9, 0, { y: topOf(base) });
    kit.put('crate', 3.6, 3.9, 0, { y: topOf(second) });
    kit.put('crate', 2.6, 3.3, 0.7);
    const cans: [number, number, number][] = [
      [1.8, 2.2, 0.3], [2.2, 2.9, 1.1], [2.7, 2.1, 2.0], [3.1, 3.2, 0.8], [1.9, 3.3, 2.6],
    ];
    for (const [x, z, yaw] of cans) kit.put('gta-can-cola', x, z, yaw, { solid: false });
    kit.sign('ACORN-COLA\nLUKEWARM AS ADVERTISED', 3.0, 1.6, 4.95, Math.PI, { w: 1.4, h: 0.6, bg: 0xc62828 });

    // Vignette 3: Mossley's abandoned grid survey.
    const table = kit.put('side-table', 2.4, -1.2, 0);
    const top = topOf(table);
    kit.put('folded-map', 2.3, -1.3, 0.2, { y: top, solid: false, size: 0.6 });
    kit.put('tall-one-pencil', 2.6, -1.0, 1.4, { y: top, solid: false, size: 1.3, by: 'h' });
    kit.put('stool', 3.2, -1.2, 1.2);
    // Moved from z -2.6 to -1.2 to clear the window (z -3.8..-2.2, y 1.2..2.2) on the same wall.
    kit.sign('GRID SURVEY, DAY 412:\nSTREET STILL STRAIGHT.', 5.95, 1.8, -1.2, -Math.PI / 2, { w: 1.4, h: 0.6, bg: 0xf5f0e1, fg: 0x263238 });

    // Vignette 4: the watering-can spout as umbrella stand.
    kit.put('barrel', 5.0, 3.6, 0);
    kit.sign('SPOUT (ORIGINAL)\nUMBRELLAS ONLY', 5.95, 1.6, 3.6, -Math.PI / 2, { w: 1.0, h: 0.5 });

    // East wall window and the neon sign just inside it.
    kit.window(5.95, -3, -Math.PI / 2, 1.6, 1.0, 1.2);
    kit.sign('OPEN 24 HRS', 5.9, 2.5, -3, -Math.PI / 2, { w: 1.2, h: 0.35, bg: 0x1a0d14, fg: 0xff4fa3 });
  },
});
