// Rootwell University's interiors and roofs (E13 issue A14): the Long Shelf library, the Crucible Block lab, Tilth Hall's
// lecture theatre, and the walkable roofs of Plumbob Hall and Tilth Hall. Interiors are defined at import time
// (defineInterior); addCampusRooftops is called while the world is built (before buildRooftops).
import type * as THREE from 'three';
import { getPrefab } from '@lawn/prefabs';
import { defineInterior } from '../interiors/registry';
import { addRooftop, enterInterior, rooftopById } from '../interiors';
import type { InteriorKit, InteriorTheme } from '../interiors/types';
import { addInteractSpot } from '../interactables';
import { heightAt } from '../terrain';
import { CAMPUS_BUILDINGS, ROOTWELL_ROOMS } from './types';

const PI = Math.PI;

/** Warm wood and green-shaded lamps. */
const LIBRARY_THEME: InteriorTheme = { floor: 0x6d4a2e, wall: 0xcdb48a, trim: 0x2f5a3c, ceiling: 0xe8dcc0, light: 0xd8f0c0 };
/** White tiles, black benches. */
const LAB_THEME: InteriorTheme = { floor: 0xe6eaec, wall: 0xf3f6f7, trim: 0x2b2f33, ceiling: 0xf7f9fa, light: 0xf2fbff };
/** Stone and oak. */
const LECTURE_THEME: InteriorTheme = { floor: 0x8a6a45, wall: 0x9b958a, trim: 0x5b3d22, ceiling: 0xb4aea2, light: 0xffe6b8 };

