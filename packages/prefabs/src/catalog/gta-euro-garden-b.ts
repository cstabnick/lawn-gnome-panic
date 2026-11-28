// Gnome Theft Auto: European kit (E29, docs/roadmaps/gta-batch-3/E29/). Seven backyard pieces, life-size metres.
import type { PrefabDef, Part } from '../types';

const ivyWallParts: Part[] = [
  { s: 'box', d: [2.96, 1.6, 0.3], at: [0, 0.8, 0], c: 'tint' },                       // brick wall, ends at x = +-1.48
  { s: 'box', d: [2.96, 0.1, 0.36], at: [0, 1.65, 0], c: 'stone' },                   // coping, deeper than the wall
  { s: 'box', d: [0.5, 0.6, 0.06], at: [-1.0, 0.9, 0.2], c: 'leaf-dark' },           // ivy clumps on the +z face
  { s: 'ball', d: [0.15], at: [-0.2, 1.2, 0.2], c: 'leaf', seg: 6 },
  { s: 'ball', d: [0.18], at: [0.5, 0.5, 0.2], scale: [1, 1.1, 0.6], c: 'leaf-dark', seg: 6 },
  { s: 'box', d: [0.6, 0.5, 0.06], at: [0.9, 1.3, 0.2], c: 'leaf' },
  { s: 'ball', d: [0.14], at: [-1.2, 0.4, 0.2], c: 'leaf', seg: 6 },
  { s: 'box', d: [0.6, 0.3, 0.1], at: [-0.4, 1.5, 0.25], c: 'leaf-dark' },           // spilling over the top
  { s: 'ball', d: [0.12], at: [-0.4, 1.72, 0.1], c: 'leaf', seg: 6 },
];

const vinePergolaParts: Part[] = [
  { s: 'box', d: [0.12, 2.4, 0.12], at: [1.35, 1.2, 1.1], c: 'wood', mirror: true },   // four posts
  { s: 'box', d: [0.12, 2.4, 0.12], at: [1.35, 1.2, -1.1], c: 'wood', mirror: true },
  { s: 'box', d: [3.0, 0.12, 0.2], at: [0, 2.37, 1.1], c: 'wood-light' },              // two beams along x
  { s: 'box', d: [3.0, 0.12, 0.2], at: [0, 2.37, -1.1], c: 'wood-light' },
  { s: 'box', d: [0.1, 0.12, 2.6], at: [-1.2, 2.4, 0], c: 'wood' },                     // four rafters along z
  { s: 'box', d: [0.1, 0.12, 2.6], at: [-0.4, 2.4, 0], c: 'wood' },
  { s: 'box', d: [0.1, 0.12, 2.6], at: [0.4, 2.4, 0], c: 'wood' },
  { s: 'box', d: [0.1, 0.12, 2.6], at: [1.2, 2.4, 0], c: 'wood' },
  { s: 'pill', d: [0.025, 0.6], at: [1.46, 1.0, 1.1], c: 'leaf-dark', seg: 6 },        // vine up a post
  { s: 'ball', d: [0.25], at: [-0.8, 2.6, 0.4], scale: [1, 0.5, 1], c: 'leaf', seg: 6 }, // leafy clumps
  { s: 'ball', d: [0.25], at: [0.8, 2.62, -0.4], scale: [1, 0.5, 1], c: 'leaf-dark', seg: 6 },
  { s: 'ball', d: [0.25], at: [1.2, 2.58, 0.9], scale: [1, 0.5, 1], c: 'leaf', seg: 6 },
  { s: 'ball', d: [0.05], at: [-0.8, 2.18, 1.2], c: 'purple', seg: 6 },                  // grape bunches
  { s: 'ball', d: [0.05], at: [-0.76, 2.11, 1.24], c: 'purple', seg: 6 },
  { s: 'ball', d: [0.05], at: [-0.84, 2.11, 1.22], c: 'amethyst', seg: 6 },
  { s: 'ball', d: [0.05], at: [0.0, 2.18, 1.2], c: 'purple', seg: 6 },
  { s: 'ball', d: [0.05], at: [0.04, 2.11, 1.24], c: 'purple', seg: 6 },
  { s: 'ball', d: [0.05], at: [-0.04, 2.11, 1.22], c: 'amethyst', seg: 6 },
  { s: 'ball', d: [0.05], at: [0.8, 2.18, 1.2], c: 'purple', seg: 6 },
  { s: 'ball', d: [0.05], at: [0.84, 2.11, 1.24], c: 'purple', seg: 6 },
  { s: 'ball', d: [0.05], at: [0.76, 2.11, 1.22], c: 'amethyst', seg: 6 },
];

