// Gnome Theft Auto: the odd rides (slow, impractical garden-scale traffic vehicles) and the Sunday Driver cap (Issue 1E).
// Ids, seats and wheel pivots are a contract with the game's config: do not rename them.
import type { PrefabDef, Part } from '../types';

const TYRE = 0x222222;
const SMOKE = 0x77716b;
const DENT = 0x3b3b3b;
const CLAY_POT = 0xc2643a;
const ROLLER_GREEN = 0x2f6b3a;
const CUP_WHITE = 0xf3efe6;
const BARROW_BLUE = 0x3f7fbf;
const TWEED = 0x8a7a5c;

/** A grey smoke column of three puffs starting at (x, y, z). */
const smoke = (x: number, y: number, z: number, s = 1): Part[] => [
  { s: 'ball', d: [0.09 * s], at: [x, y, z], c: SMOKE, alpha: 0.6, seg: 6 },
  { s: 'ball', d: [0.12 * s], at: [x + 0.03 * s, y + 0.16 * s, z - 0.02 * s], c: SMOKE, alpha: 0.45, seg: 6 },
  { s: 'ball', d: [0.15 * s], at: [x - 0.02 * s, y + 0.34 * s, z + 0.03 * s], c: SMOKE, alpha: 0.3, seg: 6 },
];

