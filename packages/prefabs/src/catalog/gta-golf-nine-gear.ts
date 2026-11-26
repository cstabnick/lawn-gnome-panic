// Gnome Theft Auto: Hedgeworth Links to nine holes (batch 3 E32): wearable rewards for the nine-hole achievements.
import type { PrefabDef } from '../types';

export const GTA_GOLF_NINE_GEAR: readonly PrefabDef[] = [
  {
    id: 'turn-rosette', name: 'Turn Rosette', category: 'armor', uses: ['wear-neck'],
    wear: { at: [0, -0.12, 0] },
    tags: ['rosette', 'ribbon', 'prize', 'medal', 'nine', 'turn', 'neck', 'reward', 'gta'], emoji: [],
    about: 'The Whole Nine: a red-and-gold prize rosette with a nine stitched in the middle, on a short red ribbon. Plain colours, no tint.',
    examine: [
      'A red-and-gold rosette the size of a fat coin, with a stitched nine in the middle and two short ribbon tails hanging down.',
      'Saying of the Turn Gate: a nine is only a number until someone has walked all the way round it, and then it is a rosette.',
      'Tip: wear it on the outside of the coat. Tucked in, the ribbon thinks it has been forgotten, and it sulks.',
      'Joke: the nine was stitched by Dame Peony, who says a nine looks like a six that has been to the Bottom Garden and come back better.',
      'Awarded to anyone who finishes the full course, and to nobody who only meant to, which Basil says is the stricter rule.',
    ],
    parts: [
      { s: 'box', d: [0.05, 0.11, 0.008], at: [-0.03, 0.055, 0.165], rot: [0, 0, 12], c: 'red' },   // ribbon tail (min.y = 0)
      { s: 'box', d: [0.05, 0.11, 0.008], at: [0.03, 0.055, 0.165], rot: [0, 0, -12], c: 'red' },    // ribbon tail
      { s: 'ring', d: [0.05, 0.03, 0], at: [0, 0.085, 0.175], rot: [0, 0, 0], c: 'gold', seg: 10 },     // rosette ring
      { s: 'ball', d: [0.045], at: [0, 0.085, 0.17], scale: [1, 1, 0.3], c: 'red', seg: 10 },           // rosette centre
      { s: 'box', d: [0.04, 0.05, 0.006], at: [0, 0.085, 0.2], c: 'gold' },                          // stitched nine plate
    ],
  },
  {
    id: 'promise-boater', name: 'Promise Boater', category: 'armor', uses: ['wear-head'],
    tags: ['boater', 'straw', 'hat', 'band', 'promise', 'summer', 'head', 'reward', 'gta'], emoji: [],
    about: 'Under the Promise: a straw boater with a green-and-gold Hedgeworth band round the crown. Plain colours, no tint.',
    examine: [
      'A flat-brimmed straw boater with a green-and-gold band round the crown and a small Hedgeworth badge on the front of it.',
      'Saying of the Promise: a boater is worn in the sun for a promise made in the sun, and both tend to be forgotten by the autumn.',
      'Tip: tilt it a finger-width forward. Tipped back, it makes the gnome look as if he has already finished the nine.',
      'Joke: the straw has been woven so tightly that it keeps the rain out, and so loosely that it keeps the wasps in.',
      'Bought for the summer Peony promised the course would be finished. It was finished in autumn, which Peony counts as close enough.',
    ],
    parts: [
      { s: 'cyl', d: [0.2, 0.2, 0.012], at: [0, 0.006, 0], c: 'straw', seg: 12 },                      // brim (min.y = 0)
      { s: 'cyl', d: [0.11, 0.115, 0.1], at: [0, 0.06, 0], c: 'straw', seg: 12 },                       // crown
      { s: 'cyl', d: [0.118, 0.118, 0.026], at: [0, 0.035, 0], c: 'green', seg: 12 },                  // green band
      { s: 'cyl', d: [0.121, 0.121, 0.008], at: [0, 0.035, 0], c: 'gold', seg: 12 },                   // gold pinstripe
      { s: 'box', d: [0.03, 0.02, 0.006], at: [0, 0.035, 0.12], c: 'gold' },                           // Hedgeworth badge
    ],
  },
  {
    id: 'topiary-cape', name: 'Topiary Cape', category: 'armor', uses: ['wear-back'],
    tags: ['cape', 'hedge', 'topiary', 'leaf', 'clipped', 'shrub', 'back', 'reward', 'gta'], emoji: [],
    about: 'Out of the Maze: a short cape of clipped hedge leaves on the back, a little clump of leaf bumps across the shoulders. Plain colours, no tint.',
    examine: [
      'A short cape of clipped hedge, the leaves cut into neat bumps across the shoulders and a few stray twigs left on the hem.',
      'Saying of the Maze: the hedge is always trying to get out, and a gnome who wears it has already lost the argument.',
      'Tip: keep the cape flat on the back. A cape that bulges looks like a hedge, and the hedge will have you back in the Maze by teatime.',
      'Joke: the topiary was clipped by Thrift in the shape of a bird, a fish and a tax form, and he is still not sure which bump is which.',
      'Cut from the last hedge on the Maze, the one that was never meant to be cut, and was cut anyway by a man with very large shears.',
    ],
    parts: [
      { s: 'box', d: [0.3, 0.02, 0.05], at: [0, 0.3, -0.06], c: 'leaf-dark' },                        // cape top
      { s: 'box', d: [0.28, 0.3, 0.02], at: [0, 0.15, -0.08], c: 'leaf-dark' },                       // cape body (min.y = 0)
      { s: 'ball', d: [0.05], at: [-0.09, 0.3, -0.09], scale: [1, 0.7, 1], c: 'green', seg: 6 },      // leaf bump
      { s: 'ball', d: [0.05], at: [0, 0.32, -0.09], scale: [1, 0.7, 1], c: 'green', seg: 6 },         // leaf bump
      { s: 'ball', d: [0.05], at: [0.09, 0.3, -0.09], scale: [1, 0.7, 1], c: 'green', seg: 6 },       // leaf bump
      { s: 'ball', d: [0.04], at: [-0.06, 0.12, -0.1], c: 'leaf-dark', seg: 6 },                      // hem bump
      { s: 'ball', d: [0.04], at: [0.06, 0.1, -0.1], c: 'leaf-dark', seg: 6 },                        // hem bump
    ],
  },
];
