// Pay 'n' Glaze prefabs (exhaust). One owner: the issue that fills this file. Starts empty.
import type { PrefabDef } from '../types';

// Exhausts: origin at the rear bumper line, pipes pointing rearward (-z) and a little up from y = 0, at most 0.5 long.
// `twin` is two pipes at x = +-0.12; the others are one pipe at x = 0.
export const GTA_GLAZE_EXHAUST: readonly PrefabDef[] = [
  {
    id: 'glaze-exhaust-stack', name: 'Smoke Stack', category: 'prop', uses: ['place'],
    tags: ['glaze', 'exhaust', 'stack', 'smoke', 'pipe', 'soot'],
    emoji: [],
    about: 'A tall smoke stack out of the back: a steel pipe with a flared lip and a black soot top. Slot: exhaust (Pay \'n\' Glaze), placed at the rear.',
    examine: [
      'A steel pipe leaving the back of the car with a flared brim at the end, and a black cap of soot that never quite comes off.',
      'Saying: a stack that puffs is a stack that is thinking, and a stack that does not puff is probably thinking about puffing.',
      'Tip: keep the lip pointed away from the washing. The soot is decorative, the washing is not.',
      'Joke: the smoke only comes out on request, and the request is always made by a gnome standing directly behind it.',
      'The flared lip is there, the shop says, so the smoke can spread out nicely. The gnomes say it is there so the soot has somewhere to sit.',
    ],
    parts: [
      { s: 'cyl', d: [0.055, 0.055, 0.4], at: [0, 0.055, -0.2], rot: [90, 0, 0], c: 'steel', seg: 8 },
      { s: 'cyl', d: [0.07, 0.07, 0.04], at: [0, 0.07, -0.41], rot: [90, 0, 0], c: 'steel', seg: 8 },
      { s: 'cyl', d: [0.072, 0.072, 0.03], at: [0, 0.07, -0.45], rot: [90, 0, 0], c: 'black', seg: 8 },
    ],
  },
  {
    id: 'glaze-exhaust-twin', name: 'Twin Tailpipes', category: 'prop', uses: ['place'],
    tags: ['glaze', 'exhaust', 'twin', 'tailpipe', 'chrome', 'pipes'],
    emoji: [],
    about: 'Two chrome tailpipes side by side with slanted cut ends. Slot: exhaust (Pay \'n\' Glaze), placed at the rear.',
    examine: [
      'Two bright chrome tubes side by side, each cut at a slant so the end looks like it was snipped by a very confident hedge trimmer.',
      'Saying: one pipe is a cough, two pipes are a statement, and three pipes are a band that nobody has invited.',
      'Tip: the pipes are hot near the end. Do not lean on them, and do not put your gnome-sized hat on them to dry.',
      'Joke: the shop fitted them so they would sound twice as loud, and then fitted a second pair so they would sound twice as sorry.',
      'Both pipes are exactly the same length, which is a rare honesty for a pair of things that only exist to make a noise.',
    ],
    parts: [
      { s: 'cyl', d: [0.035, 0.035, 0.4], at: [-0.12, 0.035, -0.2], rot: [90, 0, 0], c: 'steel', seg: 8 },
      { s: 'cyl', d: [0.035, 0.035, 0.4], at: [0.12, 0.035, -0.2], rot: [90, 0, 0], c: 'steel', seg: 8 },
      { s: 'cyl', d: [0.03, 0.03, 0.02], at: [-0.12, 0.035, -0.4], rot: [60, 0, 0], c: 'iron', seg: 8 },
      { s: 'cyl', d: [0.03, 0.03, 0.02], at: [0.12, 0.035, -0.4], rot: [60, 0, 0], c: 'iron', seg: 8 },
    ],
  },
  {
    id: 'glaze-exhaust-chimney', name: 'Tin Chimney', category: 'prop', uses: ['place'],
    tags: ['glaze', 'exhaust', 'chimney', 'tin', 'rain', 'cap', 'bracket'],
    emoji: [],
    about: 'A little tin chimney with a rain cap and a bracket, standing on the rear deck. Slot: exhaust (Pay \'n\' Glaze), placed at the rear.',
    examine: [
      'A small tin chimney standing up off the back, with a rain cap on top and a flat bracket at the foot to hold it to the car.',
      'Saying: a chimney on a car is not for keeping the rain out, it is for keeping the rain company until the car is washed.',
      'Tip: the rain cap is there to stop the rain, not the smoke. Get it the right way up, or the rain will go down the wrong pipe.',
      'Joke: the tiny curl of smoke it gives off is the only smoke on the whole lawn that has ever been asked to leave.',
      'The bracket is bolted on with four screws, and one of them is a rivet that somebody tapped in with a spoon.',
    ],
    parts: [
      { s: 'box', d: [0.1, 0.02, 0.1], at: [0, 0.01, -0.1], c: 'iron-dark' },
      { s: 'cyl', d: [0.045, 0.045, 0.2], at: [0, 0.1, -0.1], c: 'iron', seg: 8 },
      { s: 'cyl', d: [0.02, 0.075, 0.06], at: [0, 0.24, -0.1], c: 'iron-dark', seg: 8 },
    ],
  },
  {
    id: 'glaze-exhaust-trumpet', name: 'Trumpet Pipe', category: 'prop', uses: ['place'],
    tags: ['glaze', 'exhaust', 'trumpet', 'brass', 'bell', 'coil'],
    emoji: [],
    about: 'A brass trumpet bell flaring rearward with a coiled tube feeding it. Slot: exhaust (Pay \'n\' Glaze), placed at the rear.',
    examine: [
      'A brass bell at the end of a coiled tube, flaring out at the back like a trumpet that has heard something very rude on the lawn.',
      'Saying: the engine has one note, and the trumpet is there to make sure everyone hears it before it has finished.',
      'Tip: play it gently. The bell has a long memory, and a loud start will be remembered by the hedge for weeks.',
      'Joke: nobody in the shop knows how to play a trumpet, but the exhaust has been playing the same tune since it was fitted.',
      'The coil was wound by a gnome who was told it would only be a little coil, and who has never quite forgiven the shop for the second loop.',
    ],
    parts: [
      { s: 'cyl', d: [0.03, 0.03, 0.25], at: [0, 0.03, -0.1], rot: [90, 0, 0], c: 'brass', seg: 8 },
      { s: 'ring', d: [0.06, 0.012], at: [0, 0.07, -0.02], rot: [90, 0, 0], c: 'brass', seg: 8 },
      { s: 'cyl', d: [0.03, 0.1, 0.12], at: [0, 0.11, -0.3], rot: [90, 0, 0], c: 'brass', seg: 10 },
      { s: 'ring', d: [0.1, 0.012], at: [0, 0.11, -0.36], c: 'brass', seg: 10 },
    ],
  },
];