function building(id: string) {
  const b = CAMPUS_BUILDINGS.find((c) => c.id === id);
  if (!b) throw new Error(`campus building ${id} missing`);
  return b;
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

/** A cycling set of lines. */
function rotator(lines: readonly string[]): () => string {
  let i = 0;
  return () => lines[i++ % lines.length];
}

// ---------------------------------------------------------------------------------------------------------------
// The Long Shelf
// ---------------------------------------------------------------------------------------------------------------

const LIB = ROOTWELL_ROOMS['uni-library'];
const nextLibrarian = rotator([
  'Shh. That was the quiet part.',
  'Overdue? Everything here is overdue. The building is overdue.',
  'The ants may borrow anything. They return it in sugar.',
  'Fines are paid in silence. You owe me four minutes.',
]);

defineInterior({
  id: 'uni-library',
  name: 'The Long Shelf',
  door: building('long-shelf').door,
  exit: building('long-shelf').door,
  size: LIB.size,
  theme: LIBRARY_THEME,
  build(kit) {
    kit.room();
    kit.door(LIB.door[0], LIB.door[1], PI);
    kit.sign('SILENCE\n(EXCEPT THE ANTS)', 4, 2.4, 7.95, PI, { w: 2.6, h: 0.9, bg: 0xf5f0e1, fg: 0x2f5a3c });

    // The long shelf: one run of bookshelves along the whole north wall.
    for (let x = -11.4; x <= 11.5; x += 1.2) kit.put('bookshelf', x, -7.7, 0, { tint: 0x9c7a55 });
    kit.sign('THE LONG SHELF\nEST. BEFORE THE ALPHABET', 0, 3.6, -7.95, 0, { w: 4, h: 0.9, bg: 0x2f5a3c, fg: 0xf5e6b8 });
    kit.put('library-ladder', 5, -7.1, 0);
    putIf(kit, 'book-pile', 5.9, -6.4, 0.5, { solid: false, size: 0.5 });

    // The librarian's desk behind her post (the quest spot stays clear).
    kit.put('reception-desk', 0, -5.9, 0);
    kit.put('lamp', -1.6, -5.9, 0, { y: 0.95, solid: false, tint: 0x6aa86f });
    kit.npc({
      id: 'uni-librarian', name: 'The Librarian', x: LIB.librarian[0], z: LIB.librarian[1], yaw: 0,
      look: { hat: 0x2f5a3c, shirt: 0x6b4a8a, beard: 0xe0e0e0 },
      line: 'Shh. That was the quiet part.',
    });
    kit.spot({ id: 'uni-librarian-ask', x: 1.6, z: -4, prompt: 'Ask the Librarian', run: () => say('The Librarian', nextLibrarian()) });

    // Reading tables with piles of books and green-shaded lamps. The essay desk (7, 3) stays clear, lamp beside it.
    const tables: [number, number][] = [[-7, -1], [-7, 3.2], [-3, 3.2], [-3, -1], [3, 0.5]];
    tables.forEach(([x, z], i) => {
      kit.put('office-desk', x, z, 0);
      putIf(kit, 'book-pile', x - 0.5, z, i, { y: 0.74, solid: false, size: 0.45 });
      kit.put('lamp', x + 0.6, z - 0.2, 0, { y: 0.74, solid: false, tint: 0x6aa86f });
    });
    kit.put('lamp', LIB.essayDesk[0] + 1.5, LIB.essayDesk[1], 0, { solid: false, tint: 0x6aa86f });

    // Vignette: the returns crate, overflowing, and a corner reserved for the landlords.
    kit.put('crate', -10.4, 6.2, 0.2);
    putIf(kit, 'book-pile', -10.4, 6.2, 0.4, { y: 0.6, solid: false, size: 0.5 });
    kit.sign('RETURNS\n(SINCE 1903)', -10.4, 1.7, 7.95, PI, { w: 1.8, h: 0.7, bg: 0xf5f0e1, fg: 0x5d4037 });
    kit.put('bench', 10.4, -3, -PI / 2);
    kit.sign('RESERVED\nFOR LANDLORDS', 11.95, 1.3, -3, -PI / 2, { w: 1.6, h: 0.6, bg: 0xf5f0e1, fg: 0x263238 });
    kit.put('pendant-lamp', -5, 1, 0, { y: 5.0, solid: false });
    kit.put('pendant-lamp', 5, 1, 0, { y: 5.0, solid: false });
    kit.window(-11.95, 1, PI / 2);
    kit.window(11.95, 4, -PI / 2);
  },
});

// ---------------------------------------------------------------------------------------------------------------
// The Crucible Block
// ---------------------------------------------------------------------------------------------------------------

const LAB = ROOTWELL_ROOMS['uni-lab'];

defineInterior({
  id: 'uni-lab',
  name: 'the Crucible Block',
  door: building('crucible-block').door,
  exit: building('crucible-block').door,
  size: LAB.size,
  theme: LAB_THEME,
  build(kit) {
    kit.room();
    kit.door(LAB.door[0], LAB.door[1], PI);

    // Benches in rows with flasks (the student's bench spot stays clear).
    const benches: [number, number][] = [[-2.5, -4.5], [2.5, -4.5], [7, -4.5], [-2.5, 1.8], [2.5, 1.8], [7, 1.8], [-7.5, 3]];
    for (const [x, z] of benches) {
      putIf(kit, 'lab-bench', x, z, 0, { size: 2.4 });
      if (getPrefab('honeydew-flask')) {
        kit.put('honeydew-flask', x - 0.6, z, 0, { y: 0.9, solid: false, size: 0.3 });
        kit.put('honeydew-flask', x + 0.5, z + 0.1, 1, { y: 0.9, solid: false, size: 0.3 });
      }
    }
    // Vignette: the scorched patch on the ceiling over the student's bench, and the soot-marked tiles under it.
    kit.block(3.2, 0.08, 3.2, LAB.bench[0], LAB.bench[1], { y: LAB.size.h - 0.12, color: 0x1c1816, solid: false });
    kit.block(2.6, 0.01, 2.6, LAB.bench[0] + 1.6, LAB.bench[1] + 0.2, { y: 0.015, color: 0x4a4440, solid: false });
    kit.npc({
      id: 'uni-chem-student', name: 'A Chemistry Student', x: LAB.bench[0], z: LAB.bench[1], yaw: PI / 2,
      look: { hat: 0xe0e0e0, shirt: 0xffffff, beard: 0x8d6e63 },
      line: 'It was supposed to go up. It went sideways. Sideways is still a result.',
    });

    // The board.
    putIf(kit, 'chalk-equation-board', 6, -6.85, 0, { size: 4, solid: false });
    kit.sign('GRAVITY:\nPROVISIONAL', 6, 3.9, -6.95, 0, { w: 2.4, h: 0.8, bg: 0x2b2f33, fg: 0xf5f0e1 });
    kit.sign('NO EXPERIMENTS BEFORE LUNCH\n(ANY EXPERIMENT IS BEFORE LUNCH)', -6, 3, -6.95, 0, { w: 3.2, h: 0.8, bg: 0xf5f0e1, fg: 0x263238 });
    kit.window(-9.95, 0, PI / 2);
    kit.window(9.95, 0, -PI / 2);
    kit.put('pendant-lamp', -3, 0, 0, { y: 4.1, solid: false });
    kit.put('pendant-lamp', 4, 0, 0, { y: 4.1, solid: false });
  },
});

// ---------------------------------------------------------------------------------------------------------------
// Tilth Hall's lecture theatre
// ---------------------------------------------------------------------------------------------------------------

const LEC = ROOTWELL_ROOMS['uni-lecture'];
const nextProfessor = rotator([
  'The physics of gnomes: why we fall over, and how to do it better.',
  'Note the centre of gravity. It is, regrettably, in the hat.',
  'Falling is merely landing with enthusiasm. Write that down.',
  'Who said "ouch"? Ouch is not on the syllabus. It will be.',
]);

defineInterior({
  id: 'uni-lecture',
  name: 'Tilth Hall',
  door: building('tilth-hall').door,
  exit: building('tilth-hall').door,
  size: LEC.size,
  theme: LECTURE_THEME,
  build(kit) {
    kit.room();
    kit.door(LEC.door[0], LEC.door[1], PI);

    // Tiers (daises) rising toward the door end, with a gap between each so no faces are shared; rows sit on them.
    const tiers: [number, number][] = [[-1, 0.35], [1.6, 0.7], [4.2, 1.05]];
    for (const [z, h] of tiers) {
      kit.block(20, h, 2.4, 0, z, { color: 0x7a5230 });
      putIf(kit, 'lecture-bench-row', 0, z, PI, { y: h, solid: false, size: 18 });
    }

    // The front: lectern, big board behind it, the professor mid-lecture.
    kit.put('lectern', LEC.lectern[0], LEC.lectern[1], 0);
    putIf(kit, 'chalk-equation-board', 0, -8.8, 0, { size: 9, solid: false });
    kit.sign('THE PHYSICS OF GNOMES:\nWHY WE FALL OVER\nAND HOW TO DO IT BETTER', 0, 5.6, -8.95, 0, { w: 5.4, h: 1.3, bg: 0x2b2f33, fg: 0xf5f0e1 });
    kit.npc({
      id: 'uni-professor', name: 'Dr Clod Furrow', x: 1.5, z: LEC.lectern[1], yaw: 0,
      look: { hat: 0x37474f, shirt: 0x8d6e63, beard: 0xcfcfcf },
      line: 'The physics of gnomes: why we fall over, and how to do it better. Please sit. Sitting is the first step.',
    });
    kit.spot({ id: 'uni-professor-listen', x: 1.5, z: -4.7, prompt: 'Listen to the lecture', run: () => say('Dr Clod Furrow', nextProfessor()) });
    // Vignette: a student asleep over the notes is a stack of books on the back row bench.
    putIf(kit, 'book-pile', 7, 4.2, 0.3, { y: 1.05 + 0.5, solid: false, size: 0.5 });
    kit.sign('LECTURE RECORDING:\nTHE PROFESSOR, ON REPEAT', -7, 2.4, 8.95, PI, { w: 2.8, h: 0.8, bg: 0xf5f0e1, fg: 0x263238 });

    // The roof stairs, west end of the board wall.
    kit.stairsTo(LEC.roofStairs[0], LEC.roofStairs[1], { x: 1121, y: heightAt(1110, -112) + 11, z: -107, yaw: PI }, 'Up to the roof');
    kit.sign('ROOF\n(MIND THE WIND)', -10, 2.2, -8.95, 0, { w: 1.6, h: 0.6, bg: 0xf5f0e1, fg: 0x263238 });

    kit.window(-11.95, 2, PI / 2);
    kit.window(11.95, 2, -PI / 2);
    kit.put('pendant-lamp', -5, 0, 0, { y: 6, solid: false });
    kit.put('pendant-lamp', 5, 0, 0, { y: 6, solid: false });
  },
});

// ---------------------------------------------------------------------------------------------------------------
// Roofs
// ---------------------------------------------------------------------------------------------------------------

/** Register the walkable roofs of Plumbob Hall and Tilth Hall (addRooftop). */
export function addCampusRooftops(): void {
  // The world can be built more than once (tests, the quest sim): register the roofs and the spot only once.
  if (rooftopById('plumbob-roof')) return;
  const plumbobY = heightAt(1180, -292) + 10;
  addRooftop({
    id: 'plumbob-roof', name: 'Plumbob Hall roof',
    minX: 1166, maxX: 1194, minZ: -304, maxZ: -280, y: plumbobY,
    solid: true, parapet: false, pad: { x: 1180, z: -292, r: 5 },
  });
  const tilthY = heightAt(1110, -112) + 11;
  addRooftop({
    id: 'tilth-roof', name: 'Tilth Hall roof',
    minX: 1092, maxX: 1128, minZ: -124, maxZ: -100, y: tilthY,
    solid: true, parapet: false,
  });
  // The way back down, beside the stair hut.
  addInteractSpot({
    x: 1121, z: -107, y: tilthY, prompt: 'Go back down',
    run: () => { enterInterior('uni-lecture'); return true; },
  });
}
