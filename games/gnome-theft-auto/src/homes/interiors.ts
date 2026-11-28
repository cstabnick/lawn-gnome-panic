// Character homes you can walk into (E10): Reginald Vance's townhouse 404 and Diggs' tin bungalow.
// Each room has story vignettes, signs and its resident. Defined at import time (app.ts imports this file).
import * as THREE from 'three';
import { defineInterior } from '../interiors/registry';
import type { InteriorKit } from '../interiors/types';

export const TOWNHOUSE_404_INTERIOR = 'townhouse-404';
export const DIGGS_BUNGALOW_INTERIOR = 'diggs-bungalow';

const REGINALD_LINES = [
  'You are standing on a non-compliant tile.',
  'The carpet is 0.25 inches proud. I will find out why.',
  'If Juniper sent you, the answer is still no.',
];

/** Height of a prefab placed on the floor, from its bounds (to set things on a table top). */
function topOf(obj: THREE.Object3D, fallback: number): number {
  const top = new THREE.Box3().setFromObject(obj).max.y;
  return Number.isFinite(top) && top > 0 ? top : fallback;
}

function say(name: string, line: string): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('gta:interior-say', { detail: { name, line } }));
}

// Townhouse 404: beige, immaculate, everything at right angles, one thing out of place.
defineInterior({
  id: TOWNHOUSE_404_INTERIOR,
  name: 'Townhouse 404, Patio Heights',
  door: { x: 102, z: -136.5, yaw: 0 },
  exit: { x: 102, z: -135, yaw: 0 },
  size: { w: 12, d: 9, h: 3.2 },
  theme: { floor: 0xcdbf9f, wall: 0xe4d8bc, trim: 0x8f8670, ceiling: 0xf3eedf, light: 0xf4f1e6 },
  ambience: 'city',
  prompt: 'Enter townhouse 404',
  build(kit: InteriorKit) {
    kit.room();
    // The front door is on the south wall (the house faces south); it faces into the room (-z).
    kit.door(0, 4.3, Math.PI);
    kit.window(-3.5, -4.45, 0, 1.6, 1.2, 1.0);
    kit.window(3.5, -4.45, 0, 1.6, 1.2, 1.0);

    // Vignette 1: a table laid for two. One chair pushed in neatly, the other knocked over (Juniper left).
    const dining = kit.put('table', -3.6, -0.6, 0);
    const diningTop = topOf(dining, 0.75);
    kit.put('chair', -3.6, -1.7, 0);
    kit.put('chair', -2.2, 0.3, 2.2, { solid: false });
    kit.put('serving-tray', -4.0, -0.6, 0, { y: diningTop, solid: false, size: 0.4 });
    kit.put('serving-tray', -3.2, -0.6, 0, { y: diningTop, solid: false, size: 0.4 });
    kit.put('candle', -3.6, -0.6, 0, { y: diningTop, solid: false });

    // Vignette 2: the measured carpet. Pegs at the corners, a measuring stick, one corner turned up.
    kit.put('rug', 1.2, 0.8, 0, { solid: false });
    kit.put('nails', -0.3, -0.5, 0, { solid: false });
    kit.put('nails', 2.7, -0.5, 0, { solid: false });
    kit.put('nails', 2.7, 2.1, 0, { solid: false });
    kit.put('nails', -0.3, 2.1, 0, { solid: false });
    kit.put('ruler-stick', 1.2, -0.7, 0.04, { solid: false });
    kit.put('rag', 2.6, -0.4, 0.8, { solid: false, size: 0.3 });

    // Vignette 3: the desk. A ledger, a lamp and a drift of notices of non-compliance, and the calipers.
    const desk = kit.put('office-desk', 4.6, -2.8, -Math.PI / 2);
    const deskTop = topOf(desk, 0.8);
    kit.put('ledger', 4.6, -2.3, -Math.PI / 2, { y: deskTop, solid: false });
    kit.put('lamp', 4.6, -3.5, 0, { y: deskTop, solid: false });
    kit.put('sealed-letter', 4.5, -2.8, 0.1, { y: deskTop, solid: false });
    kit.put('sealed-letter', 4.7, -2.7, -0.1, { y: deskTop, solid: false });
    kit.put('sealed-letter', 4.0, -1.2, 0.2, { solid: false });
    kit.put('brass-calipers', 4.8, -3.1, 1.2, { y: deskTop, solid: false, size: 0.3 });
    kit.put('chair', 3.5, -2.8, -Math.PI / 2);
    kit.sign('NOTICE OF NON-COMPLIANCE\n(DRAFT 41)', 5.95, 1.6, -2.8, -Math.PI / 2, {
      w: 1.0, h: 0.4, bg: 0xf5f0e1, fg: 0x8b1a1a,
    });

    // Vignette 4: a bookshelf, every shelf identical.
    kit.put('bookshelf', -5.4, 2.6, Math.PI / 2);
    kit.put('bookshelf', -5.4, 1.2, Math.PI / 2);
    kit.put('plant', -5.2, 4.0, 0);

    // The kitchen end: the fridge with a note on it.
    kit.put('fridge', 5.3, 3.4, -Math.PI / 2);
    kit.put('wall-clock', 0, -4.4, 0, { y: 1.9, solid: false });

    // Signs.
    kit.sign('SHOES OFF.\nSOCKS: BEIGE.', 1.8, 1.5, 4.45, Math.PI, { w: 1.1, h: 0.5, bg: 0xf5f0e1, fg: 0x263238 });
    kit.sign('HOA AUDITOR OF THE MONTH\n(EVERY MONTH)', -1.6, 1.8, -4.45, 0, {
      w: 1.5, h: 0.6, bg: 0xfff8dc, fg: 0x5d4037,
    });
    kit.sign('J. - YOUR HALF OF THE SHELF\nIS 0.25 IN. OVER.', 4.95, 1.4, 3.4, -Math.PI / 2, {
      w: 0.8, h: 0.4, bg: 0xfff176, fg: 0x263238,
    });

    // Reginald, crouched by the rug measuring it. Each ask gets the next line.
    let next = 0;
    kit.npc({
      id: 'reginald',
      name: 'Reginald Vance',
      x: 0.2,
      z: 2.6,
      yaw: Math.PI,
      look: { hat: 0x18181e, shirt: 0xc9b99b, glasses: true },
      line: REGINALD_LINES[0],
    });
    kit.spot({
      id: 'reginald-measure',
      x: 0.2,
      z: 3.4,
      prompt: 'Ask Reginald about the carpet',
      run() {
        say('Reginald Vance', REGINALD_LINES[next % REGINALD_LINES.length]);
        next += 1;
      },
    });
  },
});