const boulesParts: Part[] = [
  { s: 'box', d: [0.1, 0.15, 8.0], at: [-1.35, 0.075, 0], c: 'wood' },                 // four timber edge boards
  { s: 'box', d: [0.1, 0.15, 8.0], at: [1.35, 0.075, 0], c: 'wood' },
  { s: 'box', d: [2.5, 0.15, 0.1], at: [0, 0.075, -3.95], c: 'wood' },
  { s: 'box', d: [2.5, 0.15, 0.1], at: [0, 0.075, 3.95], c: 'wood' },
  { s: 'box', d: [2.5, 0.1, 7.7], at: [0, 0.05, 0], c: 0xd8c9a0 },                      // gravel fill, inside the boards
  { s: 'ball', d: [0.06], at: [-0.6, 0.16, -2.0], c: 'steel', seg: 6 },                 // three boules on the gravel
  { s: 'ball', d: [0.06], at: [0.2, 0.16, -1.4], c: 'steel', seg: 6 },
  { s: 'ball', d: [0.06], at: [-0.1, 0.16, 0.9], c: 'steel', seg: 6 },
  { s: 'ball', d: [0.025], at: [0.5, 0.125, 0.2], c: 'red', seg: 6 },                    // red jack
  { s: 'ball', d: [0.06], at: [2.2, 0.06, 2.5], c: 'steel', seg: 6 },                    // the badly thrown boule
  { s: 'cyl', d: [0.02, 0.02, 1.0], at: [0.9, 0.5, -3.5], c: 'bark', seg: 6 },           // scoreboard stake
  { s: 'box', d: [0.5, 0.3, 0.06], at: [0.9, 1.0, -3.5], c: 'white' },                  // scoreboard
];

const washingLineParts: Part[] = [
  { s: 'box', d: [0.06, 1.8, 0.06], at: [-1.5, 0.9, 0], c: 'wood' },                    // T-posts
  { s: 'box', d: [0.06, 1.8, 0.06], at: [1.5, 0.9, 0], c: 'wood' },
  { s: 'box', d: [0.3, 0.08, 0.12], at: [-1.5, 1.83, 0], c: 'wood-dark' },             // T-bars
  { s: 'box', d: [0.3, 0.08, 0.12], at: [1.5, 1.83, 0], c: 'wood-dark' },
  { s: 'box', d: [1.5, 0.012, 0.012], at: [-0.75, 1.65, 0], rot: [0, 0, -3.81], c: 'iron' }, // sagging line
  { s: 'box', d: [1.5, 0.012, 0.012], at: [0.75, 1.65, 0], rot: [0, 0, 3.81], c: 'iron' },
  { s: 'box', d: [0.36, 0.4, 0.03], at: [-1.0, 1.437, 0], c: 'blue' },                  // striped shirt
  { s: 'box', d: [0.4, 0.05, 0.12], at: [-1.0, 1.3, 0], c: 'white' },
  { s: 'box', d: [0.4, 0.05, 0.12], at: [-1.0, 1.4, 0], c: 'white' },
  { s: 'box', d: [0.08, 0.3, 0.03], at: [-0.4, 1.447, 0], c: 'red' },                  // long sock
  { s: 'box', d: [0.14, 0.07, 0.04], at: [-0.36, 1.3, 0], c: 'red' },
  { s: 'cone', d: [0.1, 0.2], at: [0.4, 1.497, 0], rot: [180, 0, 0], c: 'red', seg: 8 }, // tiny gnome hat
  { s: 'box', d: [0.18, 0.18, 0.01], at: [0.9, 1.54, 0], c: 'cloth' },                  // polka-dot hanky
  { s: 'ball', d: [0.02], at: [0.86, 1.56, 0.02], c: 'red', seg: 6 },
  { s: 'ball', d: [0.02], at: [0.94, 1.5, 0.02], c: 'red', seg: 6 },
  { s: 'box', d: [0.02, 0.06, 0.02], at: [-1.0, 1.63, 0], c: 'wood-light' },            // pegs
  { s: 'box', d: [0.02, 0.06, 0.02], at: [-0.4, 1.6, 0], c: 'wood-light' },
  { s: 'box', d: [0.02, 0.06, 0.02], at: [0.4, 1.6, 0], c: 'wood-light' },
  { s: 'box', d: [0.02, 0.06, 0.02], at: [0.9, 1.63, 0], c: 'wood-light' },
];

