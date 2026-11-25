// Gnome Theft Auto (E16): wearable rewards for the countryside achievements. Each is the reward of one achievement in
// packages/achievements/src/catalog.ts.
import type { PrefabDef } from '../types';

export const GTA_COUNTRY_GEAR: readonly PrefabDef[] = [
  {
    id: 'croft-trowel', name: 'Croft Trowel', category: 'armor', uses: ['hold'], grip: [0, 0.07, 0], wear: { rot: [90, 0, 0] },
    tags: ['trowel', 'garden', 'dig', 'spade', 'wood', 'steel', 'croft', 'hand', 'reward', 'gta'], emoji: [],
    about: 'First Sprout: a small garden trowel with a worn wooden handle and a steel blade with soil on the tip. Held by the handle. Plain colours, no tint.',
    examine: [
      'A small garden trowel with a worn wooden handle and a steel blade, a little soil still caked on the tip.',
      'Croft saying: the first sprout is the one you did not plant, and the trowel is how you find out where it came from.',
      'Tip: dig with the blade, not the handle. The handle is for holding and the blade is for being sorry about later.',
      'Joke: the handle has been worn smooth by three generations of Brambles, and the blade by one very patient cat.',
      'Left standing in a flowerbed by the croft gate, its blade pointing at the sky as if it had just finished a job.',
    ],
    parts: [
      { s: 'cyl', d: [0.014, 0.014, 0.14], at: [0, 0.07, 0], c: 'wood-dark', seg: 8 },    // handle (min.y = 0)
      { s: 'cyl', d: [0.012, 0.012, 0.03], at: [0, 0.155, 0], c: 'steel', seg: 6 },        // ferrule
      { s: 'box', d: [0.05, 0.1, 0.006], at: [0, 0.2, 0], c: 'steel' },                     // blade
      { s: 'box', d: [0.04, 0.02, 0.01], at: [0, 0.26, 0], c: 'dirt' },                     // soil on the tip
    ],
  },
  {
    id: 'croft-straw-hat', name: 'Croft Straw Hat', category: 'armor', uses: ['wear-head'],
    tags: ['hat', 'straw', 'farm', 'wide', 'brim', 'acorn', 'croft', 'head', 'reward', 'gta'], emoji: [],
    about: 'Oak Patience: a wide-brimmed straw farm hat with a green band and an acorn tucked in the band. Plain colours, no tint.',
    examine: [
      'A wide-brimmed straw farm hat with a green band, and a single acorn tucked into the band like a pencil behind an ear.',
      'Croft saying: a hat keeps the sun off the head, and an oak keeps the sun off everything else for three hundred years.',
      'Tip: tip the brim down on a windy day. A straw brim that is lifted by the wind is just a very slow kite.',
      'Joke: the acorn has been in the band since the Croft was sold, and it is still waiting for someone to ask about it.',
      'Worn by a farmer who grew one oak in forty years and was not one bit in a hurry about the second.',
    ],
    parts: [
      { s: 'cyl', d: [0.2, 0.2, 0.02], at: [0, 0.01, 0], c: 0xe3c77a, seg: 12 },            // brim (min.y = 0)
      { s: 'cyl', d: [0.14, 0.15, 0.1], at: [0, 0.07, 0], c: 0xe3c77a, seg: 10 },            // crown
      { s: 'cyl', d: [0.152, 0.152, 0.03], at: [0, 0.04, 0], c: 'green', seg: 10 },         // green band
      { s: 'ball', d: [0.02], at: [0.15, 0.04, 0], c: 'leather', seg: 6 },                  // acorn
      { s: 'cyl', d: [0.02, 0.015, 0.012], at: [0.15, 0.062, 0], c: 'bark', seg: 6 },       // acorn cap
    ],
  },
  {
    id: 'brass-knocker-pendant', name: 'Brass Knocker Pendant', category: 'armor', uses: ['wear-neck'],
    tags: ['pendant', 'knocker', 'ring', 'brass', 'ribbon', 'necklace', 'manor', 'neck', 'reward', 'gta'], emoji: [],
    about: 'Mansion on the Hill: a heavy brass ring, a miniature of the Brassknock Manor knocker, on a dark ribbon round the neck. Plain colours, no tint.',
    examine: [
      'A heavy brass ring, a miniature of a knocker that is far too big for any door, hanging on a dark ribbon round the neck.',
      'Manor saying: a knocker that is never used keeps its shine, and the shine is the only thing the house has ever answered.',
      'Tip: knock once, politely, before you walk in. The Countess will not hear you, but the ring will feel better for it.',
      'Joke: the knocker has been polished every morning for a century and has yet to be lifted once.',
      'Given to a visitor who came to the front door, was not admitted, and was too polite to ask the way round the back.',
    ],
    parts: [
      { s: 'ring', d: [0.2, 0.012], at: [0, 0.02, 0], rot: [90, 0, 0], c: 'black', seg: 12 },  // ribbon (min.y = 0.008)
      { s: 'box', d: [0.012, 0.04, 0.05], at: [0, 0.05, 0.22], c: 'black' },                    // ribbon drop
      { s: 'ring', d: [0.05, 0.01], at: [0, 0.1, 0.27], c: 'brass', seg: 10 },                    // knocker ring
      { s: 'box', d: [0.02, 0.02, 0.012], at: [0, 0.055, 0.27], c: 'brass' },                    // knocker plate
    ],
  },
  {
    id: 'antler-headband', name: 'Antler Headband', category: 'armor', uses: ['wear-head'],
    tags: ['headband', 'antler', 'antlers', 'deer', 'felt', 'brown', 'band', 'head', 'reward', 'gta'], emoji: [],
    about: 'Deer Me: a brown headband with two small branching felt antlers, three tines each. Plain colours, no tint.',
    examine: [
      'A brown headband with two small branching antlers made of felt, three tines on each side and stitched at the join.',
      'Mossy Wood saying: a deer will forgive you for almost anything, provided you hold very still and smell of nothing.',
      'Tip: keep the antlers level. Lopsided antlers invite the deer to ask questions, and deer ask terrible questions.',
      'Joke: the felt does not shed, which is the one thing the real antlers never managed to learn.',
      'Sewn by a hunter who wanted to join the herd and was asked to leave the herd before the stitching was finished.',
    ],
    parts: [
      { s: 'cyl', d: [0.14, 0.14, 0.04], at: [0, 0.02, 0], c: 'leather', seg: 10 },                   // band (min.y = 0)
      { s: 'cyl', d: [0.012, 0.012, 0.12], at: [0.07, 0.11, 0], rot: [0, 0, -20], c: 'wood', seg: 6, mirror: true }, // antler stem
      { s: 'cyl', d: [0.008, 0.008, 0.05], at: [0.1, 0.2, 0], rot: [0, 0, -50], c: 'wood', seg: 6, mirror: true },    // tine
      { s: 'cyl', d: [0.008, 0.008, 0.05], at: [0.088, 0.198, 0], rot: [0, 0, -15], c: 'wood', seg: 6, mirror: true }, // tine
      { s: 'cyl', d: [0.008, 0.008, 0.04], at: [0.12, 0.13, 0], rot: [0, 0, -70], c: 'wood', seg: 6, mirror: true },   // low tine
    ],
  },
  {
    id: 'camp-kettle-pack', name: 'Camp Kettle Pack', category: 'armor', uses: ['wear-back'],
    tags: ['pack', 'rucksack', 'kettle', 'bedroll', 'camp', 'olive', 'strap', 'back', 'reward', 'gta'], emoji: [],
    about: 'Camp Crasher: a small olive rucksack with a black kettle strapped to the outside and a rolled bedroll on top. Plain colours, no tint.',
    examine: [
      'A small olive rucksack with a black kettle strapped to the outside and a rolled bedroll tied on top like a parcel.',
      'Hunters saying: a camp is only ever as big as its kettle, and the kettle is always the largest thing in the camp.',
      'Tip: put the kettle on the outside. A kettle inside the pack is a kettle that gets tea on the bedroll.',
      'Joke: the bedroll has been slept in once, by the hunter who came to collect the kettle and stayed for the night.',
      'Carried out of a camp in the empty country by a gnome who said he was only borrowing the kettle and was not sure whose it was.',
    ],
    parts: [
      { s: 'box', d: [0.26, 0.3, 0.12], at: [0, 0.15, 0], c: 0x6b7a3a },                             // pack (min.y = 0)
      { s: 'box', d: [0.27, 0.06, 0.13], at: [0, 0.32, 0], c: 0x6b7a3a },                            // flap
      { s: 'cyl', d: [0.05, 0.05, 0.26], at: [0, 0.41, 0], rot: [0, 0, 90], c: 'straw', seg: 8 },   // bedroll
      { s: 'cyl', d: [0.06, 0.07, 0.1], at: [0, 0.1, -0.12], c: 'black', seg: 8 },                  // kettle
      { s: 'cyl', d: [0.035, 0.035, 0.012], at: [0, 0.2, -0.12], c: 'iron-dark', seg: 8 },            // kettle lid
      { s: 'box', d: [0.24, 0.02, 0.01], at: [0, 0.12, 0.065], c: 'leather-dark' },                  // strap
    ],
  },
  {
    id: 'spirit-level', name: 'Spirit Level', category: 'armor', uses: ['hold'], grip: [0, 0.25, 0],
    tags: ['level', 'spirit', 'bubble', 'vial', 'yellow', 'plumb', 'builder', 'hand', 'reward', 'gta'], emoji: [],
    about: 'Level Best: a yellow spirit level about half a gnome long, held by its middle, with a green vial and a bubble. Plain colours, no tint.',
    examine: [
      'A yellow spirit level about half a gnome long, with a green vial set in the middle and one small bubble floating in it.',
      'Levelright saying: the bubble goes to the middle of the vial, and everything else must go to the bubble.',
      'Tip: lay it on the top edge, not the side. The side is where the wall goes out of square, and nobody wants to hear about that.',
      'Joke: the bubble has been exactly level for the whole of the building season and has never once been asked how it feels.',
      'Carried by a foreman under one arm who said that everything else was fine, and had never once looked at the bubble.',
    ],
    parts: [
      { s: 'box', d: [0.04, 0.5, 0.02], at: [0, 0.25, 0], c: 'yellow' },                          // body (min.y = 0)
      { s: 'box', d: [0.02, 0.05, 0.004], at: [0, 0.3, 0.012], c: 'green' },                      // vial
      { s: 'ball', d: [0.007], at: [0, 0.305, 0.016], c: 'white', seg: 6 },                       // bubble
      { s: 'box', d: [0.05, 0.01, 0.024], at: [0, 0.005, 0], c: 'black' },                        // bottom end cap
    ],
  },
];