export const GTA_ODD_RIDES: readonly PrefabDef[] = [
  // ---- Pot Rod: a terracotta flowerpot hot rod -----------------------------------------------------------------------
  {
    id: 'gta-pot-rod', name: 'Pot Rod', category: 'prop', uses: ['place', 'sit'],
    tags: ['pot', 'rod', 'flowerpot', 'terracotta', 'hot', 'flame', 'vehicle', 'seat', 'ride', 'gta'], emoji: [],
    tint: 0xf2a12e,
    seat: [0, 0.26, -0.05],
    pivots: {
      'wheel-0': [-0.33, 0.1, -0.35], 'wheel-1': [0.33, 0.1, -0.35],
      'wheel-2': [-0.33, 0.1, 0.35], 'wheel-3': [0.33, 0.1, 0.35],
      steer: [0, 0.47, 0.3],
    },
    about: 'Gnome Theft Auto: the Pot Rod. A terracotta flowerpot on a plank chassis with four small wheels, painted flame stripes (the tint), a rear exhaust, and a steering wheel (steer). Nose +z.',
    examine: [
      'A terracotta flowerpot bolted to a plank, with flame stripes painted on in a hurry and a small pipe out the back.',
      'Saying: a pot that is painted with flames will go like the Kiln, which is to say very hot and not very far.',
      'Tip: the flames are for looks only. The pot is slower than a sulky snail, so keep the handbrake on for the flames.',
      'Joke: Razor-Back sold the stripes as a speed upgrade, and the receipt says so in very small letters.',
      'The exhaust pops whenever the driver sneezes, which happens often inside a pot full of clay dust.',
    ],
    parts: [
      { s: 'box', d: [0.62, 0.05, 1.0], at: [0, 0.2, 0], c: 'wood', name: 'chassis' },
      { s: 'cyl', d: [0.36, 0.28, 0.36], at: [0, 0.405, -0.1], c: CLAY_POT, seg: 10, name: 'pot' },
      { s: 'ring', d: [0.36, 0.025], rot: [90, 0, 0], at: [0, 0.585, -0.1], c: 'clay-dark', seg: 10, name: 'lip' },
      { s: 'box', d: [0.1, 0.28, 0.03], rot: [0, 0, 8], at: [0, 0.4, 0.22], c: 'tint', name: 'flame-a' },
      { s: 'box', d: [0.06, 0.22, 0.03], rot: [0, 0, -12], at: [0.2, 0.42, 0.16], c: 'tint', name: 'flame-b' },
      { s: 'box', d: [0.06, 0.22, 0.03], rot: [0, 0, 12], at: [-0.2, 0.42, 0.16], c: 'tint', name: 'flame-c' },
      { s: 'box', d: [0.06, 0.2, 0.03], at: [0, 0.4, -0.42], c: 'tint', name: 'flame-d' },
      { s: 'cyl', d: [0.03, 0.03, 0.1], rot: [90, 0, 0], at: [0.2, 0.2, -0.54], c: 'steel', seg: 8, name: 'exhaust' },
      { s: 'cyl', d: [0.1, 0.1, 0.07], rot: [0, 0, 90], at: [-0.33, 0.1, -0.35], c: TYRE, seg: 10, group: 'wheel-0' },
      { s: 'cyl', d: [0.1, 0.1, 0.07], rot: [0, 0, 90], at: [0.33, 0.1, -0.35], c: TYRE, seg: 10, group: 'wheel-1' },
      { s: 'cyl', d: [0.1, 0.1, 0.07], rot: [0, 0, 90], at: [-0.33, 0.1, 0.35], c: TYRE, seg: 10, group: 'wheel-2' },
      { s: 'cyl', d: [0.1, 0.1, 0.07], rot: [0, 0, 90], at: [0.33, 0.1, 0.35], c: TYRE, seg: 10, group: 'wheel-3' },
      { s: 'cyl', d: [0.015, 0.015, 0.26], rot: [0, 0, 0], at: [0, 0.34, 0.3], c: 'steel', seg: 6, group: 'steer' },
      { s: 'ring', d: [0.09, 0.015], rot: [-30, 0, 0], at: [0, 0.47, 0.3], c: 'black', seg: 10, group: 'steer' },
    ],
    damage: [
      {
        name: 'dented', darken: 0.25,
        morph: { 'flame-a': { rot: [0, 0, 6] } },
        add: [{ s: 'box', d: [0.14, 0.03, 0.04], at: [0.1, 0.5, 0.225], c: DENT }],
      },
      {
        name: 'wrecked', darken: 0.6, sink: 0.04,
        hide: ['wheel-1'],
        morph: { pot: { rot: [0, 0, 6] }, steer: { rot: [0, 0, 22] }, exhaust: { rot: [0, 0, 30] } },
        add: [...smoke(0, 0.75, -0.4, 1)],
      },
    ],
  },

  // ---- Lawn Roller: a garden roller turned into a little steamroller ------------------------------------------------
  {
    id: 'gta-lawn-roller', name: 'Lawn Roller', category: 'prop', uses: ['place', 'sit'],
    tags: ['lawn', 'roller', 'steamroller', 'drum', 'steam', 'iron', 'vehicle', 'seat', 'ride', 'gta'], emoji: [],
    tint: ROLLER_GREEN,
    seat: [0, 0.47, -0.3],
    pivots: {
      'wheel-0': [-0.32, 0.12, -0.4], 'wheel-1': [0.32, 0.12, -0.4],
      'wheel-2': [0, 0.28, 0.42],
      steer: [0, 0.4, -0.2],
    },
    about: 'Gnome Theft Auto: the Lawn Roller. A steel drum at the front (wheel-2, the only one that turns to steer and spin), two small rear wheels (wheel-0, wheel-1), a green boiler housing (the tint) with a black chimney, a bench seat and a tiller (steer). Nose +z.',
    examine: [
      'A garden roller with a boiler housing, a black chimney and a bench seat, flattened by its own weight and proud of it.',
      'Saying: the flat road is the one a roller has already been over, so go over it twice for a good finish.',
      'Tip: the top speed is walking pace, so the gnome walking alongside is usually the faster traveller.',
      'Joke: Buck-Iron calls it a Ride-On. Nobody has ever ridden it on, only over, and only once.',
      'A brass band round the chimney has a maker name scratched out and written over by another hand.',
    ],
    parts: [
      { s: 'cyl', d: [0.28, 0.28, 0.9], rot: [0, 0, 90], at: [0, 0.28, 0.42], c: 'steel', seg: 12, group: 'wheel-2', name: 'drum' },
      // Drum hubs start inside the drum (its ends are at x +-0.45), so no hub face is flush with the drum's end cap.
      { s: 'cyl', d: [0.05, 0.05, 0.04], rot: [0, 0, 90], at: [-0.46, 0.28, 0.42], c: 'iron-dark', seg: 10, group: 'wheel-2' },
      { s: 'cyl', d: [0.05, 0.05, 0.04], rot: [0, 0, 90], at: [0.46, 0.28, 0.42], c: 'iron-dark', seg: 10, group: 'wheel-2' },
      { s: 'cyl', d: [0.12, 0.12, 0.08], rot: [0, 0, 90], at: [-0.32, 0.12, -0.4], c: TYRE, seg: 10, group: 'wheel-0' },
      // Axle caps stand 4 cm proud of the tyre faces (x +-0.36) instead of 1 cm, so they do not share a plane with them.
      { s: 'cyl', d: [0.04, 0.04, 0.16], rot: [0, 0, 90], at: [-0.32, 0.12, -0.4], c: 'steel', seg: 8, group: 'wheel-0' },
      { s: 'cyl', d: [0.12, 0.12, 0.08], rot: [0, 0, 90], at: [0.32, 0.12, -0.4], c: TYRE, seg: 10, group: 'wheel-1' },
      { s: 'cyl', d: [0.04, 0.04, 0.16], rot: [0, 0, 90], at: [0.32, 0.12, -0.4], c: 'steel', seg: 8, group: 'wheel-1' },
      // The frame ends inside the rear tyres (x +-0.34): its ends used to sit in the same plane as the tyre faces.
      { s: 'box', d: [0.68, 0.04, 0.08], at: [0, 0.2, -0.4], c: 'iron-dark', name: 'frame' },
      { s: 'box', d: [0.5, 0.3, 0.28], at: [0, 0.37, 0], c: 'tint', name: 'engine' },
      { s: 'cyl', d: [0.075, 0.075, 0.04], at: [0, 0.66, 0], c: 'brass', seg: 10, name: 'band' },
      { s: 'cyl', d: [0.06, 0.07, 0.4], at: [0, 0.72, 0], c: 'black', seg: 8, name: 'chimney' },
      { s: 'box', d: [0.5, 0.1, 0.26], at: [0, 0.42, -0.36], c: 'wood', name: 'seat' },
      { s: 'box', d: [0.08, 0.2, 0.08], at: [0, 0.27, -0.36], c: 'iron-dark', name: 'seat-post' },
      { s: 'box', d: [0.03, 0.25, 0.03], at: [0, 0.5, -0.2], c: 'iron-dark', group: 'steer' },
      { s: 'cyl', d: [0.02, 0.02, 0.4], rot: [0, 0, 90], at: [0, 0.625, -0.2], c: 'black', seg: 6, group: 'steer' },
    ],
    damage: [
      {
        name: 'dented', darken: 0.25,
        morph: { 'wheel-2': { rot: [0, 0, 4] } },
        add: [{ s: 'box', d: [0.3, 0.03, 0.12], at: [0.15, 0.56, 0.42], c: DENT }],
      },
      {
        name: 'wrecked', darken: 0.6, sink: 0.05,
        hide: ['wheel-1'],
        morph: { chimney: { rot: [0, 0, 20] }, steer: { rot: [0, 0, 22] } },
        add: [...smoke(0.05, 0.95, 0, 1.1)],
      },
    ],
  },

  // ---- Teacup Trundler: an oversized porcelain teacup on casters ----------------------------------------------------
  {
    id: 'gta-teacup-trundler', name: 'Teacup Trundler', category: 'prop', uses: ['place', 'sit'],
    tags: ['teacup', 'cup', 'saucer', 'porcelain', 'tea', 'caster', 'vehicle', 'seat', 'ride', 'gta'], emoji: [],
    tint: CUP_WHITE,
    trim: 'gold',
    seat: [0, 0.2, 0],
    pivots: {
      'wheel-0': [-0.3, 0.04, -0.3], 'wheel-1': [0.3, 0.04, -0.3],
      'wheel-2': [-0.3, 0.04, 0.3], 'wheel-3': [0.3, 0.04, 0.3],
      steer: [0, 0.34, 0.12],
    },
    about: 'Gnome Theft Auto: the Teacup Trundler. An oversized porcelain teacup (the tint) on a saucer, a gold rim (trim), a ring handle on +x, four casters (wheel-0..3) and a brass steering wheel (steer) inside. Nose +z.',
    examine: [
      'An oversized porcelain teacup on a saucer, with a gold rim, a ring handle and four casters underneath.',
      'Saying: a cup that is too full will spill on the Verge, and so will a cup that is too empty.',
      'Tip: it spins in its own length, which is handy in a car park and useless for getting anywhere else.',
      'Joke: the top speed is listed as a nice cup of tea, and that is the only speed it has ever reached.',
      'There is still tea in the cup, gone cold, and nobody has ever finished it or looked properly inside.',
    ],
    parts: [
      { s: 'cyl', d: [0.5, 0.5, 0.05], at: [0, 0.1, 0], c: 'white', seg: 12, name: 'saucer' },
      { s: 'ring', d: [0.46, 0.02], rot: [90, 0, 0], at: [0, 0.125, 0], c: 'white', seg: 12, name: 'saucer-rim' },
      { s: 'ball', d: [0.04], at: [-0.3, 0.04, -0.3], c: 'black', seg: 6, group: 'wheel-0' },
      { s: 'ball', d: [0.04], at: [0.3, 0.04, -0.3], c: 'black', seg: 6, group: 'wheel-1' },
      { s: 'ball', d: [0.04], at: [-0.3, 0.04, 0.3], c: 'black', seg: 6, group: 'wheel-2' },
      { s: 'ball', d: [0.04], at: [0.3, 0.04, 0.3], c: 'black', seg: 6, group: 'wheel-3' },
      { s: 'cyl', d: [0.42, 0.32, 0.4], at: [0, 0.325, 0], c: 'tint', seg: 12, name: 'cup' },
      { s: 'cyl', d: [0.39, 0.39, 0.01], at: [0, 0.505, 0], c: 0x6b4a2a, seg: 12, name: 'tea' },
      { s: 'ring', d: [0.42, 0.02], rot: [90, 0, 0], at: [0, 0.525, 0], c: 'trim', seg: 12, name: 'gold-rim' },
      { s: 'ring', d: [0.1, 0.025], rot: [0, 90, 0], at: [0.42, 0.33, 0], c: 'tint', seg: 8, name: 'handle' },
      { s: 'box', d: [0.02, 0.01, 0.16], at: [0.36, 0.13, 0.2], c: 'brass', name: 'spoon' },
      { s: 'cyl', d: [0.012, 0.012, 0.14], at: [0, 0.27, 0.12], c: 'brass', seg: 6, group: 'steer' },
      { s: 'ring', d: [0.07, 0.012], rot: [-30, 0, 0], at: [0, 0.34, 0.12], c: 'brass', seg: 8, group: 'steer' },
    ],
    damage: [
      {
        name: 'dented', darken: 0.25,
        morph: { handle: { rot: [0, 0, 8] } },
        add: [{ s: 'box', d: [0.16, 0.03, 0.04], at: [0.16, 0.42, 0.3], c: DENT }],
      },
      {
        name: 'wrecked', darken: 0.6, sink: 0.03,
        hide: ['wheel-1'],
        morph: { cup: { rot: [0, 0, 8] }, steer: { rot: [0, 0, 22] }, 'wheel-2': { rot: [0, 0, 6] } },
        add: [...smoke(0.05, 0.7, -0.05, 0.9)],
      },
    ],
  },

  // ---- Barrow Buggy: a motorised wheelbarrow -----------------------------------------------------------------------
  {
    id: 'gta-barrow-buggy', name: 'Barrow Buggy', category: 'prop', uses: ['place', 'sit'],
    tags: ['barrow', 'buggy', 'wheelbarrow', 'tray', 'engine', 'pull', 'cord', 'vehicle', 'seat', 'ride', 'gta'], emoji: [],
    tint: BARROW_BLUE,
    seat: [0, 0.32, -0.1],
    pivots: {
      'wheel-0': [-0.3, 0.12, -0.35], 'wheel-1': [0.3, 0.12, -0.35],
      'wheel-2': [0, 0.18, 0.55],
    },
    about: 'Gnome Theft Auto: the Barrow Buggy. A motorised wheelbarrow: a blue tray (the tint) with a plank seat, one big front wheel (wheel-2), two pram wheels at the back (wheel-0, wheel-1), long handles and a two-stroke engine box with a pull cord. Nose +z.',
    examine: [
      'A blue wheelbarrow tray with a two-stroke engine box at the front, a pull cord, and two long handles out the back.',
      'Saying: a barrow goes where it is pushed, and a buggy goes where the barrow was pushed last Tuesday.',
      'Tip: the top speed is a brisk waddle, and the pull cord starts the engine on the third pull, if you are lucky.',
      'Joke: Pip Potsworth built the first one as a joke. It is still the only joke anyone can actually ride.',
      'The salvaged pram wheels squeak in a different key each, which is how the Hat Watch knows it is coming.',
    ],
    parts: [
      { s: 'box', d: [0.5, 0.04, 0.7], at: [0, 0.28, 0], c: 'tint', name: 'tray' },
      { s: 'box', d: [0.04, 0.24, 0.7], rot: [0, 0, 12], at: [-0.27, 0.4, 0], c: 'tint', name: 'wall-l' },
      { s: 'box', d: [0.04, 0.24, 0.7], rot: [0, 0, -12], at: [0.27, 0.4, 0], c: 'tint', name: 'wall-r' },
      { s: 'box', d: [0.5, 0.24, 0.04], rot: [12, 0, 0], at: [0, 0.4, 0.35], c: 'tint', name: 'wall-f' },
      { s: 'box', d: [0.5, 0.24, 0.04], rot: [-12, 0, 0], at: [0, 0.4, -0.35], c: 'tint', name: 'wall-b' },
      { s: 'box', d: [0.5, 0.02, 0.12], at: [0, 0.31, -0.1], c: 'wood', name: 'seat' },
      { s: 'cyl', d: [0.18, 0.18, 0.07], rot: [0, 0, 90], at: [0, 0.18, 0.55], c: TYRE, seg: 12, group: 'wheel-2' },
      { s: 'cyl', d: [0.05, 0.05, 0.09], rot: [0, 0, 90], at: [0, 0.18, 0.55], c: 'steel', seg: 8, group: 'wheel-2' },
      { s: 'ring', d: [0.1, 0.02], rot: [0, 90, 0], at: [-0.3, 0.12, -0.35], c: TYRE, seg: 10, group: 'wheel-0' },
      { s: 'cyl', d: [0.03, 0.03, 0.08], rot: [0, 0, 90], at: [-0.3, 0.12, -0.35], c: 'steel', seg: 8, group: 'wheel-0' },
      { s: 'ring', d: [0.1, 0.02], rot: [0, 90, 0], at: [0.3, 0.12, -0.35], c: TYRE, seg: 10, group: 'wheel-1' },
      { s: 'cyl', d: [0.03, 0.03, 0.08], rot: [0, 0, 90], at: [0.3, 0.12, -0.35], c: 'steel', seg: 8, group: 'wheel-1' },
      { s: 'cyl', d: [0.025, 0.025, 0.8], rot: [90, 0, 0], at: [-0.2, 0.3, -0.75], c: 'wood', seg: 6, name: 'handle-l' },
      { s: 'cyl', d: [0.025, 0.025, 0.8], rot: [90, 0, 0], at: [0.2, 0.3, -0.75], c: 'wood', seg: 6, name: 'handle-r' },
      { s: 'box', d: [0.26, 0.18, 0.2], at: [0, 0.39, 0.2], c: 'iron-dark', name: 'engine' },
      { s: 'ball', d: [0.03], at: [0, 0.44, 0.09], c: 'white', seg: 6, name: 'cord' },
    ],
    damage: [
      {
        name: 'dented', darken: 0.25,
        morph: { 'wheel-2': { rot: [0, 0, 5] } },
        add: [{ s: 'box', d: [0.16, 0.04, 0.02], rot: [12, 0, 0], at: [0.1, 0.42, 0.37], c: DENT }],
      },
      {
        name: 'wrecked', darken: 0.6, sink: 0.04,
        hide: ['wheel-1'],
        morph: { 'handle-l': { rot: [0, 0, -14] }, 'handle-r': { rot: [0, 0, 14] }, 'wheel-2': { rot: [0, 0, 6] } },
        add: [...smoke(0, 0.56, 0.2, 0.8)],
      },
    ],
  },

  // ---- Sunday Driver's Cap: a tweed flat cap with driving goggles (armour, head slot) -------------------------------
  {
    id: 'sunday-driver-cap', name: "Sunday Driver's Cap", category: 'armor', uses: ['wear-head'],
    tags: ['cap', 'tweed', 'flat', 'driving', 'goggles', 'sunday', 'driver', 'gta'], emoji: [],
    tint: TWEED,
    about: "Gnome Theft Auto: the Sunday Driver's Cap. A tweed flat cap with a short peak and a pair of round driving goggles pushed up on the front. The crown and peak take a tint.",
    examine: [
      'A tweed flat cap with a short peak, cut from the same cloth as the Sunday coats of Mossbottom.',
      'Saying: a Sunday driver is one who has been on the road for six days and is only now getting the hang of it.',
      'Tip: the goggles are for the sun. The sun does not come out in Turfton, so they stay pushed up forever.',
      'Joke: a driver who wears goggles on the Verge is only ever being watched by the other drivers.',
      'Someone has pinned a small brass badge inside the crown, reading only "slow", and nobody remembers who did it.',
    ],
    parts: [
      { s: 'ball', d: [0.16], at: [0, 0.1, 0], scale: [1, 0.6, 1], c: 'tint', seg: 10, name: 'crown' },
      { s: 'box', d: [0.28, 0.015, 0.12], at: [0, 0.03, 0.11], c: 'tint', name: 'peak' },
      { s: 'box', d: [0.3, 0.025, 0.03], at: [0, 0.07, -0.02], c: 'black', name: 'band' },
      { s: 'ring', d: [0.035, 0.012], at: [0.06, 0.2, 0.14], c: 'brass', seg: 8, mirror: true, name: 'goggle-rim' },
      { s: 'ball', d: [0.03], at: [0.06, 0.2, 0.14], scale: [1, 1, 0.4], c: 'glass', seg: 6, mirror: true, name: 'goggle-lens' },
      { s: 'box', d: [0.14, 0.02, 0.02], at: [0, 0.2, 0.13], c: 'black', name: 'strap' },
    ],
  },
];
