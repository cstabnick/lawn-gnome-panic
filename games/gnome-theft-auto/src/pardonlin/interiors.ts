// Pardonlin's walk-in rooms (E30), defined at import time with defineInterior (interiors/). app.ts imports this once.
// Two small stories: Cafe Pardon on Teacup Row (nobody has been served since Tuesday) and the Radio Adagio foyer and
// studio in the Opera Hall (the broadcast is live, just slowly). Lore: docs/roadmaps/gta-batch-3/E30-pardonlin-town.md.
import * as THREE from 'three';
import { getPrefab } from '@lawn/prefabs';
import { defineInterior } from '../interiors/registry';
import type { InteriorKit, InteriorTheme } from '../interiors/types';

export const PL_INTERIOR_IDS = ['pl-cafe-pardon', 'pl-adagio-foyer'] as const;

/** Warm cafe: honey floor, cream walls, bottle-green trim. */
const CAFE_THEME: InteriorTheme = { floor: 0x7a5a3c, wall: 0xe8d6b0, trim: 0x3e5c4a, ceiling: 0xf0e6cc, light: 0xffe2b0 };
/** Velvet and gold: oxblood walls, gold trim, dark wood. */
const VELVET_THEME: InteriorTheme = { floor: 0x3a1c1c, wall: 0x5a1a26, trim: 0xc9a227, ceiling: 0x24100f, light: 0xffd9a0 };

/** Prefabs added by another worker this epic: skipped (not thrown) while missing. */
function putIf(kit: InteriorKit, id: string, x: number, z: number, yaw = 0, opts?: Parameters<InteriorKit['put']>[4]): THREE.Object3D | null {
  if (!getPrefab(id)) return null;
  return kit.put(id, x, z, yaw, opts);
}

function topOf(obj: THREE.Object3D): number {
  return new THREE.Box3().setFromObject(obj).max.y;
}

function say(name: string, line: string): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('gta:interior-say', { detail: { name, line } }));
  }
}

// ---------------------------------------------------------------------------------------------------------------
// Cafe Pardon
// ---------------------------------------------------------------------------------------------------------------

let hectorRefusal = 0;
const HECTOR_REFUSALS = [
  'A coffee. Today. In this economy of time. No.',
  'The kitchen is closed for the lunch that has not ended yet.',
  'I do not take orders. I take notes on people who think I do.',
  'We are out of coffee. We are also out of out. Sit, and be quiet about it.',
  'Ask again after the strike. The one that comes after the one we are in.',
  'You may look at the menu. The menu may look at you. That is the service.',
];

/** A tower of saucers (thin slabs) on a table top: lifted apart, no shared faces. Returns the top height. */
function saucerTower(kit: InteriorKit, x: number, z: number, baseY: number, count: number): number {
  const step = 0.045;
  let y = baseY;
  for (let i = 0; i < count; i++) {
    const wob = ((i % 3) - 1) * 0.012;
    const s = 0.17 - (i % 2) * 0.01;
    kit.block(s, 0.03, s, x + wob, z - wob, { y, color: i % 2 ? 0xf3efe6 : 0xdfe7ea, solid: false });
    y += step;
  }
  return y;
}

function cafeTableSet(kit: InteriorKit, x: number, z: number): THREE.Object3D {
  const t = kit.put('euro-cafe-table', x, z, 0);
  kit.put('euro-cafe-chair', x - 0.75, z, Math.PI / 2);
  kit.put('euro-cafe-chair', x + 0.75, z, -Math.PI / 2);
  return t;
}

