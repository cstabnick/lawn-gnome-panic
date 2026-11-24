// Gnome Theft Auto: the mowing rewards (Issue 1F). The Clippings Crown (head) and the Grass-Catcher Pack (back).
// Ids are a contract with the achievement catalog: do not rename them.
import type { PrefabDef, Part } from '../types';

const CATCHER_GREEN = 0x3f7a3c;

/** A ring of ten thin grass blades standing up and leaning out around a circle of radius r at height y. */
const blades = (r: number, y: number): Part[] => {
  const out: Part[] = [];
  for (let i = 0; i < 10; i++) {
    const a = (i * 36 * Math.PI) / 180;
    const x = r * Math.sin(a);
    const z = r * Math.cos(a);
    out.push({
      s: 'box', d: [0.018, 0.09, 0.008], at: [x, y + 0.045, z],
      rot: [(z / r) * 15, 0, -(x / r) * 15], c: 'grass', name: `blade-${i}`,
    });
  }
  return out;
};

export const GTA_MOWING: PrefabDef[] = [
  // ---- Clippings Crown: a laurel of cut grass and a few petals ------------------------------------------------------
  {
    id: 'clippings-crown', name: 'Clippings Crown', category: 'armor', uses: ['wear-head'],
    tags: ['crown', 'laurel', 'wreath', 'grass', 'clippings', 'mowing', 'petal', 'flower', 'hat', 'gta'], emoji: [],
    about: 'Gnome Theft Auto: the Clippings Crown. A green laurel ring (leaf) lying flat on the hat line, ten thin grass blades (grass) standing up and out, and three petal dots (yellow, pink). Worn on the head, about 0.3 across.',
    examine: [
      'A ring of cut grass blades, woven flat and stuck up at every angle, like a hairstyle that has had a bad week in the lawn.',
      'Saying: the first cut is the one that makes the crown, and the second cut is the one that makes the gnome wear it.',
      'Tip: the blades wilt by teatime. Wet them at the Spigot every morning or they will look like a sad lawn by noon.',
      'Joke: the petals are real. The grass is real too. Only the sense of occasion is made up, and that is the best part.',
      'Someone has tucked a single dandelion clock into the back of it, and it is still there, waiting to be blown away.',
    ],
    parts: [
      { s: 'ring', d: [0.13, 0.03], rot: [90, 0, 0], at: [0, 0.03, 0], c: 'leaf', seg: 10, name: 'laurel' },
      ...blades(0.13, 0.03),
      { s: 'ball', d: [0.02], at: [0.13, 0.07, 0], scale: [1, 0.5, 1], c: 'yellow', seg: 6, name: 'petal-a' },
      { s: 'ball', d: [0.02], at: [-0.065, 0.07, 0.113], scale: [1, 0.5, 1], c: 'pink', seg: 6, name: 'petal-b' },
      { s: 'ball', d: [0.02], at: [-0.065, 0.07, -0.113], scale: [1, 0.5, 1], c: 'yellow', seg: 6, name: 'petal-c' },
    ],
  },

  // ---- Grass-Catcher Pack: a mower's grass bag worn as a backpack ---------------------------------------------------
  {
    id: 'grass-catcher-pack', name: 'Grass-Catcher Pack', category: 'armor', uses: ['wear-back'],
    wear: { at: [0, -0.08, 0], scale: 0.85 },
    tags: ['bag', 'catcher', 'grass', 'clippings', 'backpack', 'pack', 'canvas', 'mowing', 'back', 'gta'], emoji: [],
    tint: CATCHER_GREEN,
    about: 'Gnome Theft Auto: the Grass-Catcher Pack. A boxy canvas bag (the tint) with a rigid iron rim across the top, two leather straps over the shoulders and a heap of clippings (grass, leaf) peeking out of the mouth. Worn on the back like the Spare Tyre Pack.',
    examine: [
      'A boxy canvas bag with a rigid rim across the top, sewn shut at the bottom and open at the top, like a sack that has ambitions.',
      'Saying: a bag full of cuttings will one day sprout, and then you will have a second gnome to carry.',
      'Tip: the clippings are heavier when they are wet. Empty the bag before the rain, or the straps will remember it for a week.',
      'Joke: the bag is green, which the gnomes of Turfton say is to show what it is for. Nobody has yet been brave enough to ask.',
      'Something green has pushed its way out of the top seam and is growing there. Nobody has pulled it out. It seems to like it.',
    ],
    parts: [
      { s: 'box', d: [0.3, 0.26, 0.16], at: [0, 0.13, -0.2], c: 'tint', name: 'body' },
      { s: 'box', d: [0.34, 0.035, 0.2], at: [0, 0.278, -0.2], c: 'iron-dark', name: 'rim' },
      { s: 'box', d: [0.03, 0.3, 0.02], at: [0.1, 0.16, -0.06], c: 'leather-dark', mirror: true, name: 'strap' },
      { s: 'ball', d: [0.09], at: [0, 0.31, -0.2], scale: [1, 0.5, 1], c: 'grass', seg: 6, name: 'heap-a' },
      { s: 'ball', d: [0.06], at: [0.08, 0.32, -0.25], scale: [1, 0.6, 1], c: 'leaf', seg: 6, name: 'heap-b' },
      { s: 'ball', d: [0.05], at: [-0.07, 0.31, -0.14], scale: [1, 0.6, 1], c: 'grass', seg: 6, name: 'heap-c' },
    ],
  },
];
