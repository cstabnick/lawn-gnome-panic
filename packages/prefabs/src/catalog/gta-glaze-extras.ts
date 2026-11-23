// Pay 'n' Glaze prefabs (extras). Small bolt-ons, each placed at a different mount point of a vehicle
// (the placement code is in packages/glaze/src/fittings.ts). Authored for a 1.2-wide vehicle; origin = attachment point.
import type { PrefabDef } from '../types';

const CHROME = 0xdfe4ea;

export const GTA_GLAZE_EXTRAS: readonly PrefabDef[] = [
  {
    id: 'glaze-extra-dice', name: 'Fuzzy Dice', category: 'prop', uses: ['place'],
    tags: ['glaze', 'extra', 'dice', 'fuzzy', 'mirror', 'hanging'], emoji: [],
    about: 'Fuzzy dice on a string from a chrome mirror-post. Pink and white cubes with black pips; no tint, the dice keep their colours.',
    examine: [
      'Two fluffy cubes on a string, one pink and one white, each with black spots a gnome could count to about two.',
      'They hang from a shiny post so that the whole street can see them coming.',
      'Old rhyme: pink for luck and white for luck, roll them twice and never look back.',
      'The fluff is the best part. It is not for eating, whatever the Compost Heap says.',
      'The dice have never once landed on anything useful, which is how gnomes know they are working.',
    ],
    parts: [
      { s: 'cyl', d: [0.01, 0.01, 0.3], at: [0, 0.15, 0], c: CHROME, seg: 6 },        // mirror-post
      { s: 'ball', d: [0.025], at: [0, 0.315, 0], c: CHROME, seg: 6 },                // chrome ball
      { s: 'cyl', d: [0.004, 0.004, 0.12], at: [0, 0.24, 0], c: 'black', seg: 4 },    // string
      { s: 'box', d: [0.07, 0.07, 0.07], at: [0.04, 0.11, 0], c: 0xff7eb6 },          // pink die
      { s: 'box', d: [0.07, 0.07, 0.07], at: [-0.04, 0.11, 0], c: 0xf4f4f0 },         // white die
      { s: 'ball', d: [0.008], at: [0.04, 0.11, 0.037], c: 'black', seg: 6 },          // pink pip
      { s: 'ball', d: [0.008], at: [-0.055, 0.095, 0.037], c: 'black', seg: 6 },       // white pip
      { s: 'ball', d: [0.008], at: [-0.025, 0.125, 0.037], c: 'black', seg: 6 },       // white pip
    ],
  },
  {
    id: 'glaze-extra-flag', name: 'Whip-Antenna Flag', category: 'prop', uses: ['place'],
    tags: ['glaze', 'extra', 'flag', 'aerial', 'antenna', 'whip', 'pennant'], emoji: [],
    about: 'A tall black whip aerial on a base, with a red pennant flying backward near the top. No tint.',
    examine: [
      'A black whip of a stick, taller than most gnomes, with a red pennant at the top.',
      'Old saying: a flag that points backward is the one that has been somewhere.',
      'Fix it to the back of the Mower and the rest of Thatchford will see you coming.',
      'It bends in a stiff wind and snaps back in a soft one. Keep your ears down when it snaps.',
      'The ball on the tip is chrome. Gnomes have polished it so often there is nothing left to shine but the sky.',
    ],
    parts: [
      { s: 'cyl', d: [0.03, 0.035, 0.04], at: [0, 0.02, 0], c: 'black', seg: 8 },       // base
      { s: 'cyl', d: [0.004, 0.01, 0.85], at: [0, 0.425, 0], c: 'black', seg: 5 },      // whip aerial
      { s: 'wedge', d: [0.01, 0.1, 0.16], at: [0, 0.77, -0.08], c: 'red' },            // pennant, flies to -z
      { s: 'ball', d: [0.012], at: [0, 0.86, 0], c: CHROME, seg: 6 },                  // tip
    ],
  },
  {
    id: 'glaze-extra-pipes', name: 'Stovepipe Exhausts', category: 'prop', uses: ['place'],
    tags: ['glaze', 'extra', 'pipes', 'exhaust', 'stovepipe', 'chrome', 'chimney'], emoji: [],
    about: 'One chrome stovepipe with a flared top and clamp bands, heat shield on its +x side, mounting plate at the base. The code mirrors it; no tint.',
    examine: [
      'Shiny chrome pipe, flared at the top like a trumpet, banded twice so it does not wobble.',
      'Hot to the touch and loud at the top. The little shield on the side keeps the heat off the hedges.',
      'Rhyme from the Verge: puff, puff, pop, the Mower never stops.',
      'Practical tip: do not stand behind it. The gnome who did is now shorter in one eyebrow.',
      'Nothing inside it can be seen from outside, but something in there has been crackling since the Kiln was new.',
    ],
    parts: [
      { s: 'box', d: [0.12, 0.01, 0.12], at: [0, 0.005, 0], c: 'iron-dark' },         // mounting plate
      { s: 'cyl', d: [0.04, 0.045, 0.4], at: [0, 0.2, 0], c: CHROME, seg: 8 },         // stovepipe
      { s: 'cyl', d: [0.06, 0.04, 0.05], at: [0, 0.425, 0], c: CHROME, seg: 8 },       // flared top
      { s: 'cyl', d: [0.05, 0.05, 0.02], at: [0, 0.1, 0], c: 'iron-dark', seg: 8 },    // clamp band
      { s: 'cyl', d: [0.05, 0.05, 0.02], at: [0, 0.3, 0], c: 'iron-dark', seg: 8 },    // clamp band
      { s: 'box', d: [0.02, 0.22, 0.1], at: [0.06, 0.2, 0], c: 'iron-dark' },          // heat shield (+x)
    ],
  },
  {
    id: 'glaze-extra-mudflaps', name: 'Mudflap Gnomes', category: 'prop', uses: ['place'],
    tags: ['glaze', 'extra', 'mudflap', 'mudflaps', 'flap', 'gnome', 'rubber'], emoji: [],
    about: 'One black rubber mudflap with a chrome gnome silhouette on its +x face; the code mirrors it behind each rear wheel. No tint.',
    examine: [
      'A black rubber flap with a chrome gnome on it: hat, head and body in one shiny shape.',
      'The silhouette is the gnome who once fought off a beetle at Mossbottom. Nobody remembers the beetle.',
      'Gnome law: a flap on the back belongs to whoever is still standing behind it.',
      'It keeps the spray off. Spray is something that happens to other gnomes.',
      'The chrome gnome is a little taller than the real one, which is how you know it is a good likeness.',
    ],
    parts: [
      { s: 'box', d: [0.03, 0.2, 0.16], at: [0, 0.1, 0], c: 'black' },                 // rubber flap
      { s: 'box', d: [0.03, 0.02, 0.06], at: [0, 0.21, 0], c: 'iron-dark' },           // bracket
      { s: 'box', d: [0.01, 0.07, 0.05], at: [0.024, 0.06, 0], c: CHROME },            // gnome body
      { s: 'ball', d: [0.025], at: [0.024, 0.13, 0], c: CHROME, seg: 6 },              // gnome head
      { s: 'cone', d: [0.03, 0.05], at: [0.024, 0.175, 0], c: CHROME, seg: 6 },        // gnome hat
    ],
  },
  {
    id: 'glaze-extra-bunting', name: 'Parade Bunting', category: 'prop', uses: ['place'],
    tags: ['glaze', 'extra', 'bunting', 'flags', 'parade', 'triangle', 'pennant'], emoji: [],
    about: 'A cord across the top with two end poles and nine hanging triangle flags, red, yellow, blue and green in turn. No tint.',
    examine: [
      'A string of little triangles, red, yellow, blue and green, hung from one cord and flapping at the top.',
      'Parade rhyme: red for the Fence and green for the bed, blue for the Rockery, yellow for ahead.',
      'Practical tip: tie it tight at both ends. A flag in a breeze is a flag that wants to leave.',
      'Nine flags is the lucky number. Gnomes have counted to nine several times to be sure.',
      'Nobody knows who first hung flags across a parade. The flags have never once been asked.',
    ],
    parts: [
      { s: 'cyl', d: [0.005, 0.005, 1.1], at: [0, 0.28, 0], rot: [0, 0, 90], c: 'black', seg: 4 },  // cord
      { s: 'cyl', d: [0.01, 0.01, 0.3], at: [-0.55, 0.15, 0], c: 'wood', seg: 5 },                  // end pole
      { s: 'cyl', d: [0.01, 0.01, 0.3], at: [0.55, 0.15, 0], c: 'wood', seg: 5 },                   // end pole
      { s: 'cone', d: [0.05, 0.08], at: [-0.4, 0.24, 0], rot: [180, 0, 0], c: 'red', seg: 3 },
      { s: 'cone', d: [0.05, 0.08], at: [-0.3, 0.24, 0], rot: [180, 0, 0], c: 'yellow', seg: 3 },
      { s: 'cone', d: [0.05, 0.08], at: [-0.2, 0.24, 0], rot: [180, 0, 0], c: 'blue', seg: 3 },
      { s: 'cone', d: [0.05, 0.08], at: [-0.1, 0.24, 0], rot: [180, 0, 0], c: 'green', seg: 3 },
      { s: 'cone', d: [0.05, 0.08], at: [0, 0.24, 0], rot: [180, 0, 0], c: 'red', seg: 3 },
      { s: 'cone', d: [0.05, 0.08], at: [0.1, 0.24, 0], rot: [180, 0, 0], c: 'yellow', seg: 3 },
      { s: 'cone', d: [0.05, 0.08], at: [0.2, 0.24, 0], rot: [180, 0, 0], c: 'blue', seg: 3 },
      { s: 'cone', d: [0.05, 0.08], at: [0.3, 0.24, 0], rot: [180, 0, 0], c: 'green', seg: 3 },
      { s: 'cone', d: [0.05, 0.08], at: [0.4, 0.24, 0], rot: [180, 0, 0], c: 'red', seg: 3 },
    ],
  },
  {
    id: 'glaze-extra-plate', name: 'Vanity Plate', category: 'prop', uses: ['place'],
    tags: ['glaze', 'extra', 'plate', 'number', 'vanity', 'sign'], emoji: [],
    about: 'A white number plate with a dark border and blocky letters reading GNOME 1, on a small bracket at the back. The code places it on the rear; no tint.',
    examine: [
      'A white plate with a dark border and five chunky letters. The dash has been there since the first gnome painted it.',
      'Reads GNOME 1. Nobody has checked whether it is true.',
      'Old saying: the first plate in the Turf was the one nobody could read, so everyone agreed it was the best.',
      'Practical tip: the letters stand proud of the plate, so they catch the light and can be read from the Shed.',
      'Someone painted over a smaller word on the back. Gnomes still disagree about what it said.',
    ],
    parts: [
      { s: 'box', d: [0.06, 0.12, 0.04], at: [0, 0.06, -0.03], c: 'iron-dark' },        // bracket
      { s: 'box', d: [0.32, 0.16, 0.02], at: [0, 0.08, -0.005], c: 0x222222 },           // dark border
      { s: 'box', d: [0.3, 0.14, 0.015], at: [0, 0.07, 0], c: 'white' },                // plate
      { s: 'box', d: [0.02, 0.04, 0.004], at: [-0.1, 0.07, 0.0095], c: 'ink' },         // G
      { s: 'box', d: [0.02, 0.04, 0.004], at: [-0.06, 0.07, 0.0095], c: 'ink' },        // N
      { s: 'box', d: [0.02, 0.04, 0.004], at: [-0.02, 0.07, 0.0095], c: 'ink' },        // O
      { s: 'box', d: [0.02, 0.04, 0.004], at: [0.02, 0.07, 0.0095], c: 'ink' },         // M
      { s: 'box', d: [0.02, 0.04, 0.004], at: [0.06, 0.07, 0.0095], c: 'ink' },         // E
      { s: 'box', d: [0.02, 0.008, 0.004], at: [0.1, 0.07, 0.0095], c: 'ink' },         // dash
    ],
  },
  {
    id: 'glaze-extra-roobar', name: 'Hedge-Bar Bumper', category: 'prop', uses: ['place'],
    tags: ['glaze', 'extra', 'bumper', 'bar', 'roobar', 'hedge', 'chrome'], emoji: [],
    about: 'A chrome hedge bar: two vertical bars, a top, a low and a central bar, with angled leaf-cutting blades at the corners. About 0.85 wide. No tint.',
    examine: [
      'Two tall chrome bars, a top bar and a low bar, with blades at the corners angled for cutting.',
      'Old rhyme: go through the hedge and not around; a hedge that stops you was never a hedge.',
      'Practical tip: the blades are for leaves. A gnome who finds a leaf that is not a leaf has a problem.',
      'It does not stop Mowers. Nothing stops a Mower. It only makes the Mower complain.',
      'The bars are as thick as a gnome thumb and have been bent back straight at least four times.',
    ],
    parts: [
      { s: 'cyl', d: [0.025, 0.025, 0.3], at: [0.32, 0.15, 0], c: CHROME, seg: 6, mirror: true },   // upright bar
      { s: 'cyl', d: [0.03, 0.03, 0.8], at: [0, 0.3, 0], rot: [0, 0, 90], c: CHROME, seg: 6 },        // top bar
      { s: 'cyl', d: [0.025, 0.025, 0.8], at: [0, 0.08, 0], rot: [0, 0, 90], c: CHROME, seg: 6 },    // low bar
      { s: 'cyl', d: [0.02, 0.02, 0.6], at: [0, 0.19, 0], rot: [0, 0, 90], c: CHROME, seg: 6 },      // central bar
      { s: 'wedge', d: [0.02, 0.1, 0.1], at: [0.4, 0.15, 0], rot: [0, 25, 0], c: 'steel', mirror: true }, // leaf blade
    ],
  },
  {
    id: 'glaze-extra-bell', name: 'Bicycle Bell', category: 'prop', uses: ['place'],
    tags: ['glaze', 'extra', 'bell', 'bicycle', 'dome', 'ring', 'dash'], emoji: [],
    about: 'A small silver dome bell with a cream trim ring, on a short post with a clamp and a side lever. The code places it on the dash; no tint.',
    examine: [
      'A silver dome with a cream ring round the bottom, on a short post. It goes ding.',
      'Ring it to clear the path. Anything in front of you will move eventually, out of politeness.',
      'Old saying: a bell rung twice is a warning, and a bell rung three times is a party.',
      'The lever on the side is the size of a gnome finger. Press it and the dome sings a single note.',
      'Nobody remembers who first heard a bell and decided it was a small silver hat. Everyone agrees it fits.',
    ],
    parts: [
      { s: 'cyl', d: [0.01, 0.01, 0.1], at: [0, 0.05, 0], c: 'iron-dark', seg: 6 },        // post
      { s: 'cyl', d: [0.018, 0.018, 0.025], at: [0, 0.1, 0], c: 'iron-dark', seg: 6 },     // clamp
      { s: 'ball', d: [0.05], at: [0, 0.135, 0], scale: [1, 0.7, 1], c: 'silver', seg: 8 }, // dome
      { s: 'ring', d: [0.05, 0.008], at: [0, 0.1, 0], rot: [90, 0, 0], c: 0xf3e9d2, seg: 8 }, // cream trim
      { s: 'box', d: [0.02, 0.02, 0.07], at: [0.065, 0.12, 0], c: 'brass' },               // lever
    ],
  },
];
