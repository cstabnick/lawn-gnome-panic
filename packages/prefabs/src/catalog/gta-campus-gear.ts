// Gnome Theft Auto (E13): wearable rewards for the Rootwell achievements. Each is the reward of one achievement in
// packages/achievements/src/catalog.ts.
import type { PrefabDef } from '../types';

export const GTA_CAMPUS_GEAR: readonly PrefabDef[] = [
  {
    id: 'ant-antenna-headband', name: 'Ant Antenna Headband', category: 'armor', uses: ['wear-head'],
    tags: ['headband', 'antenna', 'antennae', 'ant', 'sugar', 'band', 'head', 'reward', 'gta'], emoji: [],
    about: 'Not Termites: a dark red-brown headband with two bendy antennae on springs, each tipped with a ball, and a white sugar cube clipped to the band. Plain colours, no tint.',
    examine: [
      'A dark red-brown headband with two bendy antennae on springs, each tipped with a little ball, and a sugar cube clipped to the band.',
      'Rootwell saying: a landlord paid in sugar is never late with the rent, and the ants have never once been late with anything.',
      'Tip: wear the antennae on the side you want the ants to see. They are not very good at seeing sideways.',
      'Joke: the antennae sense the mood of the landlord, which is always the same, and always sugar.',
      'Not termites. Do not call them termites. The band was a gift from the ants, and it came with a bill.',
    ],
    parts: [
      { s: 'cyl', d: [0.16, 0.16, 0.05], at: [0, 0.025, 0], c: 0x5a2a1e, seg: 10 },          // headband (min.y = 0)
      { s: 'cyl', d: [0.008, 0.008, 0.3], at: [0.1, 0.19, 0], rot: [0, 0, -15], c: 'black', seg: 6, mirror: true }, // antenna spring
      { s: 'ball', d: [0.02], at: [0.136, 0.335, 0], c: 'red', seg: 6, mirror: true },         // antenna tip
      { s: 'box', d: [0.04, 0.03, 0.03], at: [0, 0.035, 0.172], c: 'white' },                   // sugar cube
    ],
  },
  {
    id: 'rootwell-college-scarf', name: 'Rootwell College Scarf', category: 'armor', uses: ['wear-neck'],
    tags: ['scarf', 'college', 'university', 'stripes', 'fringe', 'neck', 'wool', 'reward', 'gta'], emoji: [],
    about: 'First Class Honours: a striped university scarf in deep red and cream, four stripes, wound round the neck with both fringed ends hanging in front. Plain colours, no tint.',
    examine: [
      'A striped university scarf in deep red and cream, four stripes, wound once round the neck with both fringed ends hanging in front.',
      'Rootwell saying: a scholar given a first is given a scarf, and both are expected back in the library on Monday.',
      'Tip: keep the stripes in the same order at both ends. Mismatched stripes mean the gnome is only half a graduate.',
      'Joke: the fringe is the only part of the degree that has ever been fully paid for, and it still owes the ants a fortnight.',
      'Knitted for the Class of the Long Shelf by a student who was given a first for the pattern and no other work.',
    ],
    parts: [
      { s: 'ring', d: [0.26, 0.02], at: [0, 0.02, 0], rot: [90, 0, 0], c: 0x8b1e2b, seg: 12 },    // stripe 1 (min.y = 0)
      { s: 'ring', d: [0.26, 0.02], at: [0, 0.04, 0], rot: [90, 0, 0], c: 0xefe3c8, seg: 12 },    // stripe 2
      { s: 'ring', d: [0.26, 0.02], at: [0, 0.06, 0], rot: [90, 0, 0], c: 0x8b1e2b, seg: 12 },    // stripe 3
      { s: 'ring', d: [0.26, 0.02], at: [0, 0.08, 0], rot: [90, 0, 0], c: 0xefe3c8, seg: 12 },    // stripe 4
      { s: 'box', d: [0.07, 0.16, 0.035], at: [-0.07, 0.085, 0.3], c: 0x8b1e2b },                  // hanging end
      { s: 'box', d: [0.07, 0.16, 0.035], at: [0.07, 0.085, 0.3], c: 0x8b1e2b },                  // hanging end
      { s: 'box', d: [0.07, 0.02, 0.012], at: [-0.07, 0.01, 0.32], c: 0xefe3c8 },                  // fringe
      { s: 'box', d: [0.07, 0.02, 0.012], at: [0.07, 0.01, 0.32], c: 0xefe3c8 },                   // fringe
    ],
  },
  {
    id: 'star-chart-tube', name: 'Star Chart Tube', category: 'armor', uses: ['wear-back'],
    tags: ['tube', 'map', 'chart', 'star', 'stars', 'leather', 'strap', 'back', 'pack', 'reward', 'gta'], emoji: [],
    about: 'Level with the Stars: a leather map tube carried across the back on a strap, brass caps at each end and a rolled star chart poking out of the top. Plain colours, no tint.',
    examine: [
      'A leather map tube carried across the back on a strap, with brass caps at each end and a rolled star chart poking out of the top.',
      'Saying of the Observatory: a gnome who looks up long enough will find the stars have gone and left a map behind.',
      'Tip: keep the cap on in the rain. A chart left open to the sky picks up dew, and dew is the first thing the stars drop.',
      'Joke: the chart shows every star in the sky except the one the Dean keeps asking about.',
      'Professor Sextant surveyed the stars for a perfectly level line and never carried the chart herself: the tube does it instead.',
    ],
    parts: [
      { s: 'cyl', d: [0.04, 0.04, 0.55], at: [0, 0.28, -0.03], rot: [0, 0, 30], c: 'leather', seg: 8 },  // tube (min.y ~ 0.01)
      { s: 'cyl', d: [0.045, 0.045, 0.02], at: [0.14, 0.0375, -0.03], rot: [0, 0, -30], c: 'brass', seg: 8 },  // bottom cap
      { s: 'cyl', d: [0.045, 0.045, 0.02], at: [-0.14, 0.5225, -0.03], rot: [0, 0, 30], c: 'brass', seg: 8 }, // top cap
      { s: 'cyl', d: [0.028, 0.028, 0.12], at: [-0.155, 0.5285, -0.03], rot: [0, 0, 30], c: 'paper', seg: 8 }, // star chart
      { s: 'ball', d: [0.01], at: [-0.145, 0.5312, -0.005], c: 'gold', seg: 6 },                  // star dot
      { s: 'ball', d: [0.01], at: [-0.165, 0.5658, -0.005], c: 'gold', seg: 6 },                 // star dot
      { s: 'ball', d: [0.01], at: [-0.18, 0.5918, -0.005], c: 'gold', seg: 6 },                  // star dot
      { s: 'box', d: [0.24, 0.03, 0.015], at: [0, 0.2, 0.0], c: 'leather-dark' },                // strap
    ],
  },
  {
    id: 'rootwell-flight-goggles', name: 'Rootwell Flight Goggles', category: 'armor', uses: ['wear-head'],
    tags: ['helmet', 'flying', 'goggles', 'leather', 'flap', 'aviator', 'pilot', 'head', 'reward', 'gta'], emoji: [],
    about: 'Touch and Go: a soft brown leather flying helmet with ear flaps, brass-rimmed goggles pushed up on the forehead and a red Rootwell R badge. Plain colours, no tint.',
    examine: [
      'A soft brown leather flying helmet with ear flaps, brass-rimmed goggles pushed up on the forehead and a red R badge on the side.',
      'Rootwell Field saying: the lift comes first and the landing comes later, and the landing is the part they put in the report.',
      'Tip: pull the goggles down before take-off. Goggles on the forehead see only the ground you have just left.',
      'Joke: the aeronautics department has one working plane and four students, so this helmet has been worn by all five at once.',
      'Left behind by a student who wanted to fly, and last seen on the Field wiping the goggles and looking up.',
    ],
    parts: [
      { s: 'cyl', d: [0.16, 0.165, 0.2], at: [0, 0.1, 0], c: 'leather', seg: 10 },                // helmet (min.y = 0)
      { s: 'ball', d: [0.16], at: [0, 0.2, 0], scale: [1, 0.5, 1], c: 'leather', seg: 8 },         // crown
      { s: 'box', d: [0.04, 0.085, 0.1], at: [0.16, 0.085, 0], c: 'leather-dark', mirror: true }, // ear flap
      { s: 'cyl', d: [0.045, 0.045, 0.02], at: [-0.05, 0.24, 0.17], rot: [90, 0, 0], c: 'brass', seg: 8, mirror: true }, // goggle rim
      { s: 'cyl', d: [0.035, 0.035, 0.01], at: [-0.05, 0.24, 0.18], rot: [90, 0, 0], c: 'glass', seg: 8, mirror: true },  // goggle lens
      { s: 'box', d: [0.012, 0.035, 0.035], at: [0.163, 0.19, 0], c: 'red' },                  // R badge
    ],
  },
  {
    id: 'pinwheel-hat', name: 'Pinwheel Hat', category: 'armor', uses: ['wear-head'],
    tags: ['hat', 'hard', 'helmet', 'pinwheel', 'silver', 'ridge', 'garden', 'head', 'reward', 'gta'], emoji: [],
    about: 'Windfall: a silver hard hat with a tiny red, yellow and blue garden pinwheel on a stalk on top. Plain colours, no tint.',
    examine: [
      'A silver hard hat with a tiny red, yellow and blue garden pinwheel on a stalk on top, its four vanes turning in no wind at all.',
      'Ridge saying: a pinwheel turns for the wind, and the wind turns for nobody, so keep your hat on while it works.',
      'Tip: wear it at dusk. The pinwheel is for lighting lamps, and at noon it is only a small coloured toy.',
      'Joke: Ragwort Coilspring says the hat is for safety. He also says naturally, which is how you know he is not sure.',
      'Ragwort wears one just like it and says the pinwheel is only for the lamps. He has never once explained the lamps.',
    ],
    parts: [
      { s: 'cyl', d: [0.22, 0.22, 0.02], at: [0, 0.01, 0], c: 'silver', seg: 12 },                // brim (min.y = 0)
      { s: 'cyl', d: [0.165, 0.17, 0.1], at: [0, 0.07, 0], c: 'silver', seg: 10 },               // crown
      { s: 'ball', d: [0.165], at: [0, 0.12, 0], scale: [1, 0.4, 1], c: 'silver', seg: 8 },       // dome
      { s: 'box', d: [0.03, 0.035, 0.2], at: [0, 0.18, 0], c: 'silver' },                         // ridge
      { s: 'cyl', d: [0.007, 0.007, 0.1], at: [0, 0.25, 0], c: 'steel', seg: 6 },                  // stalk
      { s: 'box', d: [0.07, 0.02, 0.008], at: [0.0247, 0.3347, 0], rot: [0, 0, 45], c: 'red' },   // vane
      { s: 'box', d: [0.07, 0.02, 0.008], at: [-0.0247, 0.3347, 0], rot: [0, 0, 135], c: 'yellow' }, // vane
      { s: 'box', d: [0.07, 0.02, 0.008], at: [-0.0247, 0.2853, 0], rot: [0, 0, 225], c: 'blue' },  // vane
      { s: 'box', d: [0.07, 0.02, 0.008], at: [0.0247, 0.2853, 0], rot: [0, 0, 315], c: 'yellow' }, // vane
      { s: 'ball', d: [0.01], at: [0, 0.31, 0.005], c: 'brass', seg: 6 },                          // pin
    ],
  },
];
