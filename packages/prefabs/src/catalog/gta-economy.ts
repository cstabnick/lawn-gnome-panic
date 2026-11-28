// Gnome Theft Auto: economy, ownership and inventory (docs/roadmaps/gta-batch-3/E08): bag items and dealership signs.
import type { PrefabDef } from '../types';

export const GTA_ECONOMY: readonly PrefabDef[] = [
  {
    id: 'party-popper', name: 'Party Popper', category: 'trinket', uses: ['hold'],
    grip: [0, 0.06, 0], tint: 'orange',
    tags: ['party', 'popper', 'confetti', 'fun', 'cone', 'string', 'stripes', 'gta'], emoji: ['🎉'],
    about: 'Gnome Theft Auto: the Party Popper. A striped paper cone held upright by its tip, with a string loop round the tip and a few bits of confetti on top. The cone tints.',
    examine: [
      'A striped paper cone with a loop of string round its tip, and a few bits of coloured confetti poking out of the open top.',
      'Saying: a cone that goes pop when its string is pulled is a sign of good fortune, or of a gnome who pulled too hard.',
      'Tip: point the open end away from your face, and away from anyone who has not yet agreed to be surprised.',
      'Joke: the confetti always lands on the gnome who was not looking, which is how the Yard learned to keep its eyes open.',
      'The string has been tied and retied so many times that nobody can say whether the loop is the original or only the latest.',
    ],
    parts: [
      { s: 'cone', d: [0.05, 0.2], rot: [180, 0, 0], at: [0, 0.1, 0], c: 'tint', seg: 8 },         // cone, mouth up, tip on the ground
      { s: 'ring', d: [0.03, 0.008], at: [0, 0.12, 0], rot: [90, 0, 0], c: 'white', seg: 8 },       // stripe
      { s: 'ring', d: [0.042, 0.008], at: [0, 0.17, 0], rot: [90, 0, 0], c: 'white', seg: 8 },      // stripe
      { s: 'ring', d: [0.03, 0.004], at: [0, 0.035, 0], rot: [0, 90, 0], c: 'iron-dark', seg: 8 },  // string loop round the tip
      { s: 'box', d: [0.015, 0.005, 0.015], at: [0.02, 0.215, 0.01], c: 'red' },                    // confetti
      { s: 'box', d: [0.015, 0.005, 0.015], at: [-0.03, 0.22, -0.01], c: 'yellow' },                // confetti
      { s: 'box', d: [0.015, 0.005, 0.015], at: [0, 0.225, 0.03], rot: [0, 30, 0], c: 'blue' },     // confetti
      { s: 'box', d: [0.015, 0.005, 0.015], at: [-0.015, 0.21, -0.035], c: 'green' },               // confetti
    ],
  },
  {
    id: 'whoopee-cushion', name: 'Whoopee Cushion', category: 'trinket', uses: ['hold', 'place'],
    grip: [0, 0.06, 0],
    tags: ['whoopee', 'cushion', 'prank', 'fun', 'pink', 'ball', 'neck', 'gta'], emoji: [],
    about: 'Gnome Theft Auto: the Whoopee Cushion. A squashed pink ball about 0.3 wide with a short neck on top, sealed with a knot. It sits flat on the ground.',
    examine: [
      'A squashed pink ball about as wide as a hand, with a short stubby neck on top that has been sealed with a knot.',
      'Saying: a gnome who sits on a pink cushion makes a sound that is not the cushion, and so the cushion takes the blame.',
      'Tip: squeeze it before you sit down, not after. Sitting on it in front of the elders is a very bad idea.',
      'Joke: the cushion has been sat on by four gnomes this week, and none of them will admit to the noise.',
      'It has been patched, sealed and patched again, and the patch is the same shade of pink as the rest, which is suspicious.',
    ],
    parts: [
      { s: 'ball', d: [0.15], at: [0, 0.06, 0], scale: [1, 0.4, 1], c: 'pink', seg: 8 },          // squashed body, height 0.12
      { s: 'cyl', d: [0.02, 0.02, 0.04], at: [0, 0.14, 0], c: 'pink', seg: 6 },                    // short neck
      { s: 'ring', d: [0.02, 0.006], at: [0, 0.16, 0], rot: [90, 0, 0], c: 'pink', seg: 6 },       // knot at the neck mouth
    ],
  },
  {
    id: 'dealer-sign-forecourt', name: "Burl's Forecourt Sign", category: 'prop', uses: ['place'],
    tags: ['sign', 'dealer', 'forecourt', 'price', 'tag', 'bunting', 'board', 'red', 'burl', 'gta'], emoji: [],
    about: "Gnome Theft Auto: Burl's Forecourt Sign. A red dealership board about 2.8 gnome-heights up on two posts, with a white price tag in the middle and a row of bunting triangles along the top. The board tints.",
    examine: [
      'A tall red board on two posts, with a white price tag in the middle and a row of bunting triangles strung along the top.',
      'Saying: a sign that promises a bargain is worth reading twice, and the price tag is where the second reading starts.',
      'Tip: the price tag is the only honest part of the sign. The board is only there to make the tag look important.',
      'Joke: the bunting was put up for a sale that ended before it started, and it has been flapping about ever since.',
      'The price tag has been painted over three times. The number underneath is still faintly visible if you squint at the posts.',
    ],
    tint: 'red',
    parts: [
      { s: 'cyl', d: [0.05, 0.05, 2.6], at: [0.8, 1.3, -0.1], c: 'wood-dark', seg: 6, mirror: true },   // posts, behind the board
      { s: 'box', d: [2.0, 0.9, 0.08], at: [0, 2.2, 0], c: 'tint' },                                 // board
      { s: 'box', d: [0.6, 0.3, 0.02], at: [0, 2.2, 0.05], c: 'white' },                            // price tag
      { s: 'cone', d: [0.06, 0.1], rot: [180, 0, 0], at: [-0.9, 2.8, 0], c: 'yellow', seg: 3, scale: [1, 1, 0.15] }, // bunting
      { s: 'cone', d: [0.06, 0.1], rot: [180, 0, 0], at: [-0.6, 2.8, 0], c: 'white', seg: 3, scale: [1, 1, 0.15] },  // bunting
      { s: 'cone', d: [0.06, 0.1], rot: [180, 0, 0], at: [-0.3, 2.8, 0], c: 'blue', seg: 3, scale: [1, 1, 0.15] },   // bunting
      { s: 'cone', d: [0.06, 0.1], rot: [180, 0, 0], at: [0, 2.8, 0], c: 'yellow', seg: 3, scale: [1, 1, 0.15] },    // bunting
      { s: 'cone', d: [0.06, 0.1], rot: [180, 0, 0], at: [0.3, 2.8, 0], c: 'white', seg: 3, scale: [1, 1, 0.15] },   // bunting
      { s: 'cone', d: [0.06, 0.1], rot: [180, 0, 0], at: [0.6, 2.8, 0], c: 'blue', seg: 3, scale: [1, 1, 0.15] },    // bunting
      { s: 'cone', d: [0.06, 0.1], rot: [180, 0, 0], at: [0.9, 2.8, 0], c: 'yellow', seg: 3, scale: [1, 1, 0.15] },  // bunting
    ],
  },
  {
    id: 'dealer-sign-boatyard', name: "Driftwood's Boat Yard Sign", category: 'prop', uses: ['place'],
    tags: ['sign', 'dealer', 'boat', 'yard', 'driftwood', 'plank', 'anchor', 'buoy', 'wood', 'gta'], emoji: [],
    about: "Gnome Theft Auto: Driftwood's Boat Yard Sign. A pale driftwood plank about 2.8 gnome-heights up, hung between two rough posts, with a small iron anchor and a red ring buoy on its face.",
    examine: [
      'A pale driftwood plank hung between two rough posts, with a small iron anchor on the left and a red ring buoy on the right.',
      'Saying: a boat sold from a plank has been sold before, and the loch remembers every one of them.',
      'Tip: read the plank from the front, not the side. The gulls sit on the back of it, and they do not care what it says.',
      'Joke: the ring buoy is there in case a customer falls in, which is the most honest thing a boat yard has ever put on a sign.',
      'The grain on the plank runs the wrong way for a sign, and nobody has yet been brave enough to say so to the loch.',
    ],
    parts: [
      { s: 'cyl', d: [0.06, 0.05, 2.6], at: [0.8, 1.3, -0.1], c: 'bark', seg: 6, mirror: true },     // rough posts
      { s: 'box', d: [2.0, 0.9, 0.1], at: [0, 2.2, 0], c: 'wood-light' },                              // driftwood plank
      { s: 'box', d: [1.9, 0.03, 0.02], at: [0, 2.0, 0.06], c: 'wood-dark' },                        // plank seam
      { s: 'box', d: [1.9, 0.03, 0.02], at: [0, 2.45, 0.06], c: 'wood-dark' },                       // plank seam
      { s: 'box', d: [0.03, 0.2, 0.02], at: [-0.5, 2.2, 0.08], c: 'iron-dark' },                     // anchor shaft
      { s: 'box', d: [0.12, 0.025, 0.03], at: [-0.5, 2.3, 0.08], c: 'iron-dark' },                   // anchor crossbar
      { s: 'ring', d: [0.02, 0.006], at: [-0.5, 2.4, 0.08], c: 'iron-dark', seg: 6 },                // anchor ring
      { s: 'ring', d: [0.14, 0.035], at: [0.5, 2.2, 0.1], c: 'red', seg: 10 },                       // ring buoy
    ],
  },
  {
    id: 'dealer-sign-winglot', name: "Wally's Wing Lot Sign", category: 'prop', uses: ['place'],
    tags: ['sign', 'dealer', 'wing', 'lot', 'propeller', 'windsock', 'pole', 'board', 'blue', 'wally', 'gta'], emoji: [],
    about: "Gnome Theft Auto: Wally's Wing Lot Sign. A blue board on a tall pole, with a small white propeller on its face and a striped windsock flying from the top. The board tints.",
    examine: [
      'A blue board on a tall pole, with a small white propeller painted on its face and a striped windsock flying from the top.',
      'Saying: a wing lot is a field of wings that never fly, and the windsock is there to show them which way they would have gone.',
      'Tip: the windsock points downwind, so it tells you where the next gust will hit before the board can.',
      'Joke: the propeller on the board has been turning for years, but only ever in the sign-painter\'s head.',
      'The pole has a dent about halfway up, where something with a propeller once tried to park on it and lost the argument.',
    ],
    tint: 'blue',
    parts: [
      { s: 'cyl', d: [0.12, 0.14, 0.08], at: [0, 0.04, -0.1], c: 'stone-dark', seg: 8 },            // stone footing
      { s: 'cyl', d: [0.05, 0.05, 2.6], at: [0, 1.3, -0.1], c: 'iron-dark', seg: 6 },                 // pole
      { s: 'box', d: [1.8, 0.8, 0.08], at: [0, 2.1, 0], c: 'tint' },                                  // board
      { s: 'cyl', d: [0.03, 0.03, 0.03], at: [0, 2.1, 0.1], rot: [90, 0, 0], c: 'iron-dark', seg: 8 }, // propeller hub
      { s: 'box', d: [0.07, 0.36, 0.02], at: [0, 2.1, 0.08], rot: [0, 0, 25], c: 'white' },            // propeller blade
      { s: 'cone', d: [0.05, 0.24], rot: [180, 0, 0], at: [0, 2.72, 0], c: 'orange', seg: 8 },        // windsock, mouth up, tip on the pole top
      { s: 'ring', d: [0.02, 0.01], at: [0, 2.68, 0], rot: [90, 0, 0], c: 'white', seg: 8 },           // windsock stripe
      { s: 'ring', d: [0.042, 0.01], at: [0, 2.78, 0], rot: [90, 0, 0], c: 'white', seg: 8 },          // windsock stripe
    ],
  },
];