// Diggs' bungalow: a Nissen hut, low and long, cluttered and warm, smelling of sand and tea.
defineInterior({
  id: DIGGS_BUNGALOW_INTERIOR,
  name: "Diggs' bungalow",
  door: { x: 615, z: 206.5, yaw: Math.PI },
  exit: { x: 615, z: 205, yaw: Math.PI },
  size: { w: 11, d: 8, h: 3 },
  theme: { floor: 0x7a6548, wall: 0x9a8f7c, trim: 0x5d4a36, ceiling: 0x7d7a70, light: 0xffd9a0 },
  ambience: 'desert',
  prompt: "Enter Diggs' bungalow",
  build(kit: InteriorKit) {
    kit.room();
    // Door on the north wall, facing into the room (+z).
    kit.door(0, -3.8, 0);
    kit.window(3.5, 3.95, Math.PI, 1.3, 1.0, 1.1);

    // Vignette 1: a camp bed with a digging tool tucked in like a teddy.
    kit.put('bed', -4.2, 1.6, Math.PI / 2);
    kit.put('hand-fork', -4.2, 1.2, 0.3, { y: 0.45, solid: false, size: 0.7 });
    kit.put('old-trowel', -4.0, 1.6, 1.1, { y: 0.5, solid: false });

    // Vignette 2: shelves of labelled jars of finds, one lid off and empty.
    kit.put('cupboard', -2.0, 3.6, Math.PI);
    kit.put('clay-jar', -2.6, 3.0, 0, { solid: false });
    kit.put('clay-jar', -2.0, 3.0, 0.5, { solid: false });
    kit.put('clay-jar', -1.4, 3.0, 1.0, { solid: false });
    kit.put('barrel', -0.5, 3.4, 0);
    kit.put('crate', 0.4, 3.4, 0.2);
    kit.put('pot', 1.2, 3.4, 0, { solid: false });
    kit.put('sack', 2.2, 3.3, 0.4);
    // The empty jar with its lid off, alone on the floor.
    kit.put('clay-jar', 0.4, 2.3, 0.3, { solid: false });
    kit.put('button', 0.9, 2.2, 0, { solid: false });

    // Vignette 3: the kettle on the stove, two mugs, one for a guest who never comes.
    const stove = kit.put('stove', 3.8, -2.6, -Math.PI / 2);
    const stoveTop = topOf(stove, 0.9);
    kit.put('espresso-cup', 3.6, -2.2, 0, { y: stoveTop, solid: false, size: 0.15 });
    kit.put('espresso-cup', 3.6, -3.0, 0, { y: stoveTop, solid: false, size: 0.15 });
    kit.put('tin-pail', 3.9, -2.6, 0, { y: stoveTop, solid: false, size: 0.3 });
    kit.put('stool', 2.4, -2.2, 0);
    kit.put('stool', 2.4, -3.2, 0);

    // Vignette 4: a wall map with pins and string.
    kit.put('painting', 0, -3.88, 0, { y: 1.3, solid: false, size: 1.2 });
    kit.sign('THE REAL MAP\n(NOT THE HOA ONE)\nX X X X X X', 1.9, 1.5, -3.92, 0, {
      w: 1.6, h: 0.9, bg: 0xe8dcb8, fg: 0x5d4037,
    });
    kit.put('folded-map', 2.4, -3.0, 0, { solid: false });

    // Signs.
    kit.sign('FINDERS KEEPERS.\nLOSERS: HOA.', -2.6, 1.7, -3.92, 0, { w: 1.3, h: 0.5, bg: 0xfff8dc, fg: 0x3e2723 });
    // Over the camp bed with the hand-fork tucked in (not by the door, where it sat at the edge of the entry view).
    kit.sign('DO NOT DIG INDOORS\n(AGAIN)', -5.45, 1.6, 1.6, Math.PI / 2, {
      w: 1.0, h: 0.45, bg: 0xfff176, fg: 0x263238,
    });

    kit.npc({
      id: 'diggs',
      name: 'Diggs',
      x: 3.0,
      z: -2.5,
      yaw: -Math.PI / 2,
      look: { hat: 0x8d6e63, shirt: 0xc2a36b, beard: 0x9e9e9e },
      sit: true,
      line: "Tea? Don't touch the jars. Each one's a story and none of them are yours.",
    });
  },
});
