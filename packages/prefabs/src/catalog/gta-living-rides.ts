// Gnome Theft Auto: three civilian vehicles (E31): the Unmown Ranger Buggy, the Snail-Shell Camper, the Ninety-Nine Cone Van.
// Rules: docs/roadmaps/prefab-library/_common.md. Small models, front on +z, scaled up by the game's VEHICLES[kind].scale.
// Ids, seats and wheel / door / steer pivots are a contract with the game's config (VEHICLES) and driveGrips.ts: do not move them.
import type { PrefabDef, Part } from '../types';

const TYRE = 0x222222;
const DENT = 0x3b3b3b;
const SMOKE = 0x77716b;

/** A grey smoke column of three puffs starting at (x, y, z). */
const smoke = (x: number, y: number, z: number, s = 1): Part[] => [
  { s: 'ball', d: [0.09 * s], at: [x, y, z], c: SMOKE, alpha: 0.6, seg: 6 },
  { s: 'ball', d: [0.12 * s], at: [x + 0.03 * s, y + 0.16 * s, z - 0.02 * s], c: SMOKE, alpha: 0.45, seg: 6 },
  { s: 'ball', d: [0.15 * s], at: [x - 0.02 * s, y + 0.34 * s, z + 0.03 * s], c: SMOKE, alpha: 0.3, seg: 6 },
];

/** A tilted steering ring at `w` with its short column, both in group `steer` (the ring turns about its own face). */
const steering = (w: readonly [number, number, number], r = 0.09): Part[] => [
  { s: 'ring', d: [r, 0.015], rot: [-60, 0, 0], at: [w[0], w[1], w[2]], c: 'black', seg: 10, group: 'steer' },
  { s: 'cyl', d: [0.012, 0.012, 0.2], rot: [-60, 0, 0], at: [w[0], w[1] - 0.1, w[2] + 0.086], c: 'black', seg: 6, group: 'steer' },
];