const bistroParts: Part[] = [
  { s: 'cyl', d: [0.35, 0.35, 0.05], at: [0, 0.775, 0], c: 'tint', seg: 10 },           // round table top
  { s: 'cyl', d: [0.04, 0.04, 0.76], at: [0, 0.38, 0], c: 'iron-dark', seg: 6 },         // pedestal
  { s: 'cyl', d: [0.2, 0.2, 0.03], at: [0, 0.015, 0], c: 'iron-dark', seg: 8 },          // foot
  { s: 'box', d: [0.4, 0.04, 0.4], at: [-0.5, 0.43, 0], c: 'tint', mirror: true },      // folding chair seats
  { s: 'box', d: [0.4, 0.44, 0.03], at: [-0.5, 0.64, -0.21], c: 'tint', mirror: true }, // backs
  { s: 'box', d: [0.03, 0.43, 0.03], at: [-0.67, 0.215, -0.17], c: 'iron-dark', mirror: true },
  { s: 'box', d: [0.03, 0.43, 0.03], at: [-0.33, 0.215, -0.17], c: 'iron-dark', mirror: true },
  { s: 'box', d: [0.03, 0.43, 0.03], at: [-0.67, 0.215, 0.17], c: 'iron-dark', mirror: true },
  { s: 'box', d: [0.03, 0.43, 0.03], at: [-0.33, 0.215, 0.17], c: 'iron-dark', mirror: true },
  { s: 'cyl', d: [0.05, 0.04, 0.11], at: [0.1, 0.845, 0.1], c: 'copper', seg: 8 },        // coffee pot
  { s: 'cyl', d: [0.02, 0.02, 0.04], at: [-0.12, 0.815, 0.1], c: 'white', seg: 8 },      // two cups
  { s: 'cyl', d: [0.02, 0.02, 0.04], at: [-0.05, 0.815, -0.12], c: 'white', seg: 8 },
];

