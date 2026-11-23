// Gnome Theft Auto: story set props for the cutscene direction pass (Bodega & Sons' cat, Tansy's wrench wall and the
// cigar box that keeps the forty-eighth wrench). Used by the story scenes in games/gnome-theft-auto/src/cutscene/scenes/story/.
import type { PrefabDef } from '../types';

const TABBY = 0x6f6a64;
const TABBY_DARK = 0x45413d;
const CAP_RED = 0xd8342c;
const PEGBOARD = 0xb48a5a;

export const GTA_STORY_PROPS: readonly PrefabDef[] = [
  {
    id: 'asphalt-cat', name: 'Asphalt the Cat', category: 'prop', uses: ['place'],
    tags: ['cat', 'tabby', 'asphalt', 'bodega', 'bottle', 'plate', 'grey', 'critter'], emoji: ['🐈'],
    about: 'Gnome Theft Auto: Asphalt, the grey clay-dust tabby of Bodega & Sons, sitting upright, a red crimped plate (a bottlecap) by her front paw. Faces +z.',
    examine: [
      'A grey tabby, sitting very upright, with dark stripes like tyre marks and one ear folded half down.',
      'Shopkeepers say: when the cat leaves the counter, leave the street.',
      'She bats the red plate when all is well. Watch the plate, not the news.',
      'She has outlived three owners of the corner, and not one of them ever owned her.',
      'The red plate has a crimped edge and a dent the exact shape of a claw.',
    ],
    parts: [
      { s: 'ball', d: [0.13], at: [0, 0.12, -0.02], scale: [1, 0.95, 1.25], c: TABBY, seg: 10 },          // haunches
      { s: 'ball', d: [0.09], at: [0, 0.24, 0.05], scale: [0.9, 1.2, 0.9], c: TABBY, seg: 10 },          // chest
      { s: 'ball', d: [0.075], at: [0, 0.37, 0.07], c: TABBY, seg: 10 },                                // head
      { s: 'cone', d: [0.03, 0.06], at: [0.045, 0.44, 0.06], c: TABBY_DARK, seg: 4, mirror: true },      // ears
      { s: 'ball', d: [0.012], at: [0.028, 0.38, 0.135], c: 0xd9c24a, glow: true, seg: 6, mirror: true }, // eyes
      { s: 'box', d: [0.15, 0.018, 0.02], at: [0, 0.31, 0.12], c: TABBY_DARK },                          // a stripe
      { s: 'box', d: [0.2, 0.02, 0.2], at: [0, 0.16, -0.02], c: TABBY_DARK },                            // a back stripe
      { s: 'pill', d: [0.022, 0.08], at: [0.035, 0.05, 0.1], c: TABBY, seg: 6, mirror: true },          // front legs
      { s: 'pill', d: [0.02, 0.2], at: [0.12, 0.025, -0.05], rot: [90, 30, 0], c: TABBY_DARK, seg: 6 },  // tail round the feet
      { s: 'cyl', d: [0.045, 0.045, 0.018], at: [0.1, 0.009, 0.16], c: CAP_RED, seg: 12 },              // the bottlecap
    ],
  },
  {
    id: 'cigar-box', name: 'Cigar Box', category: 'prop', uses: ['place', 'open'],
    tags: ['cigar', 'box', 'tin', 'keepsake', 'tansy', 'wrench', 'brass', 'secret'], emoji: [],
    about: 'Gnome Theft Auto: Tansy Clayfoot\'s cigar box, a flat lidded wooden box with a brass clasp and a faded paper label; the forty-eighth wrench lives in it.',
    examine: [
      'A flat wooden box with a brass clasp, the paper label worn to a ghost of red and gold.',
      'Old saying: what is kept in a box is kept from someone.',
      'It does not rattle when you shake it. Something inside is packed in a rag.',
      'It smells of cedar and polish, which is a strange thing for a box of nothing to smell of.',
      'The clasp is bright where a thumb opens it, and dull everywhere else.',
    ],
    parts: [
      { s: 'box', d: [0.3, 0.07, 0.2], at: [0, 0.035, 0], c: 'wood-dark' },     // the box
      { s: 'box', d: [0.31, 0.02, 0.21], at: [0, 0.08, 0], c: 'wood' },         // the lid
      { s: 'box', d: [0.16, 0.003, 0.09], at: [0, 0.092, 0], c: 0xc8352f },     // the label
      { s: 'box', d: [0.1, 0.0035, 0.04], at: [0, 0.094, 0], c: 'gold' },       // label band
      { s: 'box', d: [0.03, 0.03, 0.01], at: [0, 0.06, 0.105], c: 'brass' },    // clasp
    ],
  },
  {
    id: 'wrench-rack', name: 'Wrench Wall', category: 'furniture', uses: ['place'],
    tags: ['wrench', 'spanner', 'rack', 'pegboard', 'tools', 'wall', 'workshop', 'tansy'], emoji: [],
    about: 'Gnome Theft Auto: Tansy\'s wrench wall, a pegboard on two legs with a row of wrenches hung in size order and one empty peg at the end. Faces +z.',
    examine: [
      'A pegboard of wrenches hung smallest to largest, every one in its painted outline, and one peg with no outline at all.',
      'Workshop rule: a tool off the wall is a tool on loan.',
      'Count them if you like. Its owner already has, this morning.',
      'The last peg is polished as if something heavy hangs there often, and is never there long.',
      'The painted outlines are older than the paint on the bay door.',
    ],
    parts: [
      { s: 'box', d: [1.2, 0.7, 0.04], at: [0, 0.75, 0], c: PEGBOARD },                         // the board
      { s: 'box', d: [0.05, 0.4, 0.05], at: [0.55, 0.2, 0], c: 'wood-dark', mirror: true },      // legs
      { s: 'box', d: [1.22, 0.04, 0.06], at: [0, 1.11, 0], c: 'wood-dark' },                     // top rail
      { s: 'box', d: [0.02, 0.14, 0.015], at: [-0.5, 0.9, 0.03], c: 'iron' },                    // wrenches, small to large
      { s: 'box', d: [0.022, 0.17, 0.015], at: [-0.4, 0.88, 0.03], c: 'iron' },
      { s: 'box', d: [0.024, 0.2, 0.015], at: [-0.29, 0.87, 0.03], c: 'iron' },
      { s: 'box', d: [0.026, 0.23, 0.015], at: [-0.17, 0.85, 0.03], c: 'iron' },
      { s: 'box', d: [0.028, 0.26, 0.015], at: [-0.04, 0.84, 0.03], c: 'iron' },
      { s: 'box', d: [0.03, 0.29, 0.015], at: [0.1, 0.82, 0.03], c: 'iron' },
      { s: 'box', d: [0.032, 0.32, 0.015], at: [0.25, 0.81, 0.03], c: 'iron' },
      { s: 'box', d: [0.034, 0.35, 0.015], at: [0.4, 0.79, 0.03], c: 'iron-dark' },
      { s: 'cyl', d: [0.012, 0.012, 0.05], at: [0.52, 0.98, 0.03], rot: [90, 0, 0], c: 'brass', seg: 6 }, // the empty peg
    ],
  },
];
