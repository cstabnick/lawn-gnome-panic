// Pay 'n' Glaze prefabs (steer). One owner: the issue that fills this file. Starts empty.
import type { PrefabDef } from '../types';

const RIM = 0x3a2a20; // dark leather

export const GTA_GLAZE_STEER: readonly PrefabDef[] = [
  {
    id: 'glaze-steer-racing', name: 'Racing Dish', category: 'prop', uses: ['place'],
    tags: ['glaze', 'steering', 'wheel', 'racing', 'dish', 'leather'], emoji: [],
    tint: RIM,
    about: 'Pay \'n\' Glaze steering wheel, the Racing Dish: a small flat-bottomed leather wheel with three spokes and a yellow mark at 12 o\'clock. The rim takes the tint; spokes and hub are fixed colours.',
    examine: [
      'A small dish of dark leather with three spokes and a yellow mark at the top, so you know which way is forward.',
      'Racing gnomes say the wheel is the only honest part of a car. The rest is just paint.',
      'Tip: keep both hands on the rim at the sides, where the leather is worn smooth.',
      'Joke: the flat bottom is not for sitting on. Gnomes have tried.',
      'Someone scratched a lap time into the spokes. Nobody can read it, and nobody has beaten it.',
    ],
    parts: [
      { s: 'ring', d: [0.17, 0.022], rot: [90, 0, 0], at: [0, 0.022, 0], c: 'tint' },              // rim
      { s: 'box', d: [0.16, 0.03, 0.04], at: [0, 0.015, -0.17], c: 'tint' },                       // flat bottom
      { s: 'box', d: [0.15, 0.025, 0.02], at: [0.09, 0.0125, 0], c: 'iron-dark' },                // left spoke
      { s: 'box', d: [0.15, 0.025, 0.02], at: [-0.09, 0.0125, 0], c: 'iron-dark' },               // right spoke
      { s: 'box', d: [0.02, 0.025, 0.15], at: [0, 0.0125, -0.09], c: 'iron-dark' },               // down spoke
      { s: 'cyl', d: [0.03, 0.03, 0.03], at: [0, 0.015, 0], c: 'iron-dark', seg: 8 },            // hub
      { s: 'box', d: [0.02, 0.03, 0.05], at: [0, 0.015, 0.17], c: 0xf2c230 },                      // yellow mark
    ],
  },
  {
    id: 'glaze-steer-banjo', name: 'Banjo Sprig', category: 'prop', uses: ['place'],
    tags: ['glaze', 'steering', 'wheel', 'banjo', 'wood', 'iron'], emoji: [],
    tint: 'wood',
    about: 'Pay \'n\' Glaze steering wheel, the Banjo Sprig: a wooden ring with three thin iron spokes and a brass hub. The rim takes the tint; spokes and hub are fixed colours.',
    examine: [
      'A wooden ring with three thin iron spokes and a brass knob in the middle, strung together by someone very patient.',
      'Old saying: a wheel that twangs when you turn it is a wheel that remembers its tune.',
      'Tip: pluck a spoke before a long turn. If it sings, the steering is sound.',
      'Joke: it is called a banjo because nobody could agree on a better name, and the spokes do not play.',
      'Three spokes, always 120 degrees apart. Gnomes count them out loud on the long hill to Thatchford.',
    ],
    parts: [
      { s: 'ring', d: [0.2, 0.02], rot: [90, 0, 0], at: [0, 0.02, 0], c: 'tint' },                  // wooden rim
      { s: 'box', d: [0.02, 0.02, 0.18], rot: [0, 0, 0], at: [0, 0.01, 0.09], c: 'iron' },          // spoke 0
      { s: 'box', d: [0.02, 0.02, 0.18], rot: [0, 120, 0], at: [0.078, 0.01, -0.045], c: 'iron' },  // spoke 120
      { s: 'box', d: [0.02, 0.02, 0.18], rot: [0, 240, 0], at: [-0.078, 0.01, -0.045], c: 'iron' }, // spoke 240
      { s: 'cyl', d: [0.04, 0.04, 0.04], at: [0, 0.02, 0], c: 'brass', seg: 8 },                   // brass hub
    ],
  },
  {
    id: 'glaze-steer-donut', name: 'Chunky Donut', category: 'prop', uses: ['place'],
    tags: ['glaze', 'steering', 'wheel', 'donut', 'chunky', 'fat'], emoji: [],
    tint: 'orange',
    about: 'Pay \'n\' Glaze steering wheel, the Chunky Donut: a fat, squashed ring with a plain hub and two short fat spokes. The ring takes the tint; hub and spokes are fixed colours.',
    examine: [
      'A fat, glossy ring of bright paint with a stubby hub and two short spokes, built for gnomes with whole-arm grip.',
      'Old saying: a round thing is never lost, only rolled out of reach.',
      'Tip: the fat rim is easy to hold with your elbows too, which is how most of Mossbottom drives.',
      'Joke: the steering is wonderful, but the wheel does not go in a straight line by choice.',
      'Its colour fades by the second day of sunshine, so the gnomes repaint it every morning.',
    ],
    parts: [
      { s: 'ring', d: [0.17, 0.05], rot: [90, 0, 0], at: [0, 0.03, 0], scale: [1, 1, 0.6], c: 'tint' }, // fat rim
      { s: 'cyl', d: [0.05, 0.05, 0.04], at: [0, 0.02, 0], c: 'iron-dark', seg: 8 },                   // hub
      { s: 'box', d: [0.12, 0.04, 0.05], at: [0.06, 0.02, 0], c: 'steel' },                          // left spoke
      { s: 'box', d: [0.12, 0.04, 0.05], at: [-0.06, 0.02, 0], c: 'steel' },                         // right spoke
    ],
  },
  {
    id: 'glaze-steer-daisy', name: 'Daisy Wheel', category: 'prop', uses: ['place'],
    tags: ['glaze', 'steering', 'wheel', 'daisy', 'petal', 'flower'], emoji: [],
    tint: RIM,
    about: 'Pay \'n\' Glaze steering wheel, the Daisy Wheel: a thin ring ringed with eight white petals and a yellow hub. The ring takes the tint; petals and hub are fixed colours.',
    examine: [
      'A dark ring ringed with eight white petals and a yellow centre, which is a very good way to say hello.',
      'Gnomes in the Hedgewood say the petals keep the wheel from getting lonely.',
      'Tip: count the petals while turning. Eight petals means a quarter turn, roughly.',
      'Joke: it has more petals than the wheel has any use for, which is the whole point of petals.',
      'One petal is always a little bigger than the others. That one is for luck, and for fighting over.',
    ],
    parts: [
      { s: 'ring', d: [0.17, 0.018], rot: [90, 0, 0], at: [0, 0.018, 0], c: 'tint' },              // rim
      { s: 'ball', d: [0.05], scale: [1, 0.3, 1], at: [0, 0.015, 0.2], c: 'white' },                // petal N
      { s: 'ball', d: [0.05], scale: [1, 0.3, 1], at: [0.1414, 0.015, 0.1414], c: 'white' },       // petal NE
      { s: 'ball', d: [0.05], scale: [1, 0.3, 1], at: [0.2, 0.015, 0], c: 'white' },               // petal E
      { s: 'ball', d: [0.05], scale: [1, 0.3, 1], at: [0.1414, 0.015, -0.1414], c: 'white' },      // petal SE
      { s: 'ball', d: [0.05], scale: [1, 0.3, 1], at: [0, 0.015, -0.2], c: 'white' },              // petal S
      { s: 'ball', d: [0.05], scale: [1, 0.3, 1], at: [-0.1414, 0.015, -0.1414], c: 'white' },     // petal SW
      { s: 'ball', d: [0.05], scale: [1, 0.3, 1], at: [-0.2, 0.015, 0], c: 'white' },              // petal W
      { s: 'ball', d: [0.05], scale: [1, 0.3, 1], at: [-0.1414, 0.015, 0.1414], c: 'white' },     // petal NW
      { s: 'ball', d: [0.05], scale: [1, 0.4, 1], at: [0, 0.02, 0], c: 'yellow' },                 // hub
    ],
  },
  {
    id: 'glaze-steer-pretzel', name: 'Pretzel Wheel', category: 'prop', uses: ['place'],
    tags: ['glaze', 'steering', 'wheel', 'pretzel', 'knot', 'salt'], emoji: [],
    tint: 0xc98a3a,
    about: 'Pay \'n\' Glaze steering wheel, the Pretzel Wheel: two overlapping golden loops with a cross brace and a row of salt grains. The loops and brace take the tint; the salt is fixed.',
    examine: [
      'Two golden loops crossed over each other, with a bar in the middle and salt grains lined up on top.',
      'Old saying: a loop that goes nowhere is still a loop.',
      'Tip: do not steer with your eyes shut. Pretzel wheels are hard to read from the inside.',
      'Joke: it was baked by accident and turned out to be a wheel. The gnome who baked it is still surprised.',
      'Salt on top, for luck and for keeping the slugs off the rim.',
    ],
    parts: [
      { s: 'ring', d: [0.12, 0.022], rot: [90, 0, 0], at: [-0.08, 0.022, 0], c: 'tint' },           // left loop
      { s: 'ring', d: [0.12, 0.022], rot: [90, 0, 0], at: [0.08, 0.022, 0], c: 'tint' },            // right loop
      { s: 'box', d: [0.16, 0.024, 0.024], at: [0, 0.022, 0], c: 'tint' },                          // cross brace
      { s: 'ball', d: [0.012], at: [-0.1, 0.04, 0], c: 'chalk' },                                   // salt
      { s: 'ball', d: [0.012], at: [-0.05, 0.04, 0], c: 'chalk' },                                  // salt
      { s: 'ball', d: [0.012], at: [0, 0.04, 0], c: 'chalk' },                                      // salt
      { s: 'ball', d: [0.012], at: [0.05, 0.04, 0], c: 'chalk' },                                   // salt
      { s: 'ball', d: [0.012], at: [0.1, 0.04, 0], c: 'chalk' },                                    // salt
    ],
  },
];
