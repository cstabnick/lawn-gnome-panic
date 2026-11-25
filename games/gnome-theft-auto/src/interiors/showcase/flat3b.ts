// Flat 3B, Saucer Court (E05 showcase interior, rebuilt by E10): the player's loaned flat. E10 builds it from the player's
// saved layout (home/layout.ts): every placed piece, the chosen wall and floor colours, a "Sleep" spot on each bed and a
// "Decorate" spot. The bank's letters, signs and the neighbour through the wall stay as fixed dressing. Locked until the
// loan is signed (ownership.ts). The door is on the Saucer Court stairwell (homes/types.ts SAUCER_COURT).
import * as THREE from 'three';
import { defineInterior, INTERIOR_THEMES } from '../registry';
import type { InteriorKit, InteriorTheme } from '../types';
import { FLAT_ID, FLOOR_COLOURS, WALL_COLOURS } from '../../home/types';
import { clearPieceObjects, homeHooks, loadLayout, placedCount, registerPieceObject, stockOf } from '../../home/layout';
import { SAUCER_COURT } from '../../homes/types';
import { ownsProperty } from '../../ownership';

export const FLAT_3B_INTERIOR = FLAT_ID;

/**
 * Free floor spots E10 may fill with furniture (local coordinates, metres from the room centre). Kept for other code;
 * the furniture itself now comes from the player's layout.
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

/** The colour of a wall or floor finish by id, or the flat's default when the id is unknown. */
function finishColour(list: readonly { id: string; color: number }[], id: string, fallback: number): number {
  return list.find((c) => c.id === id)?.color ?? fallback;
}

defineInterior({
  id: FLAT_3B_INTERIOR,
  name: 'Flat 3B, Saucer Court',
  prompt: 'Enter Flat 3B',
  door: { ...SAUCER_COURT.stairDoor },
  exit: { ...SAUCER_COURT.exit },
  size: { w: 12, d: 10, h: 3 },
  theme: 'flat',
  ambience: 'city',
  locked: () => (ownsProperty(FLAT_ID) ? null : 'Flat 3B is locked. The First Kiln Bank has the keys.'),
  build(kit: InteriorKit) {
    clearPieceObjects();
    const l = loadLayout();

    const theme: InteriorTheme = {
      ...INTERIOR_THEMES.flat,
      wall: finishColour(WALL_COLOURS, l.wall, INTERIOR_THEMES.flat.wall),
      floor: finishColour(FLOOR_COLOURS, l.floor, INTERIOR_THEMES.flat.floor),
    };
    kit.room({ theme });
    kit.door(0, 4.8, Math.PI);

    // Two windows on the north wall (0.05 m in front of it).
    kit.window(-3, -4.95, 0, 1.6, 1.2, 1.0);
    kit.window(3, -4.95, 0, 1.6, 1.2, 1.0);

    // The player's furniture. Wall pieces hang at their wall height; rugs and wall pieces do not block.
    for (const it of l.items) {
      const s = stockOf(it.prefab);
      const obj = kit.put(it.prefab, it.x, it.z, it.yaw, {
        solid: !(s?.flat || s?.wall),
        y: s?.wall ? (s.wallY ?? 0) : undefined,
      });
      registerPieceObject(it.uid, obj);
      if (s?.sleep) {
        kit.spot({ id: 'sleep-' + it.uid, x: it.x, z: it.z, prompt: 'Sleep (saves the game)', run: () => homeHooks()?.sleep() });
      }
    }
    kit.spot({ id: 'decorate', x: 2.2, z: 4.1, prompt: 'Decorate the flat', run: () => homeHooks()?.decorate() });

    // Fixed dressing that always stays: the bank's notice, the price sticky note, post piling up by the door.
    kit.sign('PROPERTY OF THE FIRST KILN BANK.\nPLEASE DO NOT ENJOY THE WALLS.', -5.95, 1.6, 0, Math.PI / 2, {
      w: 2.2, h: 0.6, bg: 0xf5f0e1, fg: 0x263238,
    });
    kit.sign('FLAT 3B: 1,500 ACORNS\n(PLUS FEELINGS)', 5.95, 1.5, -1, -Math.PI / 2, {
      w: 1.0, h: 0.45, bg: 0xfff176, fg: 0x263238,
    });
    kit.sign('LOAN REPAYMENT DUE:\nEVERY DAY', 5.95, 1.9, 2.5, -Math.PI / 2, {
      w: 0.7, h: 0.5, bg: 0xffee58, fg: 0x263238,
    });
    kit.put('sealed-letter', -0.6, 3.9, 0.5, { solid: false });
    kit.put('sealed-letter', 0.4, 4.1, 0.5, { solid: false });
    kit.put('sealed-letter', -1.3, 4.3, 0.5, { solid: false });

    // A vignette without text: Hyssop's welcome plant, left on a parcel by the window and never watered.
    const parcel = kit.put('parcel-box', 4.9, -4.2, 0, { solid: false });
    kit.put('plant', 4.9, -4.2, 0, { y: topOf(parcel, 0.4), solid: false });

    // Moving day: boxes by the east wall, until the player has placed six pieces ("not unpacked yet").
    if (placedCount(l) < 6) {
      const boxLow = kit.put('crate', 4.6, 2.8, 0);
      kit.put('crate', 4.6, 1.6, 0);
      kit.put('crate', 4.6, 2.8, 0, { y: topOf(boxLow, 0.6), solid: false });
      kit.put('parcel-box', 3.6, 3.4, 0.4, { solid: false });
    }

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
