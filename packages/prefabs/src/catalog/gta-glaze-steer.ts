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
  {
    id: 'glaze-steer-ship', name: "Ship's Helm", category: 'prop', uses: ['place'],
    tags: ['glaze', 'steering', 'wheel', 'ship', 'helm', 'brass', 'wood'], emoji: [],
    tint: 'wood-dark',
    about: "Pay 'n' Glaze steering wheel, Ship's Helm: a dark wooden ring with eight spokes poking out past the rim as handles and a brass hub. The rim takes the tint; spokes, knobs and hub are fixed colours.",
    examine: [
      'A ring of dark wood with eight spokes sticking out past the edge, each one ending in a little brass knob for a gripping hand.',
      'Gnome saying: a helm is turned by the whole arm, and a ship goes wherever the arm has been sulking.',
      'Tip: grab two spokes opposite each other. Eight spokes means there is always a handle, even in a fright.',
      'Joke: nobody on the Verge has seen a ship, but every gnome agrees this wheel is made for a very wide boat.',
      'The brass hub has a dent that fits exactly one thumb. Gnomes argue about whose thumb it is, and still do.',
    ],
    parts: [
      { s: 'ring', d: [0.2, 0.018], rot: [90, 0, 0], at: [0, 0.018, 0], c: 'tint' },                 // rim
      { s: 'box', d: [0.27, 0.03, 0.035], at: [0.135, 0.03, 0], rot: [0, 0, 0], c: 'wood' },          // spoke E
      { s: 'box', d: [0.27, 0.03, 0.035], at: [0.0955, 0.03, 0.0955], rot: [0, -45, 0], c: 'wood' },  // spoke NE
      { s: 'box', d: [0.27, 0.03, 0.035], at: [0, 0.03, 0.135], rot: [0, -90, 0], c: 'wood' },        // spoke N
      { s: 'box', d: [0.27, 0.03, 0.035], at: [-0.0955, 0.03, 0.0955], rot: [0, -135, 0], c: 'wood' }, // spoke NW
      { s: 'box', d: [0.27, 0.03, 0.035], at: [-0.135, 0.03, 0], rot: [0, 180, 0], c: 'wood' },       // spoke W
      { s: 'box', d: [0.27, 0.03, 0.035], at: [-0.0955, 0.03, -0.0955], rot: [0, 135, 0], c: 'wood' }, // spoke SW
      { s: 'box', d: [0.27, 0.03, 0.035], at: [0, 0.03, -0.135], rot: [0, 90, 0], c: 'wood' },        // spoke S
      { s: 'box', d: [0.27, 0.03, 0.035], at: [0.0955, 0.03, -0.0955], rot: [0, 45, 0], c: 'wood' },  // spoke SE
      { s: 'ball', d: [0.028], at: [0.27, 0.03, 0], c: 'brass', seg: 8 },                             // handle knobs
      { s: 'ball', d: [0.028], at: [0.191, 0.03, 0.191], c: 'brass', seg: 8 },
      { s: 'ball', d: [0.028], at: [0, 0.03, 0.27], c: 'brass', seg: 8 },
      { s: 'ball', d: [0.028], at: [-0.191, 0.03, 0.191], c: 'brass', seg: 8 },
      { s: 'ball', d: [0.028], at: [-0.27, 0.03, 0], c: 'brass', seg: 8 },
      { s: 'ball', d: [0.028], at: [-0.191, 0.03, -0.191], c: 'brass', seg: 8 },
      { s: 'ball', d: [0.028], at: [0, 0.03, -0.27], c: 'brass', seg: 8 },
      { s: 'ball', d: [0.028], at: [0.191, 0.03, -0.191], c: 'brass', seg: 8 },
      { s: 'cyl', d: [0.04, 0.04, 0.05], at: [0, 0.025, 0], c: 'brass', seg: 8 },                     // brass hub
    ],
  },
  {
    id: 'glaze-steer-heart', name: 'Heart Wheel', category: 'prop', uses: ['place'],
    tags: ['glaze', 'steering', 'wheel', 'heart', 'love', 'pink'], emoji: [],
    tint: 0xff5fa8,
    about: 'Pay \'n\' Glaze steering wheel, the Heart Wheel: two overlapping pink rings for lobes and a V of bars running down to a point. The rings and bars take the tint.',
    examine: [
      'Two round pink lobes that overlap in the middle, then a V of bars running down to a single point at the bottom.',
      'Gnome saying: a wheel that steers with love will go wherever it likes, and it will look very pleased about it.',
      'Tip: hold the lobes at the top, not the point. The point is for pointing, and the lobes are for gripping.',
      'Joke: the wobble is part of the charm. Anybody who says the wobble is a fault has never been in love.',
      'The point at the bottom is worn bright from years of being rubbed for luck by nervous gnomes.',
    ],
    parts: [
      { s: 'ring', d: [0.11, 0.018], rot: [90, 0, 0], at: [-0.09, 0.018, 0.05], c: 'tint' },              // left lobe
      { s: 'ring', d: [0.11, 0.018], rot: [90, 0, 0], at: [0.09, 0.018, 0.05], c: 'tint' },               // right lobe
      { s: 'box', d: [0.17, 0.036, 0.036], rot: [0, 124.7, 0], at: [0.045, 0.018, -0.125], c: 'tint' },   // right bar of the V
      { s: 'box', d: [0.17, 0.036, 0.036], rot: [0, 55.3, 0], at: [-0.045, 0.018, -0.125], c: 'tint' },   // left bar of the V
    ],
  },
  {
    id: 'glaze-steer-square', name: 'Square Wheel', category: 'prop', uses: ['place'],
    tags: ['glaze', 'steering', 'wheel', 'square', 'corners', 'blue'], emoji: [],
    tint: 'blue',
    about: 'Pay \'n\' Glaze steering wheel, the Square Wheel: a square rim from four bars with ball corners and a small hub. The bars and corners take the tint; the hub is steel.',
    examine: [
      'A square frame of blue bars with a fat ball at every corner, and a small steel nut sitting in the middle.',
      'Gnome saying: a square mind goes round in corners, and a square wheel goes round in squares, and both get there.',
      'Tip: take the corners slowly. The balls are there to catch your thumbs, not to be admired.',
      'Joke: the ride is rough, but it is never boring. Passengers see every corner coming, one at a time.',
      'The steel nut was added after the first wheel fell off. Nobody has the heart to tell the wheel.',
    ],
    parts: [
      { s: 'box', d: [0.36, 0.036, 0.036], at: [0, 0.018, 0.18], c: 'tint' },                           // front bar
      { s: 'box', d: [0.36, 0.036, 0.036], at: [0, 0.018, -0.18], c: 'tint' },                          // back bar
      { s: 'box', d: [0.036, 0.036, 0.36], at: [-0.18, 0.018, 0], c: 'tint' },                          // left bar
      { s: 'box', d: [0.036, 0.036, 0.36], at: [0.18, 0.018, 0], c: 'tint' },                           // right bar
      { s: 'ball', d: [0.026], at: [-0.18, 0.026, 0.18], c: 'tint', seg: 8 },                          // corner balls
      { s: 'ball', d: [0.026], at: [0.18, 0.026, 0.18], c: 'tint', seg: 8 },
      { s: 'ball', d: [0.026], at: [-0.18, 0.026, -0.18], c: 'tint', seg: 8 },
      { s: 'ball', d: [0.026], at: [0.18, 0.026, -0.18], c: 'tint', seg: 8 },
      { s: 'cyl', d: [0.03, 0.03, 0.04], at: [0, 0.02, 0], c: 'steel', seg: 8 },                         // steel hub nut
    ],
  },
  {
    id: 'glaze-steer-sprocket', name: 'Sprocket Wheel', category: 'prop', uses: ['place'],
    tags: ['glaze', 'steering', 'wheel', 'sprocket', 'gear', 'chain', 'steel'], emoji: [],
    tint: 'steel',
    about: 'Pay \'n\' Glaze steering wheel, the Sprocket Wheel: a gear rim with twelve small teeth and a disc with three round holes. The rim and teeth take the tint; the disc and holes are fixed.',
    examine: [
      'A gear-toothed rim with twelve little teeth around the edge and a flat disc inside, pierced by three round holes.',
      'Gnome saying: every tooth is a promise, and every hole is a place to put your thumb while you think it over.',
      'Tip: turn it one tooth at a time. Each click tells you how far you have gone, which is more than most roads do.',
      'Joke: it clicks every time you turn, so sneaking up on anybody in one is impossible, and nobody has tried.',
      'Someone hung a rusty chain on the back. It does not drive anything, but it does rattle at the right moment.',
    ],
    parts: [
      { s: 'ring', d: [0.2, 0.024], rot: [90, 0, 0], at: [0, 0.024, 0], c: 'tint' },                       // gear rim
      { s: 'cyl', d: [0.18, 0.18, 0.024], at: [0, 0.012, 0], c: 'iron', seg: 12 },                       // inner disc
      { s: 'box', d: [0.04, 0.03, 0.035], rot: [0, 0, 0], at: [0.21, 0.015, 0], c: 'tint' },           // teeth
      { s: 'box', d: [0.04, 0.03, 0.035], rot: [0, -30, 0], at: [0.1819, 0.015, 0.105], c: 'tint' },
      { s: 'box', d: [0.04, 0.03, 0.035], rot: [0, -60, 0], at: [0.105, 0.015, 0.1819], c: 'tint' },
      { s: 'box', d: [0.04, 0.03, 0.035], rot: [0, -90, 0], at: [0, 0.015, 0.21], c: 'tint' },
      { s: 'box', d: [0.04, 0.03, 0.035], rot: [0, -120, 0], at: [-0.105, 0.015, 0.1819], c: 'tint' },
      { s: 'box', d: [0.04, 0.03, 0.035], rot: [0, -150, 0], at: [-0.1819, 0.015, 0.105], c: 'tint' },
      { s: 'box', d: [0.04, 0.03, 0.035], rot: [0, -180, 0], at: [-0.21, 0.015, 0], c: 'tint' },
      { s: 'box', d: [0.04, 0.03, 0.035], rot: [0, 150, 0], at: [-0.1819, 0.015, -0.105], c: 'tint' },
      { s: 'box', d: [0.04, 0.03, 0.035], rot: [0, 120, 0], at: [-0.105, 0.015, -0.1819], c: 'tint' },
      { s: 'box', d: [0.04, 0.03, 0.035], rot: [0, 90, 0], at: [0, 0.015, -0.21], c: 'tint' },
      { s: 'box', d: [0.04, 0.03, 0.035], rot: [0, 60, 0], at: [0.105, 0.015, -0.1819], c: 'tint' },
      { s: 'box', d: [0.04, 0.03, 0.035], rot: [0, 30, 0], at: [0.1819, 0.015, -0.105], c: 'tint' },
      { s: 'cyl', d: [0.03, 0.03, 0.006], at: [0, 0.0255, 0.11], c: 'black', seg: 8 },                     // holes
      { s: 'cyl', d: [0.03, 0.03, 0.006], at: [0.0953, 0.0255, -0.055], c: 'black', seg: 8 },
      { s: 'cyl', d: [0.03, 0.03, 0.006], at: [-0.0953, 0.0255, -0.055], c: 'black', seg: 8 },
    ],
  },
];
