// New prefabs for gnomeokemon. One owner (the gnomeokemon adoption issue): add entries here and nowhere else.
import type { PrefabDef } from '../types';

// The Giant Fetch Dog is authored at 0.7 of its in-game size so its largest side stays under the catalog limit
// (3 gnome heights). The game scales it back up by 1 / 0.7 (games/gnomeokemon/src/snap/models.ts).
// Coordinates below are already multiplied by 0.7. Pivots mark the head, tail and four hips that the game animates.
const FUR = 0xd97706;
const SPOT = 0x78350f;
const DARK = 0x111827;

export const GNOMEOKEMON_WORLD: readonly PrefabDef[] = [
  {
    id: 'giant-fetch-dog',
    name: 'Giant Fetch Dog',
    category: 'gnomeokemon',
    uses: ['place'],
    tags: ['gnomeokemon', 'dog', 'giant', 'fetch', 'mount', 'hound', 'saddle'],
    emoji: [],
    pivots: {
      'dog-head': [0, 1.505, 0.875],
      'dog-tail': [0, 1.295, -0.945],
      'leg-fl': [-0.315, 0.6685, 0.595],
      'leg-fr': [0.315, 0.6685, 0.595],
      'leg-bl': [-0.315, 0.6685, -0.595],
      'leg-br': [0.315, 0.6685, -0.595],
    },
    about: 'The Giant Goofy Fetch Dog: a saddled giant dog that carries the gnome photographer on rails. Front faces +z.',
    examine: [
      'A giant, goofy dog that throws balls for the gnome. It never hurts anyone, and it has never once let go of a ball.',
      'Its saddle blanket is red, its tongue is pink, and it sheds the odd tennis ball on every lap.',
      'Gnome photographers climb on, hold tight, and try to keep the shutter steady over the bumps.',
      'Do not ask the dog where the yard ends. It will fetch that too, and the stick is very large.',
    ],
    parts: [
      // Body and saddle
      { s: 'box', d: [0.91, 0.77, 1.61], at: [0, 1.015, 0], c: FUR },
      { s: 'box', d: [0.952, 0.098, 0.805], at: [0, 1.414, -0.07], c: 0xb91c1c },
      // Head (pivot dog-head): skull, snout, nose, tongue, ears, eyes
      { s: 'box', d: [0.7, 0.665, 0.77], at: [0, 1.505, 0.875], group: 'dog-head', c: FUR },
      { s: 'box', d: [0.406, 0.322, 0.455], at: [0, 1.365, 1.365], group: 'dog-head', c: FUR },
      { s: 'ball', d: [0.098], at: [0, 1.456, 1.596], group: 'dog-head', c: DARK },
      { s: 'box', d: [0.168, 0.056, 0.294], at: [0.07, 1.204, 1.47], rot: [25.78, 0, 0], group: 'dog-head', c: 0xf472b6, glow: true },
      { s: 'box', d: [0.14, 0.455, 0.315], at: [-0.392, 1.47, 0.805], rot: [0, 0, 14.32], group: 'dog-head', c: SPOT, mirror: true },
      { s: 'ball', d: [0.091], at: [-0.182, 1.624, 1.267], group: 'dog-head', c: 0xffffff, glow: true, mirror: true },
      { s: 'ball', d: [0.042], at: [-0.182, 1.624, 1.33], group: 'dog-head', c: DARK, glow: true, mirror: true },
      // Legs (pivots at the hip)
      { s: 'box', d: [0.224, 0.665, 0.238], at: [-0.315, 0.336, 0.595], group: 'leg-fl', c: FUR },
      { s: 'box', d: [0.224, 0.665, 0.238], at: [0.315, 0.336, 0.595], group: 'leg-fr', c: FUR },
      { s: 'box', d: [0.224, 0.665, 0.238], at: [-0.315, 0.336, -0.595], group: 'leg-bl', c: FUR },
      { s: 'box', d: [0.224, 0.665, 0.238], at: [0.315, 0.336, -0.595], group: 'leg-br', c: FUR },
      // Tail (pivot dog-tail)
      { s: 'box', d: [0.154, 0.154, 0.56], at: [0, 1.295, -0.945], rot: [34.38, 0, 0], group: 'dog-tail', c: SPOT },
    ],
  },
  {
    id: 'yarn-ball',
    name: 'Yarn Ball',
    category: 'gnomeokemon',
    uses: ['place'],
    tags: ['gnomeokemon', 'yarn', 'ball', 'wool', 'toy', 'cat', 'play'],
    emoji: [],
    about: 'A ball of red wool with a loose end trailing off it. Creatures bat at it. Front faces +z.',
    examine: [
      'A ball of red wool, wound too tight at the middle and far too loose at the edges.',
      'The loose end runs off across the ground. Nobody has found where it ends.',
      'Gnome rule: never leave a yarn ball where a creature can see it, and never leave it where it cannot.',
      'It has been unwound and rewound so many times that it has gone a little bit lumpy and a lot more fun.',
    ],
    parts: [
      { s: 'ball', d: [0.14], at: [0, 0.14, 0], c: 'red' },
      { s: 'ring', d: [0.14, 0.012, 360], at: [0, 0.14, 0], rot: [0, 0, 45], c: 'wool' },
      { s: 'ring', d: [0.14, 0.012, 360], at: [0, 0.14, 0], rot: [0, 0, -30], c: 'wool' },
      { s: 'cyl', d: [0.006, 0.006, 0.25], at: [0.2, 0.012, 0.06], rot: [0, 0, 90], c: 'red' },
    ],
  },
  {
    id: 'lily-pad',
    name: 'Lily Pad',
    category: 'gnomeokemon',
    uses: ['place'],
    tags: ['gnomeokemon', 'lily', 'pad', 'pond', 'leaf', 'water', 'flower'],
    emoji: [],
    about: 'A flat green lily pad with a small pink flower. Sits on pond water. Front faces +z.',
    examine: [
      'A round green leaf, flat as a plate, with a notch cut to the middle so the water can get in.',
      'A pink flower sits on it, or it might be a fleck of pond froth. The gnomes have not decided.',
      'Sit on a lily pad and you will be wet, but only as far as your hat.',
      'Small creatures climb on the pad to be above the water. The pad, so far, has not minded.',
    ],
    parts: [
      { s: 'cyl', d: [0.25, 0.25, 0.02], at: [0, 0.01, 0], c: 'leaf' },
      { s: 'box', d: [0.12, 0.024, 0.14], at: [0.1, 0.012, -0.08], rot: [0, 30, 0], c: 'water' },
      { s: 'ball', d: [0.035], at: [0.06, 0.03, 0.06], c: 'pink' },
    ],
  },
  {
    id: 'lava-rock',
    name: 'Lava Rock',
    category: 'gnomeokemon',
    uses: ['place'],
    tags: ['gnomeokemon', 'lava', 'rock', 'stone', 'cave', 'glow', 'kiln'],
    emoji: [],
    about: 'A dark rock with glowing orange cracks, left by the lava. Front faces +z.',
    examine: [
      'A dark, lumpy rock, cool on the outside and hot in its cracks, which glow the colour of a fired pot.',
      'The Kiln does not give up its heat easily. Rocks carried out of it keep their embers for a long time.',
      'Gnome tip: a lava rock warms a sitting gnome. Do not sit on it, as the rock will not warn you.',
      'Its cracks are full of light, and when the light moves, the rock looks as though it is breathing.',
    ],
    parts: [
      { s: 'ball', d: [0.25], at: [0, 0.175, 0], scale: [1, 0.7, 1], c: 'stone' },
      { s: 'ball', d: [0.07], at: [0.1, 0.22, 0.12], c: 'flame', glow: true },
      { s: 'ball', d: [0.05], at: [-0.12, 0.1, 0.1], c: 'flame', glow: true },
    ],
  },
];
