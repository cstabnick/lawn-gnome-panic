// Gnome Theft Auto, Saltbucket Shore (E11 coast): wearable achievement rewards (head, neck, back).
import type { PrefabDef } from '../types';

export const GTA_COAST_GEAR: readonly PrefabDef[] = [
  {
    id: 'ski-visor', name: 'Salt-Skier Visor', category: 'armor', uses: ['wear-head'],
    tags: ['visor', 'sun', 'skier', 'ski', 'cap', 'hat', 'saltbucket', 'head', 'reward'], emoji: [],
    tint: 0x2a9df4,
    about: 'Salt Skier: a white sun visor with a band ring and a curved peak (the peak takes a tint, default sky blue) and a tiny red ski badge on the front. Achievement reward for Salt Skier.',
    examine: [
      'A white sun visor with a thin band ring and a stiff peak, tinted sky blue, with a tiny red ski badge on the front.',
      'Saltbucket saying: the Saltwater is flat until you lean on it, and then it is the fastest road on the whole shore.',
      'Tip: keep the rope tight and the peak low, or the spray gets under the brim and the Saltwater gets its laugh.',
      'Joke: the badge says SKI. Nobody has yet been towed far enough across the Saltwater to check the spelling.',
      'The peak has been bent back by the sea wind so often that it curls up at the tip, like a wave that stopped halfway.',
    ],
    parts: [
      { s: 'ring', d: [0.15, 0.012], at: [0, 0.012, 0], rot: [90, 0, 0], c: 'white', seg: 12 },
      { s: 'box', d: [0.26, 0.012, 0.12], at: [0, 0.03, 0.15], rot: [-8, 0, 0], c: 'tint' },
      { s: 'box', d: [0.03, 0.02, 0.01], at: [0, 0.012, 0.158], c: 'red' },
    ],
  },
  {
    id: 'life-ring-back', name: 'Life Ring', category: 'armor', uses: ['wear-back'],
    tags: ['life', 'ring', 'float', 'rope', 'stripe', 'orange', 'back', 'saltbucket', 'reward'], emoji: [],
    about: 'Wake Jumper: an orange and white striped life ring worn flat on the back, with a rope loop at the top. Achievement reward for Wake Jumper.',
    examine: [
      'A fat orange and white striped ring worn flat across the back, with a loop of rope at the top, about as wide as a gnome.',
      'Saying from the Saltwater: a ring thrown is a promise kept, and the gnome who catches it owes the thrower a cup of tea.',
      'Tip: tie the rope before the jump. A ring that is tied to nothing is only a very round thing for the fish to look at.',
      'Joke: the ring was made to save drowning gnomes, and has since been used for everything except drowning gnomes.',
      'Someone has pressed a tiny bucket stamp inside the rim, the Saltbucket mark, so the ring knows where it belongs.',
    ],
    parts: [
      { s: 'ring', d: [0.16, 0.04], at: [0, 0.2, 0], c: 'orange', seg: 12 },
      { s: 'box', d: [0.07, 0.07, 0.09], at: [0.16, 0.2, 0], c: 'white' },
      { s: 'box', d: [0.07, 0.07, 0.09], at: [-0.16, 0.2, 0], c: 'white' },
      { s: 'box', d: [0.07, 0.07, 0.09], at: [0, 0.36, 0], c: 'white' },
      { s: 'box', d: [0.07, 0.07, 0.09], at: [0, 0.04, 0], c: 'white' },
      { s: 'ring', d: [0.05, 0.01], at: [0, 0.44, 0], c: 'bark', seg: 8 },
    ],
  },
  {
    id: 'spokewheel-scarf', name: 'Spokewheel Scarf', category: 'trinket', uses: ['wear-neck'],
    tags: ['scarf', 'knit', 'loop', 'stripe', 'red', 'teacup', 'spokewheel', 'neck', 'saltbucket', 'reward'], emoji: [],
    about: 'Full Circle: a red and white striped knitted scarf loop with two tails, one ending in a tiny teacup charm. Achievement reward for Full Circle.',
    examine: [
      'A red and white striped knitted loop with two tails hanging on the chest, and a tiny teacup charm on the end of one tail.',
      'Spokewheel saying: a rider who goes all the way round keeps one scarf for the second lap and one for the cold.',
      'Tip: knit the stripes tight. A loose stripe catches on the spokes, and the gnome ends up wearing the wheel.',
      'Joke: the teacup was meant for the Bathtub Queen, who sent it back empty with a note that said nothing at all.',
      'The knitting drops one stitch for every full turn, so the scarf is a little looser at the end of each round.',
    ],
    parts: [
      { s: 'ring', d: [0.2, 0.03], at: [0, 0.03, -0.04], rot: [90, 0, 0], c: 'red', seg: 12 },
      { s: 'ball', d: [0.034], at: [-0.2, 0.03, -0.04], c: 'white', seg: 6 },
      { s: 'ball', d: [0.034], at: [0.2, 0.03, -0.04], c: 'white', seg: 6 },
      { s: 'ball', d: [0.034], at: [0, 0.03, -0.24], c: 'white', seg: 6 },
      { s: 'box', d: [0.05, 0.14, 0.02], at: [-0.05, 0.07, 0.19], c: 'red' },
      { s: 'box', d: [0.05, 0.16, 0.02], at: [0.06, 0.1, 0.19], c: 'red' },
      { s: 'cyl', d: [0.022, 0.016, 0.03], at: [0.06, 0.015, 0.2], c: 'chalk', seg: 8 },
    ],
  },
  {
    id: 'pirate-bandana', name: 'Pirate Bandana', category: 'armor', uses: ['wear-head'],
    tags: ['bandana', 'pirate', 'cap', 'hat', 'polka', 'dot', 'red', 'knot', 'head', 'saltbucket', 'reward'], emoji: [],
    tint: 'red',
    about: "The Queen's Treasure: a red bandana worn like a squashed cap, with white polka dots and a knot with two short tails at the back. The cloth takes a tint. Achievement reward for The Queen's Treasure.",
    examine: [
      'A red bandana worn like a squashed cap, with white polka dots across the crown and a knot at the back with two short tails.',
      'Saying from Long Spoon Pier: a pirate always knows where the treasure is, and always forgets it on the way back.',
      'Tip: knot it at the back, where the dots face the sea. Dots at the front only frighten the gulls.',
      'Joke: the Bathtub Queen wears one for every treasure she has found, and her head is now almost entirely bandana.',
      'Each dot was pressed in with the same thumb, and the thumb has never once admitted to finding gold in the bath.',
    ],
    parts: [
      { s: 'ball', d: [0.15], at: [0, 0.045, 0], scale: [1, 0.3, 1], c: 'tint', seg: 10 },
      { s: 'ball', d: [0.025], at: [0, 0.085, 0.07], scale: [1, 0.2, 1], c: 'white', seg: 6 },
      { s: 'ball', d: [0.025], at: [0.06, 0.082, 0.04], scale: [1, 0.2, 1], c: 'white', seg: 6 },
      { s: 'ball', d: [0.025], at: [-0.07, 0.082, -0.02], scale: [1, 0.2, 1], c: 'white', seg: 6 },
      { s: 'ball', d: [0.025], at: [0.02, 0.082, -0.08], scale: [1, 0.2, 1], c: 'white', seg: 6 },
      { s: 'ball', d: [0.03], at: [0, 0.045, -0.16], c: 'tint', seg: 6 },
      { s: 'box', d: [0.025, 0.025, 0.1], at: [0.03, 0.035, -0.2], rot: [0, 0, -20], c: 'tint', mirror: true },
    ],
  },
  {
    id: 'eye-patch', name: 'Toy Eye Patch', category: 'armor', uses: ['wear-head'],
    tags: ['eye', 'patch', 'pirate', 'band', 'black', 'skull', 'head', 'saltbucket', 'reward'], emoji: [],
    about: 'Shiver Me Glaze: a thin black band round the head with a black oval eye patch over one eye and a tiny gold skull dot. Achievement reward for Shiver Me Glaze.',
    examine: [
      'A thin black band round the head with a black oval patch over one eye, and a tiny gold skull dot in the middle of it.',
      'Saying from the Pier: one eye for the sea and one for the shore, and a gnome who keeps both open is just nosy.',
      'Tip: switch the patch to the other eye on the hour. Otherwise the gnome forgets which side has been looking.',
      'Joke: the skull dot is a gold button from an old Saltbucket coat. It was the only gold the pirate had to hand.',
      'The patch is stitched from an old boot cuff, and the stitches still show the shape of a boot toe.',
    ],
    parts: [
      { s: 'ring', d: [0.15, 0.012], at: [0, 0.012, 0], rot: [90, 0, 0], c: 'black', seg: 12 },
      { s: 'ball', d: [0.042], at: [-0.06, 0.07, 0.15], scale: [1, 1, 0.25], c: 'black', seg: 8 },
      { s: 'ball', d: [0.008], at: [-0.06, 0.07, 0.172], c: 'gold', seg: 6 },
    ],
  },
];
