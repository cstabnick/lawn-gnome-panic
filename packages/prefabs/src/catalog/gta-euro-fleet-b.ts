// Gnome Theft Auto: European kit (E29, docs/roadmaps/gta-batch-3/E29/). The Wespa scooter and the Baguette Trike.
// Ids, seats, wheel pivots and steer pivots are a contract with the game's config: do not rename or move them.
import type { PrefabDef, Part } from '../types';

const TYRE = 0x222222;
const SMOKE = 0x77716b;
const DENT = 0x3b3b3b;
const BREAD = 0xd9a441;

const smoke = (x: number, y: number, z: number): Part[] => [
  { s: 'ball', d: [0.08], at: [x, y, z], c: SMOKE, alpha: 0.6, seg: 6 },
  { s: 'ball', d: [0.1], at: [x + 0.03, y + 0.14, z - 0.02], c: SMOKE, alpha: 0.45, seg: 6 },
  { s: 'ball', d: [0.13], at: [x - 0.02, y + 0.3, z + 0.03], c: SMOKE, alpha: 0.3, seg: 6 },
];

export const GTA_EURO_FLEET_B: readonly PrefabDef[] = [
  // ---- Wespa: a wasp-striped scooter that is mostly noise ------------------------------------------------------------
  {
    id: 'gta-wespa', name: 'Wespa', category: 'prop', uses: ['place', 'sit'],
    tags: ['scooter', 'moped', 'wasp', 'yellow', 'stripes', 'vehicle', 'seat', 'ride', 'gta', 'euro'], emoji: [],
    tint: 0xf2c230,
    seat: [0, 0.36, -0.1],
    pivots: { 'wheel-0': [0, 0.1, -0.33], 'wheel-1': [0, 0.1, 0.36], steer: [0, 0.62, 0.28] },
    about: 'Gnome Theft Auto: the Wespa. A wasp-yellow scooter (the tint) with black stripes, a long two-up saddle, a leg shield, a rack with a crate, and a steer group with handlebar, grips, headlamp, mirrors, fork and antennae. Wheels wheel-0 (rear) and wheel-1 (front). Nose +z.',
    examine: [
      'A yellow scooter with black stripes round its fat back end, two little antennae up front and a crate on the rack.',
      'Saying: a scooter that is quiet is a scooter that is broken, so be glad of the noise.',
      'Tip: the saddle takes two gnomes, but only if the second one has no opinions about the corners.',
      'Joke: the antennae do nothing. The maker says they are for the look, and the look is angry.',
      'The crate holds one cold pastry, a map of a street that has since moved, and a note saying back at two.',
    ],
    parts: [
      { s: 'ball', d: [0.15], at: [0, 0.2, -0.26], scale: [1, 1, 1.6], c: 'tint', seg: 8, name: 'body' },
      { s: 'box', d: [0.34, 0.2, 0.04], at: [0, 0.2, -0.36], c: 'black', name: 'stripe-a' },
      { s: 'box', d: [0.34, 0.2, 0.04], at: [0, 0.2, -0.2], c: 'black', name: 'stripe-b' },
      { s: 'box', d: [0.24, 0.07, 0.55], at: [0, 0.325, -0.225], c: 'black', name: 'saddle' },
      { s: 'box', d: [0.28, 0.04, 0.25], at: [0, 0.14, 0.125], c: 'tint', name: 'floorboard' },
      { s: 'box', d: [0.3, 0.4, 0.04], at: [0, 0.4, 0.25], rot: [-15, 0, 0], c: 'tint', name: 'shield' },
      { s: 'box', d: [0.22, 0.02, 0.16], at: [0, 0.375, -0.42], c: 'iron-dark', name: 'rack' },
      { s: 'box', d: [0.18, 0.12, 0.12], at: [0, 0.43, -0.42], c: 'wood', name: 'crate' },
      { s: 'cyl', d: [0.1, 0.1, 0.06], rot: [0, 0, 90], at: [0, 0.1, -0.33], c: TYRE, seg: 10, group: 'wheel-0' },
      { s: 'cyl', d: [0.04, 0.04, 0.1], rot: [0, 0, 90], at: [0, 0.1, -0.33], c: 'steel', seg: 8, group: 'wheel-0' },
      { s: 'cyl', d: [0.1, 0.1, 0.06], rot: [0, 0, 90], at: [0, 0.1, 0.36], c: TYRE, seg: 10, group: 'wheel-1' },
      { s: 'cyl', d: [0.04, 0.04, 0.1], rot: [0, 0, 90], at: [0, 0.1, 0.36], c: 'steel', seg: 8, group: 'wheel-1' },
      { s: 'cyl', d: [0.02, 0.02, 0.36], rot: [0, 0, 90], at: [0, 0.62, 0.28], c: 'steel', seg: 6, group: 'steer', name: 'bar' },
      { s: 'cyl', d: [0.026, 0.026, 0.08], rot: [0, 0, 90], at: [0.2, 0.62, 0.28], c: 'black', seg: 6, mirror: true, group: 'steer', name: 'grip' },
      { s: 'ball', d: [0.06], at: [0, 0.68, 0.33], scale: [1, 1, 0.7], c: 0xfff3b0, glow: true, seg: 8, group: 'steer', name: 'headlamp' },
      { s: 'pill', d: [0.015, 0.5], at: [0.045, 0.36, 0.32], rot: [-9, 0, 0], c: 'steel', seg: 6, mirror: true, group: 'steer', name: 'fork' },
      { s: 'pill', d: [0.01, 0.06], at: [0.15, 0.69, 0.28], c: 'steel', seg: 6, mirror: true, group: 'steer', name: 'stalk' },
      { s: 'ball', d: [0.035], at: [0.15, 0.77, 0.28], scale: [1, 1, 0.5], c: 'silver', seg: 6, mirror: true, group: 'steer', name: 'mirror' },
      { s: 'pill', d: [0.008, 0.1], at: [0.05, 0.78, 0.33], rot: [-25, 0, -15], c: 'black', seg: 5, mirror: true, group: 'steer', name: 'antenna' },
    ],
    damage: [
      {
        name: 'dented', darken: 0.25,
        morph: { shield: { rot: [6, 0, 0] } },
        add: [{ s: 'box', d: [0.1, 0.03, 0.04], at: [0.1, 0.5, 0.29], c: DENT }],
      },
      {
        name: 'wrecked', darken: 0.6, sink: 0.03,
        hide: ['wheel-1'],
        morph: { steer: { rot: [0, 20, 0] }, crate: { rot: [0, 0, 18] } },
        add: [...smoke(0, 0.6, -0.35)],
      },
    ],
  },

  // ---- Baguette Trike: a little three-wheeled bakery delivery trike -------------------------------------------------
  {
    id: 'gta-baguette-trike', name: 'Baguette Trike', category: 'prop', uses: ['place', 'sit'],
    tags: ['trike', 'tricycle', 'bakery', 'baguette', 'bread', 'delivery', 'cargo', 'vehicle', 'seat', 'ride', 'gta', 'euro'], emoji: [],
    tint: 0x2f5a8f, trim: BREAD,
    seat: [0, 0.4, 0.08],
    pivots: { 'wheel-0': [-0.32, 0.11, -0.35], 'wheel-1': [0.32, 0.11, -0.35], 'wheel-2': [0, 0.11, 0.45], steer: [0, 0.62, 0.3] },
    about: 'Gnome Theft Auto: the Baguette Trike. A delivery-blue (tint) three-wheeler with a bread-gold (trim) striped canopy, an open cargo box with five baguettes and a sign, a two-stroke engine under the saddle, and a steer group with bar, grips, bell and fork. Wheels wheel-0, wheel-1 (rear) and wheel-2 (front). Nose +z.',
    examine: [
      'A blue three-wheeler with a striped canopy over a box of baguettes, and a small noisy engine under the saddle.',
      'Saying: the bread is always warm at the start of the round and a fond memory by the end of it.',
      'Tip: the box takes a passenger, but sit well clear of the baguettes. They are counted twice a day.',
      'Joke: the sign says fresh. It does not say which day, and the baker has never been asked.',
      'One baguette is wrapped in a small form, stamped three times, and nobody knows who it was ordered by.',
    ],
    parts: [
      { s: 'box', d: [0.08, 0.05, 0.8], at: [0, 0.2, 0.05], c: 'iron-dark', name: 'frame' },
      { s: 'box', d: [0.18, 0.15, 0.2], at: [0, 0.265, 0], c: 'iron', name: 'engine' },
      { s: 'cyl', d: [0.025, 0.025, 0.4], rot: [90, 0, 0], at: [0.1, 0.2, -0.2], c: 'steel', seg: 6, name: 'exhaust' },
      { s: 'box', d: [0.16, 0.07, 0.28], at: [0, 0.365, 0.08], c: 'leather-dark', name: 'saddle' },
      { s: 'box', d: [0.66, 0.04, 0.5], at: [0, 0.28, -0.35], c: 'tint', name: 'cargo-floor' },
      { s: 'box', d: [0.7, 0.24, 0.04], at: [0, 0.4, -0.59], c: 'tint', name: 'cargo-back' },
      { s: 'box', d: [0.04, 0.24, 0.5], at: [0.33, 0.4, -0.35], c: 'tint', mirror: true, name: 'cargo-side' },
      { s: 'box', d: [0.62, 0.24, 0.04], at: [0, 0.4, -0.13], c: 'tint', name: 'cargo-front' },
      { s: 'box', d: [0.05, 0.14, 0.3], at: [0.37, 0.42, -0.35], c: 'trim', name: 'sign' },
      { s: 'pill', d: [0.025, 0.4], at: [-0.2, 0.5, -0.4], rot: [10, 0, 14], c: BREAD, seg: 6, name: 'baguette-a' },
      { s: 'pill', d: [0.025, 0.4], at: [-0.1, 0.5, -0.32], rot: [-12, 0, 8], c: BREAD, seg: 6, name: 'baguette-b' },
      { s: 'pill', d: [0.025, 0.4], at: [0, 0.5, -0.42], rot: [14, 0, -4], c: BREAD, seg: 6, name: 'baguette-c' },
      { s: 'pill', d: [0.025, 0.4], at: [0.1, 0.5, -0.3], rot: [-8, 0, -10], c: BREAD, seg: 6, name: 'baguette-d' },
      { s: 'pill', d: [0.025, 0.4], at: [0.2, 0.5, -0.42], rot: [12, 0, -16], c: BREAD, seg: 6, name: 'baguette-e' },
      { s: 'cyl', d: [0.015, 0.015, 0.5], at: [0.3, 0.77, -0.55], c: 'steel', seg: 6, mirror: true, name: 'pole' },
      { s: 'box', d: [0.74, 0.03, 0.56], at: [0, 1.0, -0.35], c: 'tint', name: 'canopy' },
      { s: 'box', d: [0.12, 0.05, 0.6], at: [0, 1.03, -0.35], c: 'trim', name: 'canopy-stripe' },
      { s: 'box', d: [0.12, 0.05, 0.6], at: [0.23, 1.03, -0.35], c: 'trim', mirror: true, name: 'canopy-stripe-side' },
      { s: 'box', d: [0.1, 0.03, 0.2], at: [0.32, 0.26, -0.35], c: 'tint', mirror: true, name: 'rear-fender' },
      { s: 'cyl', d: [0.11, 0.11, 0.07], rot: [0, 0, 90], at: [-0.32, 0.11, -0.35], c: TYRE, seg: 10, group: 'wheel-0' },
      { s: 'cyl', d: [0.04, 0.04, 0.13], rot: [0, 0, 90], at: [-0.32, 0.11, -0.35], c: 'steel', seg: 8, group: 'wheel-0' },
      { s: 'cyl', d: [0.11, 0.11, 0.07], rot: [0, 0, 90], at: [0.32, 0.11, -0.35], c: TYRE, seg: 10, group: 'wheel-1' },
      { s: 'cyl', d: [0.04, 0.04, 0.13], rot: [0, 0, 90], at: [0.32, 0.11, -0.35], c: 'steel', seg: 8, group: 'wheel-1' },
      { s: 'cyl', d: [0.11, 0.11, 0.07], rot: [0, 0, 90], at: [0, 0.11, 0.45], c: TYRE, seg: 10, group: 'wheel-2' },
      { s: 'cyl', d: [0.04, 0.04, 0.13], rot: [0, 0, 90], at: [0, 0.11, 0.45], c: 'steel', seg: 8, group: 'wheel-2' },
      { s: 'box', d: [0.1, 0.03, 0.24], at: [0, 0.27, 0.45], c: 'tint', group: 'steer', name: 'front-fender' },
      { s: 'cyl', d: [0.02, 0.02, 0.4], rot: [0, 0, 90], at: [0, 0.62, 0.3], c: 'steel', seg: 6, group: 'steer', name: 'bar' },
      { s: 'cyl', d: [0.026, 0.026, 0.08], rot: [0, 0, 90], at: [0.21, 0.62, 0.3], c: 'black', seg: 6, mirror: true, group: 'steer', name: 'grip' },
      { s: 'ball', d: [0.03], at: [0.12, 0.68, 0.3], c: 'brass', seg: 6, group: 'steer', name: 'bell' },
      { s: 'pill', d: [0.015, 0.5], at: [0.055, 0.365, 0.375], rot: [-16, 0, 0], c: 'steel', seg: 6, mirror: true, group: 'steer', name: 'fork' },
    ],
    damage: [
      {
        name: 'dented', darken: 0.25,
        morph: { canopy: { rot: [0, 0, 4] } },
        add: [{ s: 'box', d: [0.04, 0.1, 0.12], at: [-0.375, 0.42, -0.35], c: DENT }],
      },
      {
        name: 'wrecked', darken: 0.6, sink: 0.03,
        hide: ['wheel-1'],
        morph: { steer: { rot: [0, 20, 0] }, 'baguette-c': { rot: [0, 0, 40] } },
        add: [...smoke(0.1, 0.45, -0.55)],
      },
    ],
  },
];