defineInterior({
  id: PL_INTERIOR_IDS[0],
  name: 'Café Pardon',
  door: { x: -1527.8, z: 139, yaw: -Math.PI / 2 },
  exit: { x: -1526.6, z: 139, yaw: Math.PI / 2 },
  size: { w: 14, d: 10, h: 4 },
  theme: CAFE_THEME,
  ambience: 'continental',
  build(kit) {
    kit.room();
    // Entrance on the east wall (the street side).
    kit.door(6.8, 0, -Math.PI / 2);
    kit.put('rug', 5.6, 0, Math.PI / 2, { solid: false, size: 1.5, tint: 0x3e5c4a });

    // --- Zinc counter along the north wall, back bar behind it ---------------------------------------------
    kit.block(6, 1.0, 1.0, -1.4, -3.4, { color: 0xaab4b8 });
    kit.put('bookshelf', -2.4, -4.55, 0, { tint: 0x8d6e63 });
    kit.sign('CAFÉ PARDON\nSINCE BEFORE THE QUEUE', -1.4, 3.1, -4.95, 0, { w: 3.4, h: 0.9, bg: 0x2f4a3c, fg: 0xf5e6b8 });
    kit.sign('MENU (FOR READING ONLY)', 0.4, 1.9, -4.95, 0, { w: 1.5, h: 0.35, bg: 0xf5f0e1, fg: 0x263238 });
    // On the counter: cups waiting for nobody, the paper, the gramophone, the lamp.
    putIf(kit, 'pl-espresso-cup', -3.6, -3.4, 0, { y: 1.0, solid: false });
    putIf(kit, 'pl-espresso-cup', -3.2, -3.35, 1.1, { y: 1.0, solid: false });
    putIf(kit, 'pl-newspaper', -0.4, -3.2, 0.3, { y: 1.0, solid: false });
    putIf(kit, 'pl-gramophone', 0.9, -3.4, Math.PI / 2, { y: 1.0, solid: false, size: 0.55 });
    kit.put('lamp', -4.0, -3.7, 0, { y: 1.0, solid: false });

    // --- Pastry vitrine at the west end of the counter (a 0.2 m gap, no shared faces) -----------------------
    kit.block(1.8, 1.0, 0.9, -5.5, -3.4, { color: 0x6d4c41 });
    kit.block(1.8, 0.06, 0.9, -5.5, -3.4, { y: 1.0, color: 0xcfe3ea, solid: false, emissive: 0x1a2a30 });
    putIf(kit, 'pl-croissant', -6.0, -3.4, 0.4, { y: 1.06, solid: false });
    putIf(kit, 'pl-croissant', -5.5, -3.2, 2.0, { y: 1.06, solid: false });
    putIf(kit, 'pl-bread-basket', -5.1, -3.5, 0, { y: 1.06, solid: false });
    kit.put('bread-loaf', -5.7, -3.7, 1.0, { y: 1.06, solid: false });
    kit.sign('PASTRIES: LOOK, DO NOT ASK', -5.5, 2.1, -4.95, 0, { w: 1.7, h: 0.4, bg: 0xf5f0e1, fg: 0x5d4037 });

    // --- Hector Disdain, front of house -----------------------------------------------------------------------
    kit.npc({
      id: 'pl-hector',
      name: 'Hector Disdain',
      x: 0.2,
      z: -2.2,
      yaw: 0,
      look: { hat: 0x111111, shirt: 0xfafafa, beard: 0x9e9e9e },
      line: 'I have seen you. I choose to have not. It is a skill, and it took me years.',
    });
    kit.spot({
      id: 'pl-order-coffee',
      x: -1.4,
      z: -2.2,
      prompt: 'Order a coffee',
      run() {
        const line = HECTOR_REFUSALS[hectorRefusal % HECTOR_REFUSALS.length];
        hectorRefusal += 1;
        say('Hector Disdain', line);
      },
    });

    // --- Vignette 1: the lost umbrella collection, behind the counter's east end ---------------------------------
    kit.put('barrel', 2.6, -4.3, 0);
    const brollies = [0xc62828, 0x1565c0, 0x2e7d32, 0x6a1b9a, 0x212121, 0xf9a825];
    brollies.forEach((c, i) => {
      kit.block(0.05, 0.9 + (i % 3) * 0.12, 0.05, 2.45 + (i % 3) * 0.14, -4.4 + Math.floor(i / 3) * 0.2, { y: 0.5, color: c, solid: false });
    });
    kit.put('barrel', 3.5, -4.3, 0);
    kit.block(0.05, 1.0, 0.05, 3.5, -4.3, { y: 0.5, color: 0x212121, solid: false });
    kit.sign('LOST UMBRELLAS: 212\nCLAIM TICKETS: NONE\nOWNERS: SUNNY TYPES', 3.0, 1.9, -4.95, 0, { w: 1.9, h: 0.7, bg: 0xf5f0e1, fg: 0x263238 });

    // --- Tables: six for the paying, one reserved ---------------------------------------------------------------------
    const tables: [number, number][] = [[-3, 0.8], [0, 0.8], [3, 0.8], [-3, 3.4], [0, 3.4], [3, 3.4]];
    for (const [x, z] of tables) {
      const t = cafeTableSet(kit, x, z);
      // One unfinished cup per table, left over from a different decade.
      putIf(kit, 'pl-espresso-cup', x + 0.05, z + 0.05, x, { y: topOf(t), solid: false });
    }
    putIf(kit, 'pl-croissant', 3.1, 0.9, 0.2, { y: 0.77, solid: false });

    // --- Vignette 2: the reserved table by the east window -------------------------------------------------------------
    const reserved = cafeTableSet(kit, 5.2, -3.4);
    kit.put('euro-geranium-pot', 5.2, -3.4, 0, { y: topOf(reserved), solid: false, size: 0.3 });
    kit.window(6.95, -3.4, -Math.PI / 2, 1.6, 1.0, 1.2);
    kit.sign('RESERVED\nSINCE THE LAST STRIKE', 6.95, 1.8, -1.4, -Math.PI / 2, { w: 1.3, h: 0.55, bg: 0x7b1f2b, fg: 0xf5e6b8 });

    // --- Vignette 3: the queue inside the cafe that formed out of habit ----------------------------------------------
    kit.block(0.5, 0.02, 3.4, -6.1, -0.6, { color: 0xe0c97a, solid: false });
    const qLook = { hat: 0x5d4037, shirt: 0x78909c, beard: 0xbcaaa4 };
    kit.npc({ id: 'pl-cafe-queue-1', name: 'First in Line', x: -6.1, z: -1.8, yaw: Math.PI, look: { ...qLook, hat: 0x6a1b9a },
      line: 'I am first. Nobody has told me what for. I will not be the one to ask.' });
    kit.npc({ id: 'pl-cafe-queue-2', x: -6.1, z: -0.8, yaw: Math.PI, look: { ...qLook, hat: 0x1565c0 } });
    kit.npc({ id: 'pl-cafe-queue-3', x: -6.1, z: 0.2, yaw: Math.PI, look: { ...qLook, hat: 0x2e7d32 } });
    kit.sign('THIS QUEUE FORMED BY HABIT.\nPLEASE JOIN IT.', -6.95, 1.9, -1.6, Math.PI / 2, { w: 1.5, h: 0.6, bg: 0xf5f0e1, fg: 0x263238 });
    kit.window(-6.95, 1.8, Math.PI / 2, 1.4, 1.0, 1.2);

    // --- The back corner: two regulars, one espresso, since Tuesday -----------------------------------------------------------
    const corner = kit.put('euro-cafe-table', -5.4, 3.6, 0);
    const stackTop = saucerTower(kit, -5.4, 3.6, topOf(corner), 12);
    putIf(kit, 'pl-espresso-cup', -5.4, 3.6, 0, { y: stackTop, solid: false });
    kit.put('euro-cafe-chair', -6.2, 3.6, Math.PI / 2);
    kit.put('euro-cafe-chair', -4.6, 3.6, -Math.PI / 2);
    kit.npc({ id: 'pl-cafe-regular-1', name: 'Regular (Tuesday)', x: -6.2, z: 3.6, yaw: Math.PI / 2, sit: true,
      look: { hat: 0x4e342e, shirt: 0x546e7a, beard: 0xe0e0e0 },
      line: 'Shh. We are mid-espresso. It is a long one. It is going well.' });
    kit.npc({ id: 'pl-cafe-regular-2', name: 'Regular (Also Tuesday)', x: -4.6, z: 3.6, yaw: -Math.PI / 2, sit: true,
      look: { hat: 0x37474f, shirt: 0x8d6e63, beard: 0xbdbdbd },
      line: 'He had the sip. I get the next one. We have a schedule. It is on a napkin.' });
    kit.sign('ONE ESPRESSO\nSINCE TUESDAY\n(12 SAUCERS, 0 REFILLS)', -5.4, 1.9, 4.95, Math.PI, { w: 1.9, h: 0.75, bg: 0xf5f0e1, fg: 0x5d4037 });

    // --- Chalkboard: the specials -----------------------------------------------------------------------------------
    kit.put('euro-chalkboard-sign', 4.8, 3.9, Math.PI * 0.95, { size: 0.9, by: 'h' });
    kit.sign("TODAY: COFFEE.\nTOMORROW: POSSIBLY COFFEE.", 5.0, 2.3, 4.95, Math.PI, { w: 2.4, h: 0.8, bg: 0x263238, fg: 0xf5f5dc });

    // Wall clock and a shy plant.
    putIf(kit, 'wall-clock', 2.5, -4.9, 0, { y: 2.4, solid: false });
    kit.put('euro-flower-trough', 6.2, 3.7, -Math.PI / 2, { solid: false, size: 1.2 });
  },
});