const roseArchParts: Part[] = [
  { s: 'box', d: [0.04, 1.6, 0.04], at: [0.8, 0.8, 0.28], c: 'iron-dark', mirror: true }, // side frames
  { s: 'box', d: [0.04, 1.6, 0.04], at: [0.8, 0.8, -0.28], c: 'iron-dark', mirror: true },
  { s: 'ring', d: [0.8, 0.03, 180], at: [0, 1.6, 0.28], c: 'iron-dark', seg: 6 },          // semicircle top
  { s: 'ring', d: [0.8, 0.03, 180], at: [0, 1.6, -0.28], c: 'iron-dark', seg: 6 },
  { s: 'ball', d: [0.07], at: [0.8, 1.72, 0.3], c: 'pink', seg: 6 },                       // roses
  { s: 'ball', d: [0.07], at: [0.72, 2.0, 0.3], c: 'red', seg: 6 },
  { s: 'ball', d: [0.07], at: [0.48, 2.2, 0.3], c: 'pink', seg: 6 },
  { s: 'ball', d: [0.07], at: [0.0, 2.45, 0.3], c: 'red', seg: 6 },
  { s: 'ball', d: [0.07], at: [-0.48, 2.2, 0.3], c: 'pink', seg: 6 },
  { s: 'ball', d: [0.07], at: [-0.72, 2.0, 0.3], c: 'red', seg: 6 },
  { s: 'ball', d: [0.1], at: [0.6, 2.12, 0.3], c: 'leaf', seg: 6 },                       // green clumps
  { s: 'ball', d: [0.1], at: [0.2, 2.36, 0.3], c: 'leaf-dark', seg: 6 },
  { s: 'ball', d: [0.1], at: [-0.2, 2.36, 0.3], c: 'leaf', seg: 6 },
  { s: 'ball', d: [0.1], at: [-0.6, 2.12, 0.3], c: 'leaf-dark', seg: 6 },
  { s: 'ball', d: [0.07], at: [0.1, 2.49, -0.3], c: 'pink', seg: 6 },                      // roses on the back ring
  { s: 'ball', d: [0.07], at: [-0.5, 2.22, -0.3], c: 'red', seg: 6 },
  { s: 'ball', d: [0.07], at: [0.5, 2.22, -0.3], c: 'red', seg: 6 },
  { s: 'ball', d: [0.1], at: [-0.25, 2.34, -0.3], c: 'leaf', seg: 6 },
  { s: 'ball', d: [0.1], at: [0.25, 2.34, -0.3], c: 'leaf-dark', seg: 6 },
];

const waterButtParts: Part[] = [
  { s: 'box', d: [0.22, 0.08, 0.12], at: [-0.2, 0.04, 0], c: 'clay-dark' },              // two bricks
  { s: 'box', d: [0.22, 0.08, 0.12], at: [0.2, 0.04, 0], c: 'clay-dark' },
  { s: 'cyl', d: [0.32, 0.35, 0.8], at: [0, 0.47, 0], c: 'tint', seg: 10 },              // barrel
  { s: 'cyl', d: [0.34, 0.34, 0.06], at: [0, 0.89, 0], c: 'tint', seg: 10 },            // lid
  { s: 'cyl', d: [0.02, 0.02, 0.12], at: [0, 0.2, 0.36], rot: [90, 0, 0], c: 'brass', seg: 6 }, // brass tap
  { s: 'ball', d: [0.035], at: [0, 0.2, 0.44], c: 'brass', seg: 6 },
  { s: 'cyl', d: [0.04, 0.04, 0.26], at: [0, 0.82, -0.43], rot: [90, 0, 0], c: 'iron-dark', seg: 6 }, // downpipe stub
];

