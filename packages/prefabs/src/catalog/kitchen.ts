// Kitchen things for cooking games: the bowl, the tin, the oven and the finished cake.
import type { PrefabDef } from '../types';

export const KITCHEN: PrefabDef[] = [
  {
    id: 'mixing-bowl', name: 'Mixing Bowl', category: 'container', uses: ['place'],
    tags: ['bowl', 'mixing', 'kitchen', 'ceramic', 'batter'], emoji: ['🥣'],
    about: 'A wide glazed mixing bowl with a blue band. Where the batter gets made.',
    examine: [
      'A wide, glazed bowl with a blue band round its belly and a chip on the rim that everyone agrees to ignore.',
      'Gnome cooks say a bowl must never be washed with the spoon still in it. Nobody remembers why.',
      'Good for batter, better for eggs, and best of all for hiding a snack from the rest of the family.',
      'The inside is smooth as a pebble. Stir for long enough and you can see your own face in the flour.',
    ],
    parts: [
      { s: 'cyl', d: [0.14, 0.07, 0.12], at: [0, 0.06, 0], c: 'chalk', seg: 12 },
      { s: 'cyl', d: [0.142, 0.142, 0.022], at: [0, 0.075, 0], c: 'blue', seg: 12 },
      { s: 'ring', d: [0.14, 0.012], at: [0, 0.12, 0], rot: [90, 0, 0], c: 'chalk', seg: 12 },
      { s: 'cyl', d: [0.128, 0.128, 0.004], at: [0, 0.112, 0], c: 'cloth', seg: 12 },
    ],
  },
  {
    id: 'cake-pan', name: 'Cake Tin', category: 'tool', uses: ['place'],
    tags: ['pan', 'tin', 'cake', 'bake', 'kitchen', 'round'], emoji: [],
    about: 'A round tin cake pan with a lip, for baking.',
    examine: [
      'A round tin with a lip all the way round, dented by one enthusiastic gnome and then straightened by another.',
      'Grease it first. Gnome bakers say an ungreased tin keeps the cake, and the cake keeps its opinions to itself.',
      'Holds one cake exactly. Holds two cakes, badly.',
      'Scratched into the bottom is a gnome name, and then "NOT THE GOOD TIN".',
    ],
    parts: [
      { s: 'cyl', d: [0.16, 0.15, 0.04], at: [0, 0.02, 0], c: 'iron', seg: 12 },
      { s: 'cyl', d: [0.14, 0.14, 0.005], at: [0, 0.042, 0], c: 'iron-dark', seg: 12 },
      { s: 'ring', d: [0.16, 0.008], at: [0, 0.04, 0], rot: [90, 0, 0], c: 'steel', seg: 12 },
    ],
  },
  {
    id: 'clay-oven', name: 'Clay Oven', category: 'furniture', uses: ['place', 'open'],
    tags: ['oven', 'stove', 'kitchen', 'clay', 'bake', 'hearth'], emoji: [],
    about: 'A squat clay oven with a glowing door and a crooked chimney. Bakes, roasts, scorches.',
    examine: [
      'A squat clay oven with a round door, a glowing slot of a window and a chimney that leans like it is listening.',
      'Light it with kindling and wait. The oven decides when it is ready, and it does not explain.',
      'Gnomes say a clay oven remembers every loaf it ever baked. This one has a few it would rather forget.',
      'Keep your face back from the door. The heat has no manners.',
    ],
    lights: [{ at: [0, 0.2, 0.26], c: 'flame', intensity: 0.4, distance: 1.2 }],
    parts: [
      { s: 'box', d: [0.5, 0.42, 0.4], at: [0, 0.21, 0], c: 'clay', seg: 8 },
      { s: 'box', d: [0.56, 0.05, 0.44], at: [0, 0.445, 0], c: 'clay-dark' },
      { s: 'cyl', d: [0.14, 0.14, 0.02], at: [0, 0.2, 0.205], rot: [90, 0, 0], c: 'iron-dark', seg: 12 },
      { s: 'box', d: [0.16, 0.1, 0.01], at: [0, 0.2, 0.22], c: 'flame', glow: true },
      { s: 'cyl', d: [0.05, 0.06, 0.16], at: [0.15, 0.52, -0.08], c: 'clay-dark', seg: 8 },
    ],
  },
  {
    id: 'acorn-cake', name: 'Acorn Cake', category: 'food', uses: ['eat'],
    tags: ['cake', 'acorn', 'frosting', 'grass', 'dessert', 'food', 'treat'], emoji: ['🍰'],
    about: 'A round acorn-flour sponge with a grass-green frosting and a single acorn on top.',
    examine: [
      'A round sponge the colour of toast, under a thick layer of grass-green frosting that is still a bit wet.',
      'Acorn flour makes a sponge that is slightly bitter and entirely honest. The frosting is sweet enough to fix that.',
      'Grass frosting: whipped meadow, honey and one suspicious clover. Do not ask where the clover came from.',
      'An acorn sits on top, pressed in with a thumb. It is a decoration, and it is also the cook\'s signature.',
      'Old rhyme: "Cut the cake and count the crumbs; every crumb is a cook\'s reward."',
    ],
    parts: [
      { s: 'cyl', d: [0.2, 0.2, 0.1], at: [0, 0.05, 0], c: 'straw', seg: 12 },
      { s: 'cyl', d: [0.205, 0.205, 0.03], at: [0, 0.115, 0], c: 'grass', seg: 12 },
      { s: 'cyl', d: [0.2, 0.2, 0.012], at: [0, 0.136, 0], c: 'grass', seg: 12 },
      { s: 'ball', d: [0.025], at: [0.12, 0.1, 0.05], scale: [1, 1.6, 1], c: 'grass', seg: 6 },
      { s: 'ball', d: [0.025], at: [-0.1, 0.1, -0.1], scale: [1, 1.4, 1], c: 'grass', seg: 6 },
      { s: 'cone', d: [0.012, 0.05], at: [-0.05, 0.16, 0.03], c: 'leaf', seg: 5 },
      { s: 'cone', d: [0.012, 0.05], at: [0.04, 0.16, -0.04], c: 'leaf', seg: 5 },
      { s: 'ball', d: [0.03], at: [0, 0.165, 0], scale: [1, 0.85, 1], c: 'leather', seg: 7 },
      { s: 'cyl', d: [0.032, 0.024, 0.02], at: [0, 0.19, 0], c: 'leather-dark', seg: 7 },
    ],
  },
];