// ---------------------------------------------------------------------------------------------------------------
// Radio Adagio: foyer (west) and studio (east), joined by an open glass wall at x = 1
// ---------------------------------------------------------------------------------------------------------------

let requestIx = 0;
const REQUESTS = [
  'Your request has been noted. It will be played in the next season.',
  'Ah, a request. Written, in triplicate, and in tempo? No? Then, regrettably, largo.',
  'We have it. It is at the back of the records, behind the records. Come back in the spring.',
  'Rejected. Not for being bad. For being quick.',
  'A fine piece. It will be played at half the speed, and your grandchildren may enjoy the middle.',
  'The orchestra is resting. The orchestra has been resting since the previous request. Yours is next.',
];

const GOLD = 0xc9a227;
const RED = 0x8e1b2b;

function recordStack(kit: InteriorKit, x: number, z: number, count: number): void {
  for (let i = 0; i < count; i++) {
    kit.block(0.3, 0.012, 0.3, x + (i % 2) * 0.01, z, { y: 0.02 + i * 0.03, color: i % 3 === 0 ? 0x5a1a26 : 0x15151a, solid: false });
  }
}

defineInterior({
  id: PL_INTERIOR_IDS[1],
  name: 'Radio Adagio',
  door: { x: -1680, z: -100, yaw: Math.PI / 2 },
  exit: { x: -1682, z: -100, yaw: -Math.PI / 2 },
  size: { w: 18, d: 14, h: 6 },
  theme: VELVET_THEME,
  ambience: 'continental',
  build(kit) {
    kit.room();
    // Entrance on the west wall (the Boulevard side).
    kit.door(-8.8, 0, Math.PI / 2);
    kit.sign('RADIO ADAGIO\nBROADCASTING SINCE EVENTUALLY', -8.95, 3.6, 0, Math.PI / 2, { w: 4, h: 1.0, bg: 0x24100f, fg: GOLD });

    // --- Foyer: red carpet from the door to the studio, edged in gold ---------------------------------------------
    kit.block(8.2, 0.02, 3.2, -4.8, 0, { color: RED, solid: false });
    kit.block(8.2, 0.03, 0.1, -4.8, -1.4, { color: GOLD, solid: false });
    kit.block(8.2, 0.03, 0.1, -4.8, 1.4, { color: GOLD, solid: false });
    // Velvet rope posts either side of the carpet.
    const postXs = [-8, -6, -4, -2];
    for (const zs of [-1.95, 1.95]) {
      postXs.forEach((x, i) => {
        kit.block(0.1, 0.95, 0.1, x, zs, { color: GOLD, solid: false });
        kit.block(0.2, 0.05, 0.2, x, zs, { color: GOLD, solid: false });
        if (i < postXs.length - 1) kit.block(2.05, 0.04, 0.04, x + 1, zs, { y: 0.72, color: 0x7b1f2b, solid: false });
      });
    }

    // --- Ticket window (north wall) --------------------------------------------------------------------------------
    kit.block(3.4, 1.0, 0.8, -5.2, -6.3, { color: 0x3a2a20 });
    kit.window(-5.2, -6.95, 0, 1.8, 0.9, 1.15);
    kit.sign('Season tickets:\nseats not provided', -5.2, 2.6, -6.95, 0, { w: 2.6, h: 0.7, bg: 0x24100f, fg: GOLD });
    kit.sign('BOX OFFICE (OPEN WHEN IT OPENS)', -5.2, 3.3, -6.95, 0, { w: 3.0, h: 0.4, bg: GOLD, fg: 0x24100f });
    putIf(kit, 'pl-newspaper', -4.6, -6.3, 0.4, { y: 1.0, solid: false });
    kit.put('lamp', -6.4, -6.3, 0, { y: 1.0, solid: false });

    // --- Hall of conductors (south wall): five portraits, one face -----------------------------------------------------
    const face = '( o_o )\n\\__M__/';
    const names = ['THE FIRST', 'THE SLOWER', 'THE ONE AFTER', 'THE SAME ONE', '(NO RELATION)'];
    names.forEach((n, i) => {
      kit.sign(`${face}\nMAESTRO LENTO\n${n}`, -7.4 + i * 2.0, 2.4, 6.95, Math.PI, { w: 1.4, h: 1.7, bg: 0x2b1a12, fg: GOLD });
    });
    kit.sign('HALL OF CONDUCTORS\n(ALL ONE FACE)', -3.4, 4.0, 6.95, Math.PI, { w: 3, h: 0.7, bg: 0x24100f, fg: GOLD });
    kit.put('bench', -6, 5.9, Math.PI, { tint: 0x5d4037 });
    kit.put('bench', -2.5, 5.9, Math.PI, { tint: 0x5d4037 });
    kit.put('grandfather-clock', -8.4, 5.2, Math.PI / 2);
    kit.put('newspaper-box', -8.3, -4.8, Math.PI / 2);

    // --- The glass wall at x = 1: low walls, panes above, a doorway between ---------------------------------------------
    for (const sgn of [-1, 1]) {
      kit.block(0.2, 1.1, 5.3, 1, sgn * 4.25, { color: 0x3a2a20 });
      kit.window(1, sgn * 4.25, Math.PI / 2, 5.3, 1.7, 1.1);
      kit.block(0.3, 2.9, 0.3, 1, sgn * 1.65, { color: GOLD });
    }
    kit.block(0.2, 3.1, 13.8, 1, 0, { y: 2.8, color: 0x3a2a20, solid: false });
    // Faces the foyer (west, so yaw -pi/2), 0.02 off the header.
    kit.sign('ON AIR\n(slowly)', 0.88, 4.4, 0, -Math.PI / 2, { w: 3.2, h: 1.0, bg: 0x7b1f2b, fg: 0xffe9a8 });

    // --- Studio ------------------------------------------------------------------------------------------------------------------
    kit.put('rug', 5.2, 0.6, 0, { solid: false, size: 4, tint: 0x6a2530 });
    // The desk, the microphone, the gramophone, a stool.
    kit.block(3.0, 0.8, 1.1, 5.8, -3.2, { color: 0x4e342e });
    kit.block(0.12, 0.02, 0.12, 5.4, -2.95, { y: 0.8, color: 0x212121, solid: false });
    kit.block(0.04, 0.32, 0.04, 5.4, -2.95, { y: 0.82, color: 0x424242, solid: false });
    kit.block(0.1, 0.14, 0.1, 5.4, -2.95, { y: 1.14, color: 0xb0bec5, solid: false });
    putIf(kit, 'pl-gramophone', 6.6, -3.3, -Math.PI / 2, { y: 0.8, solid: false, size: 0.55 });
    putIf(kit, 'pl-sheet-music', 4.9, -3.4, 0.3, { y: 0.8, solid: false });
    kit.put('stool', 5.8, -4.3, 0);
    kit.sign('ON AIR\n(slowly)', 8.95, 3.2, -2.5, -Math.PI / 2, { w: 2.2, h: 0.8, bg: 0x7b1f2b, fg: 0xffe9a8 });
    kit.sign('NEXT: SILENCE (RECORDED)\nAFTER THAT: THE SAME SILENCE, LIVE', 8.95, 2.1, -2.5, -Math.PI / 2, { w: 2.6, h: 0.5, bg: 0x24100f, fg: GOLD });

    // Records: archive shelf, stacks on the floor.
    kit.put('bookshelf', 8.4, -5.4, -Math.PI / 2, { tint: 0x5d4037 });
    kit.sign('ARCHIVE: ONE SONG,\n400 VERSIONS', 8.95, 1.7, -5.4, -Math.PI / 2, { w: 1.6, h: 0.6, bg: 0xf5f0e1, fg: 0x263238 });
    recordStack(kit, 7.9, 2.0, 9);
    recordStack(kit, 7.9, 3.0, 6);
    recordStack(kit, 7.5, 4.0, 11);

    // Orchestra corner: stands, a cello, an accordion on a stool, the piano.
    putIf(kit, 'pl-music-stand', 2.8, 3.2, Math.PI * 0.6);
    putIf(kit, 'pl-music-stand', 4.0, 4.4, Math.PI * 0.75);
    putIf(kit, 'pl-music-stand', 5.2, 3.0, Math.PI * 0.5);
    putIf(kit, 'pl-cello', 3.0, 5.0, Math.PI * 0.8, { solid: false });
    const accStool = kit.put('stool', 2.2, 1.6, 0);
    putIf(kit, 'pl-accordion', 2.2, 1.6, 0.6, { y: topOf(accStool), solid: false, size: 0.5 });
    kit.put('gsr-upright-piano', 6.5, 6.35, Math.PI);
    kit.put('stool', 6.5, 5.3, Math.PI);

    // --- Maestro Ottavio Lento: conducts the foyer, very slowly ------------------------------------------------------------------
    kit.npc({
      id: 'pl-maestro-inside',
      name: 'Maestro Ottavio Lento',
      x: 3.2,
      z: 0.6,
      yaw: -Math.PI / 2,
      look: { hat: 0x15151a, shirt: 0x5a1a26, beard: 0xf5f5f5 },
      line: 'Ah. A listener. Stand. Be still. The next... note... arrives... shortly. Do not... applaud... yet.',
    });
    kit.spot({
      id: 'pl-request-piece',
      x: 3.2,
      z: -1.0,
      prompt: 'Request a piece',
      run() {
        const line = REQUESTS[requestIx % REQUESTS.length];
        requestIx += 1;
        say('Maestro Ottavio Lento', line);
      },
    });
  },
});
