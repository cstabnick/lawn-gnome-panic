// Inside the Anthill Observatory (E13 issue A15b): a dome room, Professor Sextant's desk and the great brass telescope.
// Defines the interior at import time. Looking through the telescope fires TELESCOPE_EVENT ("Level with the Stars" at night).
import type * as THREE from 'three';
import { getPrefab } from '@lawn/prefabs';
import { defineInterior } from '../interiors/registry';
import type { InteriorKit, InteriorTheme } from '../interiors/types';
import { OBSERVATORY, ROOTWELL_ROOMS, TELESCOPE_EVENT } from './types';

const ROOM = ROOTWELL_ROOMS['anthill-observatory'];
const NIGHT_LABELS = ['Dusk', 'Neon Night', 'Dawn'];

/** Night blue walls, brass trim, dark wood floor, pale ceiling. */
const THEME: InteriorTheme = { floor: 0x3b2a1e, wall: 0x1e2740, trim: 0xc9a227, ceiling: 0xdfe6f2, light: 0xb8c8ff };

let clock: () => string | null = () => null;

/** Lets the telescope know the sky's time (installObservatory passes deps.timeLabel). */
export function setTelescopeClock(c: () => string | null): void {
  clock = c;
}

/** Prefabs added by another worker this epic: skipped (not thrown) while missing. */
function putIf(kit: InteriorKit, id: string, x: number, z: number, yaw = 0, opts?: Parameters<InteriorKit['put']>[4]): THREE.Object3D | null {
  if (!getPrefab(id)) return null;
  return kit.put(id, x, z, yaw, opts);
}

function say(name: string, line: string): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('gta:interior-say', { detail: { name, line } }));
  }
}

const NIGHT_LINES = [
  'Stars. Every one of them exactly where Professor Sextant said. She is unbearable about it.',
  'A perfectly level line of stars. Somebody at the HOA has drawn a ruler on the glass.',
  'The sky is very large tonight, and the lawn below it very flat. That is the trouble.',
  'You count the stars. The telescope counts them too, gets a different number, and sulks.',
];
const DAY_LINES = [
  'The sky, blue, and an ant on the lens. The ant looks back.',
  "Daytime. The telescope shows you the Dean's lodge, very large, and the Dean, pretending not to see it.",
  'Nothing but daylight. Professor Sextant says the stars are still up there. She says it often.',
  'A cloud, pointedly not level. You feel the professor would object.',
];
let nightLine = 0;
let dayLine = 0;

/** Look through the eyepiece: fire the achievement event and say a line (rotating, by day or night). */
function lookThrough(): void {
  const night = NIGHT_LABELS.includes(clock() ?? '');
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(TELESCOPE_EVENT, { detail: { night } }));
  }
  const line = night ? NIGHT_LINES[nightLine++ % NIGHT_LINES.length] : DAY_LINES[dayLine++ % DAY_LINES.length];
  say('The Telescope', line);
}

defineInterior({
  id: 'anthill-observatory',
  name: 'The Anthill Observatory',
  door: OBSERVATORY.door,
  exit: OBSERVATORY.door,
  size: ROOM.size,
  theme: THEME,
  build(kit) {
    kit.room();
    kit.door(ROOM.door[0], ROOM.door[1], Math.PI);

    // Eight buttresses round the walls (0.05 m off them) make the square room feel round.
    const e = 8.95 - 1.2; // centre of a 2.4 m corner pier
    const m = 8.95 - 0.5; // centre of a 1 m deep wall pier
    const piers: [number, number, number, number][] = [
      [2.4, 2.4, -e, -e], [2.4, 2.4, e, -e], [2.4, 2.4, -e, e], [2.4, 2.4, e, e],
      [1.2, 1, 0, -m], [1, 1.2, m, 0], [1, 1.2, -m, 0], [1.2, 1, 6, m],
    ];
    for (const [w, d, x, z] of piers) kit.block(w, ROOM.size.h - 0.1, d, x, z, { color: 0x2b3659 });

    // The painted star map: small pale glow blocks just under the ceiling.
    for (let i = 0; i < 18; i++) {
      const a = i * 2.399963; // golden angle spreads them
      const r = 1 + ((i * 0.43) % 6.5);
      kit.block(0.18, 0.04, 0.18, Math.cos(a) * r, Math.sin(a) * r, { y: ROOM.size.h - 0.1, color: 0xfff6d0, emissive: 0xfff6d0, solid: false });
    }

    // The great telescope, tube up toward +z, eyepiece at the low -z end.
    putIf(kit, 'anthill-telescope', ROOM.telescope[0], ROOM.telescope[1], 0);
    kit.spot({
      id: 'telescope-eyepiece',
      x: ROOM.telescope[0],
      z: ROOM.telescope[1] - 1.6,
      prompt: 'Look through the telescope',
      run: lookThrough,
    });

    // Sextant's desk, and the note that says she is out.
    const [dx, dz] = ROOM.desk;
    kit.put('office-desk', dx, dz, 0);
    kit.put('lamp', dx - 0.5, dz, 0, { y: 0.75, solid: false });
    putIf(kit, 'book-pile', dx + 0.5, dz, 0.4, { y: 0.75, solid: false });
    putIf(kit, 'essay-page', dx + 0.1, dz + 0.1, 0.2, { y: 0.77, solid: false });
    putIf(kit, 'essay-page', dx - 0.1, dz - 0.1, -0.5, { y: 0.77, solid: false });
    kit.sign('BACK AT DUSK\n— B.S.', dx, 1.5, 8.93, Math.PI, { w: 1.3, h: 0.5, bg: 0xf5f0e1, fg: 0x263238 });

    // Chalk board, books and the sugar receipts.
    putIf(kit, 'chalk-equation-board', 4, -8.6, 0);
    kit.sign('LEVEL LINE\nSTAR A + STAR B\n= A STRAIGHT LINE\n(DO NOT GIVE TO HOA)', 4, 1.7, -8.3, 0, { w: 2.2, h: 1.1, bg: 0x1f2a24, fg: 0xf2f2e6 });
    kit.put('bookshelf', -8.4, -4, Math.PI / 2);
    kit.put('filing-cabinet', -8.4, 1.8, Math.PI / 2);
    kit.sign('SUGAR RECEIPTS (FEW)', -8.2, 1.3, 1.8, Math.PI / 2, { w: 0.9, h: 0.25, bg: 0xf5f0e1, fg: 0x5d4037 });
  },
});