export const GTA_LIVING_RIDES: readonly PrefabDef[] = [
  // ---- Unmown Ranger Buggy: an olive open two-seater with a roll bar ---------------------------------------------------
  {
    id: 'gta-ranger-buggy', name: 'Unmown Ranger Buggy', category: 'prop', uses: ['place', 'sit'],
    tags: ['ranger', 'buggy', 'unmown', 'preserve', 'olive', 'roll', 'bar', 'car', 'vehicle', 'seat', 'ride', 'gta', 'living'], emoji: [],
    tint: 0x6b7a35,
    trim: 0xe8c547,
    seat: [0.16, 0.31, -0.06],
    pivots: {
      'wheel-0': [-0.36, 0.12, -0.4], 'wheel-1': [0.36, 0.12, -0.4],
      'wheel-2': [-0.36, 0.12, 0.4], 'wheel-3': [0.36, 0.12, 0.4],
      steer: [0.16, 0.6, 0.1],
    },
    about: 'Gnome Theft Auto: the Unmown Ranger Buggy. An open olive two-seater (tint) with a roll bar, chunky tyres, a spare wheel and a rack with a coiled hose and a net on the back, a RANGER plate (trim) on the nose, a binocular case on the dash and a steering wheel (steer). Nose +z.',
    examine: [
      'An olive-green buggy with a roll bar, fat tyres, a spare wheel on the back and a rack holding a coiled hose and a net.',
      'Saying: the Unmown does not need a road, only a ranger who is in no hurry.',
      'Tip: it takes the long grass at a stroll. Do not hurry it. The grass notices, and so do the rangers.',
      'Joke: the net is for butterflies. The hose is for the HOA, who occasionally need a calming spray.',
      'The binocular case on the dash is full of sandwiches. The binoculars are in the sandwiches. Nobody asks.',
    ],
    parts: [
      { s: 'box', d: [0.6, 0.14, 1.1], at: [0, 0.24, 0], c: 'tint', name: 'body' },
      { s: 'box', d: [0.5, 0.14, 0.35], at: [0, 0.34, 0.42], c: 'tint', name: 'hood' },
      { s: 'box', d: [0.5, 0.1, 0.08], at: [0, 0.42, 0.2], c: 'tint', name: 'dash' },
      { s: 'box', d: [0.2, 0.06, 0.2], at: [0.16, 0.285, -0.06], c: 'black' },
      { s: 'box', d: [0.2, 0.06, 0.2], at: [-0.16, 0.285, -0.06], c: 'black' },
      { s: 'box', d: [0.2, 0.22, 0.04], at: [0.16, 0.42, -0.2], c: 'black' },
      { s: 'box', d: [0.2, 0.22, 0.04], at: [-0.16, 0.42, -0.2], c: 'black' },
      { s: 'box', d: [0.03, 0.5, 0.03], at: [-0.3, 0.55, -0.24], c: 'black', mirror: true, name: 'bar-rear' },
      { s: 'box', d: [0.03, 0.5, 0.03], at: [-0.3, 0.55, 0.18], c: 'black', mirror: true, name: 'bar-front' },
      { s: 'box', d: [0.03, 0.03, 0.46], at: [-0.3, 0.8, -0.03], c: 'black', mirror: true, name: 'bar-roof' },
      { s: 'box', d: [0.63, 0.03, 0.03], at: [0, 0.8, -0.24], c: 'black', name: 'bar-cross' },
      { s: 'box', d: [0.12, 0.06, 0.07], at: [-0.15, 0.5, 0.2], c: 0x4a3a22, name: 'binoculars' },
      { s: 'box', d: [0.3, 0.07, 0.02], at: [0, 0.34, 0.6], c: 'trim', name: 'plate' },
      { s: 'box', d: [0.22, 0.03, 0.02], at: [0, 0.34, 0.615], c: 0x2a2a20, name: 'plate-text' },
      { s: 'ball', d: [0.055], at: [-0.2, 0.38, 0.6], c: 'spark', glow: true, seg: 8, mirror: true },
      { s: 'cyl', d: [0.1, 0.1, 0.06], rot: [90, 0, 0], at: [0, 0.34, -0.6], c: TYRE, seg: 10, name: 'spare' },
      { s: 'box', d: [0.03, 0.17, 0.03], at: [-0.24, 0.41, -0.46], c: 'black', mirror: true },
      { s: 'box', d: [0.52, 0.03, 0.3], at: [0, 0.5, -0.38], c: 'black', name: 'rack' },
      { s: 'ring', d: [0.07, 0.02], rot: [90, 0, 0], at: [-0.12, 0.54, -0.38], c: 0x2f7f3a, seg: 10, name: 'hose' },
      { s: 'box', d: [0.22, 0.04, 0.2], at: [0.12, 0.53, -0.38], c: 0xd8c9a0, alpha: 0.7, name: 'net' },
      ...steering([0.16, 0.6, 0.1]),
      { s: 'cyl', d: [0.12, 0.12, 0.1], rot: [0, 0, 90], at: [-0.36, 0.12, -0.4], c: TYRE, seg: 10, group: 'wheel-0' },
      { s: 'cyl', d: [0.12, 0.12, 0.1], rot: [0, 0, 90], at: [0.36, 0.12, -0.4], c: TYRE, seg: 10, group: 'wheel-1' },
      { s: 'cyl', d: [0.12, 0.12, 0.1], rot: [0, 0, 90], at: [-0.36, 0.12, 0.4], c: TYRE, seg: 10, group: 'wheel-2' },
      { s: 'cyl', d: [0.12, 0.12, 0.1], rot: [0, 0, 90], at: [0.36, 0.12, 0.4], c: TYRE, seg: 10, group: 'wheel-3' },
    ],
    damage: [
      {
        name: 'dented', darken: 0.25,
        morph: { hood: { rot: [0, 0, 4] } },
        add: [{ s: 'box', d: [0.16, 0.03, 0.05], at: [0.1, 0.42, 0.45], c: DENT }],
      },
      {
        name: 'wrecked', darken: 0.6, sink: 0.04,
        hide: ['wheel-1'],
        morph: { hood: { rot: [0, 0, 8] }, 'bar-cross': { rot: [0, 0, 12] }, net: { rot: [0, 0, 20] } },
        add: [...smoke(0, 0.6, 0.4, 1)],
      },
    ],
  },

  // ---- Snail-Shell Camper: a little camper van with a spiral shell for a back half ---------------------------------------
  {
    id: 'gta-shell-camper', name: 'Snail-Shell Camper', category: 'prop', uses: ['place', 'sit'],
    tags: ['snail', 'shell', 'camper', 'van', 'spiral', 'caravan', 'bicycle', 'vehicle', 'seat', 'ride', 'gta', 'living'], emoji: [],
    tint: 0xf0e2bd,
    trim: 0x8a5a2b,
    seat: [0.18, 0.31, 0.47],
    pivots: {
      'wheel-0': [-0.4, 0.11, -0.5], 'wheel-1': [0.4, 0.11, -0.5],
      'wheel-2': [-0.4, 0.11, 0.5], 'wheel-3': [0.4, 0.11, 0.5],
      'door-left': [0.435, 0.42, 0.65], 'door-right': [-0.435, 0.42, 0.65],
      steer: [0.18, 0.655, 0.59],
    },
    about: 'Gnome Theft Auto: the Snail-Shell Camper. A teal cab with two doors and round headlamps, and a whole back half that is one big spiral snail shell (tint cream, trim brown swirl), pink curtains and a bicycle strapped to the back. Wheels, door and steer pivots. Nose +z.',
    examine: [
      'A small teal camper whose entire back half is a spiral snail shell, with a bicycle strapped on behind.',
      'Saying: a home you carry is a home you never have to find a parking space for.',
      'Tip: it is slow to turn and slower to stop. The shell has views on both, and they are unhurried.',
      'Joke: nobody has seen the previous owner. The curtains twitch whenever anyone asks.',
      'The bicycle is for the days the camper does not feel like going anywhere, which is most of them.',
    ],
    parts: [
      { s: 'box', d: [0.84, 0.16, 1.6], at: [0, 0.19, 0], c: 0x4f8f94, name: 'chassis' },
      { s: 'box', d: [0.84, 0.2, 0.5], at: [0, 0.37, 0.5], c: 0x4f8f94, name: 'cab' },
      { s: 'box', d: [0.8, 0.46, 0.46], at: [0, 0.7, 0.5], c: 'glass', name: 'windscreen' },
      { s: 'box', d: [0.86, 0.04, 0.52], at: [0, 0.95, 0.5], c: 0x4f8f94, name: 'cab-roof' },
      { s: 'box', d: [0.8, 0.1, 0.08], at: [0, 0.52, 0.7], c: 'black', name: 'dash' },
      { s: 'box', d: [0.2, 0.06, 0.2], at: [0.18, 0.28, 0.47], c: 'black', mirror: true },
      { s: 'box', d: [0.2, 0.2, 0.04], at: [0.18, 0.4, 0.34], c: 'black', mirror: true },
      { s: 'ball', d: [0.07], at: [-0.28, 0.32, 0.8], c: 'spark', glow: true, seg: 8, mirror: true },
      { s: 'box', d: [0.3, 0.2, 0.02], at: [0.2, 0.7, 0.27], c: 0xd0607a, mirror: true, name: 'curtains' },
      { s: 'ball', d: [0.45], scale: [0.9, 1.15, 1.2], at: [0, 0.75, -0.35], c: 'tint', seg: 12, name: 'shell' },
      { s: 'ring', d: [0.3, 0.03], rot: [0, 90, 0], at: [0.36, 0.78, -0.35], c: 'trim', seg: 10, mirror: true, name: 'swirl-a' },
      { s: 'ring', d: [0.18, 0.03], rot: [0, 90, 0], at: [0.395, 0.78, -0.35], c: 'trim', seg: 10, mirror: true, name: 'swirl-b' },
      { s: 'ring', d: [0.08, 0.03], rot: [0, 90, 0], at: [0.405, 0.78, -0.35], c: 'trim', seg: 8, mirror: true, name: 'swirl-c' },
      { s: 'ball', d: [0.11], at: [0, 1.25, -0.55], c: 'trim', seg: 8, name: 'apex' },
      { s: 'box', d: [0.5, 0.03, 0.12], at: [0, 0.3, -0.9], c: 'black', name: 'rack' },
      { s: 'ring', d: [0.12, 0.015], at: [0.22, 0.45, -0.95], c: 'black', seg: 10, mirror: true, name: 'bike-wheel' },
      { s: 'box', d: [0.44, 0.02, 0.02], at: [0, 0.45, -0.95], c: 0xc0392b, name: 'bike-frame' },
      { s: 'ball', d: [0.04], at: [0.1, 0.55, -0.95], c: 'black', seg: 6, name: 'bike-saddle' },
      ...steering([0.18, 0.655, 0.59]),
      { s: 'cyl', d: [0.11, 0.11, 0.08], rot: [0, 0, 90], at: [-0.4, 0.11, -0.5], c: TYRE, seg: 10, group: 'wheel-0' },
      { s: 'cyl', d: [0.11, 0.11, 0.08], rot: [0, 0, 90], at: [0.4, 0.11, -0.5], c: TYRE, seg: 10, group: 'wheel-1' },
      { s: 'cyl', d: [0.11, 0.11, 0.08], rot: [0, 0, 90], at: [-0.4, 0.11, 0.5], c: TYRE, seg: 10, group: 'wheel-2' },
      { s: 'cyl', d: [0.11, 0.11, 0.08], rot: [0, 0, 90], at: [0.4, 0.11, 0.5], c: TYRE, seg: 10, group: 'wheel-3' },
      { s: 'box', d: [0.03, 0.36, 0.34], at: [0.435, 0.42, 0.48], c: 0x4f8f94, group: 'door-left' },
      { s: 'box', d: [0.03, 0.36, 0.34], at: [-0.435, 0.42, 0.48], c: 0x4f8f94, group: 'door-right' },
    ],
    damage: [
      {
        name: 'dented', darken: 0.25,
        morph: { apex: { rot: [0, 0, 12] } },
        add: [{ s: 'box', d: [0.04, 0.12, 0.2], at: [0.44, 0.65, 0.2], c: DENT }],
      },
      {
        name: 'wrecked', darken: 0.6, sink: 0.04,
        hide: ['wheel-1'],
        morph: { apex: { rot: [0, 0, 25] }, curtains: { rot: [0, 0, 10] }, shell: { rot: [4, 0, 0] } },
        add: [...smoke(0, 1.0, 0.4, 1.1)],
      },
    ],
  },

  // ---- Ninety-Nine Cone Van: a pastel Saltbucket ice-cream van with a giant cone on the roof -----------------------------
  {
    id: 'gta-cone-van', name: 'Ninety-Nine Cone Van', category: 'prop', uses: ['place', 'sit'],
    tags: ['ice', 'cream', 'cone', 'ninety-nine', 'van', 'saltbucket', 'pink', 'chime', 'vehicle', 'seat', 'ride', 'gta', 'living'], emoji: [],
    tint: 0xf4b6c8,
    trim: 0xf8f4ec,
    seat: [0.18, 0.3, 0.42],
    pivots: {
      'wheel-0': [-0.4, 0.11, -0.5], 'wheel-1': [0.4, 0.11, -0.5],
      'wheel-2': [-0.4, 0.11, 0.5], 'wheel-3': [0.4, 0.11, 0.5],
      'door-left': [0.445, 0.42, 0.62], 'door-right': [-0.445, 0.42, 0.62],
      steer: [0.18, 0.64, 0.54],
    },
    about: 'Gnome Theft Auto: the Ninety-Nine Cone Van. A boxy pastel pink ice-cream van (tint) with a white stripe and roof (trim), a serving hatch on the right (-x) side with an awning, a giant plastic ninety-nine cone with a flake on the roof, a chime speaker and a glass cab. Nose +z.',
    examine: [
      'A pastel pink ice-cream van with a serving hatch, a striped awning and a giant plastic cone and flake on the roof.',
      'Saying: nobody ever bought an ice cream in a hurry, and the van knows it.',
      'Tip: the chime plays whether or not anyone is near. It has been trying to sell to the same hedge since spring.',
      'Joke: the flake on top is real chocolate. It is also load-bearing, and nobody will say how.',
      'A sign on the hatch says Ninety-Nine and, in smaller letters, that it was a hundred once, before the incident.',
    ],
    parts: [
      { s: 'box', d: [0.86, 0.62, 1.1], at: [0, 0.51, -0.2], c: 'tint', name: 'body' },
      { s: 'box', d: [0.86, 0.22, 0.38], at: [0, 0.31, 0.52], c: 'tint', name: 'nose' },
      { s: 'box', d: [0.8, 0.31, 0.4], at: [0, 0.575, 0.54], c: 'glass', name: 'windscreen' },
      { s: 'box', d: [0.84, 0.05, 0.44], at: [0, 0.745, 0.54], c: 'trim', name: 'cab-roof' },
      { s: 'box', d: [0.88, 0.08, 1.12], at: [0, 0.42, -0.2], c: 'trim', name: 'stripe' },
      { s: 'box', d: [0.94, 0.04, 1.2], at: [0, 0.83, -0.2], c: 'trim', name: 'roof-strip' },
      { s: 'ball', d: [0.05], scale: [1, 1, 0.5], at: [-0.28, 0.32, 0.725], c: 'spark', glow: true, seg: 8, mirror: true },
      { s: 'box', d: [0.05, 0.26, 0.3], at: [-0.445, 0.56, -0.2], c: 'black', name: 'hatch' },
      { s: 'box', d: [0.1, 0.03, 0.34], at: [-0.52, 0.44, -0.2], c: 'trim', name: 'counter' },
      { s: 'box', d: [0.16, 0.03, 0.4], rot: [0, 0, 25], at: [-0.54, 0.74, -0.2], c: 0xe8587a, name: 'awning' },
      { s: 'cone', d: [0.14, 0.3], rot: [180, 0, 0], at: [0, 1.0, -0.2], c: 0xd9a65a, seg: 8, name: 'cone' },
      { s: 'ball', d: [0.17], at: [0, 1.2, -0.2], c: 'trim', seg: 8, name: 'scoop' },
      { s: 'box', d: [0.03, 0.14, 0.03], rot: [0, 0, 15], at: [0.08, 1.35, -0.2], c: 0x5b3a22, name: 'flake' },
      { s: 'box', d: [0.16, 0.1, 0.1], at: [0, 0.82, 0.55], c: 0x555a60, name: 'speaker' },
      { s: 'box', d: [0.8, 0.08, 0.08], at: [0, 0.52, 0.68], c: 'black', name: 'dash' },
      ...steering([0.18, 0.64, 0.54]),
      { s: 'cyl', d: [0.11, 0.11, 0.08], rot: [0, 0, 90], at: [-0.4, 0.11, -0.5], c: TYRE, seg: 10, group: 'wheel-0' },
      { s: 'cyl', d: [0.11, 0.11, 0.08], rot: [0, 0, 90], at: [0.4, 0.11, -0.5], c: TYRE, seg: 10, group: 'wheel-1' },
      { s: 'cyl', d: [0.11, 0.11, 0.08], rot: [0, 0, 90], at: [-0.4, 0.11, 0.5], c: TYRE, seg: 10, group: 'wheel-2' },
      { s: 'cyl', d: [0.11, 0.11, 0.08], rot: [0, 0, 90], at: [0.4, 0.11, 0.5], c: TYRE, seg: 10, group: 'wheel-3' },
      { s: 'box', d: [0.03, 0.34, 0.34], at: [0.45, 0.42, 0.45], c: 'tint', group: 'door-left' },
      { s: 'box', d: [0.03, 0.34, 0.34], at: [-0.45, 0.42, 0.45], c: 'tint', group: 'door-right' },
    ],
    damage: [
      {
        name: 'dented', darken: 0.25,
        morph: { flake: { rot: [0, 0, 30] } },
        add: [{ s: 'box', d: [0.04, 0.12, 0.2], at: [0.45, 0.65, -0.3], c: DENT }],
      },
      {
        name: 'wrecked', darken: 0.6, sink: 0.04,
        hide: ['wheel-1'],
        morph: { cone: { rot: [170, 0, 12] }, scoop: { rot: [0, 0, 14] }, awning: { rot: [0, 0, 45] } },
        add: [...smoke(0, 0.95, 0.4, 1.1)],
      },
    ],
  },
];