export const GTA_EURO_GARDEN_B: readonly PrefabDef[] = [
  {
    id: 'euro-ivy-wall', name: 'Ivy Garden Wall', category: 'prop', uses: ['place'],
    tags: ['wall', 'brick', 'ivy', 'ivy-wall', 'garden', 'coping', 'gta', 'euro'], emoji: [],
    tint: 'clay-dark',
    footprint: { r: 0.2, h: 1.8 },
    about: 'Gnome Theft Auto: the Ivy Garden Wall. A 3 m section of old red brick, 1.6 tall with a stone coping, dark green ivy clumps on the front and a spill over the top. Tint is the brick, ivy is leaf colours.',
    examine: [
      'An old brick wall with a stone cap, the bricks gone soft at the corners and the mortar gone a little bit grey, like the face of a retired professor.',
      'Saying: an ivy wall is a wall that has been quietly taken over, one leaf at a time, and it has never once asked for permission.',
      'Tip: keep your hands off the ivy on the front. The clumps are thick, and most of what is hiding in them is a snail with a grudge.',
      'Joke: the council wanted the wall pulled down for safety, and the ivy wrote a very long letter in protest, in triplicate.',
      'A small brass plate was screwed into the bricks at one time, and the ivy has grown over every letter except the word for later.',
    ],
    parts: ivyWallParts,
  },
  {
    id: 'euro-vine-pergola', name: 'Vine Pergola', category: 'prop', uses: ['place'],
    tags: ['pergola', 'vine', 'grape', 'arbour', 'timber', 'shade', 'garden', 'gta', 'euro'], emoji: [],
    footprint: { r: 0.15, h: 2.5 },
    about: 'Gnome Theft Auto: the Vine Pergola. Four timber posts 2.4 tall with beams and cross rafters, a vine on one post, leafy clumps on top and three bunches of purple grapes hanging from the front beam.',
    examine: [
      'A timber frame with four posts, two long beams and a row of rafters, all smothered in a grape vine that has decided the shade is its own idea.',
      'Saying: a pergola is a roof that has agreed to let the sky in, a few leaves at a time, provided you pay attention to the leaves.',
      'Tip: sit under it in the afternoon. The grapes are sour in June and sweet in September, and the wasps know the calendar better than you do.',
      'Joke: the grapes are kept under the pergola so the neighbours cannot reach them, and the neighbours have simply built a ladder on their side.',
      'A bottle with a cork and a little handwritten label hangs off the back post, dated some years ago, and the label has never been finished.',
    ],
    parts: vinePergolaParts,
  },
  {
    id: 'euro-boules-court', name: 'Boules Court', category: 'prop', uses: ['place'],
    tags: ['boules', 'court', 'gravel', 'pitch', 'game', 'timber', 'sport', 'gta', 'euro'], emoji: [],
    footprint: { r: 1.4, h: 0.15 },
    about: 'Gnome Theft Auto: the Boules Court. A long raised gravel court 2.8 by 8 m with timber edges, three silver boules and a red jack on the gravel, one stray boule outside and a small scoreboard on a stake.',
    examine: [
      'A long raised bed of pale gravel with timber edges, and three silver balls and a small red one resting on it as if the game was interrupted for lunch.',
      'Saying: a boule thrown well is a boule that stays where it lands, and a boule thrown badly is a story for the rest of the afternoon.',
      'Tip: stand at the end with the scoreboard. The gravel at the far end has been raked so often that it holds your footprints for a week.',
      'Joke: the rules are simple, the scores are complicated, and the scoreboard has been wrong since it was painted in a strike.',
      'The one stray boule out past the edge has been there all summer, and nobody will say who threw it, or why it went quite so far.',
    ],
    parts: boulesParts,
  },
  {
    id: 'euro-washing-line', name: 'Washing Line', category: 'prop', uses: ['place'],
    tags: ['washing', 'line', 'laundry', 'clothes', 'pegs', 'post', 'garden', 'gta', 'euro'], emoji: [],
    tint: 'wood',
    footprint: { r: 0.1, h: 1.9 },
    about: 'Gnome Theft Auto: the Washing Line. Two T-posts 3.2 m apart with a sagging line and hanging laundry: a striped shirt, a long sock, a tiny gnome hat and a polka-dot hanky, with wooden pegs.',
    examine: [
      'A line strung between two T-shaped posts, sagging a little under the weight of a striped shirt, a long sock, a small pointed hat and a spotted hanky.',
      'Saying: washing dries best on a line that has been pulled tight by somebody who knows what they are doing, and nobody here has.',
      'Tip: take the washing in before the rain. The line will hold anything you leave on it, including the rain, and it will not let go of the rain.',
      'Joke: the sock has been hanging there since the spring and nobody has ever found its partner, which the sock regards as a personal triumph.',
      'The hat is the wrong size for any gnome in the street, and it has been on the line so long that it has started to look like it is waiting.',
    ],
    parts: washingLineParts,
  },
  {
    id: 'euro-bistro-set', name: 'Bistro Garden Set', category: 'prop', uses: ['place', 'sit'],
    tags: ['bistro', 'table', 'chair', 'folding', 'cafe', 'metal', 'coffee', 'garden', 'gta', 'euro'], emoji: [],
    tint: 0x2f6b8f,
    seat: [-0.5, 0.45, 0],
    footprint: { r: 0.9, h: 0.8 },
    about: 'Gnome Theft Auto: the Bistro Garden Set. A small round table 0.8 tall with two folding chairs, one at each side, and a coffee pot with two cups on top. Tint is the painted metal.',
    examine: [
      'A small round table with two folding chairs drawn up to it, painted a blue that was once very bright and is now the colour of a tired sea.',
      'Saying: a bistro table is for two people who have agreed to share one coffee, and for the third person who arrives to share the cups.',
      'Tip: sit on the left chair. The right one wobbles on the back leg, and the wobble is more pronounced after the second cup.',
      'Joke: the coffee is served in very small cups so that nobody can say they had a second one, which is the only rule anybody has ever followed.',
      'The coffee pot has a little dent on one side, and a waiter who was here in the spring says it was not him, and he was not even here then.',
    ],
    parts: bistroParts,
  },
  {
    id: 'euro-rose-arch', name: 'Rose Arch', category: 'prop', uses: ['place'],
    tags: ['rose', 'roses', 'arch', 'arbour', 'metal', 'flower', 'climbing', 'garden', 'gta', 'euro'], emoji: [],
    footprint: { r: 0.1, h: 2.4 },
    about: 'Gnome Theft Auto: the Rose Arch. A metal arch 1.6 wide and 2.4 tall with a semicircular top, climbing roses pink and red along it and green clumps between them.',
    examine: [
      'A metal arch with a rounded top, so covered in pink and red roses that the iron underneath is only a rumour between the flowers.',
      'Saying: a rose will climb anything you put in front of it, and an arch is only a very polite invitation to climb through.',
      'Tip: walk under it slowly. The thorns are not very large, but they are very well organised and they have been practising.',
      'Joke: the roses are said to be the finest in the street, and they say so themselves, in pink, at the top of their voices.',
      'A small wooden sign hangs from the crossbar, reading the name of a rose that nobody has ever seen, and it has been there longer than the arch.',
    ],
    parts: roseArchParts,
  },
  {
    id: 'euro-water-butt', name: 'Water Butt', category: 'prop', uses: ['place'],
    tags: ['water', 'butt', 'barrel', 'rain', 'tap', 'plastic', 'garden', 'gta', 'euro'], emoji: [],
    tint: 0x3f6b3a,
    footprint: { r: 0.35, h: 1.1 },
    about: 'Gnome Theft Auto: the Water Butt. A green plastic rain barrel 0.9 tall with a lid, a brass tap low on the front and a downpipe stub at the back, standing on two bricks. Tint is the barrel.',
    examine: [
      'A green plastic barrel with a lid and a brass tap near the bottom, standing on two bricks so it cannot be rolled off by a determined cat.',
      'Saying: a water butt catches the rain for the dry months, and it is the only container in the garden that is glad to be full of weather.',
      'Tip: turn the tap gently. The first drop is always cold, and the second one is always a surprise, and the third is usually the bucket.',
      'Joke: the barrel is so full of rain that it has begun to hold opinions about the weather, and most of them are about the bucket.',
      'A cloth sack has been tied under the tap for a reason nobody remembers, and the rain keeps rinsing the same old word off the label.',
    ],
    parts: waterButtParts,
  },
];
